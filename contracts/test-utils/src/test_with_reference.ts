import { BigNumber, RevertError } from '@0x/utils';
import * as _ from 'lodash';

import { expect } from './chai_setup';

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
    // Measure correct behavior
    let expected: any;
    let expectedError: Error | undefined;
    try {
        expected = await referenceFuncAsync(...values);
    } catch (err) {
        expectedError = err;
    }
    // Measure actual behavior
    let actual: any;
    let actualError: Error | undefined;
    try {
        actual = await testFuncAsync(...values);
    } catch (err) {
        actualError = err;
    }

    const testCaseString = _getTestCaseString(referenceFuncAsync, values);
    // Compare behavior
    if (expectedError !== undefined) {
        // Expecting an error.
        if (actualError === undefined) {
            return expect.fail(
                actualError,
                expectedError,
                `${testCaseString}: expected failure but instead succeeded`,
            );
        } else {
            if (expectedError instanceof RevertError) {
                // Expecting a RevertError.
                if (actualError instanceof RevertError) {
                    if (!actualError.equals(expectedError)) {
                        return expect.fail(
                            actualError,
                            expectedError,
                            `${testCaseString}: expected error ${actualError.toString()} to equal ${expectedError.toString()}`,
                        );
                    }
                } else {
                    return expect.fail(
                        actualError,
                        expectedError,
                        `${testCaseString}: expected a RevertError but received an Error`,
                    );
                }
            } else {
                // Expecing any Error type.
                if (actualError.message !== expectedError.message) {
                    return expect.fail(
                        actualError,
                        expectedError,
                        `${testCaseString}: expected error message '${actualError.message}' to equal '${expectedError.message}'`,
                    );
                }
            }
        }
    } else {
        // Not expecting an error.
        if (actualError !== undefined) {
            return expect.fail(
                actualError,
                expectedError,
                `${testCaseString}: expected success but instead failed`,
            );
        }
        if (expected instanceof BigNumber) {
            // Technically we can do this with `deep.eq`, but this prints prettier
            // error messages for BigNumbers.
            expect(actual).to.bignumber.eq(expected, testCaseString);
        } else {
            expect(actual).to.deep.eq(expected, testCaseString);
        }
    }
}

function _getTestCaseString(referenceFuncAsync: (...args: any[]) => Promise<any>, values: any[]): string {
    const paramNames = _getParameterNames(referenceFuncAsync);
    while (paramNames.length < values.length) {
        paramNames.push(`${paramNames.length}`);
    }
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
