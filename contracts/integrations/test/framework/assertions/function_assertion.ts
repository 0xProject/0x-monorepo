import { BaseContract, ContractFunctionObj, ContractTxFunctionObj } from '@0x/base-contract';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { logger } from '../utils/logger';

// tslint:disable:max-classes-per-file
export type GenericContractFunction<T> = (...args: any[]) => ContractFunctionObj<T>;

export interface FunctionResult {
    data?: any;
    success: boolean;
    receipt?: TransactionReceiptWithDecodedLogs;
}

/**
 * This interface represents a condition that can be placed on a contract function.
 * This can be used to represent the pre- and post-conditions of a "Hoare Triple" on a
 * given contract function. The "Hoare Triple" is a way to represent the way that a
 * function changes state.
 * @param before A function that will be run before a call to the contract wrapper
 *               function. Ideally, this will be a "precondition."
 * @param after A function that will be run after a call to the contract wrapper
 *              function.
 */
export interface Condition<TArgs extends any[], TBefore> {
    before: (args: TArgs, txData: Partial<TxData>) => Promise<TBefore>;
    after: (beforeInfo: TBefore, result: FunctionResult, args: TArgs, txData: Partial<TxData>) => Promise<any>;
}

/**
 * The basic unit of abstraction for testing. This just consists of a command that
 * can be run. For example, this can represent a simple command that can be run, or
 * it can represent a command that executes a "Hoare Triple" (this is what most of
 * our `Assertion` implementations will do in practice).
 * @param runAsync The function to execute for the assertion.
 */
export interface Assertion<TArgs extends any[]> {
    executeAsync: (args: TArgs, txData: TxData) => Promise<any>;
}

export interface AssertionResult<TBefore = unknown> {
    beforeInfo: TBefore;
    afterInfo: any;
}

/**
 * This class implements `Assertion` and represents a "Hoare Triple" that can be
 * executed.
 */
export class FunctionAssertion<TArgs extends any[], TBefore, ReturnDataType> implements Assertion<TArgs> {
    // A condition that will be applied to `wrapperFunction`.
    public readonly condition: Condition<TArgs, TBefore>;

    constructor(
        private readonly _contractWrapper: BaseContract,
        private readonly _functionName: string,
        condition: Partial<Condition<TArgs, TBefore>> = {},
    ) {
        this.condition = {
            before: async (_args: TArgs, _txData: Partial<TxData>) => {
                return ({} as any) as TBefore;
            },
            after: async (_beforeInfo: TBefore, _result: FunctionResult, _args: TArgs, _txData: Partial<TxData>) => {
                return ({} as any) as TBefore;
            },
            ...condition,
        };
    }

    /**
     * Runs the wrapped function and fails if the before or after assertions fail.
     * @param ...args The args to the contract wrapper function.
     */
    public async executeAsync(args: TArgs, txData: Partial<TxData>): Promise<AssertionResult<TBefore>> {
        // Call the before condition.
        const beforeInfo = await this.condition.before(args, txData);

        // Initialize the callResult so that the default success value is true.
        const callResult: FunctionResult = { success: true };

        // Log function name, arguments, and txData
        logger.logFunctionAssertion(this._functionName, args, txData);

        // Try to make the call to the function. If it is successful, pass the
        // result and receipt to the after condition.
        try {
            const functionWithArgs = (this._contractWrapper as any)[this._functionName](
                ...args,
            ) as ContractTxFunctionObj<ReturnDataType>;
            callResult.data = await functionWithArgs.callAsync(txData);
            callResult.receipt =
                functionWithArgs.awaitTransactionSuccessAsync !== undefined
                    ? await functionWithArgs.awaitTransactionSuccessAsync(txData) // tslint:disable-line:await-promise
                    : undefined;
            // tslint:enable:await-promise
        } catch (error) {
            callResult.data = error;
            callResult.success = false;
            callResult.receipt = undefined;
        }

        // Call the after condition.
        const afterInfo = await this.condition.after(beforeInfo, callResult, args, txData);

        return {
            beforeInfo,
            afterInfo,
        };
    }
}
