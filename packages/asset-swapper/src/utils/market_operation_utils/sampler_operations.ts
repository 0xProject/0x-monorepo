import { BigNumber, ERC20BridgeSource, SignedOrder } from '../..';
import { getCurveInfo, isCurveSource } from '../source_utils';

import { DEFAULT_FAKE_BUY_OPTS } from './constants';
import { getMultiBridgeIntermediateToken } from './multibridge_utils';
import { BatchedOperation, DexSample, FakeBuyOpts } from './types';

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
    getKyberBuyQuotes(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
        fakeBuyOpts: FakeBuyOpts = DEFAULT_FAKE_BUY_OPTS,
    ): BatchedOperation<BigNumber[]> {
        return {
            encodeCall: contract => {
                return contract
                    .sampleBuysFromKyberNetwork(takerToken, makerToken, makerFillAmounts, fakeBuyOpts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleBuysFromKyberNetwork', callResults);
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
    getUniswapV2SellQuotes(tokenAddressPath: string[], takerFillAmounts: BigNumber[]): BatchedOperation<BigNumber[]> {
        return {
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
    getUniswapV2BuyQuotes(tokenAddressPath: string[], makerFillAmounts: BigNumber[]): BatchedOperation<BigNumber[]> {
        return {
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
    ): BatchedOperation<BigNumber[]> {
        return {
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
    getMultiBridgeSellQuotes(
        multiBridgeAddress: string,
        makerToken: string,
        intermediateToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): BatchedOperation<BigNumber[]> {
        return {
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
        fakeBuyOpts: FakeBuyOpts = DEFAULT_FAKE_BUY_OPTS,
    ): BatchedOperation<BigNumber[]> {
        return {
            encodeCall: contract => {
                return contract
                    .sampleBuysFromLiquidityProviderRegistry(
                        registryAddress,
                        takerToken,
                        makerToken,
                        makerFillAmounts,
                        fakeBuyOpts,
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
    getMedianSellRate(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        takerFillAmount: BigNumber,
        wethAddress: string,
        liquidityProviderRegistryAddress?: string,
        multiBridgeAddress?: string,
    ): BatchedOperation<BigNumber> {
        if (makerToken.toLowerCase() === takerToken.toLowerCase()) {
            return samplerOperations.constant(new BigNumber(1));
        }
        const getSellQuotes = samplerOperations.getSellQuotes(
            sources,
            makerToken,
            takerToken,
            [takerFillAmount],
            wethAddress,
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
                return '0x';
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
    getSellQuotes(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
        wethAddress: string,
        liquidityProviderRegistryAddress?: string,
        multiBridgeAddress?: string,
    ): BatchedOperation<DexSample[][]> {
        const subOps = sources
            .map(source => {
                let batchedOperation;
                if (source === ERC20BridgeSource.Eth2Dai) {
                    batchedOperation = samplerOperations.getEth2DaiSellQuotes(makerToken, takerToken, takerFillAmounts);
                } else if (source === ERC20BridgeSource.Uniswap) {
                    batchedOperation = samplerOperations.getUniswapSellQuotes(makerToken, takerToken, takerFillAmounts);
                } else if (source === ERC20BridgeSource.UniswapV2) {
                    batchedOperation = samplerOperations.getUniswapV2SellQuotes(
                        [takerToken, makerToken],
                        takerFillAmounts,
                    );
                } else if (source === ERC20BridgeSource.UniswapV2Eth) {
                    batchedOperation = samplerOperations.getUniswapV2SellQuotes(
                        [takerToken, wethAddress, makerToken],
                        takerFillAmounts,
                    );
                } else if (source === ERC20BridgeSource.Kyber) {
                    batchedOperation = samplerOperations.getKyberSellQuotes(makerToken, takerToken, takerFillAmounts);
                } else if (isCurveSource(source)) {
                    const { curveAddress, fromTokenIdx, toTokenIdx } = getCurveInfo(source, takerToken, makerToken);
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
                } else if (source === ERC20BridgeSource.MultiBridge) {
                    if (multiBridgeAddress === undefined) {
                        throw new Error('Cannot sample liquidity from MultiBridge if an address is not provided.');
                    }
                    const intermediateToken = getMultiBridgeIntermediateToken(takerToken, makerToken);
                    batchedOperation = samplerOperations.getMultiBridgeSellQuotes(
                        multiBridgeAddress,
                        makerToken,
                        intermediateToken,
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
        wethAddress: string,
        liquidityProviderRegistryAddress?: string,
        fakeBuyOpts: FakeBuyOpts = DEFAULT_FAKE_BUY_OPTS,
    ): BatchedOperation<DexSample[][]> {
        const subOps = sources
            .map(source => {
                let batchedOperation;
                if (source === ERC20BridgeSource.Eth2Dai) {
                    batchedOperation = samplerOperations.getEth2DaiBuyQuotes(makerToken, takerToken, makerFillAmounts);
                } else if (source === ERC20BridgeSource.Uniswap) {
                    batchedOperation = samplerOperations.getUniswapBuyQuotes(makerToken, takerToken, makerFillAmounts);
                } else if (source === ERC20BridgeSource.UniswapV2) {
                    batchedOperation = samplerOperations.getUniswapV2BuyQuotes(
                        [takerToken, makerToken],
                        makerFillAmounts,
                    );
                } else if (source === ERC20BridgeSource.UniswapV2Eth) {
                    batchedOperation = samplerOperations.getUniswapV2BuyQuotes(
                        [takerToken, wethAddress, makerToken],
                        makerFillAmounts,
                    );
                } else if (source === ERC20BridgeSource.Kyber) {
                    batchedOperation = samplerOperations.getKyberBuyQuotes(
                        makerToken,
                        takerToken,
                        makerFillAmounts,
                        fakeBuyOpts,
                    );
                } else if (isCurveSource(source)) {
                    const { curveAddress, fromTokenIdx, toTokenIdx } = getCurveInfo(source, takerToken, makerToken);
                    if (fromTokenIdx !== -1 && toTokenIdx !== -1) {
                        batchedOperation = samplerOperations.getCurveBuyQuotes(
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
                        fakeBuyOpts,
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
                        input: makerFillAmounts[j],
                    }));
                });
            },
        };
    },
};
// tslint:disable max-file-line-count
