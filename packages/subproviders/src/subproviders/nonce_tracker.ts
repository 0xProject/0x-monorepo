import * as _ from 'lodash';

import EthereumTx = require('ethereumjs-tx');
import ethUtil = require('ethereumjs-util');
import providerEngineUtils = require('web3-provider-engine/util/rpc-cache-utils');

import { JSONRPCPayload } from '../types';

import { Subprovider } from './subprovider';

const NONCE_TOO_LOW_ERROR_MESSAGE = 'Transaction nonce is too low';

export class NonceTrackerSubprovider extends Subprovider {
    private _nonceCache: { [address: string]: string } = {};
    private static _reconstructTransaction(payload: JSONRPCPayload): EthereumTx {
        const raw = payload.params[0];
        const transactionData = ethUtil.stripHexPrefix(raw);
        const rawData = new Buffer(transactionData, 'hex');
        return new EthereumTx(rawData);
    }
    private static _determineAddress(payload: JSONRPCPayload): string {
        switch (payload.method) {
            case 'eth_getTransactionCount':
                return payload.params[0].toLowerCase();
            case 'eth_sendRawTransaction':
                const transaction = NonceTrackerSubprovider._reconstructTransaction(payload);
                return `0x${transaction.getSenderAddress().toString('hex')}`.toLowerCase();
            default:
                throw new Error('Invalid Method');
        }
    }
    constructor() {
        super();
    }
    // tslint:disable-next-line:async-suffix
    public async handleRequest(
        payload: JSONRPCPayload,
        next: (callback?: (err: Error | null, result: any, cb: any) => void) => void,
        end: (err: Error | null, data?: any) => void,
    ): Promise<void> {
        switch (payload.method) {
            case 'eth_getTransactionCount':
                const blockTag = providerEngineUtils.blockTagForPayload(payload);
                if (!_.isNull(blockTag) && blockTag === 'pending') {
                    const address = NonceTrackerSubprovider._determineAddress(payload);
                    const cachedResult = this._nonceCache[address];
                    if (cachedResult) {
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
                return next(async (sendTransactionError: Error | null, txResult: any, cb: any) => {
                    if (_.isNull(sendTransactionError)) {
                        this._handleSuccessfulTransaction(payload);
                    } else {
                        await this._handleSendTransactionErrorAsync(payload, sendTransactionError);
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
    private async _handleSendTransactionErrorAsync(payload: JSONRPCPayload, err: Error): Promise<void> {
        const address = NonceTrackerSubprovider._determineAddress(payload);
        if (this._nonceCache[address]) {
            if (_.includes(err.message, NONCE_TOO_LOW_ERROR_MESSAGE)) {
                await this._handleNonceTooLowErrorAsync(address);
            }
        }
    }
    private async _handleNonceTooLowErrorAsync(address: string): Promise<void> {
        const oldNonceInt = ethUtil.bufferToInt(new Buffer(this._nonceCache[address], 'hex'));
        delete this._nonceCache[address];
        const nonceResult = await this.emitPayloadAsync({
            method: 'eth_getTransactionCount',
            params: [address, 'pending'],
        });
        const nonce = nonceResult.result;
        const latestNonceInt = ethUtil.bufferToInt(new Buffer(nonce, 'hex'));
        if (latestNonceInt > oldNonceInt) {
            this._nonceCache[address] = nonce;
        }
    }
}
