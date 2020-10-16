import { ContractAddresses } from '@0x/contract-addresses';
import { RFQTIndicativeQuote } from '@0x/quote-server';
import { SignedOrder } from '@0x/types';
import { BigNumber, NULL_ADDRESS } from '@0x/utils';
import * as _ from 'lodash';

import { MarketOperation } from '../../types';
import { QuoteRequestor } from '../quote_requestor';

import { generateQuoteReport, QuoteReport } from './../quote_report_generator';
import {
    BUY_SOURCE_FILTER,
    DEFAULT_GET_MARKET_ORDERS_OPTS,
    FEE_QUOTE_SOURCES,
    ONE_ETHER,
    SELL_SOURCE_FILTER,
    SOURCE_FLAGS,
    ZERO_AMOUNT,
} from './constants';
import { createFills } from './fills';
import { getBestTwoHopQuote } from './multihop_utils';
import {
    createOrdersFromTwoHopSample,
    createSignedOrdersFromRfqtIndicativeQuotes,
    createSignedOrdersWithFillableAmounts,
    getNativeOrderTokens,
} from './orders';
import { findOptimalPathAsync } from './path_optimizer';
import { DexOrderSampler, getSampleAmounts } from './sampler';
import { SourceFilters } from './source_filters';
import {
    AggregationError,
    CollapsedFill,
    DexSample,
    ERC20BridgeSource,
    ExchangeProxyOverhead,
    FeeSchedule,
    GetMarketOrdersOpts,
    MarketSideLiquidity,
    OptimizedMarketOrder,
    OptimizerResult,
    OrderDomain,
    TokenAdjacencyGraph,
} from './types';

// tslint:disable:boolean-naming

/**
 * Returns a indicative quotes or an empty array if RFQT is not enabled or requested
 * @param makerAssetData the maker asset data
 * @param takerAssetData the taker asset data
 * @param marketOperation Buy or Sell
 * @param assetFillAmount the amount to fill, in base units
 * @param opts market request options
 */
export async function getRfqtIndicativeQuotesAsync(
    makerAssetData: string,
    takerAssetData: string,
    marketOperation: MarketOperation,
    assetFillAmount: BigNumber,
    opts: Partial<GetMarketOrdersOpts>,
): Promise<RFQTIndicativeQuote[]> {
    if (opts.rfqt && opts.rfqt.isIndicative === true && opts.rfqt.quoteRequestor) {
        return opts.rfqt.quoteRequestor.requestRfqtIndicativeQuotesAsync(
            makerAssetData,
            takerAssetData,
            assetFillAmount,
            marketOperation,
            opts.rfqt,
        );
    } else {
        return Promise.resolve<RFQTIndicativeQuote[]>([]);
    }
}

export class MarketOperationUtils {
    private readonly _wethAddress: string;
    private readonly _multiBridge: string;
    private readonly _sellSources: SourceFilters;
    private readonly _buySources: SourceFilters;
    private readonly _feeSources = new SourceFilters(FEE_QUOTE_SOURCES);

    private static _computeQuoteReport(
        nativeOrders: SignedOrder[],
        quoteRequestor: QuoteRequestor | undefined,
        marketSideLiquidity: MarketSideLiquidity,
        optimizerResult: OptimizerResult,
    ): QuoteReport {
        const { side, dexQuotes, twoHopQuotes, orderFillableAmounts } = marketSideLiquidity;
        const { liquidityDelivered } = optimizerResult;
        return generateQuoteReport(
            side,
            _.flatten(dexQuotes),
            twoHopQuotes,
            nativeOrders,
            orderFillableAmounts,
            liquidityDelivered,
            quoteRequestor,
        );
    }

    constructor(
        private readonly _sampler: DexOrderSampler,
        private readonly contractAddresses: ContractAddresses,
        private readonly _orderDomain: OrderDomain,
        private readonly _liquidityProviderRegistry: string = NULL_ADDRESS,
        private readonly _tokenAdjacencyGraph: TokenAdjacencyGraph = {},
    ) {
        this._wethAddress = contractAddresses.etherToken.toLowerCase();
        this._multiBridge = contractAddresses.multiBridge.toLowerCase();
        const optionalQuoteSources = [];
        if (this._liquidityProviderRegistry !== NULL_ADDRESS) {
            optionalQuoteSources.push(ERC20BridgeSource.LiquidityProvider);
        }
        if (this._multiBridge !== NULL_ADDRESS) {
            optionalQuoteSources.push(ERC20BridgeSource.MultiBridge);
        }
        this._buySources = BUY_SOURCE_FILTER.validate(optionalQuoteSources);
        this._sellSources = SELL_SOURCE_FILTER.validate(optionalQuoteSources);
    }

    /**
     * Gets the liquidity available for a market sell operation
     * @param nativeOrders Native orders.
     * @param takerAmount Amount of taker asset to sell.
     * @param opts Options object.
     * @return MarketSideLiquidity.
     */
    public async getMarketSellLiquidityAsync(
        nativeOrders: SignedOrder[],
        takerAmount: BigNumber,
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<MarketSideLiquidity> {
        if (nativeOrders.length === 0) {
            throw new Error(AggregationError.EmptyOrders);
        }
        const _opts = { ...DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const [makerToken, takerToken] = getNativeOrderTokens(nativeOrders[0]);
        const sampleAmounts = getSampleAmounts(takerAmount, _opts.numSamples, _opts.sampleDistributionBase);

        const requestFilters = new SourceFilters().exclude(_opts.excludedSources).include(_opts.includedSources);
        const quoteSourceFilters = this._sellSources.merge(requestFilters);

        const feeSourceFilters = this._feeSources.exclude(_opts.excludedFeeSources);

        const {
            onChain: sampleBalancerOnChain,
            offChain: sampleBalancerOffChain,
        } = this._sampler.balancerPoolsCache.howToSampleBalancer(
            takerToken,
            makerToken,
            quoteSourceFilters.isAllowed(ERC20BridgeSource.Balancer),
        );

        const {
            onChain: sampleCreamOnChain,
            offChain: sampleCreamOffChain,
        } = this._sampler.creamPoolsCache.howToSampleCream(
            takerToken,
            makerToken,
            quoteSourceFilters.isAllowed(ERC20BridgeSource.Cream),
        );

        const offChainSources = [
            ...(!sampleCreamOnChain ? [ERC20BridgeSource.Cream] : []),
            ...(!sampleBalancerOnChain ? [ERC20BridgeSource.Balancer] : []),
        ];

        // Call the sampler contract.
        const samplerPromise = this._sampler.executeAsync(
            // Get native order fillable amounts.
            this._sampler.getOrderFillableTakerAmounts(nativeOrders, this.contractAddresses.exchange),
            // Get ETH -> maker token price.
            this._sampler.getMedianSellRate(
                feeSourceFilters.sources,
                makerToken,
                this._wethAddress,
                ONE_ETHER,
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            // Get ETH -> taker token price.
            this._sampler.getMedianSellRate(
                feeSourceFilters.sources,
                takerToken,
                this._wethAddress,
                ONE_ETHER,
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            // Get sell quotes for taker -> maker.
            this._sampler.getSellQuotes(
                quoteSourceFilters.exclude(offChainSources).sources,
                makerToken,
                takerToken,
                sampleAmounts,
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            this._sampler.getTwoHopSellQuotes(
                quoteSourceFilters.isAllowed(ERC20BridgeSource.MultiHop) ? quoteSourceFilters.sources : [],
                makerToken,
                takerToken,
                takerAmount,
                this._tokenAdjacencyGraph,
                this._wethAddress,
                this._liquidityProviderRegistry,
            ),
        );

        const rfqtPromise = quoteSourceFilters.isAllowed(ERC20BridgeSource.Native)
            ? getRfqtIndicativeQuotesAsync(
                  nativeOrders[0].makerAssetData,
                  nativeOrders[0].takerAssetData,
                  MarketOperation.Sell,
                  takerAmount,
                  _opts,
              )
            : Promise.resolve([]);

        const offChainBalancerPromise = sampleBalancerOffChain
            ? this._sampler.getBalancerSellQuotesOffChainAsync(makerToken, takerToken, sampleAmounts)
            : Promise.resolve([]);

        const offChainCreamPromise = sampleCreamOffChain
            ? this._sampler.getCreamSellQuotesOffChainAsync(makerToken, takerToken, sampleAmounts)
            : Promise.resolve([]);

        const offChainBancorPromise = quoteSourceFilters.isAllowed(ERC20BridgeSource.Bancor)
            ? this._sampler.getBancorSellQuotesOffChainAsync(makerToken, takerToken, [takerAmount])
            : Promise.resolve([]);

        const [
            [orderFillableAmounts, ethToMakerAssetRate, ethToTakerAssetRate, dexQuotes, twoHopQuotes],
            rfqtIndicativeQuotes,
            offChainBalancerQuotes,
            offChainCreamQuotes,
            offChainBancorQuotes,
        ] = await Promise.all([
            samplerPromise,
            rfqtPromise,
            offChainBalancerPromise,
            offChainCreamPromise,
            offChainBancorPromise,
        ]);

        return {
            side: MarketOperation.Sell,
            inputAmount: takerAmount,
            inputToken: takerToken,
            outputToken: makerToken,
            dexQuotes: dexQuotes.concat([...offChainBalancerQuotes, ...offChainCreamQuotes, offChainBancorQuotes]),
            nativeOrders,
            orderFillableAmounts,
            ethToOutputRate: ethToMakerAssetRate,
            ethToInputRate: ethToTakerAssetRate,
            rfqtIndicativeQuotes,
            twoHopQuotes,
        };
    }

    /**
     * Gets the liquidity available for a market buy operation
     * @param nativeOrders Native orders.
     * @param makerAmount Amount of maker asset to buy.
     * @param opts Options object.
     * @return MarketSideLiquidity.
     */
    public async getMarketBuyLiquidityAsync(
        nativeOrders: SignedOrder[],
        makerAmount: BigNumber,
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<MarketSideLiquidity> {
        if (nativeOrders.length === 0) {
            throw new Error(AggregationError.EmptyOrders);
        }
        const _opts = { ...DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const [makerToken, takerToken] = getNativeOrderTokens(nativeOrders[0]);
        const sampleAmounts = getSampleAmounts(makerAmount, _opts.numSamples, _opts.sampleDistributionBase);

        const requestFilters = new SourceFilters().exclude(_opts.excludedSources).include(_opts.includedSources);
        const quoteSourceFilters = this._buySources.merge(requestFilters);

        const feeSourceFilters = this._feeSources.exclude(_opts.excludedFeeSources);

        const {
            onChain: sampleBalancerOnChain,
            offChain: sampleBalancerOffChain,
        } = this._sampler.balancerPoolsCache.howToSampleBalancer(
            takerToken,
            makerToken,
            quoteSourceFilters.isAllowed(ERC20BridgeSource.Balancer),
        );

        const {
            onChain: sampleCreamOnChain,
            offChain: sampleCreamOffChain,
        } = this._sampler.creamPoolsCache.howToSampleCream(
            takerToken,
            makerToken,
            quoteSourceFilters.isAllowed(ERC20BridgeSource.Cream),
        );

        const offChainSources = [
            ...(!sampleCreamOnChain ? [ERC20BridgeSource.Cream] : []),
            ...(!sampleBalancerOnChain ? [ERC20BridgeSource.Balancer] : []),
        ];

        // Call the sampler contract.
        const samplerPromise = this._sampler.executeAsync(
            // Get native order fillable amounts.
            this._sampler.getOrderFillableMakerAmounts(nativeOrders, this.contractAddresses.exchange),
            // Get ETH -> makerToken token price.
            this._sampler.getMedianSellRate(
                feeSourceFilters.sources,
                makerToken,
                this._wethAddress,
                ONE_ETHER,
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            // Get ETH -> taker token price.
            this._sampler.getMedianSellRate(
                feeSourceFilters.sources,
                takerToken,
                this._wethAddress,
                ONE_ETHER,
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            // Get buy quotes for taker -> maker.
            this._sampler.getBuyQuotes(
                quoteSourceFilters.exclude(offChainSources).sources,
                makerToken,
                takerToken,
                sampleAmounts,
                this._wethAddress,
                this._liquidityProviderRegistry,
            ),
            this._sampler.getTwoHopBuyQuotes(
                quoteSourceFilters.isAllowed(ERC20BridgeSource.MultiHop) ? quoteSourceFilters.sources : [],
                makerToken,
                takerToken,
                makerAmount,
                this._tokenAdjacencyGraph,
                this._wethAddress,
                this._liquidityProviderRegistry,
            ),
        );

        const rfqtPromise = quoteSourceFilters.isAllowed(ERC20BridgeSource.Native)
            ? getRfqtIndicativeQuotesAsync(
                  nativeOrders[0].makerAssetData,
                  nativeOrders[0].takerAssetData,
                  MarketOperation.Buy,
                  makerAmount,
                  _opts,
              )
            : Promise.resolve([]);

        const offChainBalancerPromise = sampleBalancerOffChain
            ? this._sampler.getBalancerBuyQuotesOffChainAsync(makerToken, takerToken, sampleAmounts)
            : Promise.resolve([]);

        const offChainCreamPromise = sampleCreamOffChain
            ? this._sampler.getCreamBuyQuotesOffChainAsync(makerToken, takerToken, sampleAmounts)
            : Promise.resolve([]);

        const [
            [orderFillableAmounts, ethToMakerAssetRate, ethToTakerAssetRate, dexQuotes, twoHopQuotes],
            rfqtIndicativeQuotes,
            offChainBalancerQuotes,
            offChainCreamQuotes,
        ] = await Promise.all([samplerPromise, rfqtPromise, offChainBalancerPromise, offChainCreamPromise]);
        // Attach the MultiBridge address to the sample fillData
        (dexQuotes.find(quotes => quotes[0] && quotes[0].source === ERC20BridgeSource.MultiBridge) || []).forEach(
            q => (q.fillData = { poolAddress: this._multiBridge }),
        );
        return {
            side: MarketOperation.Buy,
            inputAmount: makerAmount,
            inputToken: makerToken,
            outputToken: takerToken,
            dexQuotes: dexQuotes.concat(offChainBalancerQuotes, offChainCreamQuotes),
            nativeOrders,
            orderFillableAmounts,
            ethToOutputRate: ethToTakerAssetRate,
            ethToInputRate: ethToMakerAssetRate,
            rfqtIndicativeQuotes,
            twoHopQuotes,
        };
    }

    /**
     * gets the orders required for a market sell operation by (potentially) merging native orders with
     * generated bridge orders.
     * @param nativeOrders Native orders.
     * @param takerAmount Amount of taker asset to sell.
     * @param opts Options object.
     * @return object with optimized orders and a QuoteReport
     */
    public async getMarketSellOrdersAsync(
        nativeOrders: SignedOrder[],
        takerAmount: BigNumber,
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<OptimizerResult> {
        const _opts = { ...DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const marketSideLiquidity = await this.getMarketSellLiquidityAsync(nativeOrders, takerAmount, _opts);
        const optimizerResult = await this._generateOptimizedOrdersAsync(marketSideLiquidity, {
            bridgeSlippage: _opts.bridgeSlippage,
            maxFallbackSlippage: _opts.maxFallbackSlippage,
            excludedSources: _opts.excludedSources,
            feeSchedule: _opts.feeSchedule,
            exchangeProxyOverhead: _opts.exchangeProxyOverhead,
            allowFallback: _opts.allowFallback,
        });

        // Compute Quote Report and return the results.
        let quoteReport: QuoteReport | undefined;
        if (_opts.shouldGenerateQuoteReport) {
            quoteReport = MarketOperationUtils._computeQuoteReport(
                nativeOrders,
                _opts.rfqt ? _opts.rfqt.quoteRequestor : undefined,
                marketSideLiquidity,
                optimizerResult,
            );
        }
        return { ...optimizerResult, quoteReport };
    }

    /**
     * gets the orders required for a market buy operation by (potentially) merging native orders with
     * generated bridge orders.
     * @param nativeOrders Native orders.
     * @param makerAmount Amount of maker asset to buy.
     * @param opts Options object.
     * @return object with optimized orders and a QuoteReport
     */
    public async getMarketBuyOrdersAsync(
        nativeOrders: SignedOrder[],
        makerAmount: BigNumber,
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<OptimizerResult> {
        const _opts = { ...DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const marketSideLiquidity = await this.getMarketBuyLiquidityAsync(nativeOrders, makerAmount, _opts);
        const optimizerResult = await this._generateOptimizedOrdersAsync(marketSideLiquidity, {
            bridgeSlippage: _opts.bridgeSlippage,
            maxFallbackSlippage: _opts.maxFallbackSlippage,
            excludedSources: _opts.excludedSources,
            feeSchedule: _opts.feeSchedule,
            exchangeProxyOverhead: _opts.exchangeProxyOverhead,
            allowFallback: _opts.allowFallback,
        });
        let quoteReport: QuoteReport | undefined;
        if (_opts.shouldGenerateQuoteReport) {
            quoteReport = MarketOperationUtils._computeQuoteReport(
                nativeOrders,
                _opts.rfqt ? _opts.rfqt.quoteRequestor : undefined,
                marketSideLiquidity,
                optimizerResult,
            );
        }
        return { ...optimizerResult, quoteReport };
    }

    /**
     * gets the orders required for a batch of market buy operations by (potentially) merging native orders with
     * generated bridge orders.
     *
     * NOTE: Currently `getBatchMarketBuyOrdersAsync()` does not support external liquidity providers.
     *
     * @param batchNativeOrders Batch of Native orders.
     * @param makerAmounts Array amount of maker asset to buy for each batch.
     * @param opts Options object.
     * @return orders.
     */
    public async getBatchMarketBuyOrdersAsync(
        batchNativeOrders: SignedOrder[][],
        makerAmounts: BigNumber[],
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<Array<OptimizedMarketOrder[] | undefined>> {
        if (batchNativeOrders.length === 0) {
            throw new Error(AggregationError.EmptyOrders);
        }
        const _opts = { ...DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };

        const requestFilters = new SourceFilters().exclude(_opts.excludedSources).include(_opts.includedSources);
        const quoteSourceFilters = this._buySources.merge(requestFilters);

        const feeSourceFilters = this._feeSources.exclude(_opts.excludedFeeSources);

        const ops = [
            ...batchNativeOrders.map(orders =>
                this._sampler.getOrderFillableMakerAmounts(orders, this.contractAddresses.exchange),
            ),
            ...batchNativeOrders.map(orders =>
                this._sampler.getMedianSellRate(
                    feeSourceFilters.sources,
                    getNativeOrderTokens(orders[0])[1],
                    this._wethAddress,
                    ONE_ETHER,
                    this._wethAddress,
                ),
            ),
            ...batchNativeOrders.map((orders, i) =>
                this._sampler.getBuyQuotes(
                    quoteSourceFilters.sources,
                    getNativeOrderTokens(orders[0])[0],
                    getNativeOrderTokens(orders[0])[1],
                    [makerAmounts[i]],
                    this._wethAddress,
                ),
            ),
        ];

        const executeResults = await this._sampler.executeBatchAsync(ops);
        const batchOrderFillableAmounts = executeResults.splice(0, batchNativeOrders.length) as BigNumber[][];
        const batchEthToTakerAssetRate = executeResults.splice(0, batchNativeOrders.length) as BigNumber[];
        const batchDexQuotes = executeResults.splice(0, batchNativeOrders.length) as DexSample[][][];
        const ethToInputRate = ZERO_AMOUNT;

        return Promise.all(
            batchNativeOrders.map(async (nativeOrders, i) => {
                if (nativeOrders.length === 0) {
                    throw new Error(AggregationError.EmptyOrders);
                }
                const [makerToken, takerToken] = getNativeOrderTokens(nativeOrders[0]);
                const orderFillableAmounts = batchOrderFillableAmounts[i];
                const ethToTakerAssetRate = batchEthToTakerAssetRate[i];
                const dexQuotes = batchDexQuotes[i];
                const makerAmount = makerAmounts[i];
                try {
                    const { optimizedOrders } = await this._generateOptimizedOrdersAsync(
                        {
                            side: MarketOperation.Buy,
                            nativeOrders,
                            orderFillableAmounts,
                            dexQuotes,
                            inputAmount: makerAmount,
                            ethToOutputRate: ethToTakerAssetRate,
                            ethToInputRate,
                            rfqtIndicativeQuotes: [],
                            inputToken: makerToken,
                            outputToken: takerToken,
                            twoHopQuotes: [],
                        },
                        {
                            bridgeSlippage: _opts.bridgeSlippage,
                            maxFallbackSlippage: _opts.maxFallbackSlippage,
                            excludedSources: _opts.excludedSources,
                            feeSchedule: _opts.feeSchedule,
                            allowFallback: _opts.allowFallback,
                        },
                    );
                    return optimizedOrders;
                } catch (e) {
                    // It's possible for one of the pairs to have no path
                    // rather than throw NO_OPTIMAL_PATH we return undefined
                    return undefined;
                }
            }),
        );
    }

    private async _generateOptimizedOrdersAsync(
        marketSideLiquidity: MarketSideLiquidity,
        opts: {
            runLimit?: number;
            bridgeSlippage?: number;
            maxFallbackSlippage?: number;
            excludedSources?: ERC20BridgeSource[];
            feeSchedule?: FeeSchedule;
            exchangeProxyOverhead?: ExchangeProxyOverhead;
            allowFallback?: boolean;
            shouldBatchBridgeOrders?: boolean;
        },
    ): Promise<OptimizerResult> {
        const {
            inputToken,
            outputToken,
            side,
            inputAmount,
            nativeOrders,
            orderFillableAmounts,
            rfqtIndicativeQuotes,
            dexQuotes,
            ethToOutputRate,
            ethToInputRate,
        } = marketSideLiquidity;
        const maxFallbackSlippage = opts.maxFallbackSlippage || 0;

        const orderOpts = {
            side,
            inputToken,
            outputToken,
            orderDomain: this._orderDomain,
            contractAddresses: this.contractAddresses,
            bridgeSlippage: opts.bridgeSlippage || 0,
        };

        // Convert native orders and dex quotes into `Fill` objects.
        const fills = createFills({
            side,
            // Augment native orders with their fillable amounts.
            orders: [
                ...createSignedOrdersWithFillableAmounts(side, nativeOrders, orderFillableAmounts),
                ...createSignedOrdersFromRfqtIndicativeQuotes(rfqtIndicativeQuotes),
            ],
            dexQuotes,
            targetInput: inputAmount,
            ethToOutputRate,
            ethToInputRate,
            excludedSources: opts.excludedSources,
            feeSchedule: opts.feeSchedule,
        });

        // Find the optimal path.
        const optimizerOpts = {
            ethToOutputRate,
            ethToInputRate,
            exchangeProxyOverhead: opts.exchangeProxyOverhead || (() => ZERO_AMOUNT),
        };

        const optimalPath = await findOptimalPathAsync(side, fills, inputAmount, opts.runLimit, optimizerOpts);
        const optimalPathRate = optimalPath ? optimalPath.adjustedRate() : ZERO_AMOUNT;

        const { adjustedRate: bestTwoHopRate, quote: bestTwoHopQuote } = getBestTwoHopQuote(
            marketSideLiquidity,
            opts.feeSchedule,
            opts.exchangeProxyOverhead,
        );
        if (bestTwoHopQuote && bestTwoHopRate.isGreaterThan(optimalPathRate)) {
            const twoHopOrders = createOrdersFromTwoHopSample(bestTwoHopQuote, orderOpts);
            return {
                optimizedOrders: twoHopOrders,
                liquidityDelivered: bestTwoHopQuote,
                sourceFlags: SOURCE_FLAGS[ERC20BridgeSource.MultiHop],
            };
        }

        // If there is no optimal path AND we didn't return a MultiHop quote, then throw
        if (optimalPath === undefined) {
            throw new Error(AggregationError.NoOptimalPath);
        }

        // Generate a fallback path if native orders are in the optimal path.
        const nativeFills = optimalPath.fills.filter(f => f.source === ERC20BridgeSource.Native);
        if (opts.allowFallback && nativeFills.length !== 0) {
            // We create a fallback path that is exclusive of Native liquidity
            // This is the optimal on-chain path for the entire input amount
            const nonNativeFills = fills.filter(p => p.length > 0 && p[0].source !== ERC20BridgeSource.Native);
            const nonNativeOptimalPath = await findOptimalPathAsync(side, nonNativeFills, inputAmount, opts.runLimit);
            // Calculate the slippage of on-chain sources compared to the most optimal path
            if (
                nonNativeOptimalPath !== undefined &&
                (nativeFills.length === optimalPath.fills.length ||
                    nonNativeOptimalPath.adjustedSlippage(optimalPathRate) <= maxFallbackSlippage)
            ) {
                optimalPath.addFallback(nonNativeOptimalPath);
            }
        }
        const collapsedPath = optimalPath.collapse(orderOpts);
        return {
            optimizedOrders: collapsedPath.orders,
            liquidityDelivered: collapsedPath.collapsedFills as CollapsedFill[],
            sourceFlags: collapsedPath.sourceFlags,
        };
    }
}

// tslint:disable: max-file-line-count
