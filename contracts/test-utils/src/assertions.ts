import { abisToAbiBySelector, decodeCallData } from '@0x/order-utils';
import { RevertReason } from '@0x/types';
import { logUtils, AbiEncoder } from '@0x/utils';
import { NodeType } from '@0x/web3-wrapper';
import * as chai from 'chai';
import {
    MethodAbi,
    TransactionReceipt,
    TransactionReceiptStatus,
    TransactionReceiptWithDecodedLogs,
} from 'ethereum-types';

import * as ethers from 'ethers';
import * as _ from 'lodash';

import { constants } from './constants';
import { web3Wrapper } from './web3_wrapper';

const expect = chai.expect;

let nodeType: NodeType | undefined;

const ERROR_ABIS = _.map(
    constants.ERROR_ABI_STRINGS,
    (errorAbiString: string) => ethers.utils.parseSignature(errorAbiString) as MethodAbi,
);
const errorAbiBySelector = abisToAbiBySelector(ERROR_ABIS);
const solidityRevertSelector = new AbiEncoder.Method(ethers.utils.parseSignature(
    constants.SOLIDITY_REVERT_ABI,
) as MethodAbi).getSelector();
const bytesRevertAbi = ethers.utils.parseSignature(constants.BYTES_REVERT_ABI) as MethodAbi;
/**
 * HACK: By default solidity encodes revert reasons as `Error(string)` we want to throw additional data
 * so we encode that data using an error signature e.g. `function INVALID_ORDER_SIGNATURE(bytes32 orderHash)`.
 * After that we treat those bytes as string and use it instead of a revert reason. When we try to decode that malformed revert reason - we have a selector - ABI mismatch.
 * That's why we need this hack, so that the decoding function uses `bytesRevertAbi` for revert reasons.
 */
errorAbiBySelector[solidityRevertSelector] = bytesRevertAbi;
interface InvalidOrderSignatureError {
    reason: RevertReason.InvalidOrderSignature;
    params: {
        orderHash: string;
    };
}

type SmartContractError = InvalidOrderSignatureError;

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
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
 */
function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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
export async function expectTransactionFailedAsync(p: sendTransactionResult, reason: RevertReason): Promise<void> {
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
            return expect(p).to.be.rejectedWith(
                new RegExp(`^${constants.GANACHE_REVERT_REASON_PREFIX}${escapeRegExp(reason)}$`),
            );
        case NodeType.Geth:
            logUtils.warn(
                'WARNING: Geth does not support revert reasons for sendTransaction. This test will pass if the transaction fails for any reason.',
            );
            return expectTransactionFailedWithoutReasonAsync(p);
        default:
            throw new Error(`Unknown node type: ${nodeType}`);
    }
}

/**
 * Resolves if the the sendTransaction call fails with the given revert reason and decoded revert params.
 * However, since Geth does not support revert reasons for sendTransaction, this
 * falls back to expectTransactionFailedWithoutReasonAsync if the backing
 * Ethereum node is Geth.
 * @param p a Promise resulting from a sendTransaction call
 * @param expectedError Expected revert reason with params
 * @returns a new Promise which will reject if the conditions are not met and
 * otherwise resolve with no value.
 */
export async function expectTransactionFailedWithParamsAsync(
    p: sendTransactionResult,
    expectedError: SmartContractError,
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
            try {
                await p;
            } catch (err) {
                if (_.startsWith(err.message, constants.GANACHE_REVERT_REASON_PREFIX)) {
                    if (err.hashes.length !== 1) {
                        throw new Error('Expected just one transaction hash in Ganache error object');
                    }
                    const txHash = err.hashes[0];
                    const ganacheError = err.results[txHash];
                    const returnData: string = ganacheError.return;
                    const decodedReturnData = decodeCallData(errorAbiBySelector, returnData);
                    const revertReasonHex = decodedReturnData.callParams.encodedRevertReasonWithAssociatedData;
                    const decodedCallData = decodeCallData(errorAbiBySelector, revertReasonHex);
                    const decodedError = {
                        reason: decodedCallData.name,
                        params: decodedCallData.callParams,
                    };
                    expect(expectedError).to.be.deep.equal(decodedError, 'Revert reason mismatch');
                } else {
                    throw new chai.AssertionError(
                        `Expected a transaction to fail with a parametrised error reason, but got ${err}`,
                    );
                }
            }
            break;
        case NodeType.Geth:
            logUtils.warn(
                'WARNING: Geth does not support revert reasons for sendTransaction. This test will pass if the transaction fails for any reason.',
            );
            return expectTransactionFailedWithoutReasonAsync(p);
        default:
            throw new Error(`Unknown node type: ${nodeType}`);
    }
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
export async function expectContractCallFailedAsync<T>(p: Promise<T>, reason: RevertReason): Promise<void> {
    return expect(p).to.be.rejectedWith(reason);
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
