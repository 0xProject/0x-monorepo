import { ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { Order } from './order';
import { SignedOrder } from './signed_order';
import { DefaultOrderParams, OptionalOrderParams, OrderParams } from './types';

export class OrderFactory {
    private _defaultOrderParams: DefaultOrderParams;
    private _web3Wrapper: Web3Wrapper;
    constructor(web3Wrapper: Web3Wrapper, defaultOrderParams: DefaultOrderParams) {
        this._defaultOrderParams = defaultOrderParams;
        this._web3Wrapper = web3Wrapper;
    }
    public async newSignedOrderAsync(customOrderParams: OptionalOrderParams = {}): Promise<SignedOrder> {
        const randomExpiration = new BigNumber(Math.floor((Date.now() + Math.random() * 100000000000) / 1000));
        const orderParams: OrderParams = _.assign(
            {},
            {
                expirationTimestampInSec: randomExpiration,
                salt: ZeroEx.generatePseudoRandomSalt(),
                taker: ZeroEx.NULL_ADDRESS,
            },
            this._defaultOrderParams,
            customOrderParams,
        );
        const order = new Order(this._web3Wrapper, orderParams);
        const signedOrder = await order.signAsync();
        return signedOrder;
    }
}
