import * as _ from 'lodash';

import { BigNumber, ERC20BridgeSource, SignedOrder } from '../..';

import { BalancerPool, BalancerPoolsCache, computeBalancerBuyQuote, computeBalancerSellQuote } from './balancer_utils';
import { BancorService } from './bancor_service';
import { MAINNET_KYBER_INFOS, NULL_BYTES, ZERO_AMOUNT } from './constants';
import { getCurveInfosForPair } from './curve_utils';
import { getMultiBridgeIntermediateToken } from './multibridge_utils';
import {
    BalancerFillData,
    BancorFillData,
    BatchedOperation,
    CurveFillData,
    CurveInfo,
    DexSample,
    FillData,
    KyberFillData,
    Quote,
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
    getKyberSellQuotes(
        reserveId: string,
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<KyberFillData> {
        return {
            source: ERC20BridgeSource.Kyber,
            encodeCall: contract => {
                return contract
                    .batchCall([
                        contract
                            .sampleSellsFromKyberNetwork(reserveId, takerToken, makerToken, takerFillAmounts)
                            .getABIEncodedTransactionData(),
                        contract.encodeKyberHint(reserveId, takerToken, makerToken).getABIEncodedTransactionData(),
                    ])
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                const [samplesEncoded, hintEncoded] = contract.getABIDecodedReturnData<string[]>(
                    'batchCall',
                    callResults,
                );
                const samples = contract.getABIDecodedReturnData<BigNumber[]>(
                    'sampleSellsFromKyberNetwork',
                    samplesEncoded,
                );
                const hint = contract.getABIDecodedReturnData<string>('encodeKyberHint', hintEncoded);
                const data = samples.map(amount => ({ amount, fillData: { hint, reserveId } }));
                return data;
            },
        };
    },
    getKyberBuyQuotes(
        reserveId: string,
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<KyberFillData> {
        return {
            source: ERC20BridgeSource.Kyber,
            encodeCall: contract => {
                return contract
                    .sampleBuysFromKyberNetwork(reserveId, takerToken, makerToken, makerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleBuysFromKyberNetwork', callResults)
                    .map(amount => ({ amount, fillData: { hint: reserveId, reserveId } }));
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
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleSellsFromUniswap', callResults)
                    .map(amount => ({ amount }));
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
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleBuysFromUniswap', callResults)
                    .map(amount => ({ amount }));
            },
        };
    },
    getUniswapV2SellQuotes(
        tokenAddressPath: string[],
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<UniswapV2FillData> {
        return {
            source: ERC20BridgeSource.UniswapV2,
            encodeCall: contract => {
                return contract
                    .sampleSellsFromUniswapV2(tokenAddressPath, takerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleSellsFromUniswapV2', callResults)
                    .map(amount => ({
                        amount,
                        fillData: { tokenAddressPath },
                    }));
            },
        };
    },
    getUniswapV2BuyQuotes(
        tokenAddressPath: string[],
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<UniswapV2FillData> {
        return {
            source: ERC20BridgeSource.UniswapV2,
            encodeCall: contract => {
                return contract
                    .sampleBuysFromUniswapV2(tokenAddressPath, makerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleBuysFromUniswapV2', callResults)
                    .map(amount => ({
                        amount,
                        fillData: { tokenAddressPath },
                    }));
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
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleSellsFromLiquidityProviderRegistry', callResults)
                    .map(amount => ({ amount }));
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
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleBuysFromLiquidityProviderRegistry', callResults)
                    .map(amount => ({ amount }));
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
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleSellsFromMultiBridge', callResults)
                    .map(amount => ({ amount }));
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
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleSellsFromEth2Dai', callResults)
                    .map(amount => ({ amount }));
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
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleBuysFromEth2Dai', callResults)
                    .map(amount => ({ amount }));
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
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleSellsFromCurve', callResults)
                    .map(amount => ({
                        amount,
                        fillData: {
                            curve,
                            fromTokenIdx,
                            toTokenIdx,
                        },
                    }));
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
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleBuysFromCurve', callResults)
                    .map(amount => ({
                        amount,
                        fillData: {
                            curve,
                            fromTokenIdx,
                            toTokenIdx,
                        },
                    }));
            },
        };
    },
    getBancorSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
        bancorService: BancorService,
    ): SourceQuoteOperation<BancorFillData> {
        return {
            source: ERC20BridgeSource.Bancor,
            encodeCall: _contract => {
                return '0x';
            },
            handleCallResultsAsync: async (_contract, _callResults) => {
                return Promise.all(
                    takerFillAmounts.map(async amt => bancorService.getQuoteAsync(takerToken, makerToken, amt)),
                );
            },
        };
    },
    getBalancerSellQuotes(pool: BalancerPool, takerFillAmounts: BigNumber[]): SourceQuoteOperation<BalancerFillData> {
        return {
            source: ERC20BridgeSource.Balancer,
            ...samplerOperations.constant(
                takerFillAmounts.map(amount => ({
                    amount: computeBalancerSellQuote(pool, amount),
                    fillData: { poolAddress: pool.id },
                })),
            ),
        };
    },
    getBalancerBuyQuotes(pool: BalancerPool, makerFillAmounts: BigNumber[]): SourceQuoteOperation<BalancerFillData> {
        return {
            source: ERC20BridgeSource.Balancer,
            ...samplerOperations.constant(
                makerFillAmounts.map(amount => ({
                    amount: computeBalancerBuyQuote(pool, amount),
                    fillData: { poolAddress: pool.id },
                })),
            ),
        };
    },
    getMStableSellQuotes(makerToken: string, takerToken: string, takerFillAmounts: BigNumber[]): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.MStable,
            encodeCall: contract => {
                return contract
                    .sampleSellsFromMStable(takerToken, makerToken, takerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleSellsFromMStable', callResults)
                    .map(amount => ({ amount }));
            },
        };
    },
    getMStableBuyQuotes(makerToken: string, takerToken: string, makerFillAmounts: BigNumber[]): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.MStable,
            encodeCall: contract => {
                return contract
                    .sampleBuysFromMStable(takerToken, makerToken, makerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleBuysFromMStable', callResults)
                    .map(amount => ({ amount }));
            },
        };
    },
    getMooniswapSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.Mooniswap,
            encodeCall: contract => {
                return contract
                    .sampleSellsFromMooniswap(takerToken, makerToken, takerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleSellsFromMooniswap', callResults)
                    .map(amount => ({ amount }));
            },
        };
    },
    getMooniswapBuyQuotes(makerToken: string, takerToken: string, makerFillAmounts: BigNumber[]): SourceQuoteOperation {
        return {
            source: ERC20BridgeSource.Mooniswap,
            encodeCall: contract => {
                return contract
                    .sampleBuysFromMooniswap(takerToken, makerToken, makerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract
                    .getABIDecodedReturnData<BigNumber[]>('sampleBuysFromMooniswap', callResults)
                    .map(amount => ({ amount }));
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
        bancorService?: BancorService,
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
            bancorService,
        );
        return {
            encodeCall: contract => {
                const encodedCall = getSellQuotes.encodeCall(contract);
                // All soures were excluded
                if (encodedCall === NULL_BYTES) {
                    return NULL_BYTES;
                }
                const subCalls = [getSellQuotes.encodeCall(contract)];
                return contract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                if (callResults === NULL_BYTES) {
                    return ZERO_AMOUNT;
                }
                const rawSubCallResults = contract.getABIDecodedReturnData<string[]>('batchCall', callResults);
                const samples = await getSellQuotes.handleCallResultsAsync(contract, rawSubCallResults[0]);
                if (samples.length === 0) {
                    return ZERO_AMOUNT;
                }
                const flatSortedSamples = samples
                    .reduce((acc, v) => acc.concat(...v))
                    .filter(v => !v.output.isZero())
                    .sort((a, b) => a.output.comparedTo(b.output));
                if (flatSortedSamples.length === 0) {
                    return ZERO_AMOUNT;
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
        bancorService?: BancorService,
    ): Promise<BatchedOperation<DexSample[][]>> => {
        const subOps = _.flatten(
            await Promise.all(
                sources.map(
                    async (source): Promise<SourceQuoteOperation<FillData> | Array<SourceQuoteOperation<FillData>>> => {
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
                                return Object.values(MAINNET_KYBER_INFOS).map(reserveId =>
                                    samplerOperations.getKyberSellQuotes(
                                        reserveId,
                                        makerToken,
                                        takerToken,
                                        takerFillAmounts,
                                    ),
                                );
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
                            case ERC20BridgeSource.Bancor:
                                if (bancorService === undefined) {
                                    throw new Error(
                                        'Cannot sample liquidity from Bancor; no Bancor service instantiated.',
                                    );
                                }
                                return samplerOperations.getBancorSellQuotes(
                                    makerToken,
                                    takerToken,
                                    takerFillAmounts,
                                    bancorService,
                                );
                            case ERC20BridgeSource.MStable:
                                return samplerOperations.getMStableSellQuotes(makerToken, takerToken, takerFillAmounts);
                            case ERC20BridgeSource.Mooniswap:
                                return samplerOperations.getMooniswapSellQuotes(
                                    makerToken,
                                    takerToken,
                                    takerFillAmounts,
                                );
                            default:
                                throw new Error(`Unsupported sell sample source: ${source}`);
                        }
                    },
                ),
            ),
        );
        const nonSamplerSources = [ERC20BridgeSource.Balancer, ERC20BridgeSource.Bancor];
        const samplerOps: Array<SourceQuoteOperation<FillData>> = [];
        const nonSamplerOps: Array<SourceQuoteOperation<FillData>> = [];
        subOps.forEach(op => {
            if (nonSamplerSources.includes(op.source)) {
                nonSamplerOps.push(op);
            } else {
                samplerOps.push(op);
            }
        });
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
                let samples: Array<Array<Quote<FillData>>>;
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
                        output: output.amount,
                        input: takerFillAmounts[j],
                        fillData: output.fillData,
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
        bancorService?: BancorService,
    ): Promise<BatchedOperation<DexSample[][]>> => {
        const subOps = _.flatten(
            await Promise.all(
                sources.map(
                    async (source): Promise<SourceQuoteOperation<FillData> | Array<SourceQuoteOperation<FillData>>> => {
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
                                return Object.values(MAINNET_KYBER_INFOS).map(reserveId =>
                                    samplerOperations.getKyberBuyQuotes(
                                        reserveId,
                                        makerToken,
                                        takerToken,
                                        makerFillAmounts,
                                    ),
                                );
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
                            case ERC20BridgeSource.Bancor:
                                return []; //  FIXME: Waiting for Bancor SDK to support buy quotes, but don't throw an error here
                            case ERC20BridgeSource.MStable:
                                return samplerOperations.getMStableBuyQuotes(makerToken, takerToken, makerFillAmounts);
                            case ERC20BridgeSource.Mooniswap:
                                return samplerOperations.getMooniswapBuyQuotes(
                                    makerToken,
                                    takerToken,
                                    makerFillAmounts,
                                );
                            default:
                                throw new Error(`Unsupported buy sample source: ${source}`);
                        }
                    },
                ),
            ),
        );
        const nonSamplerSources = [ERC20BridgeSource.Balancer, ERC20BridgeSource.Bancor];
        const samplerOps: Array<SourceQuoteOperation<FillData>> = [];
        const nonSamplerOps: Array<SourceQuoteOperation<FillData>> = [];
        subOps.forEach(op => {
            if (nonSamplerSources.find(s => s === op.source) !== undefined) {
                nonSamplerOps.push(op);
            } else {
                samplerOps.push(op);
            }
        });
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
                let samples: Array<Array<Quote<FillData>>>;
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
                        output: output.amount,
                        input: makerFillAmounts[j],
                        fillData: output.fillData,
                    }));
                });
            },
        };
    },
};
// tslint:disable max-file-line-count
