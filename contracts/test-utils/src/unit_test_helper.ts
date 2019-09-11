import { RevertError } from '@0x/utils';

import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { expect } from './chai_setup';

type AsyncFunction<TArgs extends any[], TReturn> = (...args: TArgs) => PromiseLike<TReturn>;

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
    awaitTransactionSuccessAsync?: AsyncFunction<TAwaitTransactionSuccessAsyncArgs, TransactionReceiptWithDecodedLogs>;
}

export type TransactionExpectation<TAwaitTransactionSuccessAsyncArgs extends any[], TCallAsyncResult> = (
    tx: Partial<TransactionReturnData<TCallAsyncResult>>,
    // tslint:disable-next-line: trailing-comma
    ...args: TAwaitTransactionSuccessAsyncArgs
) => Promise<void> | void;

export class BaseUnitTestHelper<TContract> {
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
        const tx = contractFunction.awaitTransactionSuccessAsync
            ? contractFunction.awaitTransactionSuccessAsync(...args)
            : contractFunction.callAsync(...((args as any) as TCallAsyncArgs));
        return expect(tx).to.revertWith(expectedError);
    }

    constructor(protected readonly _testContract: TContract) {}

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
        const receipt =
            contractFunction.awaitTransactionSuccessAsync !== undefined
                ? await contractFunction.awaitTransactionSuccessAsync(...args)
                : undefined;

        for (const expectation of expectations) {
            await expectation({ result, receipt }, ...args);
        }
    }
}
