import { BigNumber, ERC20BridgeSource, SignedOrder } from '../..';

import { DEFAULT_CURVE_OPTS } from './constants';
import { BatchedOperation, DexSample } from './types';

/**
 * Composable operations that can be batched in a single transaction,
 * for use with `DexOrderSampler.executeAsync()`.
 */
export const samplerOperations = {
    getOrderFillableTakerAmounts(orders: SignedOrder[]): BatchedOperation<BigNumber[]> {
        return {
            encodeCall: contract => {
                return contract
                    .getOrderFillableTakerAssetAmounts(orders, orders.map(o => o.signature))
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('getOrderFillableTakerAssetAmounts', callResults);
            },
        };
    },
    getOrderFillableMakerAmounts(orders: SignedOrder[]): BatchedOperation<BigNumber[]> {
        return {
            encodeCall: contract => {
                return contract
                    .getOrderFillableMakerAssetAmounts(orders, orders.map(o => o.signature))
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('getOrderFillableMakerAssetAmounts', callResults);
            },
        };
    },
    getKyberSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): BatchedOperation<BigNumber[]> {
        return {
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
    getUniswapSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): BatchedOperation<BigNumber[]> {
        return {
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
    getLiquidityProviderSellQuotes(
        liquidityProviderRegistryAddress: string,
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): BatchedOperation<BigNumber[]> {
        return {
            encodeCall: contract => {
                return contract
                    .sampleSellsFromLiquidityProviderRegistry(
                        liquidityProviderRegistryAddress,
                        takerToken,
                        makerToken,
                        takerFillAmounts,
                    )
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
        liquidityProviderRegistryAddress: string,
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): BatchedOperation<BigNumber[]> {
        return {
            encodeCall: contract => {
                return contract
                    .sampleBuysFromLiquidityProviderRegistry(
                        liquidityProviderRegistryAddress,
                        takerToken,
                        makerToken,
                        makerFillAmounts,
                    )
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
    getEth2DaiSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): BatchedOperation<BigNumber[]> {
        return {
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
    getCurveSellQuotes(
        curveAddress: string,
        fromTokenIdx: number,
        toTokenIdx: number,
        takerFillAmounts: BigNumber[],
    ): BatchedOperation<BigNumber[]> {
        return {
            encodeCall: contract => {
                return contract
                    .sampleSellsFromCurve(
                        curveAddress,
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
        curveAddress: string,
        fromTokenIdx: number,
        toTokenIdx: number,
        makerFillAmounts: BigNumber[],
    ): BatchedOperation<BigNumber[]> {
        return {
            encodeCall: contract => {
                return contract
                    .sampleBuysFromCurve(
                        curveAddress,
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
    getUniswapBuyQuotes(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): BatchedOperation<BigNumber[]> {
        return {
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
    getEth2DaiBuyQuotes(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): BatchedOperation<BigNumber[]> {
        return {
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
    getMedianSellRate(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        takerFillAmount: BigNumber,
        liquidityProviderRegistryAddress?: string | undefined,
    ): BatchedOperation<BigNumber> {
        if (makerToken.toLowerCase() === takerToken.toLowerCase()) {
            return samplerOperations.constant(new BigNumber(1));
        }
        const getSellQuotes = samplerOperations.getSellQuotes(
            sources,
            makerToken,
            takerToken,
            [takerFillAmount],
            liquidityProviderRegistryAddress,
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
            encodeCall: contract => {
                return '0x';
            },
            handleCallResultsAsync: async (contract, callResults) => {
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
    getSellQuotes(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
        liquidityProviderRegistryAddress?: string | undefined,
    ): BatchedOperation<DexSample[][]> {
        const subOps = sources
            .map(source => {
                let batchedOperation;
                if (source === ERC20BridgeSource.Eth2Dai) {
                    batchedOperation = samplerOperations.getEth2DaiSellQuotes(makerToken, takerToken, takerFillAmounts);
                } else if (source === ERC20BridgeSource.Uniswap) {
                    batchedOperation = samplerOperations.getUniswapSellQuotes(makerToken, takerToken, takerFillAmounts);
                } else if (source === ERC20BridgeSource.Kyber) {
                    batchedOperation = samplerOperations.getKyberSellQuotes(makerToken, takerToken, takerFillAmounts);
                } else if (Object.keys(DEFAULT_CURVE_OPTS).includes(source)) {
                    const { curveAddress, tokens } = DEFAULT_CURVE_OPTS[source];
                    const fromTokenIdx = tokens.indexOf(takerToken);
                    const toTokenIdx = tokens.indexOf(makerToken);
                    if (fromTokenIdx !== -1 && toTokenIdx !== -1) {
                        batchedOperation = samplerOperations.getCurveSellQuotes(
                            curveAddress,
                            fromTokenIdx,
                            toTokenIdx,
                            takerFillAmounts,
                        );
                    }
                } else if (source === ERC20BridgeSource.LiquidityProvider) {
                    if (liquidityProviderRegistryAddress === undefined) {
                        throw new Error(
                            'Cannot sample liquidity from a LiquidityProvider liquidity pool, if a registry is not provided.',
                        );
                    }
                    batchedOperation = samplerOperations.getLiquidityProviderSellQuotes(
                        liquidityProviderRegistryAddress,
                        makerToken,
                        takerToken,
                        takerFillAmounts,
                    );
                } else {
                    throw new Error(`Unsupported sell sample source: ${source}`);
                }
                return { batchedOperation, source };
            })
            .filter(op => op.batchedOperation) as Array<{
            batchedOperation: BatchedOperation<BigNumber[]>;
            source: ERC20BridgeSource;
        }>;
        return {
            encodeCall: contract => {
                const subCalls = subOps.map(op => op.batchedOperation.encodeCall(contract));
                return contract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                const rawSubCallResults = contract.getABIDecodedReturnData<string[]>('batchCall', callResults);
                const samples = await Promise.all(
                    subOps.map(async (op, i) =>
                        op.batchedOperation.handleCallResultsAsync(contract, rawSubCallResults[i]),
                    ),
                );
                return subOps.map((op, i) => {
                    return samples[i].map((output, j) => ({
                        source: op.source,
                        output,
                        input: takerFillAmounts[j],
                    }));
                });
            },
        };
    },
    getBuyQuotes(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
        liquidityProviderRegistryAddress?: string | undefined,
    ): BatchedOperation<DexSample[][]> {
        const subOps = sources
            .map(source => {
                let batchedOperation;
                if (source === ERC20BridgeSource.Eth2Dai) {
                    batchedOperation = samplerOperations.getEth2DaiBuyQuotes(makerToken, takerToken, makerFillAmounts);
                } else if (source === ERC20BridgeSource.Uniswap) {
                    batchedOperation = samplerOperations.getUniswapBuyQuotes(makerToken, takerToken, makerFillAmounts);
                } else if (Object.keys(DEFAULT_CURVE_OPTS).includes(source)) {
                    const { curveAddress, tokens } = DEFAULT_CURVE_OPTS[source];
                    const fromTokenIdx = tokens.indexOf(takerToken);
                    const toTokenIdx = tokens.indexOf(makerToken);
                    if (fromTokenIdx !== -1 && toTokenIdx !== -1) {
                        batchedOperation = samplerOperations.getCurveSellQuotes(
                            curveAddress,
                            fromTokenIdx,
                            toTokenIdx,
                            makerFillAmounts,
                        );
                    }
                } else if (source === ERC20BridgeSource.LiquidityProvider) {
                    if (liquidityProviderRegistryAddress === undefined) {
                        throw new Error(
                            'Cannot sample liquidity from a LiquidityProvider liquidity pool, if a registry is not provided.',
                        );
                    }
                    batchedOperation = samplerOperations.getLiquidityProviderBuyQuotes(
                        liquidityProviderRegistryAddress,
                        makerToken,
                        takerToken,
                        makerFillAmounts,
                    );
                } else {
                    throw new Error(`Unsupported buy sample source: ${source}`);
                }
                return { source, batchedOperation };
            })
            .filter(op => op.batchedOperation) as Array<{
            batchedOperation: BatchedOperation<BigNumber[]>;
            source: ERC20BridgeSource;
        }>;
        return {
            encodeCall: contract => {
                const subCalls = subOps.map(op => op.batchedOperation.encodeCall(contract));
                return contract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                const rawSubCallResults = contract.getABIDecodedReturnData<string[]>('batchCall', callResults);
                const samples = await Promise.all(
                    subOps.map(async (op, i) =>
                        op.batchedOperation.handleCallResultsAsync(contract, rawSubCallResults[i]),
                    ),
                );
                return subOps.map((op, i) => {
                    return samples[i].map((output, j) => ({
                        source: op.source,
                        output,
                        input: makerFillAmounts[i],
                    }));
                });
            },
        };
    },
};
