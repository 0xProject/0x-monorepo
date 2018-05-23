import { generatePseudoRandomSalt } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { constants } from './constants';
import { orderUtils } from './order_utils';
import { signingUtils } from './signing_utils';
import { SignatureType, SignedOrder, UnsignedOrder } from './types';

export class OrderFactory {
    private _defaultOrderParams: Partial<UnsignedOrder>;
    private _privateKey: Buffer;
    constructor(privateKey: Buffer, defaultOrderParams: Partial<UnsignedOrder>) {
        this._defaultOrderParams = defaultOrderParams;
        this._privateKey = privateKey;
    }
    public newSignedOrder(
        customOrderParams: Partial<UnsignedOrder> = {},
        signatureType: SignatureType = SignatureType.Ecrecover,
    ): SignedOrder {
        const randomExpiration = new BigNumber(Math.floor((Date.now() + Math.random() * 100000000000) / 1000));
        const order = ({
            senderAddress: constants.NULL_ADDRESS,
            expirationTimeSeconds: randomExpiration,
            salt: generatePseudoRandomSalt(),
            takerAddress: constants.NULL_ADDRESS,
            ...this._defaultOrderParams,
            ...customOrderParams,
        } as any) as UnsignedOrder;
        const orderHashBuff = orderUtils.getOrderHashBuff(order);
        const signature = signingUtils.signMessage(orderHashBuff, this._privateKey, signatureType);
        const signedOrder = {
            ...order,
            signature: `0x${signature.toString('hex')}`,
        };
        return signedOrder;
    }
}
