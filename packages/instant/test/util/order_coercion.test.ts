import { BigNumber } from '@0x/utils';

import { orderCoercionUtil } from '../../src/util/order_coercion';

const ORDER = {
    senderAddress: '0x0000000000000000000000000000000000000000',
    makerAddress: '0x34a745008a643eebc58920eaa29fb1165b4a288e',
    takerAddress: '0x0000000000000000000000000000000000000000',
    makerFee: new BigNumber('0'),
    takerFee: new BigNumber('0'),
    makerAssetAmount: new BigNumber('200000000000000000000'),
    takerAssetAmount: new BigNumber('10000000000000000000'),
    makerAssetData: '0xf47261b00000000000000000000000008cb3971b8eb709c14616bd556ff6683019e90d9c',
    takerAssetData: '0xf47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c',
    expirationTimeSeconds: new BigNumber('1601535600'),
    feeRecipientAddress: '0x0000000000000000000000000000000000000000',
    salt: new BigNumber('3101985707338942582579795423923841749956600670712030922928319824580764688653'),
    signature:
        '0x1bd4d5686fea801fe33c68c4944356085e7e6cb553eb7073160abd815609f714e85fb47f44b7ffd0a2a1321ac40d72d55163869d0a50fdb5a402132150fe33a08403',
    exchangeAddress: '0x35dd2932454449b14cee11a94d3674a936d5d7b2',
};

const STRING_ORDER = {
    senderAddress: '0x0000000000000000000000000000000000000000',
    makerAddress: '0x34a745008a643eebc58920eaa29fb1165b4a288e',
    takerAddress: '0x0000000000000000000000000000000000000000',
    makerFee: '0',
    takerFee: '0',
    makerAssetAmount: '300000000000000000000',
    takerAssetAmount: '31000000000000000000',
    makerAssetData: '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa',
    takerAssetData: '0xf47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c',
    expirationTimeSeconds: '2524636800',
    feeRecipientAddress: '0x0000000000000000000000000000000000000000',
    salt: '64592004666704945574675477805199411288137454783320798602050822322450089238268',
    signature:
        '0x1c13cacddca8d7d8248e91f412377e68f8f1f9891a59a6c1b2eea9f7b33558c30c4fb86a448e08ab7def40a28fb3a3062dcb33bb3c45302447fce5c4288b7c7f5b03',
    exchangeAddress: '0x35dd2932454449b14cee11a94d3674a936d5d7b2',
};

const ORDERS = [ORDER, STRING_ORDER];

describe('orderCoercionUtil', () => {
    describe('coerceFieldsToBigNumbers', () => {
        it('should coerce all fields specified to a big number', () => {
            const coercedOrder = orderCoercionUtil.coerceFieldsToBigNumbers(STRING_ORDER, ['makerFee', 'takerFee']);
            expect(coercedOrder.makerFee.toString()).toEqual('0');
            expect(coercedOrder.takerFee.toString()).toEqual('0');
        });
        it("should throw if a field can't be found", () => {
            expect(() => {
                orderCoercionUtil.coerceFieldsToBigNumbers(ORDER, ['salty']);
            }).toThrow("Could not find field 'salty' while converting fields to BigNumber.");
        });
        it('should not change value if not numeric string or big number', () => {
            const obj = { number: 'number' };
            const coercedObj = orderCoercionUtil.coerceFieldsToBigNumbers(obj, ['number']);
            expect(coercedObj).toEqual({
                number: 'number',
            });
        });
    });
    // Note: this doesn't test coercing pre v8.0.0 BigNumber versions to specified one used by 0x
    describe('coerceOrderFieldsToBigNumber', () => {
        it('should convert string values in order to big number', () => {
            const coercedOrder = orderCoercionUtil.coerceOrderFieldsToBigNumber(STRING_ORDER);
            expect(coercedOrder.makerFee.toString()).toEqual(STRING_ORDER.makerFee);
            expect(coercedOrder.takerFee.toString()).toEqual(STRING_ORDER.takerFee);
            expect(coercedOrder.takerAssetAmount.toString()).toEqual(STRING_ORDER.takerAssetAmount);
            expect(coercedOrder.makerAssetAmount.toString()).toEqual(STRING_ORDER.makerAssetAmount);
            expect(coercedOrder.salt.toString()).toEqual(STRING_ORDER.salt);
            expect(coercedOrder.expirationTimeSeconds.toString()).toEqual(STRING_ORDER.expirationTimeSeconds);
        });
        it('should convert big number values in order to big number', () => {
            const coercedOrder = orderCoercionUtil.coerceOrderFieldsToBigNumber(ORDER);
            expect(coercedOrder.makerFee).toEqual(ORDER.makerFee);
            expect(coercedOrder.takerFee).toEqual(ORDER.takerFee);
            expect(coercedOrder.takerAssetAmount).toEqual(ORDER.takerAssetAmount);
            expect(coercedOrder.makerAssetAmount).toEqual(ORDER.makerAssetAmount);
            expect(coercedOrder.salt).toEqual(ORDER.salt);
            expect(coercedOrder.expirationTimeSeconds).toEqual(ORDER.expirationTimeSeconds);
        });
    });
    // Note: this doesn't test coercing pre v8.0.0 BigNumber versions to specified one used by 0x
    describe('coerceOrderArrayFieldsToBigNumber', () => {
        it('should convert string values and big numbers in orders to big number', () => {
            const coercedOrders = orderCoercionUtil.coerceOrderArrayFieldsToBigNumber(ORDERS);
            expect(coercedOrders[0].makerFee).toEqual(ORDER.makerFee);
            expect(coercedOrders[0].takerFee).toEqual(ORDER.takerFee);
            expect(coercedOrders[0].takerAssetAmount).toEqual(ORDER.takerAssetAmount);
            expect(coercedOrders[0].makerAssetAmount).toEqual(ORDER.makerAssetAmount);
            expect(coercedOrders[0].salt).toEqual(ORDER.salt);
            expect(coercedOrders[0].expirationTimeSeconds).toEqual(ORDER.expirationTimeSeconds);

            expect(coercedOrders[1].makerFee.toString()).toEqual(STRING_ORDER.makerFee);
            expect(coercedOrders[1].takerFee.toString()).toEqual(STRING_ORDER.takerFee);
            expect(coercedOrders[1].takerAssetAmount.toString()).toEqual(STRING_ORDER.takerAssetAmount);
            expect(coercedOrders[1].makerAssetAmount.toString()).toEqual(STRING_ORDER.makerAssetAmount);
            expect(coercedOrders[1].salt.toString()).toEqual(STRING_ORDER.salt);
            expect(coercedOrders[1].expirationTimeSeconds.toString()).toEqual(STRING_ORDER.expirationTimeSeconds);
        });
    });
});
