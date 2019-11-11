import { PromiseWithTransactionHash } from '@0x/base-contract';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

// tslint:disable:max-classes-per-file

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
export interface Condition<TBefore> {
    before: (...args: any[]) => Promise<TBefore>;
    after: (beforeInfo: TBefore, result: Result, ...args: any[]) => Promise<any>;
}

/**
 * The basic unit of abstraction for testing. This just consists of a command that
 * can be run. For example, this can represent a simple command that can be run, or
 * it can represent a command that executes a "Hoare Triple" (this is what most of
 * our `Assertion` implementations will do in practice).
 * @param runAsync The function to execute for the assertion.
 */
export interface Assertion {
    executeAsync: (...args: any[]) => Promise<any>;
}

export interface RunResult {
    beforeInfo: any;
    afterInfo: any;
}

/**
 * This class implements `Assertion` and represents a "Hoare Triple" that can be
 * executed.
 */
export class FunctionAssertion<TBefore> implements Assertion {
    // A condition that will be applied to `wrapperFunction`.
    public condition: Condition<TBefore>;

    // The wrapper function that will be wrapped in assertions.
    public wrapperFunction: ContractWrapperFunction;

    constructor(wrapperFunction: ContractWrapperFunction, condition: Partial<Condition<TBefore>> = {}) {
        this.condition = {
            before: _.noop.bind(this),
            after: _.noop.bind(this),
            ...condition,
        };
        this.wrapperFunction = wrapperFunction;
    }

    /**
     * Runs the wrapped function and fails if the before or after assertions fail.
     * @param ...args The args to the contract wrapper function.
     */
    public async executeAsync(...args: any[]): Promise<RunResult> {
        // Call the before condition.
        const beforeInfo = await this.condition.before(...args);

        // Initialize the callResult so that the default success value is true.
        const callResult: Result = { success: true };

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
        const afterInfo = await this.condition.after(beforeInfo, callResult, ...args);

        return {
            beforeInfo,
            afterInfo,
        };
    }
}

export type IndexGenerator = () => number;

export type InputGenerator = () => Promise<any[]>;

export interface AssertionGenerator {
    assertion: Assertion;
    generator: InputGenerator;
}

/**
 * This class is an abstract way to represent collections of function assertions.
 * Using this, we can use closures to build up many useful collections with different
 * properties. Notably, this abstraction supports function assertion collections
 * that can be run continuously and also those that terminate in a finite number
 * of steps.
 */
class MetaAssertion implements Assertion {
    constructor(
        protected readonly assertionGenerators: AssertionGenerator[],
        protected readonly indexGenerator: IndexGenerator,
    ) {}

    public async executeAsync(): Promise<void> {
        let idx = this.indexGenerator();
        while (idx > 0) {
            const args = await this.assertionGenerators[idx].generator();
            await this.assertionGenerators[idx].assertion.executeAsync(...args);
            idx = this.indexGenerator();
        }
    }
}

/**
 * Returns a class that can execute a set of function assertions in sequence.
 * @param assertionGenerators A set of assertion generators to run in sequence.
 */
export function FunctionAssertionSequence(assertionGenerators: AssertionGenerator[]): MetaAssertion {
    let idx = 0;
    return new MetaAssertion(assertionGenerators, () => {
        if (idx < assertionGenerators.length) {
            return idx++;
        } else {
            idx = 0;
            return -1;
        }
    });
}

export interface WeightedAssertionGenerator extends AssertionGenerator {
    weight?: number;
}

/**
 * Returns a class that can execute a set of function assertions at random continuously.
 * This will not terminate unless the process that called `runAsync` terminates.
 * @param weightedAssertionGenerators A set of function assertions that have been
 *        assigned weights.
 */
export function ContinuousFunctionAssertionSet(
    weightedAssertionGenerators: WeightedAssertionGenerator[],
): MetaAssertion {
    // Construct an array of assertion generators that allows random sampling from a
    // uniform distribution to correctly bias assertion selection.
    let assertionGenerators: AssertionGenerator[] = [];
    for (const { assertion, generator, weight } of weightedAssertionGenerators) {
        const weightedAssertions: AssertionGenerator[] = [];
        _.fill(weightedAssertions, { assertion, generator }, 0, weight || 1);
        assertionGenerators = assertionGenerators.concat(weightedAssertions);
    }

    // The index generator simply needs to sample from a uniform distribution.
    const indexGenerator = () => Math.round(Math.random() * (assertionGenerators.length - 1));

    return new MetaAssertion(assertionGenerators, indexGenerator);
}
