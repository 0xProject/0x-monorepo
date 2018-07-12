import * as chai from 'chai';
import * as _ from 'lodash';

import { chaiSetup } from './chai_setup';

chaiSetup.configure();
const expect = chai.expect;

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
    referenceFunc: (...args: any[]) => Promise<any>,
    testFuncAsync: (...args: any[]) => Promise<any>,
    values: any[],
): Promise<void> {
    const paramNames = _getParameterNames(referenceFunc);
    const testCaseString = JSON.stringify(_.zipObject(paramNames, values));
    let expectedResult: any;
    let expectedErr: string | undefined;
    try {
        expectedResult = await referenceFunc(...values);
    } catch (e) {
        expectedErr = e.message;
    }
    let actualResult: any | undefined;
    try {
        actualResult = await testFuncAsync(...values);
        if (!_.isUndefined(expectedErr)) {
            throw new Error(
                `Expected error containing ${expectedErr} but got no error\n\tTest case: ${testCaseString}`,
            );
        }
    } catch (e) {
        if (_.isUndefined(expectedErr)) {
            throw new Error(`${e.message}\n\tTest case: ${testCaseString}`);
        } else {
            expect(e.message).to.contain(expectedErr, `${e.message}\n\tTest case: ${testCaseString}`);
        }
    }
    if (!_.isUndefined(actualResult) && !_.isUndefined(expectedResult)) {
        expect(JSON.stringify(actualResult)).to.equal(
            JSON.stringify(expectedResult),
            `\n\tTest case: ${testCaseString}`,
        );
    }
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
