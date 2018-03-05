import * as _ from 'lodash';

import { BlockParamLiteral } from '@0xproject/types';
import EthereumTx = require('ethereumjs-tx');
import ethUtil = require('ethereumjs-util');
import * as Web3 from 'web3';
import providerEngineUtils = require('web3-provider-engine/util/rpc-cache-utils');

import { Callback, ErrorCallback, NextCallback, NonceSubproviderErrors } from '../types';

import { Subprovider } from './subprovider';

// We do not export this since this is not our error, and we do not throw this error
const NONCE_TOO_LOW_ERROR_MESSAGE = 'Transaction nonce is too low';
/*
    This class is heavily inspiried by the Web3ProviderEngine NonceSubprovider
    We have added the additional feature of clearing any nonce balues when an error message
    describes a nonce value being too low.
*/
export class NonceTrackerSubprovider extends Subprovider {
    private _nonceCache: { [address: string]: string } = {};
    private static _reconstructTransaction(payload: Web3.JSONRPCRequestPayload): EthereumTx {
        const raw = payload.params[0];
        if (_.isUndefined(raw)) {
            throw new Error(NonceSubproviderErrors.EmptyParametersFound);
        }
        const rawData = ethUtil.toBuffer(raw);
        const transaction = new EthereumTx(rawData);
        return transaction;
    }
    private static _determineAddress(payload: Web3.JSONRPCRequestPayload): string {
        let address: string;
        switch (payload.method) {
            case 'eth_getTransactionCount':
                address = payload.params[0].toLowerCase();
                return address;
            case 'eth_sendRawTransaction':
                const transaction = NonceTrackerSubprovider._reconstructTransaction(payload);
                const addressRaw = transaction
                    .getSenderAddress()
                    .toString('hex')
                    .toLowerCase();
                address = `0x${addressRaw}`;
                return address;
            default:
                throw new Error(NonceSubproviderErrors.CannotDetermineAddressFromPayload);
        }
    }
    // Required to implement this public interface which doesn't conform to our linting rule.
    // tslint:disable-next-line:async-suffix
    public async handleRequest(
        payload: Web3.JSONRPCRequestPayload,
        next: NextCallback,
        end: ErrorCallback,
    ): Promise<void> {
        switch (payload.method) {
            case 'eth_getTransactionCount':
                const requestDefaultBlock = providerEngineUtils.blockTagForPayload(payload);
                if (requestDefaultBlock === BlockParamLiteral.Pending) {
                    const address = NonceTrackerSubprovider._determineAddress(payload);
                    const cachedResult = this._nonceCache[address];
                    if (!_.isUndefined(cachedResult)) {
                        return end(null, cachedResult);
                    } else {
                        return next((requestError: Error | null, requestResult: any, cb: Callback) => {
                            if (_.isNull(requestError)) {
                                this._nonceCache[address] = requestResult as string;
                            }
                            cb();
                        });
                    }
                } else {
                    return next();
                }
            case 'eth_sendRawTransaction':
                return next((sendTransactionError: Error | null, txResult: any, cb: Callback) => {
                    if (_.isNull(sendTransactionError)) {
                        this._handleSuccessfulTransaction(payload);
                    } else {
                        this._handleSendTransactionError(payload, sendTransactionError);
                    }
                    cb();
                });
            default:
                return next();
        }
    }
    private _handleSuccessfulTransaction(payload: Web3.JSONRPCRequestPayload): void {
        const address = NonceTrackerSubprovider._determineAddress(payload);
        const transaction = NonceTrackerSubprovider._reconstructTransaction(payload);
        // Increment the nonce from the previous successfully submitted transaction
        let nonce = ethUtil.bufferToInt(transaction.nonce);
        nonce++;
        let nextHexNonce = nonce.toString(16);
        if (nextHexNonce.length % 2) {
            nextHexNonce = `0${nextHexNonce}`;
        }
        const nextPrefixedHexNonce = `0x${nextHexNonce}`;
        this._nonceCache[address] = nextPrefixedHexNonce;
    }
    private _handleSendTransactionError(payload: Web3.JSONRPCRequestPayload, err: Error): void {
        const address = NonceTrackerSubprovider._determineAddress(payload);
        if (this._nonceCache[address] && _.includes(err.message, NONCE_TOO_LOW_ERROR_MESSAGE)) {
            delete this._nonceCache[address];
        }
    }
}
