import { StandardError, RichRevertReason } from '@0x/order-utils';
import { RevertReason } from '@0x/types';
import { logUtils } from '@0x/utils';
import { NodeType } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { TransactionReceipt, TransactionReceiptStatus, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { web3Wrapper } from './web3_wrapper';

const expect = chai.expect;

let nodeType: NodeType | undefined;

// Represents the return value of a `sendTransaction` call. The Promise should
// resolve with either a transaction receipt or a transaction hash.
export type sendTransactionResult = Promise<TransactionReceipt | TransactionReceiptWithDecodedLogs | string>;

/**
 * Returns ganacheError if the backing Ethereum node is Ganache and gethError
 * if it is Geth.
 * @param ganacheError the error to be returned if the backing node is Ganache.
 * @param gethError the error to be returned if the backing node is Geth.
 * @returns either the given ganacheError or gethError depending on the backing
 * node.
 */
async function _getGanacheOrGethErrorAsync(ganacheError: string, gethError: string): Promise<string> {
    if (_.isUndefined(nodeType)) {
        nodeType = await web3Wrapper.getNodeTypeAsync();
    }
    switch (nodeType) {
        case NodeType.Ganache:
            return ganacheError;
        case NodeType.Geth:
            return gethError;
        default:
            throw new Error(`Unknown node type: ${nodeType}`);
    }
}

async function _getInsufficientFundsErrorMessageAsync(): Promise<string> {
    return _getGanacheOrGethErrorAsync("sender doesn't have enough funds", 'insufficient funds');
}

async function _getTransactionFailedErrorMessageAsync(): Promise<string> {
    return _getGanacheOrGethErrorAsync('revert', 'always failing transaction');
}

async function _getContractCallFailedErrorMessageAsync(): Promise<string> {
    return _getGanacheOrGethErrorAsync('revert', 'Contract call failed');
}

/**
 * Returns the expected error message for an 'invalid opcode' resulting from a
 * contract call. The exact error message depends on the backing Ethereum node.
 */
export async function getInvalidOpcodeErrorMessageForCallAsync(): Promise<string> {
    return _getGanacheOrGethErrorAsync('invalid opcode', 'Contract call failed');
}

/**
 * Returns the expected error message for the given revert reason resulting from
 * a sendTransaction call. The exact error message depends on the backing
 * Ethereum node and whether it supports revert reasons.
 * @param reason a specific revert reason.
 * @returns the expected error message.
 */
export async function getRevertReasonOrErrorMessageForSendTransactionAsync(reason: RevertReason): Promise<string> {
    return _getGanacheOrGethErrorAsync(reason, 'always failing transaction');
}

/**
 * Rejects if the given Promise does not reject with an error indicating
 * insufficient funds.
 * @param p a promise resulting from a contract call or sendTransaction call.
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export async function expectInsufficientFundsAsync<T>(p: Promise<T>): Promise<void> {
    const errMessage = await _getInsufficientFundsErrorMessageAsync();
    return expect(p).to.be.rejectedWith(errMessage);
}

/**
 * Resolves if the the sendTransaction call fails with the given revert reason.
 * However, since Geth does not support revert reasons for sendTransaction, this
 * falls back to expectTransactionFailedWithoutReasonAsync if the backing
 * Ethereum node is Geth.
 * @param p a Promise resulting from a sendTransaction call
 * @param reason a specific revert reason
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export async function expectTransactionFailedAsync(
    p: sendTransactionResult,
    reason: RevertReason | RichRevertReason,
): Promise<void> {
    // HACK(albrow): This dummy `catch` should not be necessary, but if you
    // remove it, there is an uncaught exception and the Node process will
    // forcibly exit. It's possible this is a false positive in
    // make-promises-safe.
    p.catch(e => {
        _.noop(e);
    });

    if (_.isUndefined(nodeType)) {
        nodeType = await web3Wrapper.getNodeTypeAsync();
    }
    switch (nodeType) {
        case NodeType.Ganache:
            // Handle rich reverts.
            if (reason instanceof RichRevertReason) {
                return _expectTransactionRichRevertAsync(p, reason);
            } else {
                return expect(p).to.be.rejectedWith(reason);
            }
        case NodeType.Geth:
            logUtils.warn(
                'WARNING: Geth does not support revert reasons for sendTransaction. This test will pass if the transaction fails for any reason.',
            );
            return expectTransactionFailedWithoutReasonAsync(p);
        default:
            throw new Error(`Unknown node type: ${nodeType}`);
    }
}

async function _expectTransactionRichRevertAsync(p: sendTransactionResult, reason: RichRevertReason): Promise<void> {
    try {
        await p;
    } catch (err) {
        const info = err.results[_.keys(err.results)[0]];
        if (info.error === 'revert' && info.return) {
            return _assertReasonsAreEqual(reason, RichRevertReason.decode(info.return));
        }
    }
    throw new Error(`Expected rich revert ${reason}`);
}

function _assertReasonsAreEqual(a: RichRevertReason, b: RichRevertReason): void {
    if (a.equals(b)) {
        return;
    }
    throw new Error(`Expected rich revert ${a}, but instead got ${b}`);
}

/**
 * Resolves if the transaction fails without a revert reason, or if the
 * corresponding transactionReceipt has a status of 0 or '0', indicating
 * failure.
 * @param p a Promise resulting from a sendTransaction call
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export async function expectTransactionFailedWithoutReasonAsync(p: sendTransactionResult): Promise<void> {
    return p
        .then(async result => {
            let txReceiptStatus: TransactionReceiptStatus;
            if (_.isString(result)) {
                // Result is a txHash. We need to make a web3 call to get the
                // receipt, then get the status from the receipt.
                const txReceipt = await web3Wrapper.awaitTransactionMinedAsync(result);
                txReceiptStatus = txReceipt.status;
            } else if ('status' in result) {
                // Result is a transaction receipt, so we can get the status
                // directly.
                txReceiptStatus = result.status;
            } else {
                throw new Error(`Unexpected result type: ${typeof result}`);
            }
            expect(_.toString(txReceiptStatus)).to.equal(
                '0',
                'Expected transaction to fail but receipt had a non-zero status, indicating success',
            );
        })
        .catch(async err => {
            // If the promise rejects, we expect a specific error message,
            // depending on the backing Ethereum node type.
            const errMessage = await _getTransactionFailedErrorMessageAsync();
            expect(err.message).to.include(errMessage);
        });
}

/**
 * Resolves if the the contract call fails with the given revert reason.
 * @param p a Promise resulting from a contract call
 * @param reason a specific revert reason
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export async function expectContractCallFailedAsync<T>(
    p: Promise<T>,
    reason: RevertReason | RichRevertReason,
): Promise<void> {
    if (reason instanceof RichRevertReason) {
        return _expectContractCallRichRevertAsync<T>(p, reason);
    }
    return expect(p).to.be.rejectedWith(reason);
}

/**
 * A hacky way of expecting a rich revert reason to resolve.
 * This is because geth does not signal when a revert happens during an
 * eth_call so we're left to guess whether the returned data is an encoded
 * rich revert reason.
 * @param p A Promise resulting from a contract call.
 * @param reason a rich revert reason
 * @returns a promise which will reject `p` does not resolve to a rich revert reason.
 */
async function _expectContractCallRichRevertAsync<T>(
        p: Promise<T>,
        reason: RichRevertReason): Promise<void> {

    let decoded: RichRevertReason | undefined;
    try {
        // Geth will not give any indication that a revert happened.
        // It will return data as if it had succeeded, but
        // the return data will be the abi encoded bytes of the revert data.
        decoded = _tryToDecodeRichRevertReason(await p);
    } catch (err) {
        if (err.returnData) {
            // We get here on geth if the contract wrapper fails to ABI decode the
            // return data, which is a clue that it might be a rich revert reason.
            decoded = _tryToDecodeRichRevertReason(err.returnData);
        } else if (!err.results) {
            // The contract wrapper caught a standard Error(string) revert reason
            // so just wrap it in a StandardError.
            decoded = new StandardError(err.message);
        } else if (err.results) {
            // Ganache threw a revert error.
            const info = err.results[_.keys(err.results)[0]];
            if (info.error === 'revert' && info.return) {
                decoded = _tryToDecodeRichRevertReason(info.return);
            }
        }
    }
    if (decoded) {
        return _assertReasonsAreEqual(reason, decoded);
    }
    throw new Error(`Expected rich revert ${reason}`);
}

/*
 * Try to guess if the data returned by a call is a rich revert reason.
 * Returns an instance if it is, undefined if it isn't.
 * @param data Any data returned by a contract call.
 */
function _tryToDecodeRichRevertReason(data: any): RichRevertReason | undefined {
    // Here we try to guess if the return data is a rich revert.
    if (typeof data === 'string' && data.startsWith('0x')) {
        // Ensure its size is a multiple of 32 bytes + 4 byte selector.
        const payloadLength = data.length - 2;
        if (payloadLength >= 4 * 2 && (payloadLength - 4 * 2) % (32 * 2) === 0) {
            try {
                return RichRevertReason.decode(data);
            } catch (err) {
                // Unable to decode. Just fall through.
            }
        }
    }
    return undefined;
}

/**
 * Resolves if the contract call fails without a revert reason.
 * @param p a Promise resulting from a contract call
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export async function expectContractCallFailedWithoutReasonAsync<T>(p: Promise<T>): Promise<void> {
    const errMessage = await _getContractCallFailedErrorMessageAsync();
    return expect(p).to.be.rejectedWith(errMessage);
}

/**
 * Resolves if the contract creation/deployment fails without a revert reason.
 * @param p a Promise resulting from a contract creation/deployment
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export async function expectContractCreationFailedAsync<T>(
    p: sendTransactionResult,
    reason: RevertReason,
): Promise<void> {
    return expectTransactionFailedAsync(p, reason);
}

/**
 * Resolves if the contract creation/deployment fails without a revert reason.
 * @param p a Promise resulting from a contract creation/deployment
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export async function expectContractCreationFailedWithoutReasonAsync<T>(p: Promise<T>): Promise<void> {
    const errMessage = await _getTransactionFailedErrorMessageAsync();
    return expect(p).to.be.rejectedWith(errMessage);
}
