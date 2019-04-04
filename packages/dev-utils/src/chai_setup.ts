import { RevertError, StringRevertError } from '@0x/utils';
import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');
import ChaiBigNumber = require('chai-bignumber');
import * as dirtyChai from 'dirty-chai';

export const chaiSetup = {
    configure(): void {
        chai.config.includeStack = true;
        // Order matters.
        chai.use(ChaiBigNumber());
        chai.use(chaiAsPromised);
        chai.use(revertErrorHelper);
        chai.use(dirtyChai);
    },
};

// tslint:disable: only-arrow-functions prefer-conditional-expression

type ChaiPromiseHandler = (x: any, ...rest: any[]) => Promise<void>;
type ChaiAssertHandler = (x: any, ...rest: any[]) => void;

interface Chai {
    Assertion: ChaiAssertionType;
}

interface ChaiAssertionInstance {
    assert: ChaiAssert;
    _obj: any;
    __flags: any;
}

interface ChaiAssertionType {
    overwriteMethod: (name: string, _super: (expected: any) => any) => void;
    new (): ChaiAssertionInstance;
}

type ChaiAssert = (
    condition: boolean,
    failMessage?: string,
    negatedFailMessage?: string,
    expected?: any,
    actual?: any,
) => void;

function revertErrorHelper(_chai: Chai): void {
    const proto = _chai.Assertion;
    proto.overwriteMethod('revertWith', function(_super: ChaiPromiseHandler): ChaiPromiseHandler {
        return async function(this: ChaiAssertionInstance, expected: any, ...rest: any[]): Promise<void> {
            const maybePromise = this._obj;
            // Make sure we're working with a promise.
            chaiAssert(_chai, maybePromise instanceof Promise, `Expected ${maybePromise} to be a promise`);
            // Wait for the promise to reject.
            let resolveValue;
            let rejectValue: any;
            let didReject = false;
            try {
                resolveValue = await maybePromise;
            } catch (err) {
                rejectValue = err;
                didReject = true;
            }
            if (!didReject) {
                chaiFail(_chai, `Expected promise to reject but instead resolved with: ${resolveValue}`);
            }
            if (!compareRevertErrors.call(this, _chai, rejectValue, expected)) {
                // Wasn't handled by the comparison function so call the previous handler.
                _super.call(this, expected, ...rest);
            }
        };
    });
    proto.overwriteMethod('become', function(_super: ChaiPromiseHandler): ChaiPromiseHandler {
        return async function(this: ChaiAssertionInstance, expected: any, ...rest: any[]): Promise<void> {
            const maybePromise = this._obj;
            // Make sure we're working with a promise.
            chaiAssert(_chai, maybePromise instanceof Promise, `Expected ${maybePromise} to be a promise`);
            // Wait for the promise to resolve.
            if (!compareRevertErrors.call(this, _chai, await maybePromise, expected)) {
                // Wasn't handled by the comparison function so call the previous handler.
                _super.call(this, expected, ...rest);
            }
        };
    });
    proto.overwriteMethod('equal', function(_super: ChaiAssertHandler): ChaiAssertHandler {
        return function(this: ChaiAssertionInstance, expected: any, ...rest: any[]): void {
            if (!compareRevertErrors.call(this, _chai, this._obj, expected)) {
                // Wasn't handled by the comparison function so call the previous handler.
                _super.call(this, expected, ...rest);
            }
        };
    });
}

/**
 * Compare two values as compatible RevertError types.
 * @return `true` if the comparison was fully evaluated. `false` indicates that
 *         it should be deferred to another handler.
 */
function compareRevertErrors(this: ChaiAssertionInstance, _chai: Chai, _actual: any, _expected: any): boolean {
    let actual = _actual;
    let expected = _expected;
    // If either subject is a RevertError, try to coerce the other into the same.
    // Some of this is for convenience, some is for backwards-compatibility.
    // TODO: Remove coercion of `actual` when all contracts and tests are upgraded
    // to explicitly use RevertErrors.
    if (expected instanceof RevertError || actual instanceof RevertError) {
        // `actual` can be a RevertError, string, or an Error type.
        if (!(actual instanceof RevertError)) {
            if (typeof actual === 'string') {
                actual = new StringRevertError(actual);
            } else if (actual instanceof Error) {
                // `BaseContract` will throw a plain `Error` type for `StringRevertErrors`
                // for backwards compatibility. So coerce it into a StringRevertError.
                actual = new StringRevertError(actual.message);
            } else {
                chaiAssert(_chai, false, `Result is not of type RevertError: ${actual}`);
            }
        }
        // `expected` can be a RevertError or string.
        if (typeof expected === 'string') {
            expected = new StringRevertError(expected);
        }
    }
    if (expected instanceof RevertError && actual instanceof RevertError) {
        // Check for equality.
        this.assert(
            actual.equals(expected),
            `${actual.toString()} != ${expected.toString()}`,
            `${actual.toString()} == ${expected.toString()}`,
            expected,
            actual,
        );
        // Return true to signal we handled it.
        return true;
    }
    return false;
}

function chaiAssert(_chai: Chai, condition: boolean, failMessage?: string, expected?: any, actual?: any): void {
    const assert = new _chai.Assertion();
    assert.assert(condition, failMessage, undefined, expected, actual);
}

function chaiFail(_chai: Chai, failMessage?: string, expected?: any, actual?: any): void {
    const assert = new _chai.Assertion();
    assert.assert(false, failMessage, undefined, expected, actual);
}
