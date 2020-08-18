import { ContractAddresses, getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { DevUtilsContract } from '@0x/contract-wrappers';
import { schemas } from '@0x/json-schemas';
import { assetDataUtils, SignedOrder } from '@0x/order-utils';
import { MeshOrderProviderOpts, Orderbook, SRAPollingOrderProviderOpts } from '@0x/orderbook';
import { BigNumber, providerUtils } from '@0x/utils';
import { BlockParamLiteral, SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { constants } from './constants';
import {
    CalculateSwapQuoteOpts,
    LiquidityForTakerMakerAssetDataPair,
    MarketBuySwapQuote,
    MarketOperation,
    MarketSellSwapQuote,
    OrderPrunerPermittedFeeTypes,
    SignedOrderWithFillableAmounts,
    SwapQuote,
    SwapQuoteRequestOpts,
    SwapQuoterOpts,
    SwapQuoterRfqtOpts,
} from './types';
import { assert } from './utils/assert';
import { calculateLiquidity } from './utils/calculate_liquidity';
import { MarketOperationUtils } from './utils/market_operation_utils';
import { createDummyOrderForSampler } from './utils/market_operation_utils/orders';
import { DexOrderSampler } from './utils/market_operation_utils/sampler';
import {
    ERC20BridgeSource,
    MarketDepth,
    MarketDepthSide,
    MarketSideLiquidity,
} from './utils/market_operation_utils/types';
import { orderPrunerUtils } from './utils/order_prune_utils';
import { OrderStateUtils } from './utils/order_state_utils';
import { ProtocolFeeUtils } from './utils/protocol_fee_utils';
import { QuoteRequestor } from './utils/quote_requestor';
import { sortingUtils } from './utils/sorting_utils';
import { SwapQuoteCalculator } from './utils/swap_quote_calculator';
import { ERC20BridgeSamplerContract } from './wrappers';

export class SwapQuoter {
    public readonly provider: ZeroExProvider;
    public readonly orderbook: Orderbook;
    public readonly expiryBufferMs: number;
    public readonly chainId: number;
    public readonly permittedOrderFeeTypes: Set<OrderPrunerPermittedFeeTypes>;
    private readonly _contractAddresses: ContractAddresses;
    private readonly _protocolFeeUtils: ProtocolFeeUtils;
    private readonly _swapQuoteCalculator: SwapQuoteCalculator;
    private readonly _devUtilsContract: DevUtilsContract;
    private readonly _marketOperationUtils: MarketOperationUtils;
    private readonly _orderStateUtils: OrderStateUtils;
    private readonly _rfqtOptions?: SwapQuoterRfqtOpts;

    /**
     * Instantiates a new SwapQuoter instance given existing liquidity in the form of orders and feeOrders.
     * @param   supportedProvider   The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orders              A non-empty array of objects that conform to SignedOrder. All orders must have the same makerAssetData and takerAssetData.
     * @param   options             Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    public static getSwapQuoterForProvidedOrders(
        supportedProvider: SupportedProvider,
        orders: SignedOrder[],
        options: Partial<SwapQuoterOpts> = {},
    ): SwapQuoter {
        assert.doesConformToSchema('orders', orders, schemas.signedOrdersSchema);
        assert.assert(orders.length !== 0, `Expected orders to contain at least one order`);
        const orderbook = Orderbook.getOrderbookForProvidedOrders(orders);
        const swapQuoter = new SwapQuoter(supportedProvider, orderbook, options);
        return swapQuoter;
    }

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
     * Instantiates a new SwapQuoter instance given a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint
     * and a websocket endpoint. This is more effecient than `getSwapQuoterForStandardRelayerAPIUrl` when requesting multiple quotes.
     * @param   supportedProvider    The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   sraApiUrl            The standard relayer API base HTTP url you would like to source orders from.
     * @param   sraWebsocketApiUrl   The standard relayer API Websocket url you would like to subscribe to.
     * @param   options              Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    public static getSwapQuoterForStandardRelayerAPIWebsocket(
        supportedProvider: SupportedProvider,
        sraApiUrl: string,
        sraWebsocketAPIUrl: string,
        options: Partial<SwapQuoterOpts> = {},
    ): SwapQuoter {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isWebUri('sraApiUrl', sraApiUrl);
        assert.isUri('sraWebsocketAPIUrl', sraWebsocketAPIUrl);
        const orderbook = Orderbook.getOrderbookForWebsocketProvider({
            httpEndpoint: sraApiUrl,
            websocketEndpoint: sraWebsocketAPIUrl,
        });
        const swapQuoter = new SwapQuoter(provider, orderbook, options);
        return swapQuoter;
    }
    /**
     * Instantiates a new SwapQuoter instance given a 0x Mesh endpoint. This pulls all available liquidity stored in Mesh
     * @param   supportedProvider The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   meshEndpoint      The standard relayer API base HTTP url you would like to source orders from.
     * @param   options           Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    public static getSwapQuoterForMeshEndpoint(
        supportedProvider: SupportedProvider,
        meshEndpoint: string,
        options: Partial<SwapQuoterOpts & MeshOrderProviderOpts> = {},
    ): SwapQuoter {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isUri('meshEndpoint', meshEndpoint);
        const orderbook = Orderbook.getOrderbookForMeshProvider({
            websocketEndpoint: meshEndpoint,
            wsOpts: options.wsOpts,
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

        this._rfqtOptions = rfqt;
        this._contractAddresses = options.contractAddresses || getContractAddressesForChainOrThrow(chainId);
        this._devUtilsContract = new DevUtilsContract(this._contractAddresses.devUtils, provider);
        this._protocolFeeUtils = ProtocolFeeUtils.getInstance(
            constants.PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS,
            options.ethGasStationUrl,
        );
        this._orderStateUtils = new OrderStateUtils(this._devUtilsContract);
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
            new DexOrderSampler(samplerContract, samplerOverrides),
            this._contractAddresses,
            {
                chainId,
                exchangeAddress: this._contractAddresses.exchange,
            },
            liquidityProviderRegistryAddress,
        );
        this._swapQuoteCalculator = new SwapQuoteCalculator(this._marketOperationUtils);
    }

    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerAssetData           The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData           The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetSellAmount     The amount of taker asset to swap for.
     * @param   options                  Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    public async getMarketSellSwapQuoteForAssetDataAsync(
        makerAssetData: string,
        takerAssetData: string,
        takerAssetSellAmount: BigNumber,
        options: Partial<SwapQuoteRequestOpts> = {},
    ): Promise<MarketSellSwapQuote> {
        assert.isBigNumber('takerAssetSellAmount', takerAssetSellAmount);
        return (await this._getSwapQuoteAsync(
            makerAssetData,
            takerAssetData,
            takerAssetSellAmount,
            MarketOperation.Sell,
            options,
        )) as MarketSellSwapQuote;
    }

    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerAssetData           The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData           The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   makerAssetBuyAmount     The amount of maker asset to swap for.
     * @param   options                  Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    public async getMarketBuySwapQuoteForAssetDataAsync(
        makerAssetData: string,
        takerAssetData: string,
        makerAssetBuyAmount: BigNumber,
        options: Partial<SwapQuoteRequestOpts> = {},
    ): Promise<MarketBuySwapQuote> {
        assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
        return (await this._getSwapQuoteAsync(
            makerAssetData,
            takerAssetData,
            makerAssetBuyAmount,
            MarketOperation.Buy,
            options,
        )) as MarketBuySwapQuote;
    }

    public async getBatchMarketBuySwapQuoteForAssetDataAsync(
        makerAssetDatas: string[],
        takerAssetData: string,
        makerAssetBuyAmount: BigNumber[],
        options: Partial<SwapQuoteRequestOpts> = {},
    ): Promise<Array<MarketBuySwapQuote | undefined>> {
        makerAssetBuyAmount.map((a, i) => assert.isBigNumber(`makerAssetBuyAmount[${i}]`, a));
        let gasPrice: BigNumber;
        const calculateSwapQuoteOpts = _.merge({}, constants.DEFAULT_SWAP_QUOTE_REQUEST_OPTS, options);
        if (!!options.gasPrice) {
            gasPrice = options.gasPrice;
            assert.isBigNumber('gasPrice', gasPrice);
        } else {
            gasPrice = await this.getGasPriceEstimationOrThrowAsync();
        }

        const apiOrders = await this.orderbook.getBatchOrdersAsync(makerAssetDatas, [takerAssetData]);
        const allOrders = apiOrders.map(orders => orders.map(o => o.order));
        const allPrunedOrders = allOrders.map((orders, i) => {
            const prunedOrders = orderPrunerUtils.pruneForUsableSignedOrders(
                orders,
                this.permittedOrderFeeTypes,
                this.expiryBufferMs,
            );
            if (prunedOrders.length === 0) {
                return [
                    createDummyOrderForSampler(
                        makerAssetDatas[i],
                        takerAssetData,
                        this._contractAddresses.uniswapBridge,
                    ),
                ];
            } else {
                return sortingUtils.sortOrders(prunedOrders);
            }
        });

        const swapQuotes = await this._swapQuoteCalculator.calculateBatchMarketBuySwapQuoteAsync(
            allPrunedOrders,
            makerAssetBuyAmount,
            gasPrice,
            calculateSwapQuoteOpts,
        );
        return swapQuotes;
    }
    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerTokenAddress       The address of the maker asset
     * @param   takerTokenAddress       The address of the taker asset
     * @param   makerAssetBuyAmount     The amount of maker asset to swap for.
     * @param   options                 Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    public async getMarketBuySwapQuoteAsync(
        makerTokenAddress: string,
        takerTokenAddress: string,
        makerAssetBuyAmount: BigNumber,
        options: Partial<SwapQuoteRequestOpts> = {},
    ): Promise<MarketBuySwapQuote> {
        assert.isETHAddressHex('makerTokenAddress', makerTokenAddress);
        assert.isETHAddressHex('takerTokenAddress', takerTokenAddress);
        assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
        const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenAddress);
        const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenAddress);
        return this.getMarketBuySwapQuoteForAssetDataAsync(
            makerAssetData,
            takerAssetData,
            makerAssetBuyAmount,
            options,
        );
    }

    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerTokenAddress       The address of the maker asset
     * @param   takerTokenAddress       The address of the taker asset
     * @param   takerAssetSellAmount     The amount of taker asset to sell.
     * @param   options                  Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    public async getMarketSellSwapQuoteAsync(
        makerTokenAddress: string,
        takerTokenAddress: string,
        takerAssetSellAmount: BigNumber,
        options: Partial<SwapQuoteRequestOpts> = {},
    ): Promise<MarketSellSwapQuote> {
        assert.isETHAddressHex('makerTokenAddress', makerTokenAddress);
        assert.isETHAddressHex('takerTokenAddress', takerTokenAddress);
        assert.isBigNumber('takerAssetSellAmount', takerAssetSellAmount);
        const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenAddress);
        const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenAddress);
        return this.getMarketSellSwapQuoteForAssetDataAsync(
            makerAssetData,
            takerAssetData,
            takerAssetSellAmount,
            options,
        );
    }

    /**
     * Returns information about available liquidity for an asset
     * Does not factor in slippage or fees
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     *
     * @return  An object that conforms to LiquidityForTakerMakerAssetDataPair that satisfies the request. See type definition for more information.
     */
    public async getLiquidityForMakerTakerAssetDataPairAsync(
        makerAssetData: string,
        takerAssetData: string,
    ): Promise<LiquidityForTakerMakerAssetDataPair> {
        assert.isString('makerAssetData', makerAssetData);
        assert.isString('takerAssetData', takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
        const assetPairs = await this.getAvailableMakerAssetDatasAsync(takerAssetData);
        if (!assetPairs.includes(makerAssetData)) {
            return {
                makerAssetAvailableInBaseUnits: new BigNumber(0),
                takerAssetAvailableInBaseUnits: new BigNumber(0),
            };
        }

        const ordersWithFillableAmounts = await this.getSignedOrdersWithFillableAmountsAsync(
            makerAssetData,
            takerAssetData,
        );
        return calculateLiquidity(ordersWithFillableAmounts);
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
        let [sellOrders, buyOrders] =
            options.excludedSources && options.excludedSources.includes(ERC20BridgeSource.Native)
                ? Promise.resolve([[], []])
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
     * Get the asset data of all assets that can be used to purchase makerAssetData in the order provider passed in at init.
     *
     * @return  An array of asset data strings that can purchase makerAssetData.
     */
    public async getAvailableTakerAssetDatasAsync(makerAssetData: string): Promise<string[]> {
        assert.isString('makerAssetData', makerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
        const allAssetPairs = await this.orderbook.getAvailableAssetDatasAsync();
        const assetPairs = allAssetPairs
            .filter(pair => pair.assetDataA.assetData === makerAssetData)
            .map(pair => pair.assetDataB.assetData);
        return assetPairs;
    }

    /**
     * Get the asset data of all assets that are purchaseable with takerAssetData in the order provider passed in at init.
     *
     * @return  An array of asset data strings that are purchaseable with takerAssetData.
     */
    public async getAvailableMakerAssetDatasAsync(takerAssetData: string): Promise<string[]> {
        assert.isString('takerAssetData', takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
        const allAssetPairs = await this.orderbook.getAvailableAssetDatasAsync();
        const assetPairs = allAssetPairs
            .filter(pair => pair.assetDataB.assetData === takerAssetData)
            .map(pair => pair.assetDataA.assetData);
        return assetPairs;
    }

    /**
     * Validates the taker + maker asset pair is available from the order provider provided to `SwapQuote`.
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     *
     * @return  A boolean on if the taker, maker pair exists
     */
    public async isTakerMakerAssetDataPairAvailableAsync(
        makerAssetData: string,
        takerAssetData: string,
    ): Promise<boolean> {
        assert.isString('makerAssetData', makerAssetData);
        assert.isString('takerAssetData', takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
        const availableMakerAssetDatas = await this.getAvailableMakerAssetDatasAsync(takerAssetData);
        return _.includes(availableMakerAssetDatas, makerAssetData);
    }

    /**
     * Grab orders from the order provider, prunes for valid orders with provided OrderPruner options
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     */
    public async getSignedOrdersWithFillableAmountsAsync(
        makerAssetData: string,
        takerAssetData: string,
    ): Promise<SignedOrderWithFillableAmounts[]> {
        assert.isString('makerAssetData', makerAssetData);
        assert.isString('takerAssetData', takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
        // get orders
        const apiOrders = await this.orderbook.getOrdersAsync(makerAssetData, takerAssetData);
        const orders = _.map(apiOrders, o => o.order);
        const prunedOrders = orderPrunerUtils.pruneForUsableSignedOrders(
            orders,
            this.permittedOrderFeeTypes,
            this.expiryBufferMs,
        );
        const sortedPrunedOrders = sortingUtils.sortOrders(prunedOrders);
        const ordersWithFillableAmounts = await this._orderStateUtils.getSignedOrdersWithFillableAmountsAsync(
            sortedPrunedOrders,
        );
        return ordersWithFillableAmounts;
    }

    /**
     * Util function to check if takerAddress's allowance is enough for 0x exchange contracts to conduct the swap specified by the swapQuote.
     * @param swapQuote The swapQuote in question to check enough allowance enabled for 0x exchange contracts to conduct the swap.
     * @param takerAddress The address of the taker of the provided swapQuote
     */
    public async isSwapQuoteFillableByTakerAddressAsync(
        swapQuote: SwapQuote,
        takerAddress: string,
    ): Promise<[boolean, boolean]> {
        const balanceAndAllowance = await this._devUtilsContract
            .getBalanceAndAssetProxyAllowance(takerAddress, swapQuote.takerAssetData)
            .callAsync();
        return [
            balanceAndAllowance[1].isGreaterThanOrEqualTo(swapQuote.bestCaseQuoteInfo.totalTakerAssetAmount),
            balanceAndAllowance[1].isGreaterThanOrEqualTo(swapQuote.worstCaseQuoteInfo.totalTakerAssetAmount),
        ];
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

    /**
     * Utility function to get assetData for Ether token.
     */
    public async getEtherTokenAssetDataOrThrowAsync(): Promise<string> {
        return assetDataUtils.encodeERC20AssetData(this._contractAddresses.etherToken);
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
        const orders = _.map(apiOrders, o => o.order);
        const prunedOrders = orderPrunerUtils.pruneForUsableSignedOrders(
            orders,
            this.permittedOrderFeeTypes,
            this.expiryBufferMs,
        );
        return prunedOrders;
    }

    /**
     * General function for getting swap quote, conditionally uses different logic per specified marketOperation
     */
    private async _getSwapQuoteAsync(
        makerAssetData: string,
        takerAssetData: string,
        assetFillAmount: BigNumber,
        marketOperation: MarketOperation,
        options: Partial<SwapQuoteRequestOpts>,
    ): Promise<SwapQuote> {
        const opts = _.merge({}, constants.DEFAULT_SWAP_QUOTE_REQUEST_OPTS, options);
        assert.isString('makerAssetData', makerAssetData);
        assert.isString('takerAssetData', takerAssetData);
        let gasPrice: BigNumber;
        if (!!opts.gasPrice) {
            gasPrice = opts.gasPrice;
            assert.isBigNumber('gasPrice', gasPrice);
        } else {
            gasPrice = await this.getGasPriceEstimationOrThrowAsync();
        }

        // If RFQT is enabled and `nativeExclusivelyRFQT` is set, then `ERC20BridgeSource.Native` should
        // never be excluded.
        if (
            opts.rfqt &&
            opts.rfqt.nativeExclusivelyRFQT === true &&
            opts.excludedSources.includes(ERC20BridgeSource.Native)
        ) {
            throw new Error('Native liquidity cannot be excluded if "rfqt.nativeExclusivelyRFQT" is set');
        }

        // get batches of orders from different sources, awaiting sources in parallel
        const orderBatchPromises: Array<Promise<SignedOrder[]>> = [];

        const skipOpenOrderbook =
            opts.excludedSources.includes(ERC20BridgeSource.Native) ||
            (opts.rfqt && opts.rfqt.nativeExclusivelyRFQT === true);
        if (!skipOpenOrderbook) {
            orderBatchPromises.push(this._getSignedOrdersAsync(makerAssetData, takerAssetData)); // order book
        }

        const rfqtOptions = this._rfqtOptions;
        const quoteRequestor = new QuoteRequestor(
            rfqtOptions ? rfqtOptions.makerAssetOfferings || {} : {},
            rfqtOptions ? rfqtOptions.warningLogger : undefined,
            rfqtOptions ? rfqtOptions.infoLogger : undefined,
            this.expiryBufferMs,
        );

        if (
            opts.rfqt && // This is an RFQT-enabled API request
            opts.rfqt.intentOnFilling && // The requestor is asking for a firm quote
            opts.rfqt.apiKey &&
            this._isApiKeyWhitelisted(opts.rfqt.apiKey) && // A valid API key was provided
            !opts.excludedSources.includes(ERC20BridgeSource.Native) // Native liquidity is not excluded
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

        const orderBatches: SignedOrder[][] = await Promise.all(orderBatchPromises);

        const unsortedOrders: SignedOrder[] = orderBatches.reduce((_orders, batch) => _orders.concat(...batch), []);

        const orders = sortingUtils.sortOrders(unsortedOrders);

        // if no native orders, pass in a dummy order for the sampler to have required metadata for sampling
        if (orders.length === 0) {
            orders.push(
                createDummyOrderForSampler(makerAssetData, takerAssetData, this._contractAddresses.uniswapBridge),
            );
        }

        let swapQuote: SwapQuote;

        const calcOpts: CalculateSwapQuoteOpts = opts;

        if (calcOpts.rfqt !== undefined) {
            calcOpts.rfqt.quoteRequestor = quoteRequestor;
        }

        if (marketOperation === MarketOperation.Buy) {
            swapQuote = await this._swapQuoteCalculator.calculateMarketBuySwapQuoteAsync(
                orders,
                assetFillAmount,
                gasPrice,
                calcOpts,
            );
        } else {
            swapQuote = await this._swapQuoteCalculator.calculateMarketSellSwapQuoteAsync(
                orders,
                assetFillAmount,
                gasPrice,
                calcOpts,
            );
        }

        return swapQuote;
    }
    private _isApiKeyWhitelisted(apiKey: string): boolean {
        const whitelistedApiKeys = this._rfqtOptions ? this._rfqtOptions.takerApiKeyWhitelist : [];
        return whitelistedApiKeys.includes(apiKey);
    }
}
// tslint:disable-next-line: max-file-line-count
