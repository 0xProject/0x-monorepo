import * as _ from 'lodash';

import { expect } from './chai_setup';

class Value<T> {
    public value: T;
    constructor(value: T) {
        this.value = value;
    }
}

// tslint:disable-next-line: max-classes-per-file
class ErrorMessage {
    public error: string;
    constructor(message: string) {
        this.error = message;
    }
}

type PromiseResult<T> = Value<T> | ErrorMessage;

// TODO(albrow): This seems like a generic utility function that could exist in
// lodash. We should replace it by a library implementation, or move it to our
// own.
async function evaluatePromiseAsync<T>(promise: Promise<T>): Promise<PromiseResult<T>> {
    try {
        return new Value<T>(await promise);
    } catch (e) {
        return new ErrorMessage(e.message);
    }
}

export async function testWithReferenceFuncAsync<P0, R>(
    referenceFunc: (p0: P0) => Promise<R>,
    testFunc: (p0: P0) => Promise<R>,
    values: [P0],
): Promise<void>;
export async function testWithReferenceFuncAsync<P0, P1, R>(
    referenceFunc: (p0: P0, p1: P1) => Promise<R>,
    testFunc: (p0: P0, p1: P1) => Promise<R>,
    values: [P0, P1],
): Promise<void>;
export async function testWithReferenceFuncAsync<P0, P1, P2, R>(
    referenceFunc: (p0: P0, p1: P1, p2: P2) => Promise<R>,
    testFunc: (p0: P0, p1: P1, p2: P2) => Promise<R>,
    values: [P0, P1, P2],
): Promise<void>;
export async function testWithReferenceFuncAsync<P0, P1, P2, P3, R>(
    referenceFunc: (p0: P0, p1: P1, p2: P2, p3: P3) => Promise<R>,
    testFunc: (p0: P0, p1: P1, p2: P2, p3: P3) => Promise<R>,
    values: [P0, P1, P2, P3],
): Promise<void>;
export async function testWithReferenceFuncAsync<P0, P1, P2, P3, P4, R>(
    referenceFunc: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) => Promise<R>,
    testFunc: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) => Promise<R>,
    values: [P0, P1, P2, P3, P4],
): Promise<void>;

/**
 * Tests the behavior of a test function by comparing it to the expected
 * behavior (defined by a reference function).
 *
 * First the reference function will be called to obtain an "expected result",
 * or if the reference function throws/rejects, an "expected error". Next, the
 * test function will be called to obtain an "actual result", or if the test
 * function throws/rejects, an "actual error". The test passes if at least one
 * of the following conditions is met:
 *
 * 1) Neither the reference function or the test function throw and the
 * "expected result" equals the "actual result".
 *
 * 2) Both the reference function and the test function throw and the "actual
 * error" message *contains* the "expected error" message.
 *
 * @param referenceFuncAsync a reference function implemented in pure
 * JavaScript/TypeScript which accepts N arguments and returns the "expected
 * result" or throws/rejects with the "expected error".
 * @param testFuncAsync a test function which, e.g., makes a call or sends a
 * transaction to a contract. It accepts the same N arguments returns the
 * "actual result" or throws/rejects with the "actual error".
 * @param values an array of N values, where each value corresponds in-order to
 * an argument to both the test function and the reference function.
 * @return A Promise that resolves if the test passes and rejects if the test
 * fails, according to the rules described above.
 */
export async function testWithReferenceFuncAsync(
    referenceFuncAsync: (...args: any[]) => Promise<any>,
    testFuncAsync: (...args: any[]) => Promise<any>,
    values: any[],
): Promise<void> {
    // Measure correct behaviour
    const expected = await evaluatePromiseAsync(referenceFuncAsync(...values));

    // Measure actual behaviour
    const actual = await evaluatePromiseAsync(testFuncAsync(...values));

    // Compare behaviour
    if (expected instanceof ErrorMessage) {
        // If we expected an error, check if the actual error message contains the
        // expected error message.
        if (!(actual instanceof ErrorMessage)) {
            throw new Error(
                `Expected error containing ${expected.error} but got no error\n\tTest case: ${_getTestCaseString(
                    referenceFuncAsync,
                    values,
                )}`,
            );
        }
        expect(actual.error).to.contain(
            expected.error,
            `${actual.error}\n\tTest case: ${_getTestCaseString(referenceFuncAsync, values)}`,
        );
    } else {
        // If we do not expect an error, compare actual and expected directly.
        expect(actual).to.deep.equal(expected, `Test case ${_getTestCaseString(referenceFuncAsync, values)}`);
    }
}

function _getTestCaseString(referenceFuncAsync: (...args: any[]) => Promise<any>, values: any[]): string {
    const paramNames = _getParameterNames(referenceFuncAsync);
    return JSON.stringify(_.zipObject(paramNames, values));
}

// Source: https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically
function _getParameterNames(func: (...args: any[]) => any): string[] {
    return _.toString(func)
        .replace(/[/][/].*$/gm, '') // strip single-line comments
        .replace(/\s+/g, '') // strip white space
        .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
        .split('){', 1)[0]
        .replace(/^[^(]*[(]/, '') // extract the parameters
        .replace(/=[^,]+/g, '') // strip any ES6 defaults
        .split(',')
        .filter(Boolean); // split & filter [""]
}
