import { PromiseWithTransactionHash } from '@0x/base-contract';
import { BlockchainTestsEnvironment } from '@0x/contracts-test-utils';
import { decodeThrownErrorAsRevertError } from '@0x/utils';
import { BlockParam, CallData, TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';
import * as _ from 'lodash';

export interface ContractGetterFunction {
    callAsync: (...args: any[]) => Promise<any>;
}

export interface ContractWrapperFunction extends ContractGetterFunction {
    awaitTransactionSuccessAsync?: (...args: any[]) => PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
}

export interface Result {
    data?: any;
    success: boolean;
    receipt?: TransactionReceiptWithDecodedLogs;
}

export interface Condition {
    before?: (...args: any[]) => Promise<any>;
    after?: (beforeInfo: any, result: Result, ...args: any[]) => Promise<any>;
}

export interface RunResult {
    beforeInfo: any;
    afterInfo: any;
}

export interface Assertion {
    runAsync: (...args: any[]) => Promise<any>;
}

export class FunctionAssertion implements Assertion {
    // A before and an after assertion that will be called around the wrapper function.
    public condition: Condition;

    // The wrapper function that will be wrapped in assertions.
    public wrapperFunction: ContractWrapperFunction;

    constructor(wrapperFunction: ContractWrapperFunction, condition: Condition) {
        this.condition = condition;
        this.wrapperFunction = wrapperFunction;
    }

    /**
     * Runs the wrapped function and fails if the before or after assertions fail.
     * @param ...args The args to the contract wrapper function.
     */
    public async runAsync(...args: any[]): Promise<RunResult> {
        // Call the before condition.
        const beforeInfo = this.condition.before !== undefined ? await this.condition.before(...args) : undefined;

        // Initialize the callResult so that the default success value is true.
        let callResult: Result = { success: true };

        // Try to make the call to the function. If it is successful, pass the
        // result and receipt to the after condition.
        try {
            callResult.data = await this.wrapperFunction.callAsync(...args);
            callResult.receipt =
                this.wrapperFunction.awaitTransactionSuccessAsync !== undefined
                    ? await this.wrapperFunction.awaitTransactionSuccessAsync(...args)
                    : undefined;
        } catch (error) {
            callResult.data = error;
            callResult.success = false;
            callResult.receipt = undefined;
        }

        // Call the after condition.
        const afterInfo =
            this.condition.after !== undefined
                ? await this.condition.after(beforeInfo, callResult, ...args)
                : undefined;

        return {
            beforeInfo,
            afterInfo,
        };
    }
}

/**
 * Note: This can be treated like a normal `FunctionAssertion`.
 */
export class FunctionAssertionSequence {
    public readonly assertions: Assertion[] = [];
    public readonly inputGenerators: Array<() => any[]> = [];

    /**
     * Set up a set of function assertions equipped with generator functions.
     * A number can be specified for each assertion that will detail the frequency
     * that this assertion will be called relative to the other assertions in the
     * set.
     */
    constructor(assertionGenerators: [Assertion, (() => any[])][]) {
        for (const assertionGenerator of assertionGenerators) {
            this.assertions.push(assertionGenerator[0]);
            this.inputGenerators.push(assertionGenerator[1]);
        }
    }

    /**
     * Run the functions in this assertion set in order.
     */
    public async runAsync(environment: BlockchainTestsEnvironment): Promise<void> {
        for (let i = 0; i < this.assertions.length; i++) {
            await this.assertions[i].runAsync(...this.inputGenerators[i]());
        }
    }
}

export class ContinuousFunctionAssertionSet {
    public readonly assertions: Assertion[] = [];
    public readonly inputGenerators: Array<() => any[]> = [];

    /**
     * Set up a set of function assertions equipped with generator functions.
     * A number can be specified for each assertion that will detail the frequency
     * that this assertion will be called relative to the other assertions in the
     * set.
     */
    constructor(assertionGenerators: [Assertion, (() => any[]), number?][]) {
        for (const assertionGenerator of assertionGenerators) {
            const frequency = assertionGenerator[2] || 1;
            for (let i = 0; i < frequency; i++) {
                this.assertions.push(assertionGenerator[0]);
                this.inputGenerators.push(assertionGenerator[1]);
            }
        }
    }

    /**
     * Run the functions in this assertion set continuously.
     */
    public async runAsync(environment: BlockchainTestsEnvironment): Promise<void> {
        for (;;) {
            const randomIdx = Math.round(Math.random() * (this.assertions.length - 1));
            await this.assertions[randomIdx].runAsync(...this.inputGenerators[randomIdx]());
        }
    }
}
