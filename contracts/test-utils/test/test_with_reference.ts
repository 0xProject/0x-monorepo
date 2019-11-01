import { AnyRevertError, StringRevertError } from '@0x/utils';

import { expect } from '../src';
import { testWithReferenceFuncAsync } from '../src/test_with_reference';

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

// returns an async function which always throws/rejects with the given error.
function alwaysFailFunc(error: Error): (x: number, y: number) => Promise<number> {
    return async (x: number, y: number) => {
        throw error;
    };
}

describe('testWithReferenceFuncAsync', () => {
    it('passes when both succeed and actual == expected', async () => {
        return testWithReferenceFuncAsync(alwaysValueFunc(0.5), divAsync, [1, 2]);
    });

    it('fails when both succeed and actual != expected', async () => {
        return expect(testWithReferenceFuncAsync(alwaysValueFunc(3), divAsync, [1, 2])).to.be.rejectedWith(
            '{"x":1,"y":2}: expected 0.5 to deeply equal 3',
        );
    });

    it('passes when both fail and error messages are the same', async () => {
        const err = new Error('whoopsie');
        return testWithReferenceFuncAsync(alwaysFailFunc(err), alwaysFailFunc(err), [1, 1]);
    });

    it('fails when both fail and error messages are not identical', async () => {
        const errorMessage = 'whoopsie';
        const notErrorMessage = 'not whoopsie';
        const error = new Error(errorMessage);
        const notError = new Error(notErrorMessage);
        return expect(
            testWithReferenceFuncAsync(alwaysFailFunc(notError), alwaysFailFunc(error), [1, 2]),
        ).to.be.rejectedWith(`{"x":1,"y":2}: expected error message '${errorMessage}' to equal '${notErrorMessage}'`);
    });

    it('passes when both fail with compatible RevertErrors', async () => {
        const error1 = new StringRevertError('whoopsie');
        const error2 = new AnyRevertError();
        return testWithReferenceFuncAsync(alwaysFailFunc(error1), alwaysFailFunc(error2), [1, 1]);
    });

    it('fails when both fail with incompatible RevertErrors', async () => {
        const error1 = new StringRevertError('whoopsie');
        const error2 = new StringRevertError('not whoopsie');
        return expect(
            testWithReferenceFuncAsync(alwaysFailFunc(error1), alwaysFailFunc(error2), [1, 1]),
        ).to.be.rejectedWith(
            `{"x":1,"y":1}: expected error StringRevertError({ message: 'not whoopsie' }) to equal StringRevertError({ message: 'whoopsie' })`,
        );
    });

    it('fails when reference function fails with a RevertError but test function fails with a regular Error', async () => {
        const error1 = new StringRevertError('whoopsie');
        const error2 = new Error('whoopsie');
        return expect(
            testWithReferenceFuncAsync(alwaysFailFunc(error1), alwaysFailFunc(error2), [1, 1]),
        ).to.be.rejectedWith(`{"x":1,"y":1}: expected a RevertError but received an Error`);
    });

    it('fails when referenceFunc succeeds and testFunc fails', async () => {
        const error = new Error('whoopsie');
        return expect(testWithReferenceFuncAsync(alwaysValueFunc(0), alwaysFailFunc(error), [1, 2])).to.be.rejectedWith(
            `{"x":1,"y":2}: expected success but instead failed`,
        );
    });

    it('fails when referenceFunc fails and testFunc succeeds', async () => {
        const error = new Error('whoopsie');
        return expect(testWithReferenceFuncAsync(alwaysFailFunc(error), divAsync, [1, 2])).to.be.rejectedWith(
            '{"x":1,"y":2}: expected failure but instead succeeded',
        );
    });
});
