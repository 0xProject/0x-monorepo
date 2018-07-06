import * as chai from 'chai';
import * as _ from 'lodash';

import { chaiSetup } from './chai_setup';

chaiSetup.configure();
const expect = chai.expect;

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

export async function testWithReferenceFuncAsync(
    referenceFunc: (...args: any[]) => Promise<any>,
    testFuncAsync: (...args: any[]) => Promise<any>,
    values: any[],
): Promise<void> {
    const testCaseString = JSON.stringify(values);
    let expectedResult: any;
    let expectedErr: string | undefined;
    try {
        expectedResult = await referenceFunc(...values);
    } catch (e) {
        expectedErr = e.message;
    }
    try {
        const actualResult = await testFuncAsync(...values);
        if (!_.isUndefined(expectedErr)) {
            throw new Error(`Expected error containing ${expectedErr} but got no error`);
        }
        expect(JSON.stringify(actualResult)).to.equal(JSON.stringify(expectedResult));
    } catch (e) {
        if (_.isUndefined(expectedErr)) {
            throw new Error(`Unexpected error:  ${e.message}\n\tTest case: ${testCaseString}`);
        } else {
            expect(e.message).to.contain(expectedErr, `${e.message}\n\tTest case: ${testCaseString}`);
        }
    }
}
