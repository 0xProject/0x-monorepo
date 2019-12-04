import { generatePseudoRandomSalt } from '@0x/order-utils';
import { Order, SignedOrder } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from './constants';
import { BatchMatchOrder, CancelOrder, MatchOrder } from './types';

export const orderUtils = {
    getPartialAmountFloor(numerator: BigNumber, denominator: BigNumber, target: BigNumber): BigNumber {
        const partialAmount = numerator
            .multipliedBy(target)
            .div(denominator)
            .integerValue(BigNumber.ROUND_FLOOR);
        return partialAmount;
    },
    createFill: (signedOrder: SignedOrder, takerAssetFillAmount?: BigNumber) => {
        const fill = {
            order: signedOrder,
            takerAssetFillAmount: takerAssetFillAmount || signedOrder.takerAssetAmount,
            signature: signedOrder.signature,
        };
        return fill;
    },
    createCancel(signedOrder: SignedOrder, takerAssetCancelAmount?: BigNumber): CancelOrder {
        const cancel = {
            order: signedOrder,
            takerAssetCancelAmount: takerAssetCancelAmount || signedOrder.takerAssetAmount,
        };
        return cancel;
    },
    createOrderWithoutSignature(signedOrder: SignedOrder): Order {
        return _.omit(signedOrder, ['signature']) as Order;
    },
    createBatchMatchOrders(signedOrdersLeft: SignedOrder[], signedOrdersRight: SignedOrder[]): BatchMatchOrder {
        return {
            leftOrders: signedOrdersLeft.map(order => orderUtils.createOrderWithoutSignature(order)),
            rightOrders: signedOrdersRight.map(order => {
                const right = orderUtils.createOrderWithoutSignature(order);
                right.makerAssetData = constants.NULL_BYTES;
                right.takerAssetData = constants.NULL_BYTES;
                return right;
            }),
            leftSignatures: signedOrdersLeft.map(order => order.signature),
            rightSignatures: signedOrdersRight.map(order => order.signature),
        };
    },
    createMatchOrders(signedOrderLeft: SignedOrder, signedOrderRight: SignedOrder): MatchOrder {
        const fill = {
            left: orderUtils.createOrderWithoutSignature(signedOrderLeft),
            right: orderUtils.createOrderWithoutSignature(signedOrderRight),
            leftSignature: signedOrderLeft.signature,
            rightSignature: signedOrderRight.signature,
        };
        fill.right.makerAssetData = constants.NULL_BYTES;
        fill.right.takerAssetData = constants.NULL_BYTES;
        return fill;
    },
    generatePseudoRandomOrderHash(): string {
        const randomBigNum = generatePseudoRandomSalt();
        const randomHash = hexUtils.hash(randomBigNum);
        return randomHash;
    },
};
