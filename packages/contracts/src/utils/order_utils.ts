import { Order, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import ethUtil = require('ethereumjs-util');

import { CancelOrder, MatchOrder } from './types';

export const orderUtils = {
    createFill: (signedOrder: SignedOrder, takerAssetFillAmount?: BigNumber) => {
        const fill = {
            order: orderUtils.getOrderStruct(signedOrder),
            takerAssetFillAmount: takerAssetFillAmount || signedOrder.takerAssetAmount,
            signature: signedOrder.signature,
        };
        return fill;
    },
    createCancel(signedOrder: SignedOrder, takerAssetCancelAmount?: BigNumber): CancelOrder {
        const cancel = {
            order: orderUtils.getOrderStruct(signedOrder),
            takerAssetCancelAmount: takerAssetCancelAmount || signedOrder.takerAssetAmount,
        };
        return cancel;
    },
    // TODO: This seems redundant... it currently returns a deep copy w/o signature.
    // Question: Should we still have a separate OrderStruct type that simply doesn't
    // include the exchangeAddress? Seems like we need to for batch ops...
    getOrderStruct(signedOrder: SignedOrder): Order {
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
            exchangeAddress: signedOrder.exchangeAddress,
        };
        return orderStruct;
    },
    createMatchOrders(signedOrderLeft: SignedOrder, signedOrderRight: SignedOrder): MatchOrder {
        const fill = {
            left: orderUtils.getOrderStruct(signedOrderLeft),
            right: orderUtils.getOrderStruct(signedOrderRight),
            leftSignature: signedOrderLeft.signature,
            rightSignature: signedOrderRight.signature,
        };
        return fill;
    },
};
