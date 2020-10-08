import { ContractAddresses, getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { assetDataUtils, SignedOrder } from '@0x/order-utils';
import { Orderbook, SRAPollingOrderProviderOpts } from '@0x/orderbook';
import { AssetProxyId } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { BlockParamLiteral, SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { constants } from './constants';
import {
    CalculateSwapQuoteOpts,
    MarketBuySwapQuote,
    MarketOperation,
    MarketSellSwapQuote,
    OrderPrunerPermittedFeeTypes,
    SwapQuote,
    SwapQuoteInfo,
    SwapQuoteOrdersBreakdown,
    SwapQuoteRequestOpts,
    SwapQuoterError,
    SwapQuoterOpts,
    SwapQuoterRfqtOpts,
} from './types';
import { assert } from './utils/assert';
import { MarketOperationUtils } from './utils/market_operation_utils';
import { SOURCE_FLAGS } from './utils/market_operation_utils/constants';
import {
    convertNativeOrderToFullyFillableOptimizedOrders,
    createDummyOrderForSampler,
} from './utils/market_operation_utils/orders';
import { DexOrderSampler } from './utils/market_operation_utils/sampler';
import { SourceFilters } from './utils/market_operation_utils/source_filters';
import {
    ERC20BridgeSource,
    FeeSchedule,
    FillData,
    GetMarketOrdersOpts,
    MarketDepth,
    MarketDepthSide,
    MarketSideLiquidity,
    OptimizedMarketOrder,
} from './utils/market_operation_utils/types';
import { orderPrunerUtils } from './utils/order_prune_utils';
import { ProtocolFeeUtils } from './utils/protocol_fee_utils';
import { QuoteReport } from './utils/quote_report_generator';
import { QuoteRequestor } from './utils/quote_requestor';
import { QuoteFillResult, simulateBestCaseFill, simulateWorstCaseFill } from './utils/quote_simulation';
import { sortingUtils } from './utils/sorting_utils';
import { getTokenFromAssetData, isSupportedAssetDataInOrders } from './utils/utils';
import { ERC20BridgeSamplerContract } from './wrappers';

export class SwapQuoter {
    public readonly provider: ZeroExProvider;
    public readonly orderbook: Orderbook;
    public readonly expiryBufferMs: number;
    public readonly chainId: number;
    public readonly permittedOrderFeeTypes: Set<OrderPrunerPermittedFeeTypes>;
    private readonly _contractAddresses: ContractAddresses;
    private readonly _protocolFeeUtils: ProtocolFeeUtils;
    private readonly _marketOperationUtils: MarketOperationUtils;
    private readonly _rfqtOptions: SwapQuoterRfqtOpts;

    /**
     * Instantiates a new SwapQuoter instance given a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint
     * @param   supportedProvider  The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   sraApiUrl          The standard relayer API base HTTP url you would like to source orders from.
     * @param   options            Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    public static getSwapQuoterForStandardRelayerAPIUrl(
        supportedProvider: SupportedProvider,
        sraApiUrl: string,
        options: Partial<SwapQuoterOpts & SRAPollingOrderProviderOpts> = {},
    ): SwapQuoter {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isWebUri('sraApiUrl', sraApiUrl);
        const orderbook = Orderbook.getOrderbookForPollingProvider({
            httpEndpoint: sraApiUrl,
            pollingIntervalMs:
                options.orderRefreshIntervalMs || constants.DEFAULT_SWAP_QUOTER_OPTS.orderRefreshIntervalMs,
            perPage: options.perPage || constants.DEFAULT_PER_PAGE,
        });
        const swapQuoter = new SwapQuoter(provider, orderbook, options);
        return swapQuoter;
    }

    /**
     * Instantiates a new SwapQuoter instance
     * @param   supportedProvider   The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orderbook           An object that conforms to Orderbook, see type for definition.
     * @param   options             Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    constructor(supportedProvider: SupportedProvider, orderbook: Orderbook, options: Partial<SwapQuoterOpts> = {}) {
        const {
            chainId,
            expiryBufferMs,
            permittedOrderFeeTypes,
            samplerGasLimit,
            liquidityProviderRegistryAddress,
            rfqt,
            tokenAdjacencyGraph,
        } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isValidOrderbook('orderbook', orderbook);
        assert.isNumber('chainId', chainId);
        assert.isNumber('expiryBufferMs', expiryBufferMs);
        this.chainId = chainId;
        this.provider = provider;
        this.orderbook = orderbook;
        this.expiryBufferMs = expiryBufferMs;
        this.permittedOrderFeeTypes = permittedOrderFeeTypes;

        this._rfqtOptions = rfqt || constants.DEFAULT_SWAP_QUOTER_OPTS.rfqt!; // defined in constants.ts
        this._contractAddresses = options.contractAddresses || getContractAddressesForChainOrThrow(chainId);
        this._protocolFeeUtils = ProtocolFeeUtils.getInstance(
            constants.PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS,
            options.ethGasStationUrl,
        );
        // Allow the sampler bytecode to be overwritten using geths override functionality
        const samplerBytecode = _.get(artifacts.ERC20BridgeSampler, 'compilerOutput.evm.deployedBytecode.object');
        const defaultCodeOverrides = samplerBytecode
            ? {
                  [this._contractAddresses.erc20BridgeSampler]: { code: samplerBytecode },
              }
            : {};
        const samplerOverrides = _.assign(
            { block: BlockParamLiteral.Latest, overrides: defaultCodeOverrides },
            options.samplerOverrides,
        );
        const samplerContract = new ERC20BridgeSamplerContract(
            this._contractAddresses.erc20BridgeSampler,
            this.provider,
            {
                gas: samplerGasLimit,
            },
        );
        this._marketOperationUtils = new MarketOperationUtils(
            new DexOrderSampler(samplerContract, samplerOverrides, provider),
            this._contractAddresses,
            {
                chainId,
                exchangeAddress: this._contractAddresses.exchange,
            },
            liquidityProviderRegistryAddress,
            tokenAdjacencyGraph,
        );
    }
    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy or sell, or process SwapQuote for on-chain consumption.
     * @param   makerTokenAddress       The address of the maker asset
     * @param   takerTokenAddress       The address of the taker asset
     * @param   assetFillAmount         For a buy quote, the amount of maker asset you wish to buy. For a sell quote, the amount of taker asset you wish to sell.
     * @param   marketOperation         Use BUY to get a buy quote, and SELL for a sell quote
     * @param   options                 Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    public async getSwapQuoteAsync(
        makerTokenAddress: string,
        takerTokenAddress: string,
        assetFillAmount: BigNumber, //  sell: takerAssetSellAmount; buy: makerAssetSellAmount
        marketOperation: MarketOperation,
        options: Partial<SwapQuoteRequestOpts> = {},
    ): Promise<SwapQuote> {
        assert.isETHAddressHex('makerTokenAddress', makerTokenAddress);
        assert.isETHAddressHex('takerTokenAddress', takerTokenAddress);
        assert.isBigNumber('assetFillAmount', assetFillAmount);
        const opts = _.merge({}, constants.DEFAULT_SWAP_QUOTE_REQUEST_OPTS, options);
        const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenAddress);
        const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenAddress);

        // set gas price
        const gasPrice = !!opts.gasPrice ? opts.gasPrice : await this.getGasPriceEstimationOrThrowAsync();
        assert.isBigNumber('gasPrice', gasPrice);

        // parse included and excluded sources
        const sourceFilters = new SourceFilters([], opts.excludedSources, opts.includedSources);

        // If RFQT is enabled and `nativeExclusivelyRFQT` is set, then `ERC20BridgeSource.Native` should
        // never be excluded.
        const isNativeExclusivelyRFQT = opts.rfqt && opts.rfqt.nativeExclusivelyRFQT === true;
        if (isNativeExclusivelyRFQT && !sourceFilters.isAllowed(ERC20BridgeSource.Native)) {
            throw new Error('Native liquidity cannot be excluded if "rfqt.nativeExclusivelyRFQT" is set');
        }

        // get batches of orders from different sources, awaiting sources in parallel
        const orderBatchPromises: Array<Promise<SignedOrder[]>> = [];
        const { makerAssetOfferings, warningLogger, infoLogger } = this._rfqtOptions;
        const quoteRequestor = new QuoteRequestor(makerAssetOfferings, warningLogger, infoLogger, this.expiryBufferMs);

        // get open orderbook orders
        const useOpenOrderbook = sourceFilters.isAllowed(ERC20BridgeSource.Native) && isNativeExclusivelyRFQT;
        if (useOpenOrderbook) {
            orderBatchPromises.push(this._getSignedOrdersAsync(makerAssetData, takerAssetData)); // order book
        }

        // get rfqt orders
        if (
            opts.rfqt && // This is an RFQT-enabled API request
            opts.rfqt.intentOnFilling && // The requestor is asking for a firm quote
            opts.rfqt.apiKey &&
            this._isApiKeyWhitelisted(opts.rfqt.apiKey) && // A valid API key was provided
            sourceFilters.isAllowed(ERC20BridgeSource.Native) // Native liquidity is not excluded
        ) {
            if (!opts.rfqt.takerAddress || opts.rfqt.takerAddress === constants.NULL_ADDRESS) {
                throw new Error('RFQ-T requests must specify a taker address');
            }
            orderBatchPromises.push(
                quoteRequestor
                    .requestRfqtFirmQuotesAsync(
                        makerAssetData,
                        takerAssetData,
                        assetFillAmount,
                        marketOperation,
                        opts.rfqt,
                    )
                    .then(firmQuotes => firmQuotes.map(quote => quote.signedOrder)),
            );
        }

        // resolve all order request promises
        const orderBatches: SignedOrder[][] = await Promise.all(orderBatchPromises);
        const unsortedOrders: SignedOrder[] = orderBatches.reduce((_orders, batch) => _orders.concat(...batch), []);
        let orders = sortingUtils.sortOrders(unsortedOrders);

        // if no native orders, pass in a dummy order for the sampler to have required metadata for sampling
        if (orders.length === 0) {
            orders = [
                createDummyOrderForSampler(makerAssetData, takerAssetData, this._contractAddresses.uniswapBridge),
            ];
        }

        // calculate the swap quote with the obtained orders
        const calcOpts: CalculateSwapQuoteOpts = opts;
        if (calcOpts.rfqt !== undefined) {
            calcOpts.rfqt.quoteRequestor = quoteRequestor;
        }
        const swapQuote = await this._calculateSwapQuoteAsync(
            orders,
            assetFillAmount,
            gasPrice,
            marketOperation,
            calcOpts,
        );

        if (marketOperation === MarketOperation.Buy) {
            return swapQuote as MarketBuySwapQuote;
        } else {
            return swapQuote as MarketSellSwapQuote;
        }
    }

    public async getBatchMarketBuySwapQuoteForAssetDataAsync(
        makerAssetDatas: string[],
        takerAssetData: string,
        makerAssetBuyAmounts: BigNumber[],
        options: Partial<SwapQuoteRequestOpts> = {},
    ): Promise<Array<MarketBuySwapQuote | undefined>> {
        makerAssetBuyAmounts.map((a, i) => assert.isBigNumber(`makerAssetBuyAmounts[${i}]`, a));

        // set gas price
        const gasPrice = !!options.gasPrice ? options.gasPrice : await this.getGasPriceEstimationOrThrowAsync();
        assert.isBigNumber('gasPrice', gasPrice);

        // get orders
        const batchApiOrders = await this.orderbook.getBatchOrdersAsync(makerAssetDatas, [takerAssetData]);
        const batchOrders = batchApiOrders.map(apiOrders => apiOrders.map(o => o.order));
        const batchPrunedOrders = batchOrders.map((orders, i) => {
            const prunedOrders = orderPrunerUtils.pruneForUsableSignedOrders(
                orders,
                this.permittedOrderFeeTypes,
                this.expiryBufferMs,
            );
            return prunedOrders.length === 0
                ? [
                      createDummyOrderForSampler(
                          makerAssetDatas[i],
                          takerAssetData,
                          this._contractAddresses.uniswapBridge,
                      ),
                  ]
                : sortingUtils.sortOrders(prunedOrders);
        });
        const opts = _.merge({}, constants.DEFAULT_SWAP_QUOTE_REQUEST_OPTS, options);
        const batchSignedOrders = await this._marketOperationUtils.getBatchMarketBuyOrdersAsync(
            batchPrunedOrders,
            makerAssetBuyAmounts,
            opts,
        );

        // calculate the quotes
        const swapQuotes = batchSignedOrders.map((signedOrders, i) => {
            const { makerAssetData, takerAssetData: _takerAssetData } = batchPrunedOrders[i][0];
            if (signedOrders === undefined) {
                return undefined;
            }
            return createSwapQuote(
                makerAssetData,
                _takerAssetData,
                signedOrders,
                MarketOperation.Buy,
                makerAssetBuyAmounts[i],
                gasPrice,
                opts.gasSchedule,
            ) as MarketBuySwapQuote;
        });
        return swapQuotes;
    }

    /**
     * Returns the bids and asks liquidity for the entire market.
     * For certain sources (like AMM's) it is recommended to provide a practical maximum takerAssetAmount.
     * @param   makerTokenAddress The address of the maker asset
     * @param   takerTokenAddress The address of the taker asset
     * @param   takerAssetAmount  The amount to sell and buy for the bids and asks.
     *
     * @return  An object that conforms to MarketDepth that contains all of the samples and liquidity
     *          information for the source.
     */
    public async getBidAskLiquidityForMakerTakerAssetPairAsync(
        makerTokenAddress: string,
        takerTokenAddress: string,
        takerAssetAmount: BigNumber,
        options: Partial<SwapQuoteRequestOpts> = {},
    ): Promise<MarketDepth> {
        assert.isString('makerTokenAddress', makerTokenAddress);
        assert.isString('takerTokenAddress', takerTokenAddress);
        const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenAddress);
        const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenAddress);
        const sourceFilters = new SourceFilters([], options.excludedSources, options.includedSources);
        let [sellOrders, buyOrders] = !sourceFilters.isAllowed(ERC20BridgeSource.Native)
            ? [[], []]
            : await Promise.all([
                  this.orderbook.getOrdersAsync(makerAssetData, takerAssetData),
                  this.orderbook.getOrdersAsync(takerAssetData, makerAssetData),
              ]);
        if (!sellOrders || sellOrders.length === 0) {
            sellOrders = [
                {
                    metaData: {},
                    order: createDummyOrderForSampler(
                        makerAssetData,
                        takerAssetData,
                        this._contractAddresses.uniswapBridge,
                    ),
                },
            ];
        }
        if (!buyOrders || buyOrders.length === 0) {
            buyOrders = [
                {
                    metaData: {},
                    order: createDummyOrderForSampler(
                        takerAssetData,
                        makerAssetData,
                        this._contractAddresses.uniswapBridge,
                    ),
                },
            ];
        }
        const getMarketDepthSide = (marketSideLiquidity: MarketSideLiquidity): MarketDepthSide => {
            const { dexQuotes, nativeOrders, orderFillableAmounts, side } = marketSideLiquidity;
            return [
                ...dexQuotes,
                nativeOrders.map((o, i) => {
                    // When sell order fillable amount is taker
                    // When buy order fillable amount is maker
                    const scaleFactor = orderFillableAmounts[i].div(
                        side === MarketOperation.Sell ? o.takerAssetAmount : o.makerAssetAmount,
                    );
                    return {
                        input: (side === MarketOperation.Sell ? o.takerAssetAmount : o.makerAssetAmount)
                            .times(scaleFactor)
                            .integerValue(),
                        output: (side === MarketOperation.Sell ? o.makerAssetAmount : o.takerAssetAmount)
                            .times(scaleFactor)
                            .integerValue(),
                        fillData: o,
                        source: ERC20BridgeSource.Native,
                    };
                }),
            ];
        };
        const [bids, asks] = await Promise.all([
            this._marketOperationUtils.getMarketBuyLiquidityAsync(
                (buyOrders || []).map(o => o.order),
                takerAssetAmount,
                options,
            ),
            this._marketOperationUtils.getMarketSellLiquidityAsync(
                (sellOrders || []).map(o => o.order),
                takerAssetAmount,
                options,
            ),
        ]);
        return {
            bids: getMarketDepthSide(bids),
            asks: getMarketDepthSide(asks),
        };
    }

    /**
     * Returns the recommended gas price for a fast transaction
     */
    public async getGasPriceEstimationOrThrowAsync(): Promise<BigNumber> {
        return this._protocolFeeUtils.getGasPriceEstimationOrThrowAsync();
    }

    /**
     * Destroys any subscriptions or connections.
     */
    public async destroyAsync(): Promise<void> {
        await this._protocolFeeUtils.destroyAsync();
        await this.orderbook.destroyAsync();
    }

    private async _calculateSwapQuoteAsync(
        prunedOrders: SignedOrder[],
        assetFillAmount: BigNumber,
        gasPrice: BigNumber,
        marketOperation: MarketOperation,
        opts: CalculateSwapQuoteOpts,
    ): Promise<SwapQuote> {
        // checks if maker asset is ERC721 or ERC20 and taker asset is ERC20
        if (!isSupportedAssetDataInOrders(prunedOrders)) {
            throw Error(SwapQuoterError.AssetDataUnsupported);
        }

        // Scale fees by gas price.
        const _opts: GetMarketOrdersOpts = {
            ...opts,
            feeSchedule: _.mapValues(opts.feeSchedule, gasCost => (fillData?: FillData) =>
                gasCost === undefined ? 0 : gasPrice.times(gasCost(fillData)),
            ),
            exchangeProxyOverhead: flags => gasPrice.times(opts.exchangeProxyOverhead(flags)),
        };

        // since prunedOrders do not have fillState, we will add a buffer of fillable orders to consider that some native orders are partially filled
        let optimizedOrders: OptimizedMarketOrder[];
        let quoteReport: QuoteReport | undefined;
        let sourceFlags: number = 0;

        const firstOrderMakerAssetData = !!prunedOrders[0]
            ? assetDataUtils.decodeAssetDataOrThrow(prunedOrders[0].makerAssetData)
            : { assetProxyId: '' };
        if (firstOrderMakerAssetData.assetProxyId === AssetProxyId.ERC721) {
            // HACK: to conform ERC721 orders to the output of market operation utils, assumes complete fillable
            optimizedOrders = prunedOrders.map(o => convertNativeOrderToFullyFillableOptimizedOrders(o));
        } else {
            const fillResult = await this._marketOperationUtils.getMarketOrdersAsync(
                prunedOrders,
                assetFillAmount,
                marketOperation,
                _opts,
            );
            optimizedOrders = fillResult.optimizedOrders;
            quoteReport = fillResult.quoteReport;
            sourceFlags = fillResult.sourceFlags;
        }

        // assetData information for the result
        const { makerAssetData, takerAssetData } = prunedOrders[0];
        const isTwoHop = sourceFlags === SOURCE_FLAGS[ERC20BridgeSource.MultiHop];
        const swapQuote = createSwapQuote(
            makerAssetData,
            takerAssetData,
            optimizedOrders,
            marketOperation,
            assetFillAmount,
            gasPrice,
            opts.gasSchedule,
            quoteReport,
            isTwoHop,
        );
        // Use the raw gas, not scaled by gas price
        const exchangeProxyOverhead = opts.exchangeProxyOverhead(sourceFlags).toNumber();
        swapQuote.bestCaseQuoteInfo.gas += exchangeProxyOverhead;
        swapQuote.worstCaseQuoteInfo.gas += exchangeProxyOverhead;
        return swapQuote;
    }

    /**
     * Grab orders from the order provider, prunes for valid orders with provided OrderPruner options
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     */
    private async _getSignedOrdersAsync(makerAssetData: string, takerAssetData: string): Promise<SignedOrder[]> {
        assert.isString('makerAssetData', makerAssetData);
        assert.isString('takerAssetData', takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
        // get orders
        const apiOrders = await this.orderbook.getOrdersAsync(makerAssetData, takerAssetData);
        const orders = apiOrders.map(o => o.order);
        const prunedOrders = orderPrunerUtils.pruneForUsableSignedOrders(
            orders,
            this.permittedOrderFeeTypes,
            this.expiryBufferMs,
        );
        return prunedOrders;
    }

    private _isApiKeyWhitelisted(apiKey: string): boolean {
        const whitelistedApiKeys = this._rfqtOptions ? this._rfqtOptions.takerApiKeyWhitelist : [];
        return whitelistedApiKeys.includes(apiKey);
    }
}
// tslint:disable-next-line: max-file-line-count
function createSwapQuote(
    makerAssetData: string,
    takerAssetData: string,
    optimizedOrders: OptimizedMarketOrder[],
    operation: MarketOperation,
    assetFillAmount: BigNumber,
    gasPrice: BigNumber,
    gasSchedule: FeeSchedule,
    quoteReport?: QuoteReport,
    isTwoHop: boolean = false,
): SwapQuote {
    let bestCaseQuoteInfo;
    let worstCaseQuoteInfo;
    let sourceBreakdown;

    if (isTwoHop) {
        const [firstHopOrder, secondHopOrder] = optimizedOrders;
        const [firstHopFill] = firstHopOrder.fills;
        const [secondHopFill] = secondHopOrder.fills;
        const gas = new BigNumber(
            gasSchedule[ERC20BridgeSource.MultiHop]!({
                firstHopSource: _.pick(firstHopFill, 'source', 'fillData'),
                secondHopSource: _.pick(secondHopFill, 'source', 'fillData'),
            }),
        ).toNumber();
        bestCaseQuoteInfo = {
            makerAssetAmount: operation === MarketOperation.Sell ? secondHopFill.output : secondHopFill.input,
            takerAssetAmount: operation === MarketOperation.Sell ? firstHopFill.input : firstHopFill.output,
            totalTakerAssetAmount: operation === MarketOperation.Sell ? firstHopFill.input : firstHopFill.output,
            feeTakerAssetAmount: constants.ZERO_AMOUNT,
            protocolFeeInWeiAmount: constants.ZERO_AMOUNT,
            gas,
        };
        worstCaseQuoteInfo = {
            makerAssetAmount: secondHopOrder.makerAssetAmount,
            takerAssetAmount: firstHopOrder.takerAssetAmount,
            totalTakerAssetAmount: firstHopOrder.takerAssetAmount,
            feeTakerAssetAmount: constants.ZERO_AMOUNT,
            protocolFeeInWeiAmount: constants.ZERO_AMOUNT,
            gas,
        };
        sourceBreakdown = {
            [ERC20BridgeSource.MultiHop]: {
                proportion: new BigNumber(1),
                intermediateToken: getTokenFromAssetData(secondHopOrder.takerAssetData),
                hops: [firstHopFill.source, secondHopFill.source],
            },
        };
    } else {
        const bestCaseFillResult = simulateBestCaseFill({
            gasPrice,
            orders: optimizedOrders,
            side: operation,
            fillAmount: assetFillAmount,
            opts: { gasSchedule },
        });
        const worstCaseFillResult = simulateWorstCaseFill({
            gasPrice,
            orders: optimizedOrders,
            side: operation,
            fillAmount: assetFillAmount,
            opts: { gasSchedule },
        });
        bestCaseQuoteInfo = fillResultsToQuoteInfo(bestCaseFillResult);
        worstCaseQuoteInfo = fillResultsToQuoteInfo(worstCaseFillResult);
        sourceBreakdown = getSwapQuoteOrdersBreakdown(bestCaseFillResult.fillAmountBySource);
    }

    const quoteBase = {
        takerAssetData,
        makerAssetData,
        gasPrice,
        bestCaseQuoteInfo,
        worstCaseQuoteInfo,
        sourceBreakdown,
        orders: optimizedOrders,
        quoteReport,
        isTwoHop,
    };

    if (operation === MarketOperation.Buy) {
        return {
            ...quoteBase,
            type: MarketOperation.Buy,
            makerAssetFillAmount: assetFillAmount,
        };
    } else {
        return {
            ...quoteBase,
            type: MarketOperation.Sell,
            takerAssetFillAmount: assetFillAmount,
        };
    }
}

function getSwapQuoteOrdersBreakdown(fillAmountBySource: { [source: string]: BigNumber }): SwapQuoteOrdersBreakdown {
    const totalFillAmount = BigNumber.sum(...Object.values(fillAmountBySource));
    const breakdown: SwapQuoteOrdersBreakdown = {};
    Object.entries(fillAmountBySource).forEach(([source, fillAmount]) => {
        breakdown[source as keyof SwapQuoteOrdersBreakdown] = fillAmount.div(totalFillAmount);
    });
    return breakdown;
}

function fillResultsToQuoteInfo(fr: QuoteFillResult): SwapQuoteInfo {
    return {
        makerAssetAmount: fr.totalMakerAssetAmount,
        takerAssetAmount: fr.takerAssetAmount,
        totalTakerAssetAmount: fr.totalTakerAssetAmount,
        feeTakerAssetAmount: fr.takerFeeTakerAssetAmount,
        protocolFeeInWeiAmount: fr.protocolFeeAmount,
        gas: fr.gas,
    };
}
