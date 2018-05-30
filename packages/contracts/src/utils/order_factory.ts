import { generatePseudoRandomSalt, orderHashUtils } from '@0xproject/order-utils';
import { Order, SignatureType, SignedOrder, UnsignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { constants } from './constants';
import { signingUtils } from './signing_utils';

export class OrderFactory {
    private _defaultOrderParams: Partial<Order>;
    private _privateKey: Buffer;
    constructor(privateKey: Buffer, defaultOrderParams: Partial<Order>) {
        this._defaultOrderParams = defaultOrderParams;
        this._privateKey = privateKey;
    }
    public newSignedOrder(
        customOrderParams: Partial<Order> = {},
        signatureType: SignatureType = SignatureType.EthSign,
    ): SignedOrder {
        const tenMinutes = 10 * 60 * 1000;
        const randomExpiration = new BigNumber(Date.now() + tenMinutes);
        const order = ({
            senderAddress: constants.NULL_ADDRESS,
            expirationTimeSeconds: randomExpiration,
            salt: generatePseudoRandomSalt(),
            takerAddress: constants.NULL_ADDRESS,
            ...this._defaultOrderParams,
            ...customOrderParams,
        } as any) as UnsignedOrder;
        const orderHashBuff = orderHashUtils.getOrderHashBuffer(order);
        const signature = signingUtils.signMessage(orderHashBuff, this._privateKey, signatureType);
        const signedOrder = {
            ...order,
            signature: `0x${signature.toString('hex')}`,
        };
        return signedOrder;
    }
}
