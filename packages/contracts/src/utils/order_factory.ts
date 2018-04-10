import { Order, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { signedOrderUtils } from './signed_order_utils';
import { DefaultOrderParams, SignedOrder } from './types';

export class OrderFactory {
    private _defaultOrderParams: Partial<Order>;
    private _zeroEx: ZeroEx;
    constructor(zeroEx: ZeroEx, defaultOrderParams: Partial<Order>) {
        this._defaultOrderParams = defaultOrderParams;
        this._zeroEx = zeroEx;
    }
    public async newSignedOrderAsync(customOrderParams: Partial<Order> = {}): Promise<SignedOrder> {
        const randomExpiration = new BigNumber(Math.floor((Date.now() + Math.random() * 100000000000) / 1000));
        const order = ({
            expirationTimestampSeconds: randomExpiration,
            salt: ZeroEx.generatePseudoRandomSalt(),
            takerAddress: ZeroEx.NULL_ADDRESS,
            ...this._defaultOrderParams,
            ...customOrderParams,
        } as any) as SignedOrder;
        const orderHashHex = signedOrderUtils.getOrderHashHex(order);
        const shouldAddPersonalMessagePrefix = false;
        const ecSignature = await this._zeroEx.signOrderHashAsync(
            orderHashHex,
            order.makerAddress,
            shouldAddPersonalMessagePrefix,
        );
        const signedOrder = {
            ...order,
            ecSignature,
        };
        return signedOrder;
    }
}
