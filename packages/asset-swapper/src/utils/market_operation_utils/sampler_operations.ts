import * as _ from 'lodash';

import { BigNumber, ERC20BridgeSource, SignedOrder } from '../..';

import { BalancerPool, BalancerPoolsCache, computeBalancerBuyQuote, computeBalancerSellQuote } from './balancer_utils';
import { NULL_BYTES } from './constants';
import { getCurveInfosForPair } from './curve_utils';
import { getMultiBridgeIntermediateToken } from './multibridge_utils';
import {
    BalancerFillData,
    BatchedOperation,
    CurveFillData,
    CurveInfo,
    DexSample,
    SourceQuoteOperation,
    UniswapV2FillData,
} from './types';

/**
 * Composable operations that can be batched in a single transaction,
 * for use with `DexOrderSampler.executeAsync()`.
 */
export const samplerOperations = {
    getOrderFillableTakerAmounts(orders: SignedOrder[], exchangeAddress: string): BatchedOperation<BigNumber[]> {
        return {
            encodeCall: contract => {
                return contract
                    .getOrderFillableTakerAssetAmounts(orders, orders.map(o => o.signature), exchangeAddress)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('getOrderFillableTakerAssetAmounts', callResults);
            },
        };
    },
    getOrderFillableMakerAmounts(orders: SignedOrder[], exchangeAddress: string): BatchedOperation<BigNumber[]> {
        return {
            encodeCall: contract => {
                return contract
                    .getOrderFillableMakerAssetAmounts(orders, orders.map(o => o.signature), exchangeAddress)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('getOrderFillableMakerAssetAmounts', callResults);
            },
        };
    },
    getKyberSellQuotes(makerToken: string, takerToken: string, takerFillAmounts: BigNumber[]): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.Kyber,
            encodeCall: contract => {
                return contract
                    .sampleSellsFromKyberNetwork(takerToken, makerToken, takerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleSellsFromKyberNetwork', callResults);
            },
        };
    },
    getKyberBuyQuotes(makerToken: string, takerToken: string, makerFillAmounts: BigNumber[]): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.Kyber,
            encodeCall: contract => {
                return contract
                    .sampleBuysFromKyberNetwork(takerToken, makerToken, makerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleBuysFromKyberNetwork', callResults);
            },
        };
    },
    getUniswapSellQuotes(makerToken: string, takerToken: string, takerFillAmounts: BigNumber[]): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.Uniswap,
            encodeCall: contract => {
                return contract
                    .sampleSellsFromUniswap(takerToken, makerToken, takerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleSellsFromUniswap', callResults);
            },
        };
    },
    getUniswapBuyQuotes(makerToken: string, takerToken: string, makerFillAmounts: BigNumber[]): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.Uniswap,
            encodeCall: contract => {
                return contract
                    .sampleBuysFromUniswap(takerToken, makerToken, makerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleBuysFromUniswap', callResults);
            },
        };
    },
    getUniswapV2SellQuotes(
        tokenAddressPath: string[],
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<UniswapV2FillData> {
        return {
            source: ERC20BridgeSource.UniswapV2,
            fillData: { tokenAddressPath },
            encodeCall: contract => {
                return contract
                    .sampleSellsFromUniswapV2(tokenAddressPath, takerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleSellsFromUniswapV2', callResults);
            },
        };
    },
    getUniswapV2BuyQuotes(
        tokenAddressPath: string[],
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<UniswapV2FillData> {
        return {
            source: ERC20BridgeSource.UniswapV2,
            fillData: { tokenAddressPath },
            encodeCall: contract => {
                return contract
                    .sampleBuysFromUniswapV2(tokenAddressPath, makerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleBuysFromUniswapV2', callResults);
            },
        };
    },
    getLiquidityProviderSellQuotes(
        registryAddress: string,
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.LiquidityProvider,
            encodeCall: contract => {
                return contract
                    .sampleSellsFromLiquidityProviderRegistry(registryAddress, takerToken, makerToken, takerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>(
                    'sampleSellsFromLiquidityProviderRegistry',
                    callResults,
                );
            },
        };
    },
    getLiquidityProviderBuyQuotes(
        registryAddress: string,
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.LiquidityProvider,
            encodeCall: contract => {
                return contract
                    .sampleBuysFromLiquidityProviderRegistry(registryAddress, takerToken, makerToken, makerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>(
                    'sampleBuysFromLiquidityProviderRegistry',
                    callResults,
                );
            },
        };
    },
    getMultiBridgeSellQuotes(
        multiBridgeAddress: string,
        makerToken: string,
        intermediateToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.MultiBridge,
            encodeCall: contract => {
                return contract
                    .sampleSellsFromMultiBridge(
                        multiBridgeAddress,
                        takerToken,
                        intermediateToken,
                        makerToken,
                        takerFillAmounts,
                    )
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleSellsFromMultiBridge', callResults);
            },
        };
    },
    getEth2DaiSellQuotes(makerToken: string, takerToken: string, takerFillAmounts: BigNumber[]): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.Eth2Dai,
            encodeCall: contract => {
                return contract
                    .sampleSellsFromEth2Dai(takerToken, makerToken, takerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleSellsFromEth2Dai', callResults);
            },
        };
    },
    getEth2DaiBuyQuotes(makerToken: string, takerToken: string, makerFillAmounts: BigNumber[]): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.Eth2Dai,
            encodeCall: contract => {
                return contract
                    .sampleBuysFromEth2Dai(takerToken, makerToken, makerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleBuysFromEth2Dai', callResults);
            },
        };
    },
    getCurveSellQuotes(
        curve: CurveInfo,
        fromTokenIdx: number,
        toTokenIdx: number,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<CurveFillData> {
        return {
            source: ERC20BridgeSource.Curve,
            fillData: {
                curve,
                fromTokenIdx,
                toTokenIdx,
            },
            encodeCall: contract => {
                return contract
                    .sampleSellsFromCurve(
                        {
                            poolAddress: curve.poolAddress,
                            sellQuoteFunctionSelector: curve.sellQuoteFunctionSelector,
                            buyQuoteFunctionSelector: curve.buyQuoteFunctionSelector,
                        },
                        new BigNumber(fromTokenIdx),
                        new BigNumber(toTokenIdx),
                        takerFillAmounts,
                    )
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleSellsFromCurve', callResults);
            },
        };
    },
    getCurveBuyQuotes(
        curve: CurveInfo,
        fromTokenIdx: number,
        toTokenIdx: number,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<CurveFillData> {
        return {
            source: ERC20BridgeSource.Curve,
            fillData: {
                curve,
                fromTokenIdx,
                toTokenIdx,
            },
            encodeCall: contract => {
                return contract
                    .sampleBuysFromCurve(
                        {
                            poolAddress: curve.poolAddress,
                            sellQuoteFunctionSelector: curve.sellQuoteFunctionSelector,
                            buyQuoteFunctionSelector: curve.buyQuoteFunctionSelector,
                        },
                        new BigNumber(fromTokenIdx),
                        new BigNumber(toTokenIdx),
                        makerFillAmounts,
                    )
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleBuysFromCurve', callResults);
            },
        };
    },
    getBalancerSellQuotes(pool: BalancerPool, takerFillAmounts: BigNumber[]): SourceQuoteOperation<BalancerFillData> {
        return {
            source: ERC20BridgeSource.Balancer,
            fillData: { poolAddress: pool.id },
            ...samplerOperations.constant(takerFillAmounts.map(amount => computeBalancerSellQuote(pool, amount))),
        };
    },
    getBalancerBuyQuotes(pool: BalancerPool, makerFillAmounts: BigNumber[]): SourceQuoteOperation<BalancerFillData> {
        return {
            source: ERC20BridgeSource.Balancer,
            fillData: { poolAddress: pool.id },
            ...samplerOperations.constant(makerFillAmounts.map(amount => computeBalancerBuyQuote(pool, amount))),
        };
    },
    getMStableSellQuotes(makerToken: string, takerToken: string, takerFillAmounts: BigNumber[]): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.MStable,
            encodeCall: contract => {
                return contract
                    .sampleSellsFromMStable(makerToken, takerToken, takerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleSellsFromMStable', callResults);
            },
        };
    },
    getMStableBuyQuotes(makerToken: string, takerToken: string, makerFillAmounts: BigNumber[]): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.MStable,
            encodeCall: contract => {
                return contract
                    .sampleBuysFromMStable(makerToken, takerToken, makerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleBuysFromMStable', callResults);
            },
        };
    },
    getMedianSellRateAsync: async (
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        takerFillAmount: BigNumber,
        wethAddress: string,
        balancerPoolsCache?: BalancerPoolsCache,
        liquidityProviderRegistryAddress?: string,
        multiBridgeAddress?: string,
    ): Promise<BatchedOperation<BigNumber>> => {
        if (makerToken.toLowerCase() === takerToken.toLowerCase()) {
            return samplerOperations.constant(new BigNumber(1));
        }
        const getSellQuotes = await samplerOperations.getSellQuotesAsync(
            sources,
            makerToken,
            takerToken,
            [takerFillAmount],
            wethAddress,
            balancerPoolsCache,
            liquidityProviderRegistryAddress,
            multiBridgeAddress,
        );
        return {
            encodeCall: contract => {
                const subCalls = [getSellQuotes.encodeCall(contract)];
                return contract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                const rawSubCallResults = contract.getABIDecodedReturnData<string[]>('batchCall', callResults);
                const samples = await getSellQuotes.handleCallResultsAsync(contract, rawSubCallResults[0]);
                if (samples.length === 0) {
                    return new BigNumber(0);
                }
                const flatSortedSamples = samples
                    .reduce((acc, v) => acc.concat(...v))
                    .filter(v => !v.output.isZero())
                    .sort((a, b) => a.output.comparedTo(b.output));
                if (flatSortedSamples.length === 0) {
                    return new BigNumber(0);
                }
                const medianSample = flatSortedSamples[Math.floor(flatSortedSamples.length / 2)];
                return medianSample.output.div(medianSample.input);
            },
        };
    },
    constant<T>(result: T): BatchedOperation<T> {
        return {
            encodeCall: _contract => {
                return NULL_BYTES;
            },
            handleCallResultsAsync: async (_contract, _callResults) => {
                return result;
            },
        };
    },
    getLiquidityProviderFromRegistry(
        registryAddress: string,
        makerToken: string,
        takerToken: string,
    ): BatchedOperation<string> {
        return {
            encodeCall: contract => {
                return contract
                    .getLiquidityProviderFromRegistry(registryAddress, takerToken, makerToken)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<string>('getLiquidityProviderFromRegistry', callResults);
            },
        };
    },
    getSellQuotesAsync: async (
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
        wethAddress: string,
        balancerPoolsCache?: BalancerPoolsCache,
        liquidityProviderRegistryAddress?: string,
        multiBridgeAddress?: string,
    ): Promise<BatchedOperation<DexSample[][]>> => {
        const subOps = _.flatten(
            await Promise.all(
                sources.map(
                    async (source): Promise<SourceQuoteOperation | SourceQuoteOperation[]> => {
                        switch (source) {
                            case ERC20BridgeSource.Eth2Dai:
                                return samplerOperations.getEth2DaiSellQuotes(makerToken, takerToken, takerFillAmounts);
                            case ERC20BridgeSource.Uniswap:
                                return samplerOperations.getUniswapSellQuotes(makerToken, takerToken, takerFillAmounts);
                            case ERC20BridgeSource.UniswapV2:
                                const ops = [
                                    samplerOperations.getUniswapV2SellQuotes(
                                        [takerToken, makerToken],
                                        takerFillAmounts,
                                    ),
                                ];
                                if (takerToken !== wethAddress && makerToken !== wethAddress) {
                                    ops.push(
                                        samplerOperations.getUniswapV2SellQuotes(
                                            [takerToken, wethAddress, makerToken],
                                            takerFillAmounts,
                                        ),
                                    );
                                }
                                return ops;
                            case ERC20BridgeSource.Kyber:
                                return samplerOperations.getKyberSellQuotes(makerToken, takerToken, takerFillAmounts);
                            case ERC20BridgeSource.Curve:
                                return getCurveInfosForPair(takerToken, makerToken).map(curve =>
                                    samplerOperations.getCurveSellQuotes(
                                        curve,
                                        curve.tokens.indexOf(takerToken),
                                        curve.tokens.indexOf(makerToken),
                                        takerFillAmounts,
                                    ),
                                );
                            case ERC20BridgeSource.LiquidityProvider:
                                if (liquidityProviderRegistryAddress === undefined) {
                                    throw new Error(
                                        'Cannot sample liquidity from a LiquidityProvider liquidity pool, if a registry is not provided.',
                                    );
                                }
                                return samplerOperations.getLiquidityProviderSellQuotes(
                                    liquidityProviderRegistryAddress,
                                    makerToken,
                                    takerToken,
                                    takerFillAmounts,
                                );
                            case ERC20BridgeSource.MultiBridge:
                                if (multiBridgeAddress === undefined) {
                                    throw new Error(
                                        'Cannot sample liquidity from MultiBridge if an address is not provided.',
                                    );
                                }
                                const intermediateToken = getMultiBridgeIntermediateToken(takerToken, makerToken);
                                return samplerOperations.getMultiBridgeSellQuotes(
                                    multiBridgeAddress,
                                    makerToken,
                                    intermediateToken,
                                    takerToken,
                                    takerFillAmounts,
                                );
                            // todo: refactor sampler ops to share state with DexOrderSampler so cache doesn't have to be passed as a param
                            case ERC20BridgeSource.Balancer:
                                if (balancerPoolsCache === undefined) {
                                    throw new Error(
                                        'Cannot sample liquidity from Balancer if a cache is not provided.',
                                    );
                                }
                                const pools = await balancerPoolsCache.getPoolsForPairAsync(takerToken, makerToken);
                                return pools.map(pool =>
                                    samplerOperations.getBalancerSellQuotes(pool, takerFillAmounts),
                                );
                            case ERC20BridgeSource.MStable:
                                return samplerOperations.getMStableSellQuotes(makerToken, takerToken, takerFillAmounts);
                            default:
                                throw new Error(`Unsupported sell sample source: ${source}`);
                        }
                    },
                ),
            ),
        );
        const samplerOps = subOps.filter(op => op.source !== ERC20BridgeSource.Balancer);
        const nonSamplerOps = subOps.filter(op => op.source === ERC20BridgeSource.Balancer);
        return {
            encodeCall: contract => {
                // All operations are NOOPs
                if (samplerOps.length === 0) {
                    return NULL_BYTES;
                }
                const subCalls = samplerOps.map(op => op.encodeCall(contract));
                return contract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                let samples: BigNumber[][];
                // If all operations were NOOPs then just call the handle result callback
                if (callResults === NULL_BYTES && samplerOps.length === 0) {
                    samples = await Promise.all(nonSamplerOps.map(async op => op.handleCallResultsAsync(contract, '')));
                } else {
                    const rawSubCallResults = contract.getABIDecodedReturnData<string[]>('batchCall', callResults);
                    samples = await Promise.all(
                        samplerOps.map(async (op, i) => op.handleCallResultsAsync(contract, rawSubCallResults[i])),
                    );
                    samples = samples.concat(
                        await Promise.all(nonSamplerOps.map(async op => op.handleCallResultsAsync(contract, ''))),
                    );
                }
                return [...samplerOps, ...nonSamplerOps].map((op, i) => {
                    return samples[i].map((output, j) => ({
                        source: op.source,
                        output,
                        input: takerFillAmounts[j],
                        fillData: op.fillData,
                    }));
                });
            },
        };
    },
    getBuyQuotesAsync: async (
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
        wethAddress: string,
        balancerPoolsCache?: BalancerPoolsCache,
        liquidityProviderRegistryAddress?: string,
    ): Promise<BatchedOperation<DexSample[][]>> => {
        const subOps = _.flatten(
            await Promise.all(
                sources.map(
                    async (source): Promise<SourceQuoteOperation | SourceQuoteOperation[]> => {
                        switch (source) {
                            case ERC20BridgeSource.Eth2Dai:
                                return samplerOperations.getEth2DaiBuyQuotes(makerToken, takerToken, makerFillAmounts);
                            case ERC20BridgeSource.Uniswap:
                                return samplerOperations.getUniswapBuyQuotes(makerToken, takerToken, makerFillAmounts);
                            case ERC20BridgeSource.UniswapV2:
                                const ops = [
                                    samplerOperations.getUniswapV2BuyQuotes([takerToken, makerToken], makerFillAmounts),
                                ];
                                if (takerToken !== wethAddress && makerToken !== wethAddress) {
                                    ops.push(
                                        samplerOperations.getUniswapV2BuyQuotes(
                                            [takerToken, wethAddress, makerToken],
                                            makerFillAmounts,
                                        ),
                                    );
                                }
                                return ops;
                            case ERC20BridgeSource.Kyber:
                                return samplerOperations.getKyberBuyQuotes(makerToken, takerToken, makerFillAmounts);
                            case ERC20BridgeSource.Curve:
                                return getCurveInfosForPair(takerToken, makerToken).map(curve =>
                                    samplerOperations.getCurveBuyQuotes(
                                        curve,
                                        curve.tokens.indexOf(takerToken),
                                        curve.tokens.indexOf(makerToken),
                                        makerFillAmounts,
                                    ),
                                );
                            case ERC20BridgeSource.LiquidityProvider:
                                if (liquidityProviderRegistryAddress === undefined) {
                                    throw new Error(
                                        'Cannot sample liquidity from a LiquidityProvider liquidity pool, if a registry is not provided.',
                                    );
                                }
                                return samplerOperations.getLiquidityProviderBuyQuotes(
                                    liquidityProviderRegistryAddress,
                                    makerToken,
                                    takerToken,
                                    makerFillAmounts,
                                );
                            case ERC20BridgeSource.Balancer:
                                if (balancerPoolsCache === undefined) {
                                    throw new Error(
                                        'Cannot sample liquidity from Balancer if a cache is not provided.',
                                    );
                                }
                                const pools = await balancerPoolsCache.getPoolsForPairAsync(takerToken, makerToken);
                                return pools.map(pool =>
                                    samplerOperations.getBalancerBuyQuotes(pool, makerFillAmounts),
                                );
                            case ERC20BridgeSource.MStable:
                                return samplerOperations.getMStableBuyQuotes(makerToken, takerToken, makerFillAmounts);
                            default:
                                throw new Error(`Unsupported buy sample source: ${source}`);
                        }
                    },
                ),
            ),
        );
        const samplerOps = subOps.filter(op => op.source !== ERC20BridgeSource.Balancer);
        const nonSamplerOps = subOps.filter(op => op.source === ERC20BridgeSource.Balancer);
        return {
            encodeCall: contract => {
                // All operations are NOOPs
                if (samplerOps.length === 0) {
                    return NULL_BYTES;
                }
                const subCalls = samplerOps.map(op => op.encodeCall(contract));
                return contract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                let samples: BigNumber[][];
                if (callResults === NULL_BYTES && samplerOps.length === 0) {
                    samples = await Promise.all(nonSamplerOps.map(async op => op.handleCallResultsAsync(contract, '')));
                } else {
                    const rawSubCallResults = contract.getABIDecodedReturnData<string[]>('batchCall', callResults);
                    samples = await Promise.all(
                        samplerOps.map(async (op, i) => op.handleCallResultsAsync(contract, rawSubCallResults[i])),
                    );
                    samples = samples.concat(
                        await Promise.all(nonSamplerOps.map(async op => op.handleCallResultsAsync(contract, ''))),
                    );
                }
                return [...samplerOps, ...nonSamplerOps].map((op, i) => {
                    return samples[i].map((output, j) => ({
                        source: op.source,
                        output,
                        input: makerFillAmounts[j],
                        fillData: op.fillData,
                    }));
                });
            },
        };
    },
};
// tslint:disable max-file-line-count
