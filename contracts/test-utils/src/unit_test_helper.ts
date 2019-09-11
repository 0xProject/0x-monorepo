import { RevertError } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { ContractArtifact, TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { expect } from './chai_setup';
import { LogDecoder } from './log_decoder';

type AsyncFunction<TArgs extends any[], TResult> = (...args: TArgs) => Promise<TResult>;

interface ContractArtifacts {
    [contractName: string]: ContractArtifact;
}

interface TransactionReturnData<TCallAsyncResult> {
    result: TCallAsyncResult;
    receipt: TransactionReceiptWithDecodedLogs;
}

interface ContractWrapperFunction<
    TCallAsyncArgs extends any[],
    TAwaitTransactionSuccessAsyncArgs extends any[],
    TCallAsyncResult
> {
    callAsync: AsyncFunction<TCallAsyncArgs, TCallAsyncResult>;
    sendTransactionAsync?: AsyncFunction<TAwaitTransactionSuccessAsyncArgs, string>;
}

export type TransactionExpectation<TAwaitTransactionSuccessAsyncArgs extends any[], TCallAsyncResult> = (
    tx: Partial<TransactionReturnData<TCallAsyncResult>>,
    // tslint:disable-next-line: trailing-comma
    ...args: TAwaitTransactionSuccessAsyncArgs
) => Promise<void> | void;

export class BaseUnitTestHelper<TContract> {
    protected _testContract: TContract;
    private _logDecoder: LogDecoder;

    protected static async _verifyContractMethodRevertErrorAsync<
        TCallAsyncArgs extends any[],
        TAwaitTransactionSuccessAsyncArgs extends any[],
        TCallAsyncResult
    >(
        contractFunction: ContractWrapperFunction<TCallAsyncArgs, TAwaitTransactionSuccessAsyncArgs, TCallAsyncResult>,
        expectedError: RevertError,
        // tslint:disable-next-line: trailing-comma
        ...args: TAwaitTransactionSuccessAsyncArgs
    ): Promise<void> {
        const tx = contractFunction.sendTransactionAsync
            ? contractFunction.sendTransactionAsync(...args)
            : contractFunction.callAsync(...((args as any) as TCallAsyncArgs));
        await expect(tx).to.revertWith(expectedError);
    }

    constructor(testContract: TContract, web3Wrapper: Web3Wrapper, artifacts: ContractArtifacts = {}) {
        this._testContract = testContract;
        this._logDecoder = new LogDecoder(web3Wrapper, artifacts);
    }

    protected async _verifyContractMethodExpectationsAsync<
        TCallAsyncArgs extends any[],
        TAwaitTransactionSuccessAsyncArgs extends any[],
        TCallAsyncResult
    >(
        contractFunction: ContractWrapperFunction<TCallAsyncArgs, TAwaitTransactionSuccessAsyncArgs, TCallAsyncResult>,
        expectations: Array<TransactionExpectation<TAwaitTransactionSuccessAsyncArgs, TCallAsyncResult>> = [],
        // tslint:disable-next-line: trailing-comma
        ...args: TAwaitTransactionSuccessAsyncArgs
    ): Promise<void> {
        const result = await contractFunction.callAsync(...((args as any) as TCallAsyncArgs));
        let receipt;
        if (contractFunction.sendTransactionAsync !== undefined) {
            receipt = await this._logDecoder.getTxWithDecodedLogsAsync(
                await contractFunction.sendTransactionAsync(...args),
            );
        }

        for (const expectation of expectations) {
            await expectation({ result, receipt }, ...args);
        }
    }
}
