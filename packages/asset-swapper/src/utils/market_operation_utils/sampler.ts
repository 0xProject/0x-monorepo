import { BigNumber, NULL_BYTES } from '@0x/utils';

import { SamplerOverrides } from '../../types';
import { ERC20BridgeSamplerContract } from '../../wrappers';

import { BalancerPoolsCache } from './balancer_utils';
import { BancorService } from './bancor_service';
import { samplerOperations } from './sampler_operations';
import { BatchedOperation } from './types';

// Evaluate the inverse CDF at `x` to obtain a point from Kumaraswamy(alpha, beta)
function kumaraswamy(x: number, alpha: number, beta: number): number {
    return (1 - (1 - x) ** (1 / beta)) ** (1 / alpha);
}

/**
 * Generate sample amounts up to `maxFillAmount`.
 */
export function getSampleAmounts(
    maxFillAmount: BigNumber,
    numSamples: number,
    alpha: number,
    beta: number,
): BigNumber[] {
    const steps = [...Array<number>(numSamples)].map((_x, i) => kumaraswamy((i + 1) / numSamples, alpha, beta));
    const amounts = steps.map((s, i) => {
        if (i === numSamples - 1) {
            return maxFillAmount;
        }
        return maxFillAmount.times(s).integerValue(BigNumber.ROUND_UP);
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

    constructor(
        private readonly _samplerContract: ERC20BridgeSamplerContract,
        private readonly _samplerOverrides?: SamplerOverrides,
        public bancorService?: BancorService,
        public balancerPoolsCache: BalancerPoolsCache = new BalancerPoolsCache(),
    ) {}

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
    >(block: number | undefined, ...ops: [T1, T2, T3, T4, T5]): Promise<[
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
    public async executeAsync(block: number | undefined, ...ops: any[]): Promise<any[]> {
        return this.executeBatchAsync(ops, block);
    }

    /**
     * Run a series of operations from `DexOrderSampler.ops` in a single transaction.
     * Takes an arbitrary length array, but is not typesafe.
     */
    public async executeBatchAsync<T extends Array<BatchedOperation<any>>>(ops: T, block?: number): Promise<any[]> {
        const callDatas = ops.map(o => o.encodeCall(this._samplerContract));
        const { overrides } = this._samplerOverrides ? this._samplerOverrides : { overrides: undefined };

        // All operations are NOOPs
        if (callDatas.every(cd => cd === NULL_BYTES)) {
            return Promise.all(
                callDatas.map(async (_callData, i) => ops[i].handleCallResultsAsync(this._samplerContract, NULL_BYTES)),
            );
        }
        // Execute all non-empty calldatas.
        const rawCallResults = await this._samplerContract
            .batchCall(callDatas.filter(cd => cd !== NULL_BYTES))
            .callAsync({ overrides }, block);
        // Return the parsed results.
        let rawCallResultsIdx = 0;
        return Promise.all(
            callDatas.map(async (callData, i) => {
                const result = callData !== NULL_BYTES ? rawCallResults[rawCallResultsIdx++] : NULL_BYTES;
                return ops[i].handleCallResultsAsync(this._samplerContract, result);
            }),
        );
    }
}
