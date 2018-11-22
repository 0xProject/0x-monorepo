import { OrderWithoutExchangeAddress, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { constants } from './constants';
import { CancelOrder, MatchOrder } from './types';

export const orderUtils = {
    getPartialAmountFloor(numerator: BigNumber, denominator: BigNumber, target: BigNumber): BigNumber {
        const partialAmount = numerator
            .mul(target)
            .div(denominator)
            .floor();
        return partialAmount;
    },
    createFill: (signedOrder: SignedOrder, takerAssetFillAmount?: BigNumber) => {
        const fill = {
            order: orderUtils.getOrderWithoutExchangeAddress(signedOrder),
            takerAssetFillAmount: takerAssetFillAmount || signedOrder.takerAssetAmount,
            signature: signedOrder.signature,
        };
        return fill;
    },
    createCancel(signedOrder: SignedOrder, takerAssetCancelAmount?: BigNumber): CancelOrder {
        const cancel = {
            order: orderUtils.getOrderWithoutExchangeAddress(signedOrder),
            takerAssetCancelAmount: takerAssetCancelAmount || signedOrder.takerAssetAmount,
        };
        return cancel;
    },
    getOrderWithoutExchangeAddress(signedOrder: SignedOrder): OrderWithoutExchangeAddress {
        const orderStruct = {
            senderAddress: signedOrder.senderAddress,
            makerAddress: signedOrder.makerAddress,
            takerAddress: signedOrder.takerAddress,
            feeRecipientAddress: signedOrder.feeRecipientAddress,
            makerAssetAmount: signedOrder.makerAssetAmount,
            takerAssetAmount: signedOrder.takerAssetAmount,
            makerFee: signedOrder.makerFee,
            takerFee: signedOrder.takerFee,
            expirationTimeSeconds: signedOrder.expirationTimeSeconds,
            salt: signedOrder.salt,
            makerAssetData: signedOrder.makerAssetData,
            takerAssetData: signedOrder.takerAssetData,
        };
        return orderStruct;
    },
    createMatchOrders(signedOrderLeft: SignedOrder, signedOrderRight: SignedOrder): MatchOrder {
        const fill = {
            left: orderUtils.getOrderWithoutExchangeAddress(signedOrderLeft),
            right: orderUtils.getOrderWithoutExchangeAddress(signedOrderRight),
            leftSignature: signedOrderLeft.signature,
            rightSignature: signedOrderRight.signature,
        };
        fill.right.makerAssetData = constants.NULL_BYTES;
        fill.right.takerAssetData = constants.NULL_BYTES;
        return fill;
    },
};
