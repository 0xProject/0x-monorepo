import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { crypto } from './crypto';
import { OrderParams } from './types';

export class Order {
    public params: OrderParams;
    private _web3Wrapper: Web3Wrapper;
    constructor(web3Wrapper: Web3Wrapper, params: OrderParams) {
        this.params = params;
        this._web3Wrapper = web3Wrapper;
    }
    public isValidSignature() {
        const { v, r, s } = this.params;
        if (_.isUndefined(v) || _.isUndefined(r) || _.isUndefined(s)) {
            throw new Error('Cannot call isValidSignature on unsigned order');
        }
        const orderHash = this._getOrderHash();
        const msgHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(orderHash));
        try {
            const pubKey = ethUtil.ecrecover(msgHash, v, ethUtil.toBuffer(r), ethUtil.toBuffer(s));
            const recoveredAddress = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));
            return recoveredAddress === this.params.maker;
        } catch (err) {
            return false;
        }
    }
    public async signAsync() {
        const orderHash = this._getOrderHash();
        const signature = await this._web3Wrapper.signTransactionAsync(this.params.maker, orderHash);
        const { v, r, s } = ethUtil.fromRpcSig(signature);
        this.params = _.assign(this.params, {
            orderHashHex: orderHash,
            v,
            r: ethUtil.bufferToHex(r),
            s: ethUtil.bufferToHex(s),
        });
    }
    public createFill(takerTokenFillAmount?: BigNumber) {
        const fill = {
            orderAddresses: [
                this.params.maker,
                this.params.taker,
                this.params.makerToken,
                this.params.takerToken,
                this.params.feeRecipient,
            ],
            orderValues: [
                this.params.makerTokenAmount,
                this.params.takerTokenAmount,
                this.params.makerFee,
                this.params.takerFee,
                this.params.expirationTimestampInSec,
                this.params.salt,
            ],
            takerTokenFillAmount: takerTokenFillAmount || this.params.takerTokenAmount,
            v: this.params.v,
            r: this.params.r,
            s: this.params.s,
        };
        return fill;
    }
    public createCancel(takerTokenCancelAmount?: BigNumber) {
        const cancel = {
            orderAddresses: [
                this.params.maker,
                this.params.taker,
                this.params.makerToken,
                this.params.takerToken,
                this.params.feeRecipient,
            ],
            orderValues: [
                this.params.makerTokenAmount,
                this.params.takerTokenAmount,
                this.params.makerFee,
                this.params.takerFee,
                this.params.expirationTimestampInSec,
                this.params.salt,
            ],
            takerTokenCancelAmount: takerTokenCancelAmount || this.params.takerTokenAmount,
        };
        return cancel;
    }
    private _getOrderHash(): string {
        const orderHash = crypto.solSHA3([
            this.params.exchangeContractAddress,
            this.params.maker,
            this.params.taker,
            this.params.makerToken,
            this.params.takerToken,
            this.params.feeRecipient,
            this.params.makerTokenAmount,
            this.params.takerTokenAmount,
            this.params.makerFee,
            this.params.takerFee,
            this.params.expirationTimestampInSec,
            this.params.salt,
        ]);
        const orderHashHex = ethUtil.bufferToHex(orderHash);
        return orderHashHex;
    }
}
