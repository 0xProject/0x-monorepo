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

export function expectInsufficientFunds<T>(p: Promise<T>): PromiseLike<void> {
    return _expectEitherError(p, 'insufficient funds', "sender doesn't have enough funds");
}

export function expectRevertOrOtherError<T>(p: Promise<T>, otherError: string): PromiseLike<void> {
    return _expectEitherError(p, constants.REVERT, otherError);
}

export function expectRevertOrAlwaysFailingTransaction<T>(p: Promise<T>): PromiseLike<void> {
    return expectRevertOrOtherError(p, 'always failing transaction');
}

export function expectRevertOrContractCallFailed<T>(p: Promise<T>): PromiseLike<void> {
    return expectRevertOrOtherError<T>(p, 'Contract call failed');
}
