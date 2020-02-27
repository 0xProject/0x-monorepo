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
 * Generate sample amounts up to `maxFillAmount`.
 */
export declare function getSampleAmounts(maxFillAmount: BigNumber, numSamples: number, expBase?: number): BigNumber[];
declare type BatchedOperationResult<T> = T extends BatchedOperation<infer TResult> ? TResult : never;
/**
 * Encapsulates interactions with the `ERC20BridgeSampler` contract.
 */
export declare class DexOrderSampler {
    /**
     * Composable operations that can be batched in a single transaction,
     * for use with `DexOrderSampler.executeAsync()`.
     */
    static ops: {
        getOrderFillableTakerAmounts(orders: SignedOrder[]): BatchedOperation<BigNumber[]>;
        getOrderFillableMakerAmounts(orders: SignedOrder[]): BatchedOperation<BigNumber[]>;
        getKyberSellQuotes(makerToken: string, takerToken: string, takerFillAmounts: BigNumber[]): BatchedOperation<BigNumber[]>;
        getUniswapSellQuotes(makerToken: string, takerToken: string, takerFillAmounts: BigNumber[]): BatchedOperation<BigNumber[]>;
        getEth2DaiSellQuotes(makerToken: string, takerToken: string, takerFillAmounts: BigNumber[]): BatchedOperation<BigNumber[]>;
        getCurveSellQuotes(curveAddress: string, fromTokenIdx: number, toTokenIdx: number, takerFillAmounts: BigNumber[]): BatchedOperation<BigNumber[]>;
        getUniswapBuyQuotes(makerToken: string, takerToken: string, makerFillAmounts: BigNumber[]): BatchedOperation<BigNumber[]>;
        getEth2DaiBuyQuotes(makerToken: string, takerToken: string, makerFillAmounts: BigNumber[]): BatchedOperation<BigNumber[]>;
        getMedianSellRate(sources: ERC20BridgeSource[], makerToken: string, takerToken: string, takerFillAmount: BigNumber): BatchedOperation<BigNumber>;
        constant<T>(result: T): BatchedOperation<T>;
        getSellQuotes(sources: ERC20BridgeSource[], makerToken: string, takerToken: string, takerFillAmounts: BigNumber[]): BatchedOperation<DexSample[][]>;
        getBuyQuotes(sources: ERC20BridgeSource[], makerToken: string, takerToken: string, makerFillAmounts: BigNumber[]): BatchedOperation<DexSample[][]>;
    };
    private readonly _samplerContract;
    constructor(samplerContract: IERC20BridgeSamplerContract);
    executeAsync<T1>(...ops: [T1]): Promise<[BatchedOperationResult<T1>]>;
    executeAsync<T1, T2>(...ops: [T1, T2]): Promise<[BatchedOperationResult<T1>, BatchedOperationResult<T2>]>;
    executeAsync<T1, T2, T3>(...ops: [T1, T2, T3]): Promise<[BatchedOperationResult<T1>, BatchedOperationResult<T2>, BatchedOperationResult<T3>]>;
    executeAsync<T1, T2, T3, T4>(...ops: [T1, T2, T3, T4]): Promise<[BatchedOperationResult<T1>, BatchedOperationResult<T2>, BatchedOperationResult<T3>, BatchedOperationResult<T4>]>;
    executeAsync<T1, T2, T3, T4, T5>(...ops: [T1, T2, T3, T4, T5]): Promise<[BatchedOperationResult<T1>, BatchedOperationResult<T2>, BatchedOperationResult<T3>, BatchedOperationResult<T4>, BatchedOperationResult<T5>]>;
    executeAsync<T1, T2, T3, T4, T5, T6>(...ops: [T1, T2, T3, T4, T5, T6]): Promise<[BatchedOperationResult<T1>, BatchedOperationResult<T2>, BatchedOperationResult<T3>, BatchedOperationResult<T4>, BatchedOperationResult<T5>, BatchedOperationResult<T6>]>;
    executeAsync<T1, T2, T3, T4, T5, T6, T7>(...ops: [T1, T2, T3, T4, T5, T6, T7]): Promise<[BatchedOperationResult<T1>, BatchedOperationResult<T2>, BatchedOperationResult<T3>, BatchedOperationResult<T4>, BatchedOperationResult<T5>, BatchedOperationResult<T6>, BatchedOperationResult<T7>]>;
    executeAsync<T1, T2, T3, T4, T5, T6, T7, T8>(...ops: [T1, T2, T3, T4, T5, T6, T7, T8]): Promise<[BatchedOperationResult<T1>, BatchedOperationResult<T2>, BatchedOperationResult<T3>, BatchedOperationResult<T4>, BatchedOperationResult<T5>, BatchedOperationResult<T6>, BatchedOperationResult<T7>, BatchedOperationResult<T8>]>;
    /**
     * Run a series of operations from `DexOrderSampler.ops` in a single transaction.
     * Takes an arbitrary length array, but is not typesafe.
     */
    executeBatchAsync<T extends Array<BatchedOperation<any>>>(ops: T): Promise<any[]>;
}
export {};
//# sourceMappingURL=sampler.d.ts.map