import { IERC20BridgeSamplerContract } from '@0x/contract-wrappers';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { constants } from '../../constants';

import { DexSample, ERC20BridgeSource } from './types';

/**
 * A composable operation the be run in `DexOrderSampler.executeAsync()`.
 */
export interface BatchedOperation<TResult> {
    encodeCall(contract: IERC20BridgeSamplerContract): string;
    handleCallResultsAsync(contract: IERC20BridgeSamplerContract, callResults: string): Promise<TResult>;
}

/**
 * Composable operations that can be batched in a single transaction,
 * for use with `DexOrderSampler.executeAsync()`.
 */
const samplerOperations = {
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
    getPLPSellQuotes(
        plpRegistryAddress: string,
        takerToken: string,
        makerToken: string,
        takerFillAmounts: BigNumber[],
    ): BatchedOperation<BigNumber[]> {
        return {
            encodeCall: contract => {
                return contract
                    .sampleSellsFromLiquidityProviderRegistry(plpRegistryAddress, takerToken, makerToken, takerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleSellsFromLiquidityProviderRegistry', callResults);
            },
        };
    },
    getPLPBuyQuotes(
        plpRegistryAddress: string,
        takerToken: string,
        makerToken: string,
        makerFillAmounts: BigNumber[],
    ): BatchedOperation<BigNumber[]> {
        return {
            encodeCall: contract => {
                return contract
                    .sampleBuysFromLiquidityProviderRegistry(plpRegistryAddress, takerToken, makerToken, makerFillAmounts)
                    .getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                return contract.getABIDecodedReturnData<BigNumber[]>('sampleBuysFromLiquidityProviderRegistry', callResults);
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
        plpRegistryAddress?: string | undefined,
    ): BatchedOperation<BigNumber> {
        const getSellQuotes = samplerOperations.getSellQuotes(sources, makerToken, takerToken, [takerFillAmount], plpRegistryAddress);
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
        takerToken: string,
        makerToken: string,
    ): BatchedOperation<string> {
        return {
            encodeCall: contract => {
                return contract.getLiquidityProviderFromRegistry(registryAddress, takerToken, makerToken).getABIEncodedTransactionData();
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
        plpRegistryAddress?: string | undefined,
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
                } else if (
                    source === ERC20BridgeSource.CurveUsdcDai ||
                    source === ERC20BridgeSource.CurveUsdcDaiUsdt ||
                    source === ERC20BridgeSource.CurveUsdcDaiUsdtTusd
                ) {
                    const { curveAddress, tokens } = constants.DEFAULT_CURVE_OPTS[source];
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
                } else if (source === ERC20BridgeSource.Plp) {
                    if (plpRegistryAddress === undefined) {
                        throw new Error('Cannot sample liquidity from a PLP liquidity pool, if a registry is not provided.');
                    }
                    batchedOperation = samplerOperations.getPLPSellQuotes(
                        plpRegistryAddress, takerToken, makerToken, takerFillAmounts,
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
        plpRegistryAddress?: string | undefined,
    ): BatchedOperation<DexSample[][]> {
        const subOps = sources.map(source => {
            if (source === ERC20BridgeSource.Eth2Dai) {
                return samplerOperations.getEth2DaiBuyQuotes(makerToken, takerToken, makerFillAmounts);
            } else if (source === ERC20BridgeSource.Uniswap) {
                return samplerOperations.getUniswapBuyQuotes(makerToken, takerToken, makerFillAmounts);
            } else if (source === ERC20BridgeSource.Plp) {
                if (plpRegistryAddress === undefined) {
                    throw new Error('Cannot sample liquidity from a PLP liquidity pool, if a registry is not provided.');
                }
                return samplerOperations.getPLPBuyQuotes(
                    plpRegistryAddress, takerToken, makerToken, makerFillAmounts,
                );
            } else {
                throw new Error(`Unsupported buy sample source: ${source}`);
            }
        });
        return {
            encodeCall: contract => {
                const subCalls = subOps.map(op => op.encodeCall(contract));
                return contract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async (contract, callResults) => {
                const rawSubCallResults = contract.getABIDecodedReturnData<string[]>('batchCall', callResults);
                const samples = await Promise.all(
                    subOps.map(async (op, i) => op.handleCallResultsAsync(contract, rawSubCallResults[i])),
                );
                return sources.map((source, i) => {
                    return samples[i].map((output, j) => ({
                        source,
                        output,
                        input: makerFillAmounts[j],
                    }));
                });
            },
        };
    },
};

/**
 * Generate sample amounts up to `maxFillAmount`.
 */
export function getSampleAmounts(maxFillAmount: BigNumber, numSamples: number, expBase: number = 1): BigNumber[] {
    const distribution = [...Array<BigNumber>(numSamples)].map((v, i) => new BigNumber(expBase).pow(i));
    const stepSizes = distribution.map(d => d.div(BigNumber.sum(...distribution)));
    const amounts = stepSizes.map((s, i) => {
        return maxFillAmount
            .times(BigNumber.sum(...[0, ...stepSizes.slice(0, i + 1)]))
            .integerValue(BigNumber.ROUND_UP);
    });
    return amounts;
}

type BatchedOperationResult<T> = T extends BatchedOperation<infer TResult> ? TResult : never;

/**
 * Encapsulates interactions with the `ERC20BridgeSampler` contract.
 */
export class DexOrderSampler {
    /**
     * Composable operations that can be batched in a single transaction,
     * for use with `DexOrderSampler.executeAsync()`.
     */
    public static ops = samplerOperations;
    private readonly _samplerContract: IERC20BridgeSamplerContract;

    constructor(samplerContract: IERC20BridgeSamplerContract) {
        this._samplerContract = samplerContract;
    }

    /* Type overloads for `executeAsync()`. Could skip this if we would upgrade TS. */

    // prettier-ignore
    public async executeAsync<
        T1
    >(...ops: [T1]): Promise<[
        BatchedOperationResult<T1>
    ]>;

    // prettier-ignore
    public async executeAsync<
        T1, T2
    >(...ops: [T1, T2]): Promise<[
        BatchedOperationResult<T1>,
        BatchedOperationResult<T2>
    ]>;

    // prettier-ignore
    public async executeAsync<
        T1, T2, T3
    >(...ops: [T1, T2, T3]): Promise<[
        BatchedOperationResult<T1>,
        BatchedOperationResult<T2>,
        BatchedOperationResult<T3>
    ]>;

    // prettier-ignore
    public async executeAsync<
        T1, T2, T3, T4
    >(...ops: [T1, T2, T3, T4]): Promise<[
        BatchedOperationResult<T1>,
        BatchedOperationResult<T2>,
        BatchedOperationResult<T3>,
        BatchedOperationResult<T4>
    ]>;

    // prettier-ignore
    public async executeAsync<
        T1, T2, T3, T4, T5
    >(...ops: [T1, T2, T3, T4, T5]): Promise<[
        BatchedOperationResult<T1>,
        BatchedOperationResult<T2>,
        BatchedOperationResult<T3>,
        BatchedOperationResult<T4>,
        BatchedOperationResult<T5>
    ]>;

    // prettier-ignore
    public async executeAsync<
        T1, T2, T3, T4, T5, T6
    >(...ops: [T1, T2, T3, T4, T5, T6]): Promise<[
        BatchedOperationResult<T1>,
        BatchedOperationResult<T2>,
        BatchedOperationResult<T3>,
        BatchedOperationResult<T4>,
        BatchedOperationResult<T5>,
        BatchedOperationResult<T6>
    ]>;

    // prettier-ignore
    public async executeAsync<
        T1, T2, T3, T4, T5, T6, T7
    >(...ops: [T1, T2, T3, T4, T5, T6, T7]): Promise<[
        BatchedOperationResult<T1>,
        BatchedOperationResult<T2>,
        BatchedOperationResult<T3>,
        BatchedOperationResult<T4>,
        BatchedOperationResult<T5>,
        BatchedOperationResult<T6>,
        BatchedOperationResult<T7>
    ]>;

    // prettier-ignore
    public async executeAsync<
        T1, T2, T3, T4, T5, T6, T7, T8
    >(...ops: [T1, T2, T3, T4, T5, T6, T7, T8]): Promise<[
        BatchedOperationResult<T1>,
        BatchedOperationResult<T2>,
        BatchedOperationResult<T3>,
        BatchedOperationResult<T4>,
        BatchedOperationResult<T5>,
        BatchedOperationResult<T6>,
        BatchedOperationResult<T7>,
        BatchedOperationResult<T8>
    ]>;

    /**
     * Run a series of operations from `DexOrderSampler.ops` in a single transaction.
     */
    public async executeAsync(...ops: any[]): Promise<any[]> {
        return this.executeBatchAsync(ops);
    }

    /**
     * Run a series of operations from `DexOrderSampler.ops` in a single transaction.
     * Takes an arbitrary length array, but is not typesafe.
     */
    public async executeBatchAsync<T extends Array<BatchedOperation<any>>>(ops: T): Promise<any[]> {
        const callDatas = ops.map(o => o.encodeCall(this._samplerContract));
        // Execute all non-empty calldatas.
        const rawCallResults = await this._samplerContract.batchCall(callDatas.filter(cd => cd !== '0x')).callAsync();
        // Return the parsed results.
        let rawCallResultsIdx = 0;
        return Promise.all(
            callDatas.map(async (callData, i) => {
                if (callData !== '0x') {
                    return ops[i].handleCallResultsAsync(this._samplerContract, rawCallResults[rawCallResultsIdx++]);
                }
                return ops[i].handleCallResultsAsync(this._samplerContract, '0x');
            }),
        );
    }
}
