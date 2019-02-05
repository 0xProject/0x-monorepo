import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { maybeBigNumberUtil } from './maybe_big_number';

const coerceBigNumberOrString = (value: any): BigNumber => {
    const bn = maybeBigNumberUtil.bigNumberOrStringToMaybeBigNumber(value);
    return !!bn ? bn : value;
};

// function implies that the signed order already has been validated
export const signedOrderCoercionUtil = {
    // coerces order big number values to the BigNumber version utilized by 0x
    bigNumberCoercion: (order: SignedOrder): SignedOrder => {
        return {
            ...order,
            makerFee: coerceBigNumberOrString(order.makerFee),
            takerFee: coerceBigNumberOrString(order.takerFee),
            makerAssetAmount: coerceBigNumberOrString(order.makerAssetAmount),
            takerAssetAmount: coerceBigNumberOrString(order.takerAssetAmount),
            salt: coerceBigNumberOrString(order.salt),
            expirationTimeSeconds: coerceBigNumberOrString(order.expirationTimeSeconds),
        };
    },
};
