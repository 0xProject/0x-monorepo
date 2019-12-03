import { ContractFunctionObj, ContractTxFunctionObj } from '@0x/base-contract';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';
import * as _ from 'lodash';

// tslint:disable:max-classes-per-file
export type GenericContractFunction<T> = (...args: any[]) => ContractFunctionObj<T>;

export interface FunctionArguments<TArgs extends any[]> {
    args: TArgs;
    txData: Partial<TxData>;
}

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
    before: (args: FunctionArguments<TArgs>) => Promise<TBefore>;
    after: (beforeInfo: TBefore, result: FunctionResult, args: FunctionArguments<TArgs>) => Promise<any>;
}

/**
 * The basic unit of abstraction for testing. This just consists of a command that
 * can be run. For example, this can represent a simple command that can be run, or
 * it can represent a command that executes a "Hoare Triple" (this is what most of
 * our `Assertion` implementations will do in practice).
 * @param runAsync The function to execute for the assertion.
 */
export interface Assertion<TArgs extends any[]> {
    executeAsync: (args: FunctionArguments<TArgs>) => Promise<any>;
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
    public condition: Condition<TArgs, TBefore>;

    // The wrapper function that will be wrapped in assertions.
    public wrapperFunction: (
        ...args: TArgs // tslint:disable-line:trailing-comma
    ) => ContractTxFunctionObj<ReturnDataType> | ContractFunctionObj<ReturnDataType>;

    constructor(
        wrapperFunction: (
            ...args: TArgs // tslint:disable-line:trailing-comma
        ) => ContractTxFunctionObj<ReturnDataType> | ContractFunctionObj<ReturnDataType>,
        condition: Partial<Condition<TArgs, TBefore>> = {},
    ) {
        this.condition = {
            before: async (args: FunctionArguments<TArgs>) => {
                return ({} as any) as TBefore;
            },
            after: async (beforeInfo: TBefore, result: FunctionResult, args: FunctionArguments<TArgs>) => {
                return ({} as any) as TBefore;
            },
            ...condition,
        };
        this.wrapperFunction = wrapperFunction;
    }

    /**
     * Runs the wrapped function and fails if the before or after assertions fail.
     * @param ...args The args to the contract wrapper function.
     */
    public async executeAsync(args: FunctionArguments<TArgs>): Promise<AssertionResult<TBefore>> {
        // Call the before condition.
        const beforeInfo = await this.condition.before(args);

        // Initialize the callResult so that the default success value is true.
        const callResult: FunctionResult = { success: true };

        // Try to make the call to the function. If it is successful, pass the
        // result and receipt to the after condition.
        try {
            const functionWithArgs = this.wrapperFunction(...args.args) as ContractTxFunctionObj<ReturnDataType>;
            callResult.data = await functionWithArgs.callAsync(args.txData);
            callResult.receipt =
                functionWithArgs.awaitTransactionSuccessAsync !== undefined
                    ? await functionWithArgs.awaitTransactionSuccessAsync(args.txData) // tslint:disable-line:await-promise
                    : undefined;
            // tslint:enable:await-promise
        } catch (error) {
            callResult.data = error;
            callResult.success = false;
            callResult.receipt = undefined;
        }

        // Call the after condition.
        const afterInfo = await this.condition.after(beforeInfo, callResult, args);

        return {
            beforeInfo,
            afterInfo,
        };
    }
}
