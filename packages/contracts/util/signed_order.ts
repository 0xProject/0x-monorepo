import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { crypto } from './crypto';
import { SignedOrderParams } from './types';

export class SignedOrder {
    public params: SignedOrderParams;
    private _web3Wrapper: Web3Wrapper;
    constructor(web3Wrapper: Web3Wrapper, params: SignedOrderParams) {
        this.params = params;
        this._web3Wrapper = web3Wrapper;
    }
    public isValidSignature() {
        const { v, r, s } = this.params;
        const orderHash = this.getOrderHashHex();
        const msgHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(orderHash));
        try {
            const pubKey = ethUtil.ecrecover(msgHash, v, ethUtil.toBuffer(r), ethUtil.toBuffer(s));
            const recoveredAddress = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));
            return recoveredAddress === this.params.maker;
        } catch (err) {
            return false;
        }
    }
    public createFill(shouldThrowOnInsufficientBalanceOrAllowance?: boolean, fillTakerTokenAmount?: BigNumber) {
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
            fillTakerTokenAmount: fillTakerTokenAmount || this.params.takerTokenAmount,
            shouldThrowOnInsufficientBalanceOrAllowance: !!shouldThrowOnInsufficientBalanceOrAllowance,
            v: this.params.v,
            r: this.params.r,
            s: this.params.s,
        };
        return fill;
    }
    public createCancel(cancelTakerTokenAmount?: BigNumber) {
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
            cancelTakerTokenAmount: cancelTakerTokenAmount || this.params.takerTokenAmount,
        };
        return cancel;
    }
    public getOrderHashHex(): string {
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
