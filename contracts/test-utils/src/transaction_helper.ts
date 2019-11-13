import { ContractTxFunctionObj } from '@0x/base-contract';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

export type MutatorContractFunction<O> = (...args: any[]) => ContractTxFunctionObj<O>;
/**
 * Helper class for performing non-constant contract functions calls.
 */
export const transactionHelper = {
    async getResultAndReceiptAsync<I, O>(
        contractFunction: MutatorContractFunction<O>,
        ...args: any[] // tslint:disable-line:trailing-comma
    ): Promise<[O, TransactionReceiptWithDecodedLogs]> {
        // HACK(dorothy-zbornak): We take advantage of the general rule that
        // the parameters for `callAsync()` are a subset of the
        // parameters for `sendTransactionAsync()`.
        const contractFunctionObj = contractFunction(...args);
        const result = await contractFunctionObj.callAsync();
        const receipt = await contractFunctionObj.awaitTransactionSuccessAsync();
        return [result, receipt];
    },
};
