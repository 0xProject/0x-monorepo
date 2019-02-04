import { BigNumber } from '@0x/asset-buyer';
import { SignedOrder } from '@0x/types';

export const coerceBigNumberOrString = (value: any): BigNumber => {
    if (typeof value === 'string') {
        return new BigNumber(value);
    }
    if (BigNumber.isBigNumber(value)) {
        return new BigNumber(value.toString());
    }
    return value;
};

// function implies that the signed order already has been invalidated
export const coerceSignedOrderBigNumberOfString = (order: SignedOrder): SignedOrder => {
    return {
        ...order,
        makerFee: coerceBigNumberOrString(order.makerFee),
        takerFee: coerceBigNumberOrString(order.takerFee),
        makerAssetAmount: coerceBigNumberOrString(order.makerAssetAmount),
        takerAssetAmount: coerceBigNumberOrString(order.takerAssetAmount),
        salt: coerceBigNumberOrString(order.salt),
        expirationTimeSeconds: coerceBigNumberOrString(order.expirationTimeSeconds),
    };
};
