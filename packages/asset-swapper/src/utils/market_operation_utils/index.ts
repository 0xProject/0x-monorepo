import { ContractAddresses } from '@0x/contract-addresses';
import { SignedOrder } from '@0x/types';
import { BigNumber, NULL_ADDRESS } from '@0x/utils';

import { MarketOperation } from '../../types';
import { difference } from '../utils';

import { BUY_SOURCES, DEFAULT_GET_MARKET_ORDERS_OPTS, FEE_QUOTE_SOURCES, ONE_ETHER, SELL_SOURCES } from './constants';
import { createFillPaths, getUnusedSourcePaths } from './fills';
import { createOrdersFromPath, createSignedOrdersWithFillableAmounts, getNativeOrderTokens } from './orders';
import { findOptimalPath } from './path_optimizer';
import { DexOrderSampler, getSampleAmounts } from './sampler';
import {
    AggregationError,
    DexSample,
    ERC20BridgeSource,
    Fill,
    GetMarketOrdersOpts,
    OptimizedMarketOrder,
    OrderDomain,
} from './types';

export class MarketOperationUtils {
    private readonly _wethAddress: string;

    constructor(
        private readonly _sampler: DexOrderSampler,
        private readonly contractAddresses: ContractAddresses,
        private readonly _orderDomain: OrderDomain,
        private readonly _liquidityProviderRegistry: string = NULL_ADDRESS,
    ) {
        this._wethAddress = contractAddresses.etherToken.toLowerCase();
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
        const [
            orderFillableAmounts,
            liquidityProviderAddress,
            ethToMakerAssetRate,
            dexQuotes,
        ] = await this._sampler.executeAsync(
            // Get native order fillable amounts.
            DexOrderSampler.ops.getOrderFillableTakerAmounts(nativeOrders),
            // Get the custom liquidity provider from registry.
            DexOrderSampler.ops.getLiquidityProviderFromRegistry(
                this._liquidityProviderRegistry,
                makerToken,
                takerToken,
            ),
            // Get ETH -> maker token price.
            makerToken === this._wethAddress
                ? DexOrderSampler.ops.constant(new BigNumber(1))
                : DexOrderSampler.ops.getMedianSellRate(
                      difference(FEE_QUOTE_SOURCES, _opts.excludedSources).concat(
                          this._liquidityProviderSourceIfAvailable(_opts.excludedSources),
                      ),
                      makerToken,
                      this._wethAddress,
                      ONE_ETHER,
                      this._liquidityProviderRegistry,
                  ),
            // Get sell quotes for taker -> maker.
            DexOrderSampler.ops.getSellQuotes(
                difference(SELL_SOURCES, _opts.excludedSources).concat(
                    this._liquidityProviderSourceIfAvailable(_opts.excludedSources),
                ),
                makerToken,
                takerToken,
                getSampleAmounts(takerAmount, _opts.numSamples, _opts.sampleDistributionBase),
                this._liquidityProviderRegistry,
            ),
        );
        return this._generateOptimizedOrders({
            orderFillableAmounts,
            nativeOrders,
            dexQuotes,
            liquidityProviderAddress,
            inputToken: takerToken,
            outputToken: makerToken,
            side: MarketOperation.Sell,
            inputAmount: takerAmount,
            ethToOutputRate: ethToMakerAssetRate,
            bridgeSlippage: _opts.bridgeSlippage,
            excludedSources: _opts.excludedSources,
            fees: _opts.fees,
            allowFallback: _opts.allowFallback,
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
        const [
            orderFillableAmounts,
            liquidityProviderAddress,
            ethToTakerAssetRate,
            dexQuotes,
        ] = await this._sampler.executeAsync(
            // Get native order fillable amounts.
            DexOrderSampler.ops.getOrderFillableMakerAmounts(nativeOrders),
            // Get the custom liquidity provider from registry.
            DexOrderSampler.ops.getLiquidityProviderFromRegistry(
                this._liquidityProviderRegistry,
                makerToken,
                takerToken,
            ),
            // Get ETH -> taker token price.
            takerToken === this._wethAddress
                ? DexOrderSampler.ops.constant(new BigNumber(1))
                : DexOrderSampler.ops.getMedianSellRate(
                      difference(FEE_QUOTE_SOURCES, _opts.excludedSources).concat(
                          this._liquidityProviderSourceIfAvailable(_opts.excludedSources),
                      ),
                      takerToken,
                      this._wethAddress,
                      ONE_ETHER,
                      this._liquidityProviderRegistry,
                  ),
            // Get buy quotes for taker -> maker.
            DexOrderSampler.ops.getBuyQuotes(
                difference(BUY_SOURCES, _opts.excludedSources).concat(
                    this._liquidityProviderSourceIfAvailable(_opts.excludedSources),
                ),
                makerToken,
                takerToken,
                getSampleAmounts(makerAmount, _opts.numSamples, _opts.sampleDistributionBase),
                this._liquidityProviderRegistry,
            ),
        );

        return this._generateOptimizedOrders({
            orderFillableAmounts,
            nativeOrders,
            dexQuotes,
            liquidityProviderAddress,
            inputToken: makerToken,
            outputToken: takerToken,
            side: MarketOperation.Buy,
            inputAmount: makerAmount,
            ethToOutputRate: ethToTakerAssetRate,
            bridgeSlippage: _opts.bridgeSlippage,
            excludedSources: _opts.excludedSources,
            fees: _opts.fees,
            allowFallback: _opts.allowFallback,
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
                ),
            ),
            ...batchNativeOrders.map((orders, i) =>
                DexOrderSampler.ops.getBuyQuotes(
                    sources,
                    getNativeOrderTokens(orders[0])[0],
                    getNativeOrderTokens(orders[0])[1],
                    [makerAmounts[i]],
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
            return this._generateOptimizedOrders({
                orderFillableAmounts,
                nativeOrders,
                dexQuotes,
                inputToken: makerToken,
                outputToken: takerToken,
                side: MarketOperation.Buy,
                inputAmount: makerAmount,
                ethToOutputRate: ethToTakerAssetRate,
                bridgeSlippage: _opts.bridgeSlippage,
                excludedSources: _opts.excludedSources,
                fees: _opts.fees,
                allowFallback: _opts.allowFallback,
            });
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
        runLimit?: number;
        ethToOutputRate?: BigNumber;
        bridgeSlippage?: number;
        excludedSources?: ERC20BridgeSource[];
        fees?: { [source: string]: BigNumber };
        allowFallback?: boolean;
        liquidityProviderAddress?: string;
    }): OptimizedMarketOrder[] {
        const { inputToken, outputToken, side, inputAmount } = opts;
        // Convert native orders and dex quotes into fill paths.
        const paths = createFillPaths({
            side,
            // Augment native orders with their fillable amounts.
            orders: createSignedOrdersWithFillableAmounts(side, opts.nativeOrders, opts.orderFillableAmounts),
            dexQuotes: opts.dexQuotes,
            targetInput: inputAmount,
            ethToOutputRate: opts.ethToOutputRate,
            excludedSources: opts.excludedSources,
            fees: opts.fees,
        });
        // Find the optimal path.
        const optimalPath = findOptimalPath(side, paths, inputAmount, opts.runLimit);
        if (!optimalPath) {
            throw new Error(AggregationError.NoOptimalPath);
        }
        // Find a fallback path from sources not used in the first path.
        let fallbackPath: Fill[] = [];
        if (opts.allowFallback) {
            fallbackPath =
                findOptimalPath(side, getUnusedSourcePaths(optimalPath, paths), inputAmount, opts.runLimit) || [];
        }
        return createOrdersFromPath([...optimalPath, ...fallbackPath], {
            side,
            inputToken,
            outputToken,
            orderDomain: this._orderDomain,
            contractAddresses: this.contractAddresses,
            bridgeSlippage: opts.bridgeSlippage || 0,
            liquidityProviderAddress: opts.liquidityProviderAddress,
        });
    }

    private _liquidityProviderSourceIfAvailable(excludedSources: ERC20BridgeSource[]): ERC20BridgeSource[] {
        return this._liquidityProviderRegistry !== NULL_ADDRESS &&
            !excludedSources.includes(ERC20BridgeSource.LiquidityProvider)
            ? [ERC20BridgeSource.LiquidityProvider]
            : [];
    }
}

// tslint:disable: max-file-line-count
