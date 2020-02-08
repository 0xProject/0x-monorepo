import { IERC20BridgeSamplerContract } from '@0x/contract-wrappers';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

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
    getSellQuotes(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): BatchedOperation<DexSample[][]> {
        const subOps = sources.map(source => {
            if (source === ERC20BridgeSource.Eth2Dai) {
                return samplerOperations.getEth2DaiSellQuotes(makerToken, takerToken, takerFillAmounts);
            } else if (source === ERC20BridgeSource.Uniswap) {
                return samplerOperations.getUniswapSellQuotes(makerToken, takerToken, takerFillAmounts);
            } else if (source === ERC20BridgeSource.Kyber) {
                return samplerOperations.getKyberSellQuotes(makerToken, takerToken, takerFillAmounts);
            } else {
                throw new Error(`Unsupported sell sample source: ${source}`);
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
    ): BatchedOperation<DexSample[][]> {
        const subOps = sources.map(source => {
            if (source === ERC20BridgeSource.Eth2Dai) {
                return samplerOperations.getEth2DaiBuyQuotes(makerToken, takerToken, makerFillAmounts);
            } else if (source === ERC20BridgeSource.Uniswap) {
                return samplerOperations.getUniswapBuyQuotes(makerToken, takerToken, makerFillAmounts);
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
        const callResults = await this._samplerContract.batchCall(callDatas).callAsync();
        return Promise.all(callResults.map(async (r, i) => ops[i].handleCallResultsAsync(this._samplerContract, r)));
    }
}
