import { ContractAddresses } from '@0x/contract-addresses';
import { SignedOrder } from '@0x/types';
import { BigNumber, NULL_ADDRESS } from '@0x/utils';

import { MarketOperation } from '../../types';
import { RfqtIndicativeQuoteResponse } from '../quote_requestor';
import { difference } from '../utils';

import { BUY_SOURCES, DEFAULT_GET_MARKET_ORDERS_OPTS, FEE_QUOTE_SOURCES, ONE_ETHER, SELL_SOURCES } from './constants';
import { createFillPaths, getPathAdjustedRate, getPathAdjustedSlippage } from './fills';
import {
    createOrdersFromPath,
    createSignedOrdersFromRfqtIndicativeQuotes,
    createSignedOrdersWithFillableAmounts,
    getNativeOrderTokens,
} from './orders';
import { findOptimalPath } from './path_optimizer';
import { DexOrderSampler, getSampleAmounts } from './sampler';
import {
    AggregationError,
    DexSample,
    ERC20BridgeSource,
    GetMarketOrdersOpts,
    OptimizedMarketOrder,
    OrderDomain,
} from './types';

async function getRfqtIndicativeQuotesAsync(
    makerAssetData: string,
    takerAssetData: string,
    marketOperation: MarketOperation,
    assetFillAmount: BigNumber,
    opts: Partial<GetMarketOrdersOpts>,
): Promise<RfqtIndicativeQuoteResponse[]> {
    if (opts.rfqt && opts.rfqt.isIndicative === true && opts.rfqt.quoteRequestor) {
        return opts.rfqt.quoteRequestor.requestRfqtIndicativeQuotesAsync(
            makerAssetData,
            takerAssetData,
            assetFillAmount,
            marketOperation,
            opts.rfqt,
        );
    } else {
        return Promise.resolve<RfqtIndicativeQuoteResponse[]>([]);
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
    ) {
        this._wethAddress = contractAddresses.etherToken.toLowerCase();
        this._multiBridge = contractAddresses.multiBridge.toLowerCase();
    }

    /**
     * gets the orders required for a market sell operation by (potentially) merging native orders with
     * generated bridge orders.
     * @param nativeOrders Native orders.
     * @param takerAmount Amount of taker asset to sell.
     * @param opts Options object.
     * @return orders.
     */
    public async getMarketSellOrdersAsync(
        nativeOrders: SignedOrder[],
        takerAmount: BigNumber,
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<OptimizedMarketOrder[]> {
        if (nativeOrders.length === 0) {
            throw new Error(AggregationError.EmptyOrders);
        }
        const _opts = { ...DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const [makerToken, takerToken] = getNativeOrderTokens(nativeOrders[0]);

        // Call the sampler contract.
        const samplerPromise = this._sampler.executeAsync(
            // Get native order fillable amounts.
            DexOrderSampler.ops.getOrderFillableTakerAmounts(nativeOrders),
            // Get the custom liquidity provider from registry.
            DexOrderSampler.ops.getLiquidityProviderFromRegistry(
                this._liquidityProviderRegistry,
                makerToken,
                takerToken,
            ),
            // Get ETH -> maker token price.
            DexOrderSampler.ops.getMedianSellRate(
                difference(FEE_QUOTE_SOURCES.concat(this._optionalSources()), _opts.excludedSources),
                makerToken,
                this._wethAddress,
                ONE_ETHER,
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            // Get sell quotes for taker -> maker.
            DexOrderSampler.ops.getSellQuotes(
                difference(SELL_SOURCES.concat(this._optionalSources()), _opts.excludedSources),
                makerToken,
                takerToken,
                getSampleAmounts(takerAmount, _opts.numSamples, _opts.sampleDistributionBase),
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
        );
        const rfqtPromise = getRfqtIndicativeQuotesAsync(
            nativeOrders[0].makerAssetData,
            nativeOrders[0].takerAssetData,
            MarketOperation.Sell,
            takerAmount,
            _opts,
        );
        const [
            [orderFillableAmounts, liquidityProviderAddress, ethToMakerAssetRate, dexQuotes],
            rfqtIndicativeQuotes,
        ] = await Promise.all([samplerPromise, rfqtPromise]);
        return this._generateOptimizedOrders({
            orderFillableAmounts,
            nativeOrders,
            dexQuotes,
            rfqtIndicativeQuotes,
            liquidityProviderAddress,
            multiBridgeAddress: this._multiBridge,
            inputToken: takerToken,
            outputToken: makerToken,
            side: MarketOperation.Sell,
            inputAmount: takerAmount,
            ethToOutputRate: ethToMakerAssetRate,
            bridgeSlippage: _opts.bridgeSlippage,
            maxFallbackSlippage: _opts.maxFallbackSlippage,
            excludedSources: _opts.excludedSources,
            feeSchedule: _opts.feeSchedule,
            allowFallback: _opts.allowFallback,
            shouldBatchBridgeOrders: _opts.shouldBatchBridgeOrders,
        });
    }

    /**
     * gets the orders required for a market buy operation by (potentially) merging native orders with
     * generated bridge orders.
     * @param nativeOrders Native orders.
     * @param makerAmount Amount of maker asset to buy.
     * @param opts Options object.
     * @return orders.
     */
    public async getMarketBuyOrdersAsync(
        nativeOrders: SignedOrder[],
        makerAmount: BigNumber,
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<OptimizedMarketOrder[]> {
        if (nativeOrders.length === 0) {
            throw new Error(AggregationError.EmptyOrders);
        }
        const _opts = { ...DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const [makerToken, takerToken] = getNativeOrderTokens(nativeOrders[0]);
        // Call the sampler contract.
        const samplerPromise = this._sampler.executeAsync(
            // Get native order fillable amounts.
            DexOrderSampler.ops.getOrderFillableMakerAmounts(nativeOrders),
            // Get the custom liquidity provider from registry.
            DexOrderSampler.ops.getLiquidityProviderFromRegistry(
                this._liquidityProviderRegistry,
                makerToken,
                takerToken,
            ),
            // Get ETH -> taker token price.
            DexOrderSampler.ops.getMedianSellRate(
                difference(FEE_QUOTE_SOURCES.concat(this._optionalSources()), _opts.excludedSources),
                takerToken,
                this._wethAddress,
                ONE_ETHER,
                this._wethAddress,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            // Get buy quotes for taker -> maker.
            DexOrderSampler.ops.getBuyQuotes(
                difference(
                    BUY_SOURCES.concat(
                        this._liquidityProviderRegistry !== NULL_ADDRESS ? [ERC20BridgeSource.LiquidityProvider] : [],
                    ),
                    _opts.excludedSources,
                ),
                makerToken,
                takerToken,
                getSampleAmounts(makerAmount, _opts.numSamples, _opts.sampleDistributionBase),
                this._wethAddress,
                this._liquidityProviderRegistry,
            ),
        );
        const rfqtPromise = getRfqtIndicativeQuotesAsync(
            nativeOrders[0].makerAssetData,
            nativeOrders[0].takerAssetData,
            MarketOperation.Buy,
            makerAmount,
            _opts,
        );
        const [
            [orderFillableAmounts, liquidityProviderAddress, ethToTakerAssetRate, dexQuotes],
            rfqtIndicativeQuotes,
        ] = await Promise.all([samplerPromise, rfqtPromise]);

        return this._generateOptimizedOrders({
            orderFillableAmounts,
            nativeOrders,
            dexQuotes,
            rfqtIndicativeQuotes,
            liquidityProviderAddress,
            multiBridgeAddress: this._multiBridge,
            inputToken: makerToken,
            outputToken: takerToken,
            side: MarketOperation.Buy,
            inputAmount: makerAmount,
            ethToOutputRate: ethToTakerAssetRate,
            bridgeSlippage: _opts.bridgeSlippage,
            maxFallbackSlippage: _opts.maxFallbackSlippage,
            excludedSources: _opts.excludedSources,
            feeSchedule: _opts.feeSchedule,
            allowFallback: _opts.allowFallback,
            shouldBatchBridgeOrders: _opts.shouldBatchBridgeOrders,
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

        const sources = difference(BUY_SOURCES, _opts.excludedSources);
        const ops = [
            ...batchNativeOrders.map(orders => DexOrderSampler.ops.getOrderFillableMakerAmounts(orders)),
            ...batchNativeOrders.map(orders =>
                DexOrderSampler.ops.getMedianSellRate(
                    difference(FEE_QUOTE_SOURCES, _opts.excludedSources),
                    getNativeOrderTokens(orders[0])[1],
                    this._wethAddress,
                    ONE_ETHER,
                    this._wethAddress,
                ),
            ),
            ...batchNativeOrders.map((orders, i) =>
                DexOrderSampler.ops.getBuyQuotes(
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

        return batchNativeOrders.map((nativeOrders, i) => {
            if (nativeOrders.length === 0) {
                throw new Error(AggregationError.EmptyOrders);
            }
            const [makerToken, takerToken] = getNativeOrderTokens(nativeOrders[0]);
            const orderFillableAmounts = batchOrderFillableAmounts[i];
            const ethToTakerAssetRate = batchEthToTakerAssetRate[i];
            const dexQuotes = batchDexQuotes[i];
            const makerAmount = makerAmounts[i];
            try {
                return this._generateOptimizedOrders({
                    orderFillableAmounts,
                    nativeOrders,
                    dexQuotes,
                    rfqtIndicativeQuotes: [],
                    inputToken: makerToken,
                    outputToken: takerToken,
                    side: MarketOperation.Buy,
                    inputAmount: makerAmount,
                    ethToOutputRate: ethToTakerAssetRate,
                    bridgeSlippage: _opts.bridgeSlippage,
                    maxFallbackSlippage: _opts.maxFallbackSlippage,
                    excludedSources: _opts.excludedSources,
                    feeSchedule: _opts.feeSchedule,
                    allowFallback: _opts.allowFallback,
                    shouldBatchBridgeOrders: _opts.shouldBatchBridgeOrders,
                });
            } catch (e) {
                // It's possible for one of the pairs to have no path
                // rather than throw NO_OPTIMAL_PATH we return undefined
                return undefined;
            }
        });
    }

    private _generateOptimizedOrders(opts: {
        side: MarketOperation;
        inputToken: string;
        outputToken: string;
        inputAmount: BigNumber;
        nativeOrders: SignedOrder[];
        orderFillableAmounts: BigNumber[];
        dexQuotes: DexSample[][];
        rfqtIndicativeQuotes: RfqtIndicativeQuoteResponse[];
        runLimit?: number;
        ethToOutputRate?: BigNumber;
        bridgeSlippage?: number;
        maxFallbackSlippage?: number;
        excludedSources?: ERC20BridgeSource[];
        feeSchedule?: { [source: string]: BigNumber };
        allowFallback?: boolean;
        shouldBatchBridgeOrders?: boolean;
        liquidityProviderAddress?: string;
        multiBridgeAddress?: string;
    }): OptimizedMarketOrder[] {
        const { inputToken, outputToken, side, inputAmount } = opts;
        const maxFallbackSlippage = opts.maxFallbackSlippage || 0;
        // Convert native orders and dex quotes into fill paths.
        const paths = createFillPaths({
            side,
            // Augment native orders with their fillable amounts.
            orders: [
                ...createSignedOrdersWithFillableAmounts(side, opts.nativeOrders, opts.orderFillableAmounts),
                ...createSignedOrdersFromRfqtIndicativeQuotes(opts.rfqtIndicativeQuotes),
            ],
            dexQuotes: opts.dexQuotes,
            targetInput: inputAmount,
            ethToOutputRate: opts.ethToOutputRate,
            excludedSources: opts.excludedSources,
            feeSchedule: opts.feeSchedule,
        });
        // Find the optimal path.
        let optimalPath = findOptimalPath(side, paths, inputAmount, opts.runLimit) || [];
        if (optimalPath.length === 0) {
            throw new Error(AggregationError.NoOptimalPath);
        }
        // Generate a fallback path if native orders are in the optimal paath.
        const nativeSubPath = optimalPath.filter(f => f.source === ERC20BridgeSource.Native);
        if (opts.allowFallback && nativeSubPath.length !== 0) {
            // We create a fallback path that is exclusive of Native liquidity
            // This is the optimal on-chain path for the entire input amount
            const nonNativePaths = paths.filter(p => p.length > 0 && p[0].source !== ERC20BridgeSource.Native);
            const nonNativeOptimalPath = findOptimalPath(side, nonNativePaths, inputAmount, opts.runLimit) || [];
            // Calculate the slippage of on-chain sources compared to the most optimal path
            const fallbackSlippage = getPathAdjustedSlippage(
                side,
                nonNativeOptimalPath,
                inputAmount,
                getPathAdjustedRate(side, optimalPath, inputAmount),
            );
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
        return createOrdersFromPath(optimalPath, {
            side,
            inputToken,
            outputToken,
            orderDomain: this._orderDomain,
            contractAddresses: this.contractAddresses,
            bridgeSlippage: opts.bridgeSlippage || 0,
            liquidityProviderAddress: opts.liquidityProviderAddress,
            multiBridgeAddress: opts.multiBridgeAddress,
            shouldBatchBridgeOrders: !!opts.shouldBatchBridgeOrders,
        });
    }

    private _optionalSources(): ERC20BridgeSource[] {
        return (this._liquidityProviderRegistry !== NULL_ADDRESS ? [ERC20BridgeSource.LiquidityProvider] : []).concat(
            this._multiBridge !== NULL_ADDRESS ? [ERC20BridgeSource.MultiBridge] : [],
        );
    }
}

// tslint:disable: max-file-line-count
