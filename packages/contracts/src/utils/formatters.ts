import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { orderUtils } from './order_utils';
import { BatchCancelOrders, BatchFillOrders, MarketBuyOrders, MarketSellOrders, SignedOrder } from './types';

export const formatters = {
    createBatchFill(signedOrders: SignedOrder[], takerAssetFillAmounts: BigNumber[] = []) {
        const batchFill: BatchFillOrders = {
            orders: [],
            signatures: [],
            takerAssetFillAmounts,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            batchFill.orders.push(orderStruct);
            batchFill.signatures.push(signedOrder.signature);
            if (takerAssetFillAmounts.length < signedOrders.length) {
                batchFill.takerAssetFillAmounts.push(signedOrder.takerAssetAmount);
            }
        });
        return batchFill;
    },
    createMarketSellOrders(signedOrders: SignedOrder[], takerAssetFillAmount: BigNumber) {
        const marketSellOrders: MarketSellOrders = {
            orders: [],
            signatures: [],
            takerAssetFillAmount,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            marketSellOrders.orders.push(orderStruct);
            marketSellOrders.signatures.push(signedOrder.signature);
        });
        return marketSellOrders;
    },
    createMarketBuyOrders(signedOrders: SignedOrder[], makerAssetFillAmount: BigNumber) {
        const marketBuyOrders: MarketBuyOrders = {
            orders: [],
            signatures: [],
            makerAssetFillAmount,
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
