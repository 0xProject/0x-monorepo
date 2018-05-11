import { SignedOrder } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { BatchCancelOrders, BatchFillOrders, FillOrdersUpTo } from './types';

export const formatters = {
    createBatchFill(
        signedOrders: SignedOrder[],
        shouldThrowOnInsufficientBalanceOrAllowance: boolean,
        fillTakerTokenAmounts: BigNumber[] = [],
    ): BatchFillOrders {
        const batchFill: BatchFillOrders = {
            orderAddresses: [],
            orderValues: [],
            fillTakerTokenAmounts,
            shouldThrowOnInsufficientBalanceOrAllowance,
            v: [],
            r: [],
            s: [],
        };
        _.forEach(signedOrders, signedOrder => {
            batchFill.orderAddresses.push([
                signedOrder.maker,
                signedOrder.taker,
                signedOrder.makerTokenAddress,
                signedOrder.takerTokenAddress,
                signedOrder.feeRecipient,
            ]);
            batchFill.orderValues.push([
                signedOrder.makerTokenAmount,
                signedOrder.takerTokenAmount,
                signedOrder.makerFee,
                signedOrder.takerFee,
                signedOrder.expirationUnixTimestampSec,
                signedOrder.salt,
            ]);
            batchFill.v.push(signedOrder.ecSignature.v);
            batchFill.r.push(signedOrder.ecSignature.r);
            batchFill.s.push(signedOrder.ecSignature.s);
            if (fillTakerTokenAmounts.length < signedOrders.length) {
                batchFill.fillTakerTokenAmounts.push(signedOrder.takerTokenAmount);
            }
        });
        return batchFill;
    },
    createFillUpTo(
        signedOrders: SignedOrder[],
        shouldThrowOnInsufficientBalanceOrAllowance: boolean,
        fillTakerTokenAmount: BigNumber,
    ): FillOrdersUpTo {
        const fillUpTo: FillOrdersUpTo = {
            orderAddresses: [],
            orderValues: [],
            fillTakerTokenAmount,
            shouldThrowOnInsufficientBalanceOrAllowance,
            v: [],
            r: [],
            s: [],
        };
        signedOrders.forEach(signedOrder => {
            fillUpTo.orderAddresses.push([
                signedOrder.maker,
                signedOrder.taker,
                signedOrder.makerTokenAddress,
                signedOrder.takerTokenAddress,
                signedOrder.feeRecipient,
            ]);
            fillUpTo.orderValues.push([
                signedOrder.makerTokenAmount,
                signedOrder.takerTokenAmount,
                signedOrder.makerFee,
                signedOrder.takerFee,
                signedOrder.expirationUnixTimestampSec,
                signedOrder.salt,
            ]);
            fillUpTo.v.push(signedOrder.ecSignature.v);
            fillUpTo.r.push(signedOrder.ecSignature.r);
            fillUpTo.s.push(signedOrder.ecSignature.s);
        });
        return fillUpTo;
    },
    createBatchCancel(signedOrders: SignedOrder[], cancelTakerTokenAmounts: BigNumber[] = []): BatchCancelOrders {
        const batchCancel: BatchCancelOrders = {
            orderAddresses: [],
            orderValues: [],
            cancelTakerTokenAmounts,
        };
        signedOrders.forEach(signedOrder => {
            batchCancel.orderAddresses.push([
                signedOrder.maker,
                signedOrder.taker,
                signedOrder.makerTokenAddress,
                signedOrder.takerTokenAddress,
                signedOrder.feeRecipient,
            ]);
            batchCancel.orderValues.push([
                signedOrder.makerTokenAmount,
                signedOrder.takerTokenAmount,
                signedOrder.makerFee,
                signedOrder.takerFee,
                signedOrder.expirationUnixTimestampSec,
                signedOrder.salt,
            ]);
            if (cancelTakerTokenAmounts.length < signedOrders.length) {
                batchCancel.cancelTakerTokenAmounts.push(signedOrder.takerTokenAmount);
            }
        });
        return batchCancel;
    },
};
