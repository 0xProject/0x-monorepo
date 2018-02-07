import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { crypto } from './crypto';
import { SignedOrder } from './signed_order';
import { OrderParams } from './types';

export class Order {
    public params: OrderParams;
    private _web3Wrapper: Web3Wrapper;
    constructor(web3Wrapper: Web3Wrapper, params: OrderParams) {
        this.params = params;
        this._web3Wrapper = web3Wrapper;
    }
    public async signAsync(): Promise<SignedOrder> {
        const orderHash = this.getOrderHashHex();
        const signature = await this._web3Wrapper.signTransactionAsync(this.params.maker, orderHash);
        const { v, r, s } = ethUtil.fromRpcSig(signature);
        const signedOrderParams = _.assign(this.params, {
            v,
            r: ethUtil.bufferToHex(r),
            s: ethUtil.bufferToHex(s),
        });
        const signedOrder = new SignedOrder(this._web3Wrapper, signedOrderParams);
        return signedOrder;
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
