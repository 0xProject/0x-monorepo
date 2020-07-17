import { ContractAddresses } from '@0x/contract-addresses';
import { ZERO_AMOUNT } from '@0x/order-utils';
import { RFQTIndicativeQuote } from '@0x/quote-server';
import { SignedOrder } from '@0x/types';
import { BigNumber, NULL_ADDRESS } from '@0x/utils';
import _ = require('lodash');

import { LiquidityForTakerMakerAssetDataPair, MarketOperation } from '../../types';
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
    FeeSchedule,
    FillData,
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

type Depth = {
    [key in ERC20BridgeSource]: Array<{ input: BigNumber; output: BigNumber; price: BigNumber; bucket: number }>
};

export function getSampleAmountsA(maxFillAmount: BigNumber, numSamples: number, expBase: number = 1): BigNumber[] {
    const distribution = [...Array<BigNumber>(numSamples)].map((_v, i) => new BigNumber(expBase).pow(i));
    const stepSizes = distribution.map(d => d.div(BigNumber.sum(...distribution)));
    const amounts = stepSizes.map((_s, i) => {
        if (i === numSamples - 1) {
            return maxFillAmount;
        }
        return maxFillAmount.times(BigNumber.sum(...[0, ...stepSizes.slice(0, i + 1)]));
    });
    return amounts;
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

    // tslint:disable-next-line:prefer-function-over-method typedef
    public calculateMarketDepth(
        nativeOrders: SignedOrder[],
        dexQuotes: Array<Array<DexSample<FillData>>>,
        sampleAmounts: BigNumber[],
        side: MarketOperation,
    ) {
        const depth: Depth = {} as any;
        const calcPrice = (input: BigNumber, output: BigNumber) =>
            output ? output.dividedBy(input).decimalPlaces(18) : ZERO_AMOUNT;
        const bestBucketPrices: BigNumber[] = sampleAmounts.map((sampleAmount, i) => {
            const valid = dexQuotes.filter(q => !q[i].output.isZero());
            const outputs = valid.map(q => q[i].output).sort((a, b) => b.comparedTo(a));
            // Median price
            // const bucketPrice = calcPrice(sampleAmount, outputs[Math.floor(outputs.length / 2)]);
            // Best price
            const bestOutput = side === MarketOperation.Sell ? BigNumber.max(...outputs) : BigNumber.min(...outputs);
            const bucketPrice = calcPrice(sampleAmount, bestOutput);
            console.log({ input: sampleAmount, output: bestOutput, bucketPrice });
            return bucketPrice;
        });
        const medianBucketPrices: BigNumber[] = sampleAmounts.map((sampleAmount, i) => {
            const valid = dexQuotes.filter(q => !q[i].output.isZero());
            const outputs = valid.map(q => q[i].output).sort((a, b) => b.comparedTo(a));
            // Median price
            const bucketPrice = calcPrice(sampleAmount, outputs[Math.floor(outputs.length / 2)]);
            return bucketPrice;
        });
        const priceDiff = medianBucketPrices[medianBucketPrices.length - 1].minus(bestBucketPrices[0]);

        const bucketPrices = [
            bestBucketPrices[0],
            ...getSampleAmountsA(priceDiff.times(2), sampleAmounts.length * 2).map(p => bestBucketPrices[0].plus(p)),
        ];
        // Sell side, higher the price the better as I get more ETH. bucketPrices High->low
        // buy side, lower the price the better as it costs less ETH. bucketPrices Low->high

        console.log({ side, priceDiff, bucketPrices });
        const findBucketByPrice = (price: BigNumber, source: ERC20BridgeSource) => {
            let bucket;
            if (side === MarketOperation.Sell) {
                // [ 229.05340183056437874,
                //   228.8099689580112688298,
                //   228.5665360854581589196,
                bucket = bucketPrices.findIndex(bucketPrice => price.gte(bucketPrice));
                if (bucket === -1) {
                    console.log('no sell bucket for', {
                        source,
                        price,
                        last: bucketPrices[bucketPrices.length - 1],
                        first: bucketPrices[0],
                    });
                    bucket = 999;
                    // bucket = price.gte(bucketPrices[0]) ? 0 : bucketPrices.length - 1;
                }
            } else {
                // [ 230.999934885187170879,
                //   231.03281311369590608505,
                //   231.0656913422046412911,
                // Market buy
                bucket = bucketPrices.findIndex(bucketPrice => price.lte(bucketPrice));
                if (bucket === -1) {
                    console.log('no buy bucket for', {
                        source,
                        price,
                        last: bucketPrices[bucketPrices.length - 1],
                        first: bucketPrices[0],
                    });
                    bucket = 999;
                    // bucket = price.lte(bucketPrices[0]) ? 0 : bucketPrices.length - 1;
                }
            }
            if (bucket === 0) {
                console.log('this is the best price in the world', {
                    side,
                    source,
                    price,
                    last: bucketPrices[bucketPrices.length - 1],
                    first: bucketPrices[0],
                });
            }
            return bucket;
        };
        // Remove the accumulation of the samples
        const unaccumulatedSamples = dexQuotes.map(samples => {
            return samples
                .map((qFs, i) => {
                    const prev = i === 0 ? undefined : samples[i - 1];
                    if (qFs.output.isZero()) {
                        return undefined;
                    }
                    return prev
                        ? {
                              ...qFs,
                              input: qFs.input.minus(prev.input),
                              output: qFs.output.minus(prev.output),
                              source: qFs.source,
                              prev,
                          }
                        : qFs;
                })
                .filter(qFs => qFs) as Array<{ input: BigNumber; output: BigNumber; source: ERC20BridgeSource }>;
        });
        let minFinalBucket = bucketPrices.length;
        // if this occurs we join them together into the same bucket
        for (const quotesForSource of unaccumulatedSamples) {
            if (!quotesForSource[0]) {
                continue;
            }
            const source = quotesForSource[0].source;
            if (!depth[source]) {
                depth[source] = [];
            }
            quotesForSource.forEach(q => {
                const price = calcPrice(q.input, q.output);
                const bucket = findBucketByPrice(price, source);
                depth[source].push({
                    input: q.input,
                    output: q.output,
                    bucket,
                    price: bucketPrices[bucket],
                });
            });
            // It's possible a Source with  many pools now exists multiple times in the same bucket
            // here we will just combine them
            const samplesGroupedByBucket = _.groupBy(depth[source], d => d.bucket);
            const squashedSamples: Array<{
                input: BigNumber;
                output: BigNumber;
                bucket: number;
                bucketPrice: BigNumber;
                price: BigNumber;
            }> = [];
            Object.keys(samplesGroupedByBucket).forEach(k => {
                const samplesByBucket = samplesGroupedByBucket[k];
                const input = BigNumber.sum(...samplesByBucket.map(s => s.input));
                const output = BigNumber.sum(...samplesByBucket.map(s => s.output));
                squashedSamples.push({
                    input,
                    output,
                    bucket: parseInt(k, 10),
                    price: bucketPrices[parseInt(k, 10)],
                    bucketPrice: bucketPrices[parseInt(k, 10)],
                });
            });
            const sourceCompleted =
                side === MarketOperation.Sell
                    ? squashedSamples.find(a => a.input.gte(sampleAmounts[sampleAmounts.length - 1]))
                    : squashedSamples.find(a => a.output.gte(sampleAmounts[sampleAmounts.length - 1]));
            if (sourceCompleted) {
                minFinalBucket = Math.max(sourceCompleted.bucket, minFinalBucket);
            }
            depth[source] = squashedSamples.sort((a, b) => a.bucket - b.bucket);
        }
        // Reaccumulate the samples
        for (const src of Object.keys(depth)) {
            const source = src as ERC20BridgeSource;
            let accInput = ZERO_AMOUNT;
            let accOutput = ZERO_AMOUNT;
            depth[source] = depth[source]
                .map(sample => {
                    // Skip over once a source has achieved its goal
                    if (sample.bucket > minFinalBucket) {
                        return undefined;
                    }
                    accInput = accInput.plus(sample.input);
                    accOutput = accOutput.plus(sample.output);
                    return { ...sample, input: accInput, output: accOutput, price: bucketPrices[sample.bucket] };
                })
                .filter(a => a) as any;
        }
        const sources = Object.keys(depth) as ERC20BridgeSource[];
        let totalOutput = ZERO_AMOUNT;
        const dataByBucketPrice = bucketPrices.map((price, i) => {
            const result: any = { price, bucket: i };
            for (const source of sources) {
                const sourceSample = depth[source].find(s => s.bucket === i);
                if (sourceSample) {
                    result[source] = sourceSample.output;
                    totalOutput = totalOutput.plus(sourceSample.output);
                }
            }
            return { ...result, bucket: i, cumulative: totalOutput };
            /*
            DepthData = {
                price: string;
                cumulative: string; // kyber.output + uniswap.output + ...
                Kyber: string // output here
                Uniswap: string; // uniswap.output
                Native: string; // native.output
            }
            */
        });
        return {
            depth,
            dataByBucketPrice,
        };
    }
    public async getMarketDepthAsync(
        nativeOrders: SignedOrder[],
        amount: BigNumber,
        side: MarketOperation = MarketOperation.Sell,
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<LiquidityForTakerMakerAssetDataPair> {
        if (nativeOrders.length === 0) {
            throw new Error(AggregationError.EmptyOrders);
        }
        console.log(opts);
        console.time('depth-charge');
        const _opts = { ...DEFAULT_GET_MARKET_ORDERS_OPTS, ...opts };
        const [makerToken, takerToken] = getNativeOrderTokens(nativeOrders[0]);
        const sampleAmounts = getSampleAmounts(amount, _opts.numSamples, _opts.sampleDistributionBase);

        // Call the sampler contract.
        const samplerPromise = this._sampler.executeAsync(
            // Get native order fillable amounts.
            DexOrderSampler.ops.getOrderFillableTakerAmounts(nativeOrders, this.contractAddresses.devUtils),
            await DexOrderSampler.ops.getSellQuotesAsync(
                difference(
                    SELL_SOURCES.concat(this._optionalSources()),
                    _opts.excludedSources.concat(ERC20BridgeSource.Balancer, ERC20BridgeSource.MultiBridge),
                ),
                makerToken,
                takerToken,
                sampleAmounts,
                this._wethAddress,
                this._sampler.balancerPoolsCache,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            await DexOrderSampler.ops.getBuyQuotesAsync(
                difference(
                    BUY_SOURCES.concat(this._optionalSources()),
                    _opts.excludedSources.concat(ERC20BridgeSource.Balancer, ERC20BridgeSource.MultiBridge),
                ),
                takerToken,
                makerToken,
                sampleAmounts,
                this._wethAddress,
                this._sampler.balancerPoolsCache,
                this._liquidityProviderRegistry,
            ),
        );

        const balancerSellPromise = this._sampler.executeAsync(
            await DexOrderSampler.ops.getSellQuotesAsync(
                difference([ERC20BridgeSource.Balancer], _opts.excludedSources),
                makerToken,
                takerToken,
                sampleAmounts,
                this._wethAddress,
                this._sampler.balancerPoolsCache,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
        );
        const balancerBuyPromise = this._sampler.executeAsync(
            await DexOrderSampler.ops.getBuyQuotesAsync(
                difference([ERC20BridgeSource.Balancer], _opts.excludedSources),
                takerToken,
                makerToken,
                sampleAmounts,
                this._wethAddress,
                this._sampler.balancerPoolsCache,
                this._liquidityProviderRegistry,
            ),
        );

        const [
            [orderFillableAmounts, dexSellQuotes, dexBuyQuotes],
            [balancerSellQuotes],
            [balancerBuyQuotes],
        ] = await Promise.all([samplerPromise, balancerSellPromise, balancerBuyPromise]);
        const sell = this.calculateMarketDepth(
            nativeOrders,
            [...dexSellQuotes, ...balancerSellQuotes],
            sampleAmounts,
            MarketOperation.Sell,
        );
        let buy;
        try {
            buy = this.calculateMarketDepth(
                [],
                [...dexBuyQuotes, ...balancerBuyQuotes],
                sampleAmounts,
                MarketOperation.Buy,
            );
        } catch (e) {
            console.log(e);
        }
        const liquidityAvailable = {
            sell: { dataByBucketPrice: sell.dataByBucketPrice },
            buy: { dataByBucketPrice: buy ? buy.dataByBucketPrice : {} },
            depth: sell.depth,
            takerAssetAvailableInBaseUnits: ZERO_AMOUNT,
            makerAssetAvailableInBaseUnits: ZERO_AMOUNT,
        };
        console.timeEnd('depth-charge');
        return liquidityAvailable;
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
        const sampleAmounts = getSampleAmounts(takerAmount, _opts.numSamples, _opts.sampleDistributionBase);

        // Call the sampler contract.
        const samplerPromise = this._sampler.executeAsync(
            // Get native order fillable amounts.
            DexOrderSampler.ops.getOrderFillableTakerAmounts(nativeOrders, this.contractAddresses.devUtils),
            // Get the custom liquidity provider from registry.
            DexOrderSampler.ops.getLiquidityProviderFromRegistry(
                this._liquidityProviderRegistry,
                makerToken,
                takerToken,
            ),
            // Get ETH -> maker token price.
            await DexOrderSampler.ops.getMedianSellRateAsync(
                difference(FEE_QUOTE_SOURCES.concat(this._optionalSources()), _opts.excludedSources),
                makerToken,
                this._wethAddress,
                ONE_ETHER,
                this._wethAddress,
                this._sampler.balancerPoolsCache,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            // Get sell quotes for taker -> maker.
            await DexOrderSampler.ops.getSellQuotesAsync(
                difference(
                    SELL_SOURCES.concat(this._optionalSources()),
                    _opts.excludedSources.concat(ERC20BridgeSource.Balancer),
                ),
                makerToken,
                takerToken,
                sampleAmounts,
                this._wethAddress,
                this._sampler.balancerPoolsCache,
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

        const balancerPromise = this._sampler.executeAsync(
            await DexOrderSampler.ops.getSellQuotesAsync(
                difference([ERC20BridgeSource.Balancer], _opts.excludedSources),
                makerToken,
                takerToken,
                sampleAmounts,
                this._wethAddress,
                this._sampler.balancerPoolsCache,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
        );

        const [
            [orderFillableAmounts, liquidityProviderAddress, ethToMakerAssetRate, dexQuotes],
            rfqtIndicativeQuotes,
            [balancerQuotes],
        ] = await Promise.all([samplerPromise, rfqtPromise, balancerPromise]);
        return this._generateOptimizedOrders({
            orderFillableAmounts,
            nativeOrders,
            dexQuotes: dexQuotes.concat(balancerQuotes),
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
        const sampleAmounts = getSampleAmounts(makerAmount, _opts.numSamples, _opts.sampleDistributionBase);

        // Call the sampler contract.
        const samplerPromise = this._sampler.executeAsync(
            // Get native order fillable amounts.
            DexOrderSampler.ops.getOrderFillableMakerAmounts(nativeOrders, this.contractAddresses.devUtils),
            // Get the custom liquidity provider from registry.
            DexOrderSampler.ops.getLiquidityProviderFromRegistry(
                this._liquidityProviderRegistry,
                makerToken,
                takerToken,
            ),
            // Get ETH -> taker token price.
            await DexOrderSampler.ops.getMedianSellRateAsync(
                difference(FEE_QUOTE_SOURCES.concat(this._optionalSources()), _opts.excludedSources),
                takerToken,
                this._wethAddress,
                ONE_ETHER,
                this._wethAddress,
                this._sampler.balancerPoolsCache,
                this._liquidityProviderRegistry,
                this._multiBridge,
            ),
            // Get buy quotes for taker -> maker.
            await DexOrderSampler.ops.getBuyQuotesAsync(
                difference(
                    BUY_SOURCES.concat(
                        this._liquidityProviderRegistry !== NULL_ADDRESS ? [ERC20BridgeSource.LiquidityProvider] : [],
                    ),
                    _opts.excludedSources.concat(ERC20BridgeSource.Balancer),
                ),
                makerToken,
                takerToken,
                sampleAmounts,
                this._wethAddress,
                this._sampler.balancerPoolsCache,
                this._liquidityProviderRegistry,
            ),
        );

        const balancerPromise = this._sampler.executeAsync(
            await DexOrderSampler.ops.getBuyQuotesAsync(
                difference([ERC20BridgeSource.Balancer], _opts.excludedSources),
                makerToken,
                takerToken,
                sampleAmounts,
                this._wethAddress,
                this._sampler.balancerPoolsCache,
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
            [balancerQuotes],
        ] = await Promise.all([samplerPromise, rfqtPromise, balancerPromise]);

        return this._generateOptimizedOrders({
            orderFillableAmounts,
            nativeOrders,
            dexQuotes: dexQuotes.concat(balancerQuotes),
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
            ...batchNativeOrders.map(orders =>
                DexOrderSampler.ops.getOrderFillableMakerAmounts(orders, this.contractAddresses.devUtils),
            ),
            ...(await Promise.all(
                batchNativeOrders.map(async orders =>
                    DexOrderSampler.ops.getMedianSellRateAsync(
                        difference(FEE_QUOTE_SOURCES, _opts.excludedSources),
                        getNativeOrderTokens(orders[0])[1],
                        this._wethAddress,
                        ONE_ETHER,
                        this._wethAddress,
                        this._sampler.balancerPoolsCache,
                    ),
                ),
            )),
            ...(await Promise.all(
                batchNativeOrders.map(async (orders, i) =>
                    DexOrderSampler.ops.getBuyQuotesAsync(
                        sources,
                        getNativeOrderTokens(orders[0])[0],
                        getNativeOrderTokens(orders[0])[1],
                        [makerAmounts[i]],
                        this._wethAddress,
                        this._sampler.balancerPoolsCache,
                    ),
                ),
            )),
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
        rfqtIndicativeQuotes: RFQTIndicativeQuote[];
        runLimit?: number;
        ethToOutputRate?: BigNumber;
        bridgeSlippage?: number;
        maxFallbackSlippage?: number;
        excludedSources?: ERC20BridgeSource[];
        feeSchedule?: FeeSchedule;
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
