import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { orderUtils } from './order_utils';
import { BatchCancelOrders, BatchFillOrders, MarketFillOrders, SignedOrder } from './types';

export const formatters = {
    createBatchFill(signedOrders: SignedOrder[], takerTokenFillAmounts: BigNumber[] = []) {
        const batchFill: BatchFillOrders = {
            orders: [],
            signatures: [],
            takerTokenFillAmounts,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            batchFill.orders.push(orderStruct);
            batchFill.signatures.push(signedOrder.signature);
            if (takerTokenFillAmounts.length < signedOrders.length) {
                batchFill.takerTokenFillAmounts.push(signedOrder.takerTokenAmount);
            }
        });
        return batchFill;
    },
    createMarketFillOrders(signedOrders: SignedOrder[], takerTokenFillAmount: BigNumber) {
        const marketFillOrders: MarketFillOrders = {
            orders: [],
            signatures: [],
            takerTokenFillAmount,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            marketFillOrders.orders.push(orderStruct);
            marketFillOrders.signatures.push(signedOrder.signature);
        });
        return marketFillOrders;
    },
    createBatchCancel(signedOrders: SignedOrder[], takerTokenCancelAmounts: BigNumber[] = []) {
        const batchCancel: BatchCancelOrders = {
            orders: [],
            takerTokenCancelAmounts,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            batchCancel.orders.push(orderStruct);
            if (takerTokenCancelAmounts.length < signedOrders.length) {
                batchCancel.takerTokenCancelAmounts.push(signedOrder.takerTokenAmount);
            }
        });
        return batchCancel;
    },
};
