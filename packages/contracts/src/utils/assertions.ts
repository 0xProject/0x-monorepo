import * as chai from 'chai';
import * as _ from 'lodash';

import { constants } from './constants';

const expect = chai.expect;

function _expectEitherError<T>(p: Promise<T>, error1: string, error2: string): PromiseLike<void> {
    return expect(p)
        .to.be.rejected()
        .then(e => {
            expect(e).to.satisfy(
                (err: Error) => _.includes(err.message, error1) || _.includes(err.message, error2),
                `expected promise to reject with error message that includes "${error1}" or "${error2}", but got: ` +
                    `"${e.message}"\n`,
            );
        });
}

/**
 * Rejects if the given Promise does not reject with an error indicating
 * insufficient funds.
 * @param p the Promise which is expected to reject
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export function expectInsufficientFunds<T>(p: Promise<T>): PromiseLike<void> {
    return _expectEitherError(p, 'insufficient funds', "sender doesn't have enough funds");
}

/**
 * Rejects if the given Promise does not reject with a "revert" error or the
 * given otherError.
 * @param p the Promise which is expected to reject
 * @param otherError the other error which is accepted as a valid reject error.
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export function expectRevertOrOtherError<T>(p: Promise<T>, otherError: string): PromiseLike<void> {
    return _expectEitherError(p, constants.REVERT, otherError);
}

/**
 * Rejects if the given Promise does not reject with a "revert" or "always
 * failing transaction" error.
 * @param p the Promise which is expected to reject
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export function expectRevertOrAlwaysFailingTransaction<T>(p: Promise<T>): PromiseLike<void> {
    return expectRevertOrOtherError(p, 'always failing transaction');
}

/**
 * Rejects if the given Promise does not reject with a "revert" or "Contract
 * call failed" error.
 * @param p the Promise which is expected to reject
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export function expectRevertOrContractCallFailed<T>(p: Promise<T>): PromiseLike<void> {
    return expectRevertOrOtherError<T>(p, 'Contract call failed');
}
