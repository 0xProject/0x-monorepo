import { SignedOrder } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { BatchCancelOrders, BatchFillOrders, MarketFillOrders } from './types';

export const formatters = {
    createBatchFill(
        signedOrders: SignedOrder[],
        takerTokenFillAmounts: BigNumber[] = [],
    ) {
        const batchFill: BatchFillOrders = {
            orderAddresses: [],
            orderValues: [],
            takerTokenFillAmounts,
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
            if (takerTokenFillAmounts.length < signedOrders.length) {
                batchFill.takerTokenFillAmounts.push(signedOrder.takerTokenAmount);
            }
        });
        return batchFill;
    },
    createMarketFillOrders(
        signedOrders: SignedOrder[],
        takerTokenFillAmount: BigNumber,
    ) {
        const marketFillOrders: MarketFillOrders = {
            orderAddresses: [],
            orderValues: [],
            takerTokenFillAmount,
            v: [],
            r: [],
            s: [],
        };
        signedOrders.forEach(signedOrder => {
            marketFillOrders.orderAddresses.push([
                signedOrder.maker,
                signedOrder.taker,
                signedOrder.makerTokenAddress,
                signedOrder.takerTokenAddress,
                signedOrder.feeRecipient,
            ]);
            marketFillOrders.orderValues.push([
                signedOrder.makerTokenAmount,
                signedOrder.takerTokenAmount,
                signedOrder.makerFee,
                signedOrder.takerFee,
                signedOrder.expirationUnixTimestampSec,
                signedOrder.salt,
            ]);
            marketFillOrders.v.push(signedOrder.ecSignature.v);
            marketFillOrders.r.push(signedOrder.ecSignature.r);
            marketFillOrders.s.push(signedOrder.ecSignature.s);
        });
        return marketFillOrders;
    },
    createBatchCancel(signedOrders: SignedOrder[], cancelTakerTokenAmounts: BigNumber[] = []) {
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
