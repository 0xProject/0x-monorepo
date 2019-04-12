import { AnyRevertError, RevertError, StringRevertError } from '@0x/utils';

// tslint:disable only-arrow-functions prefer-conditional-expression

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

interface GanacheTransactionRevertResult {
    error: 'revert';
    program_counter: number;
    return?: string;
    reason?: string;
}

interface GanacheTransactionRevertError extends Error {
    results: { [hash: string]: GanacheTransactionRevertResult };
    hashes: string[];
}

export function revertErrorHelper(_chai: Chai): void {
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
            if (!compareRevertErrors.call(this, _chai, rejectValue, expected, true)) {
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
function compareRevertErrors(
    this: ChaiAssertionInstance,
    _chai: Chai,
    _actual: any,
    _expected: any,
    force?: boolean,
): boolean {
    let actual = _actual;
    let expected = _expected;
    // If either subject is a RevertError, or the `force` is `true`,
    // try to coerce the subjects into a RevertError.
    // Some of this is for convenience, some is for backwards-compatibility.
    if (force || expected instanceof RevertError || actual instanceof RevertError) {
        // `actual` can be a RevertError, string, or an Error type.
        if (!(actual instanceof RevertError)) {
            if (typeof actual === 'string') {
                actual = new StringRevertError(actual);
            } else if (actual instanceof Error) {
                actual = coerceErrorToRevertError(actual);
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
            expected.equals(actual),
            `${actual.toString()} != ${expected.toString()}`,
            `${actual.toString()} == ${expected.toString()}`,
            expected.toString(),
            actual.toString(),
        );
        // Return true to signal we handled it.
        return true;
    }
    return false;
}

const GANACHE_TRANSACTION_REVERT_ERROR_MESSAGE = /^VM Exception while processing transaction: revert/;
const GETH_TRANSACTION_REVERT_ERROR_MESSAGE = /always failing transaction$/;

function coerceErrorToRevertError(error: Error | GanacheTransactionRevertError): RevertError {
    // Handle ganache transaction reverts.
    if (isGanacheTransactionRevertError(error)) {
        // Grab the first result attached.
        const result = error.results[error.hashes[0]];
        // If a reason is provided, just wrap it in a StringRevertError
        if (result.reason !== undefined) {
            return new StringRevertError(result.reason);
        }
        // If there is return data, try to decode it.
        if (result.return !== undefined && result.return !== '0x') {
            return RevertError.decode(result.return);
        }
        // Otherwise, return an AnyRevertError type.
        return new AnyRevertError();
    }

    // Handle geth transaction reverts.
    if (isGethTransactionRevertError(error)) {
        // Geth transaction reverts are opaque, meaning no useful data is returned,
        // so we just return an AnyRevertError type.
        return new AnyRevertError();
    }

    // Handle call reverts.
    // `BaseContract` will throw a plain `Error` type for `StringRevertErrors`
    // in callAsync functions for backwards compatibility, and a proper RevertError
    // for all others.
    if (error instanceof RevertError) {
        return error;
    }
    // Coerce plain errors into a StringRevertError.
    return new StringRevertError(error.message);
}

function isGanacheTransactionRevertError(
    error: Error | GanacheTransactionRevertError,
): error is GanacheTransactionRevertError {
    if (GANACHE_TRANSACTION_REVERT_ERROR_MESSAGE.test(error.message) && 'hashes' in error && 'results' in error) {
        return true;
    }
    return false;
}

function isGethTransactionRevertError(error: Error | GanacheTransactionRevertError): boolean {
    return GETH_TRANSACTION_REVERT_ERROR_MESSAGE.test(error.message);
}

function chaiAssert(_chai: Chai, condition: boolean, failMessage?: string, expected?: any, actual?: any): void {
    const assert = new _chai.Assertion();
    assert.assert(condition, failMessage, undefined, expected, actual);
}

function chaiFail(_chai: Chai, failMessage?: string, expected?: any, actual?: any): void {
    const assert = new _chai.Assertion();
    assert.assert(false, failMessage, undefined, expected, actual);
}
