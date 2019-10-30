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
export interface Condition<TBefore extends any> {
    before?: (...args: any[]) => Promise<TBefore>;
    after?: (beforeInfo: TBefore, result: Result, ...args: any[]) => Promise<any>;
}

/**
 *
 */
export interface Assertion {
    runAsync: (...args: any[]) => Promise<any>;
}

export interface RunResult {
    beforeInfo: any;
    afterInfo: any;
}

export class FunctionAssertion<TBefore extends any> implements Assertion {
    // A condition that will be applied to `wrapperFunction`.
    // Note: `TBefore | undefined` is used because the `before` and `after` functions
    //       are optional in `Condition`.
    public condition: Condition<TBefore | undefined>;

    // The wrapper function that will be wrapped in assertions.
    public wrapperFunction: ContractWrapperFunction;

    constructor(wrapperFunction: ContractWrapperFunction, condition: Condition<TBefore | undefined>) {
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

export type InputGenerator = () => Promise<any[]>;

export interface AssertionGenerator {
    assertion: Assertion;
    generator: InputGenerator;
}

/**
 * A class that can run a set of function assertions in a sequence. This will terminate
 * after every assertion in the sequence has been executed.
 */
export class FunctionAssertionSequence {
    /**
     * @constructor Initializes a readonly list of AssertionGenerator objects.
     * @param assertionGenerators A list of objects that contain (1) assertions
     *        and (2) functions that generate the arguments to "run" the assertions.
     */
    constructor(protected readonly assertionGenerators: AssertionGenerator[]) {}

    /**
     * Execute this class's function assertions in the order that they were initialized.
     * The assertions corresponding input generators will provide the arguments when the
     * assertion is executed.
     */
    public async runAsync(): Promise<void> {
        for (let i = 0; i < this.assertionGenerators.length; i++) {
            const args = await this.assertionGenerators[i].generator();
            await this.assertionGenerators[i].assertion.runAsync(...args);
        }
    }
}

export interface WeightedAssertionGenerator extends AssertionGenerator {
    weight?: number;
}

/**
 * A class that can execute a set of function assertions at random continuously.
 * This will not terminate unless the process that called `runAsync` terminates.
 */
export class ContinuousFunctionAssertionSet {
    protected readonly assertionGenerators: AssertionGenerator[] = [];

    /**
     * @constructor Initializes assertion generators so that assertion's can be
     *              selected using a uniform distribution and the weights of the
     *              assertions hold.
     * @param weightedAssertionGenerators An array of assertion generators that
     *        have specified "weights." These "weights" specify the relative frequency
     *        that assertions should be executed when the set is run.
     */
    constructor(weightedAssertionGenerators: WeightedAssertionGenerator[]) {
        for (const { assertion, generator, weight } of weightedAssertionGenerators) {
            const weightedAssertions: AssertionGenerator[] = [];
            _.fill(weightedAssertions, { assertion, generator }, 0, weight || 1);
            this.assertionGenerators = this.assertionGenerators.concat(weightedAssertions);
        }
    }

    /**
     * Execute this class's function assertions continuously and randomly using the weights
     * of the assertions to bias the assertion selection. The assertions corresponding
     * input generators will provide the arguments when the
     * assertion is executed.
     */
    public async runAsync(): Promise<void> {
        for (;;) {
            const randomIdx = Math.round(Math.random() * (this.assertionGenerators.length - 1));
            const args = await this.assertionGenerators[randomIdx].generator();
            await this.assertionGenerators[randomIdx].assertion.runAsync(...args);
        }
    }
}
