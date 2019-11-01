import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractArtifact, TransactionReceipt } from 'ethereum-types';

import { LogDecoder } from './log_decoder';

type AsyncFunction<TArgs extends any[], TResult> = (...args: TArgs) => Promise<TResult>;

interface ContractArtifacts {
    [contractName: string]: ContractArtifact;
}

export interface MutatorContractFunction<
    TCallAsyncArgs extends any[],
    TAwaitTransactionSuccessAsyncArgs extends any[],
    TCallAsyncResult
> {
    callAsync: AsyncFunction<TCallAsyncArgs, TCallAsyncResult>;
    sendTransactionAsync: AsyncFunction<TAwaitTransactionSuccessAsyncArgs, string>;
}

/**
 * Helper class for performing non-constant contract functions calls.
 */
export class TransactionHelper {
    public readonly logDecoder: LogDecoder;

    constructor(web3Wrapper: Web3Wrapper, artifacts: ContractArtifacts) {
        this.logDecoder = new LogDecoder(web3Wrapper, artifacts);
    }

    /**
     * Call a non-constant contract function `contractFunction`, passing `args`.
     * This will first perform an 'eth_call' (read-only) call in order to
     * retrieve the return value, then a 'sendTransaction' to actually modify
     * the state. Returns a tuple of the return value amd receipt, with decoded
     * logs.
     */
    public async getResultAndReceiptAsync<
        TCallAsyncArgs extends any[],
        TAwaitTransactionSuccessAsyncArgs extends any[],
        TCallAsyncResult
    >(
        contractFunction: MutatorContractFunction<TCallAsyncArgs, TAwaitTransactionSuccessAsyncArgs, TCallAsyncResult>,
        // tslint:disable-next-line: trailing-comma
        ...args: TAwaitTransactionSuccessAsyncArgs
    ): Promise<[TCallAsyncResult, TransactionReceipt]> {
        // HACK(dorothy-zbornak): We take advantage of the general rule that
        // the parameters for `callAsync()` are a subset of the
        // parameters for `sendTransactionAsync()`.
        const result = await contractFunction.callAsync(...((args as any) as TCallAsyncArgs));
        const receipt = await this.logDecoder.getTxWithDecodedLogsAsync(
            await contractFunction.sendTransactionAsync(...args),
        );
        return [result, receipt];
    }
}
