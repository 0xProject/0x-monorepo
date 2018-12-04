import { BigNumber } from '@0x/utils';
import * as combinatorics from 'js-combinatorics';

import { testWithReferenceFuncAsync } from './test_with_reference';

// A set of values corresponding to the uint256 type in Solidity. This set
// contains some notable edge cases, including some values which will overflow
// the uint256 type when used in different mathematical operations.
export const uint256Values = [
    new BigNumber(0),
    new BigNumber(1),
    new BigNumber(2),
    // Non-trivial big number.
    new BigNumber(2).pow(64),
    // Max that does not overflow when squared.
    new BigNumber(2).pow(128).minus(1),
    // Min that does overflow when squared.
    new BigNumber(2).pow(128),
    // Max that does not overflow when doubled.
    new BigNumber(2).pow(255).minus(1),
    // Min that does overflow when doubled.
    new BigNumber(2).pow(255),
    // Max that does not overflow.
    new BigNumber(2).pow(256).minus(1),
];

// A set of values corresponding to the bytes32 type in Solidity.
export const bytes32Values = [
    // Min
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000001',
    '0x0000000000000000000000000000000000000000000000000000000000000002',
    // Non-trivial big number.
    '0x000000000000f000000000000000000000000000000000000000000000000000',
    // Max
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
];

export async function testCombinatoriallyWithReferenceFuncAsync<P0, P1, R>(
    name: string,
    referenceFunc: (p0: P0, p1: P1) => Promise<R>,
    testFunc: (p0: P0, p1: P1) => Promise<R>,
    allValues: [P0[], P1[]],
): Promise<void>;
export async function testCombinatoriallyWithReferenceFuncAsync<P0, P1, P2, R>(
    name: string,
    referenceFunc: (p0: P0, p1: P1, p2: P2) => Promise<R>,
    testFunc: (p0: P0, p1: P1, p2: P2) => Promise<R>,
    allValues: [P0[], P1[], P2[]],
): Promise<void>;
export async function testCombinatoriallyWithReferenceFuncAsync<P0, P1, P2, P3, R>(
    name: string,
    referenceFunc: (p0: P0, p1: P1, p2: P2, p3: P3) => Promise<R>,
    testFunc: (p0: P0, p1: P1, p2: P2, p3: P3) => Promise<R>,
    allValues: [P0[], P1[], P2[], P3[]],
): Promise<void>;
export async function testCombinatoriallyWithReferenceFuncAsync<P0, P1, P2, P3, P4, R>(
    name: string,
    referenceFunc: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) => Promise<R>,
    testFunc: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) => Promise<R>,
    allValues: [P0[], P1[], P2[], P3[], P4[]],
): Promise<void>;

/**
 * Uses combinatorics to test the behavior of a test function by comparing it to
 * the expected behavior (defined by a reference function) for a large number of
 * possible input values.
 *
 * First generates test cases by taking the cartesian product of the given
 * values. Each test case is a set of N values corresponding to the N arguments
 * for the test func and the reference func. For each test case, first the
 * reference function will be called to obtain an "expected result", or if the
 * reference function throws/rejects, an "expected error". Next, the test
 * function will be called to obtain an "actual result", or if the test function
 * throws/rejects, an "actual error". Each test case passes if at least one of
 * the following conditions is met:
 *
 * 1) Neither the reference function or the test function throw and the
 * "expected result" equals the "actual result".
 *
 * 2) Both the reference function and the test function throw and the "actual
 * error" message *contains* the "expected error" message.
 *
 * The first test case which does not meet one of these conditions will cause
 * the entire test to fail and this function will throw/reject.
 *
 * @param referenceFuncAsync a reference function implemented in pure
 * JavaScript/TypeScript which accepts N arguments and returns the "expected
 * result" or "expected error" for a given test case.
 * @param testFuncAsync a test function which, e.g., makes a call or sends a
 * transaction to a contract. It accepts the same N arguments returns the
 * "actual result" or "actual error" for a given test case.
 * @param values an array of N arrays. Each inner array is a set of possible
 * values which are passed into both the reference function and the test
 * function.
 * @return A Promise that resolves if the test passes and rejects if the test
 * fails, according to the rules described above.
 */
export async function testCombinatoriallyWithReferenceFuncAsync(
    name: string,
    referenceFuncAsync: (...args: any[]) => Promise<any>,
    testFuncAsync: (...args: any[]) => Promise<any>,
    allValues: any[],
): Promise<void> {
    const testCases = combinatorics.cartesianProduct(...allValues);
    let counter = 0;
    testCases.forEach(async testCase => {
        counter += 1;
        it(`${name} ${counter}/${testCases.length}`, async () => {
            await testWithReferenceFuncAsync(referenceFuncAsync, testFuncAsync, testCase as any);
        });
    });
}
