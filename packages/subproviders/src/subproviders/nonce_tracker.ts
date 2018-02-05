import * as _ from 'lodash';

import EthereumTx = require('ethereumjs-tx');
import ethUtil = require('ethereumjs-util');
import providerEngineUtils = require('web3-provider-engine/util/rpc-cache-utils');

import {
    BlockParamLiteral,
    ErrorCallback,
    JSONRPCPayload,
    NonceSubproviderErrors,
    OptionalNextCallback,
} from '../types';

import { Subprovider } from './subprovider';

const NONCE_TOO_LOW_ERROR_MESSAGE = 'Transaction nonce is too low';
export class NonceTrackerSubprovider extends Subprovider {
    private _nonceCache: { [address: string]: string } = {};
    private static _reconstructTransaction(payload: JSONRPCPayload): EthereumTx {
        const raw = payload.params[0];
        if (_.isUndefined(raw)) {
            throw new Error(NonceSubproviderErrors.EmptyParametersFound);
        }
        const rawData = ethUtil.toBuffer(raw);
        const transaction = new EthereumTx(rawData);
        return transaction;
    }
    private static _determineAddress(payload: JSONRPCPayload): string {
        let address: string;
        switch (payload.method) {
            case 'eth_getTransactionCount':
                address = payload.params[0].toLowerCase();
                return address;
            case 'eth_sendRawTransaction':
                const transaction = NonceTrackerSubprovider._reconstructTransaction(payload);
                address = `0x${transaction.getSenderAddress().toString('hex')}`.toLowerCase();
                return address;
            default:
                throw new Error(NonceSubproviderErrors.CannotDetermineAddressFromPayload);
        }
    }
    // Required to implement this public interface which doesn't conform to our linting rule.
    // tslint:disable-next-line:async-suffix
    public async handleRequest(payload: JSONRPCPayload, next: OptionalNextCallback, end: ErrorCallback): Promise<void> {
        switch (payload.method) {
            case 'eth_getTransactionCount':
                const requestDefaultBlock = providerEngineUtils.blockTagForPayload(payload);
                if (requestDefaultBlock === BlockParamLiteral.Pending) {
                    const address = NonceTrackerSubprovider._determineAddress(payload);
                    const cachedResult = this._nonceCache[address];
                    if (!_.isUndefined(cachedResult)) {
                        return end(null, cachedResult);
                    } else {
                        return next((requestError: Error | null, requestResult: any, cb: any) => {
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
                return next((sendTransactionError: Error | null, txResult: any, cb: any) => {
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
    private _handleSuccessfulTransaction(payload: JSONRPCPayload): void {
        const address = NonceTrackerSubprovider._determineAddress(payload);
        const transaction = NonceTrackerSubprovider._reconstructTransaction(payload);
        // Increment the nonce from the previous successfully submitted transaction
        let nonce = ethUtil.bufferToInt(transaction.nonce);
        nonce++;
        let nextHexNonce = nonce.toString(16);
        if (nextHexNonce.length % 2) {
            nextHexNonce = `0${nextHexNonce}`;
        }
        nextHexNonce = `0x${nextHexNonce}`;
        this._nonceCache[address] = nextHexNonce;
    }
    private _handleSendTransactionError(payload: JSONRPCPayload, err: Error): void {
        const address = NonceTrackerSubprovider._determineAddress(payload);
        if (this._nonceCache[address] && _.includes(err.message, NONCE_TOO_LOW_ERROR_MESSAGE)) {
            delete this._nonceCache[address];
        }
    }
}
