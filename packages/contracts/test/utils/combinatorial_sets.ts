import { BigNumber } from '@0xproject/utils';
import * as combinatorics from 'js-combinatorics';

import { testWithReferenceFuncAsync } from './test_with_reference';

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
    // Min that does overflow.
    new BigNumber(2).pow(256),
];

export const bytes32Values = [
    // Min
    '0x00000000000000000000000000000000',
    '0x00000000000000000000000000000001',
    '0x00000000000000000000000000000002',
    // Non-trivial big number.
    '0x000000000f0000000000000000000000',
    // Max that does not overflow
    '0xffffffffffffffffffffffffffffffff',
    // Min that overflows
    '0x100000000000000000000000000000000',
];

export async function testCombinatoriallyWithReferenceFuncAsync<P0, P1, R>(
    name: string,
    referenceFunc: (p0: P0, p1: P1) => Promise<R>,
    testFunc: (p0: P0, p1: P1) => Promise<R>,
    values: [P0[], P1[]],
): Promise<void>;
export async function testCombinatoriallyWithReferenceFuncAsync<P0, P1, P2, R>(
    name: string,
    referenceFunc: (p0: P0, p1: P1, p2: P2) => Promise<R>,
    testFunc: (p0: P0, p1: P1, p2: P2) => Promise<R>,
    values: [P0[], P1[], P2[]],
): Promise<void>;
export async function testCombinatoriallyWithReferenceFuncAsync<P0, P1, P2, P3, R>(
    name: string,
    referenceFunc: (p0: P0, p1: P1, p2: P2, p3: P3) => Promise<R>,
    testFunc: (p0: P0, p1: P1, p2: P2, p3: P3) => Promise<R>,
    values: [P0[], P1[], P2[], P3[]],
): Promise<void>;
export async function testCombinatoriallyWithReferenceFuncAsync<P0, P1, P2, P3, P4, R>(
    name: string,
    referenceFunc: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) => Promise<R>,
    testFunc: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) => Promise<R>,
    values: [P0[], P1[], P2[], P3[], P4[]],
): Promise<void>;

export async function testCombinatoriallyWithReferenceFuncAsync(
    name: string,
    referenceFuncAsync: (...args: any[]) => Promise<any>,
    testFuncAsync: (...args: any[]) => Promise<any>,
    values: any[],
): Promise<void> {
    const testCases = combinatorics.cartesianProduct(...values);
    let counter = -1;
    testCases.forEach(async testCase => {
        counter += 1;
        it(`${name} ${counter}/${testCases.length}`, async () => {
            await testWithReferenceFuncAsync(referenceFuncAsync, testFuncAsync, testCase as any);
        });
    });
}
