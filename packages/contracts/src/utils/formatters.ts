import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { orderUtils } from './order_utils';
import { BatchCancelOrders, BatchFillOrders, MarketBuyOrders, MarketSellOrders, SignedOrder } from './types';

export const formatters = {
    createBatchFill(signedOrders: SignedOrder[], takerSellAmounts: BigNumber[] = []) {
        const batchFill: BatchFillOrders = {
            orders: [],
            signatures: [],
            takerSellAmounts,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            batchFill.orders.push(orderStruct);
            batchFill.signatures.push(signedOrder.signature);
            if (takerSellAmounts.length < signedOrders.length) {
                batchFill.takerSellAmounts.push(signedOrder.makerBuyAmount);
            }
        });
        return batchFill;
    },
    createMarketSellOrders(signedOrders: SignedOrder[], takerSellAmount: BigNumber) {
        const marketSellOrders: MarketSellOrders = {
            orders: [],
            signatures: [],
            takerSellAmount,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            marketSellOrders.orders.push(orderStruct);
            marketSellOrders.signatures.push(signedOrder.signature);
        });
        return marketSellOrders;
    },
    createMarketBuyOrders(signedOrders: SignedOrder[], takerBuyAmount: BigNumber) {
        const marketBuyOrders: MarketBuyOrders = {
            orders: [],
            signatures: [],
            takerBuyAmount,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            marketBuyOrders.orders.push(orderStruct);
            marketBuyOrders.signatures.push(signedOrder.signature);
        });
        return marketBuyOrders;
    },
    createBatchCancel(signedOrders: SignedOrder[]) {
        const batchCancel: BatchCancelOrders = {
            orders: [],
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            batchCancel.orders.push(orderStruct);
        });
        return batchCancel;
    },
};
