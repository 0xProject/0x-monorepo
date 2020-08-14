import { ContractAddresses } from '@0x/contract-addresses';
import { ZERO_AMOUNT } from '@0x/order-utils';
import { RFQTIndicativeQuote } from '@0x/quote-server';
import { SignedOrder } from '@0x/types';
import { BigNumber, NULL_ADDRESS } from '@0x/utils';
import * as _ from 'lodash';

import { MarketOperation } from '../../types';
import { QuoteRequestor } from '../quote_requestor';
import { difference } from '../utils';

import { generateQuoteReport } from './../quote_report_generator';
import {
    BUY_SOURCES,
    DEFAULT_GET_MARKET_ORDERS_OPTS,
    FEE_QUOTE_SOURCES,
    ONE_ETHER,
    POSITIVE_INF,
    SELL_SOURCES,
    ZERO_AMOUNT,
} from './constants';
import { createFillPaths, getPathAdjustedRate, getPathAdjustedSlippage, getTwoHopAdjustedRate } from './fills';
import {
    createOrdersFromPath,
    createOrdersFromTwoHopSample,
    createSignedOrdersFromRfqtIndicativeQuotes,
    createSignedOrdersWithFillableAmounts,
    getNativeOrderTokens,
} from './orders';
import { findOptimalPathAsync } from './path_optimizer';
import { DexOrderSampler, getSampleAmounts } from './sampler';
import {
    AggregationError,
    DexSample,
    ERC20BridgeSource,
    FeeSchedule,
    GetMarketOrdersOpts,
    MarketSideLiquidity,
    MultiHopFillData,
    OptimizedMarketOrder,
    OptimizerResult,
    OrderDomain,
    TokenAdjacencyGraph,
} from './types';

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
    const hasExcludedNativeLiquidity = opts.excludedSources && opts.excludedSources.includes(ERC20BridgeSource.Native);
    if (!hasExcludedNativeLiquidity && opts.rfqt && opts.rfqt.isIndicative === true && opts.rfqt.quoteRequestor) {
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

    constructor(
        private readonly _sampler: DexOrderSampler,
        private readonly contractAddresses: ContractAddresses,
        private readonly _orderDomain: OrderDomain,
        private readonly _liquidityProviderRegistry: string = NULL_ADDRESS,
        private readonly _tokenAdjacencyGraph: TokenAdjacencyGraph = {},
    ) {
        this._wethAddress = contractAddresses.etherToken.toLowerCase();
        this._multiBridge = contractAddresses.multiBridge.toLowerCase();
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
        // Call the sampler contract.
        const samplerPromise = this._sampler.executeAsync(
            // Get native order fillable amounts.
            this._sampler.getOrderFillableTakerAmounts(nativeOrders, this.contractAddresses.exchange),
            // Get ETH -> maker token price.
            this._sampler.getMedianSellRate(
                difference(FEE_QUOTE_SOURCES, _opts.excludedSources),
                makerToken,
                this._wethAddress,
                ONE_ETHER,
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            // Get ETH -> taker token price.
            this._sampler.getMedianSellRate(
                difference(FEE_QUOTE_SOURCES, _opts.excludedSources),
                takerToken,
                this._wethAddress,
                ONE_ETHER,
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            // Get sell quotes for taker -> maker.
            this._sampler.getSellQuotes(
                difference(
                    SELL_SOURCES.concat(this._optionalSources()),
                    _opts.excludedSources.concat(ERC20BridgeSource.Balancer),
                ),
                makerToken,
                takerToken,
                sampleAmounts,
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            _opts.excludedSources.includes(ERC20BridgeSource.MultiHop)
                ? DexOrderSampler.constant([])
                : this._sampler.getTwoHopSellQuotes(
                      difference(
                          SELL_SOURCES.concat(this._optionalSources()),
                          _opts.excludedSources.concat([ERC20BridgeSource.MultiBridge]),
                      ),
                      makerToken,
                      takerToken,
                      takerAmount,
                      this._tokenAdjacencyGraph,
                      this._wethAddress,
                      this._liquidityProviderRegistry,
                  ),
        );

        const rfqtPromise = getRfqtIndicativeQuotesAsync(
            nativeOrders[0].makerAssetData,
            nativeOrders[0].takerAssetData,
            MarketOperation.Sell,
            takerAmount,
            _opts,
        );

        const balancerPromise = _opts.excludedSources.includes(ERC20BridgeSource.Balancer)
            ? Promise.resolve([])
            : this._sampler.getBalancerSellQuotesAsync(makerToken, takerToken, sampleAmounts);

        const bancorPromise = _opts.excludedSources.includes(ERC20BridgeSource.Bancor)
            ? Promise.resolve([])
            : this._sampler.getBancorSellQuotesAsync(makerToken, takerToken, sampleAmounts);

        const [
            [orderFillableAmounts, ethToMakerAssetRate, ethToTakerAssetRate, dexQuotes, twoHopQuotes],
            rfqtIndicativeQuotes,
            balancerQuotes,
            bancorQuotes,
        ] = await Promise.all([samplerPromise, rfqtPromise, balancerPromise, bancorPromise]);

        return {
            side: MarketOperation.Sell,
            inputAmount: takerAmount,
            inputToken: takerToken,
            outputToken: makerToken,
            dexQuotes: dexQuotes.concat(...balancerQuotes, bancorQuotes),
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

        // Call the sampler contract.
        const samplerPromise = this._sampler.executeAsync(
            // Get native order fillable amounts.
            this._sampler.getOrderFillableMakerAmounts(nativeOrders, this.contractAddresses.exchange),
            // Get ETH -> makerToken token price.
            this._sampler.getMedianSellRate(
                difference(FEE_QUOTE_SOURCES, _opts.excludedSources),
                makerToken,
                this._wethAddress,
                ONE_ETHER,
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            // Get ETH -> taker token price.
            this._sampler.getMedianSellRate(
                difference(FEE_QUOTE_SOURCES, _opts.excludedSources),
                takerToken,
                this._wethAddress,
                ONE_ETHER,
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            // Get buy quotes for taker -> maker.
            this._sampler.getBuyQuotes(
                difference(
                    BUY_SOURCES.concat(
                        this._liquidityProviderRegistry !== NULL_ADDRESS ? [ERC20BridgeSource.LiquidityProvider] : [],
                    ),
                    _opts.excludedSources.concat([ERC20BridgeSource.Balancer]),
                ),
                makerToken,
                takerToken,
                sampleAmounts,
                this._wethAddress,
                this._liquidityProviderRegistry,
            ),
            _opts.excludedSources.includes(ERC20BridgeSource.MultiHop)
                ? DexOrderSampler.constant([])
                : this._sampler.getTwoHopBuyQuotes(
                      difference(
                          BUY_SOURCES.concat(this._optionalSources()),
                          _opts.excludedSources.concat([ERC20BridgeSource.MultiBridge]),
                      ),
                      makerToken,
                      takerToken,
                      makerAmount,
                      this._tokenAdjacencyGraph,
                      this._wethAddress,
                      this._liquidityProviderRegistry,
                  ),
        );

        const balancerPromise = _opts.excludedSources.includes(ERC20BridgeSource.Balancer)
            ? Promise.resolve([])
            : this._sampler.getBalancerBuyQuotesAsync(makerToken, takerToken, sampleAmounts);

        const rfqtPromise = getRfqtIndicativeQuotesAsync(
            nativeOrders[0].makerAssetData,
            nativeOrders[0].takerAssetData,
            MarketOperation.Buy,
            makerAmount,
            _opts,
        );
        const [
            [orderFillableAmounts, ethToMakerAssetRate, ethToTakerAssetRate, dexQuotes, twoHopQuotes],
            rfqtIndicativeQuotes,
            balancerQuotes,
        ] = await Promise.all([samplerPromise, rfqtPromise, balancerPromise]);
        // Attach the MultiBridge address to the sample fillData
        (dexQuotes.find(quotes => quotes[0] && quotes[0].source === ERC20BridgeSource.MultiBridge) || []).forEach(
            q => (q.fillData = { poolAddress: this._multiBridge }),
        );
        return {
            side: MarketOperation.Buy,
            inputAmount: makerAmount,
            inputToken: makerToken,
            outputToken: takerToken,
            dexQuotes: dexQuotes.concat(balancerQuotes),
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
        return this._generateOptimizedOrdersAsync(marketSideLiquidity, {
            bridgeSlippage: _opts.bridgeSlippage,
            maxFallbackSlippage: _opts.maxFallbackSlippage,
            excludedSources: _opts.excludedSources,
            feeSchedule: _opts.feeSchedule,
            allowFallback: _opts.allowFallback,
            shouldBatchBridgeOrders: _opts.shouldBatchBridgeOrders,
            quoteRequestor: _opts.rfqt ? _opts.rfqt.quoteRequestor : undefined,
        });
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
        return this._generateOptimizedOrdersAsync(marketSideLiquidity, {
            bridgeSlippage: _opts.bridgeSlippage,
            maxFallbackSlippage: _opts.maxFallbackSlippage,
            excludedSources: _opts.excludedSources,
            feeSchedule: _opts.feeSchedule,
            allowFallback: _opts.allowFallback,
            shouldBatchBridgeOrders: _opts.shouldBatchBridgeOrders,
            quoteRequestor: _opts.rfqt ? _opts.rfqt.quoteRequestor : undefined,
        });
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

        const sources = difference(BUY_SOURCES, _opts.excludedSources.concat(ERC20BridgeSource.Balancer));
        const ops = [
            ...batchNativeOrders.map(orders =>
                this._sampler.getOrderFillableMakerAmounts(orders, this.contractAddresses.exchange),
            ),
            ...batchNativeOrders.map(orders =>
                this._sampler.getMedianSellRate(
                    difference(FEE_QUOTE_SOURCES, _opts.excludedSources),
                    getNativeOrderTokens(orders[0])[1],
                    this._wethAddress,
                    ONE_ETHER,
                    this._wethAddress,
                ),
            ),
            ...batchNativeOrders.map((orders, i) =>
                this._sampler.getBuyQuotes(
                    sources,
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
                            shouldBatchBridgeOrders: _opts.shouldBatchBridgeOrders,
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
            allowFallback?: boolean;
            shouldBatchBridgeOrders?: boolean;
            quoteRequestor?: QuoteRequestor;
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
            twoHopQuotes,
        } = marketSideLiquidity;
        const maxFallbackSlippage = opts.maxFallbackSlippage || 0;

        const orderOpts = {
            side,
            inputToken,
            outputToken,
            orderDomain: this._orderDomain,
            contractAddresses: this.contractAddresses,
            bridgeSlippage: opts.bridgeSlippage || 0,
            shouldBatchBridgeOrders: !!opts.shouldBatchBridgeOrders,
        };

        // Convert native orders and dex quotes into fill paths.
        const paths = createFillPaths({
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
        let optimalPath = (await findOptimalPathAsync(side, paths, inputAmount, opts.runLimit)) || [];
        if (optimalPath.length === 0) {
            throw new Error(AggregationError.NoOptimalPath);
        }
        const optimalPathRate = getPathAdjustedRate(side, optimalPath, inputAmount);

        const isBetterRate = (a: BigNumber, b: BigNumber): boolean =>
            side === MarketOperation.Sell ? a.isGreaterThan(b) : a.isLessThan(b);

        const { bestRate: bestTwoHopRate, bestQuote: bestTwoHopQuote } = twoHopQuotes
            .map(quote => getTwoHopAdjustedRate(side, quote, inputAmount, ethToOutputRate, opts.feeSchedule))
            .reduce(
                (prev, curr, i) =>
                    isBetterRate(curr, prev.bestRate) ? { bestRate: curr, bestQuote: twoHopQuotes[i] } : prev,
                {
                    bestRate: side === MarketOperation.Sell ? ZERO_AMOUNT : POSITIVE_INF,
                    bestQuote: undefined as DexSample<MultiHopFillData> | undefined,
                },
            );
        if (isBetterRate(bestTwoHopRate, optimalPathRate)) {
            const twoHopOrders = createOrdersFromTwoHopSample(bestTwoHopQuote!, orderOpts);
            const twoHopQuoteReport = generateQuoteReport(
                side,
                _.flatten(dexQuotes),
                twoHopQuotes,
                nativeOrders,
                orderFillableAmounts,
                bestTwoHopQuote!,
                opts.quoteRequestor,
            );
            return { optimizedOrders: twoHopOrders, quoteReport: twoHopQuoteReport, isTwoHop: true };
        }

        // Generate a fallback path if native orders are in the optimal path.
        const nativeSubPath = optimalPath.filter(f => f.source === ERC20BridgeSource.Native);
        if (opts.allowFallback && nativeSubPath.length !== 0) {
            // We create a fallback path that is exclusive of Native liquidity
            // This is the optimal on-chain path for the entire input amount
            const nonNativePaths = paths.filter(p => p.length > 0 && p[0].source !== ERC20BridgeSource.Native);
            const nonNativeOptimalPath =
                (await findOptimalPathAsync(side, nonNativePaths, inputAmount, opts.runLimit)) || [];
            // Calculate the slippage of on-chain sources compared to the most optimal path
            const fallbackSlippage = getPathAdjustedSlippage(side, nonNativeOptimalPath, inputAmount, optimalPathRate);
            if (nativeSubPath.length === optimalPath.length || fallbackSlippage <= maxFallbackSlippage) {
                // If the last fill is Native and penultimate is not, then the intention was to partial fill
                // In this case we drop it entirely as we can't handle a failure at the end and we don't
                // want to fully fill when it gets prepended to the front below
                const [last, penultimateIfExists] = optimalPath.slice().reverse();
                const lastNativeFillIfExists =
                    last.source === ERC20BridgeSource.Native &&
                    penultimateIfExists &&
                    penultimateIfExists.source !== ERC20BridgeSource.Native
                        ? last
                        : undefined;
                // By prepending native paths to the front they cannot split on-chain sources and incur
                // an additional protocol fee. I.e [Uniswap,Native,Kyber] becomes [Native,Uniswap,Kyber]
                // In the previous step we dropped any hanging Native partial fills, as to not fully fill
                optimalPath = [...nativeSubPath.filter(f => f !== lastNativeFillIfExists), ...nonNativeOptimalPath];
            }
        }
        const optimizedOrders = createOrdersFromPath(optimalPath, orderOpts);
        const quoteReport = generateQuoteReport(
            side,
            _.flatten(dexQuotes),
            twoHopQuotes,
            nativeOrders,
            orderFillableAmounts,
            _.flatten(optimizedOrders.map(order => order.fills)),
            opts.quoteRequestor,
        );
        return { optimizedOrders, quoteReport, isTwoHop: false };
    }

    private _optionalSources(): ERC20BridgeSource[] {
        return (this._liquidityProviderRegistry !== NULL_ADDRESS ? [ERC20BridgeSource.LiquidityProvider] : []).concat(
            this._multiBridge !== NULL_ADDRESS ? [ERC20BridgeSource.MultiBridge] : [],
        );
    }
}

// tslint:disable: max-file-line-count
