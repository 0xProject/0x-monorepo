import { RevertReason } from '@0xproject/types';
import * as chai from 'chai';
import { TransactionReceipt, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from './constants';
import { web3Wrapper } from './web3_wrapper';

const expect = chai.expect;

function _expectEitherErrorAsync<T>(p: Promise<T>, error1: string, error2: string): PromiseLike<void> {
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
export function expectInsufficientFundsAsync<T>(p: Promise<T>): PromiseLike<void> {
    return _expectEitherErrorAsync(p, 'insufficient funds', "sender doesn't have enough funds");
}

/**
 * Rejects if the given Promise does not reject with a "revert" error or the
 * given otherError.
 * @param p the Promise which is expected to reject
 * @param otherError the other error which is accepted as a valid reject error.
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export function expectRevertOrOtherErrorAsync<T>(p: Promise<T>, otherError: string): PromiseLike<void> {
    return _expectEitherErrorAsync(p, constants.REVERT, otherError);
}

/**
 * Rejects if the given Promise does not reject with a "revert" or "always
 * failing transaction" error.
 * @param p the Promise which is expected to reject
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export function expectRevertOrAlwaysFailingTransactionAsync<T>(p: Promise<T>): PromiseLike<void> {
    return expectRevertOrOtherErrorAsync(p, 'always failing transaction');
}

/**
 * Rejects if at least one the following conditions is not met:
 * 1) The given Promise rejects with the given revert reason.
 * 2) The given Promise rejects with an error containing "always failing transaction"
 * 3) The given Promise fulfills with a txReceipt that has a status of 0 or '0', indicating the transaction failed.
 * 4) The given Promise fulfills with a txHash and corresponding txReceipt has a status of 0 or '0'.
 * @param p the Promise which is expected to reject
 * @param reason a specific revert reason
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export async function expectRevertReasonOrAlwaysFailingTransactionAsync(
    p: Promise<string | TransactionReceiptWithDecodedLogs | TransactionReceipt>,
    reason: RevertReason,
): Promise<void> {
    return p
        .then(async result => {
            let txReceiptStatus: string | 0 | 1 | null;
            if (typeof result === 'string') {
                // Result is a txHash. We need to make a web3 call to get the receipt.
                const txReceipt = await web3Wrapper.getTransactionReceiptAsync(result);
                txReceiptStatus = txReceipt.status;
            } else if ('status' in result) {
                // Result is a TransactionReceiptWithDecodedLogs or TransactionReceipt
                // and status is a field of result.
                txReceiptStatus = result.status;
            } else {
                throw new Error('Unexpected result type');
            }
            expect(_.toString(txReceiptStatus)).to.equal(
                '0',
                'transactionReceipt had a non-zero status, indicating success',
            );
        })
        .catch(err => {
            expect(err.message).to.satisfy(
                (msg: string) => _.includes(msg, reason) || _.includes(msg, 'always failing transaction'),
                `Expected ${reason} or 'always failing transaction' but error message was ${err.message}`,
            );
        });
}

/**
 * Rejects if the given Promise does not reject with a "revert" or "Contract
 * call failed" error.
 * @param p the Promise which is expected to reject
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export function expectRevertOrContractCallFailedAsync<T>(p: Promise<T>): PromiseLike<void> {
    return expectRevertOrOtherErrorAsync<T>(p, 'Contract call failed');
}
