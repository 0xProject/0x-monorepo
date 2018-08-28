import * as chai from 'chai';

import { chaiSetup } from '../utils/chai_setup';
import { testWithReferenceFuncAsync } from '../utils/test_with_reference';

chaiSetup.configure();
const expect = chai.expect;

async function divAsync(x: number, y: number): Promise<number> {
    if (y === 0) {
        throw new Error('MathError: divide by zero');
    }
    return x / y;
}

// returns an async function that always returns the given value.
function alwaysValueFunc(value: number): (x: number, y: number) => Promise<number> {
    return async (x: number, y: number) => value;
}

// returns an async function which always throws/rejects with the given error
// message.
function alwaysFailFunc(errMessage: string): (x: number, y: number) => Promise<number> {
    return async (x: number, y: number) => {
        throw new Error(errMessage);
    };
}

describe('testWithReferenceFuncAsync', () => {
    it('passes when both succeed and actual === expected', async () => {
        await testWithReferenceFuncAsync(alwaysValueFunc(0.5), divAsync, [1, 2]);
    });

    it('passes when both fail and actual error contains expected error', async () => {
        await testWithReferenceFuncAsync(alwaysFailFunc('divide by zero'), divAsync, [1, 0]);
    });

    it('fails when both succeed and actual !== expected', async () => {
        expect(testWithReferenceFuncAsync(alwaysValueFunc(3), divAsync, [1, 2])).to.be.rejectedWith(
            'Test case {"x":1,"y":2}: expected { value: 0.5 } to deeply equal { value: 3 }',
        );
    });

    it('fails when both fail and actual error does not contain expected error', async () => {
        expect(
            testWithReferenceFuncAsync(alwaysFailFunc('Unexpected math error'), divAsync, [1, 0]),
        ).to.be.rejectedWith(
            'MathError: divide by zero\n\tTest case: {"x":1,"y":0}: expected \'MathError: divide by zero\' to include \'Unexpected math error\'',
        );
    });

    it('fails when referenceFunc succeeds and testFunc fails', async () => {
        expect(testWithReferenceFuncAsync(alwaysValueFunc(0), divAsync, [1, 0])).to.be.rejectedWith(
            'Test case {"x":1,"y":0}: expected { error: \'MathError: divide by zero\' } to deeply equal { value: 0 }',
        );
    });

    it('fails when referenceFunc fails and testFunc succeeds', async () => {
        expect(testWithReferenceFuncAsync(alwaysFailFunc('divide by zero'), divAsync, [1, 2])).to.be.rejectedWith(
            'Expected error containing divide by zero but got no error\n\tTest case: {"x":1,"y":2}',
        );
    });
});
