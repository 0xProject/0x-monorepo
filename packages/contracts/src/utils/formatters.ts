import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { orderUtils } from './order_utils';
import { BatchCancelOrders, BatchFillOrders, MarketBuyOrders, MarketSellOrders, SignedOrder } from './types';

export const formatters = {
    createBatchFill(
        signedOrders: SignedOrder[],
        takerAssetFillAmounts: BigNumber[] = [],
        defaultParamsIds: BigNumber[] = [],
    ) {
        const batchFill: BatchFillOrders = {
            orders: [],
            signatures: [],
            takerAssetFillAmounts,
            defaultParamsIds,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            batchFill.orders.push(orderStruct);
            batchFill.signatures.push(signedOrder.signature);
            if (takerAssetFillAmounts.length < signedOrders.length) {
                batchFill.takerAssetFillAmounts.push(signedOrder.takerAssetAmount);
            }
            if (defaultParamsIds.length < signedOrders.length) {
                const nullId = new BigNumber(0);
                batchFill.defaultParamsIds.push(nullId);
            }
        });
        return batchFill;
    },
    createMarketSellOrders(
        signedOrders: SignedOrder[],
        takerAssetFillAmount: BigNumber,
        defaultParamsIds: BigNumber[] = [],
    ) {
        const marketSellOrders: MarketSellOrders = {
            orders: [],
            signatures: [],
            takerAssetFillAmount,
            defaultParamsIds,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            marketSellOrders.orders.push(orderStruct);
            marketSellOrders.signatures.push(signedOrder.signature);
            if (defaultParamsIds.length < signedOrders.length) {
                const nullId = new BigNumber(0);
                marketSellOrders.defaultParamsIds.push(nullId);
            }
        });
        return marketSellOrders;
    },
    createMarketBuyOrders(
        signedOrders: SignedOrder[],
        makerAssetFillAmount: BigNumber,
        defaultParamsIds: BigNumber[] = [],
    ) {
        const marketBuyOrders: MarketBuyOrders = {
            orders: [],
            signatures: [],
            makerAssetFillAmount,
            defaultParamsIds,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            marketBuyOrders.orders.push(orderStruct);
            marketBuyOrders.signatures.push(signedOrder.signature);
            if (defaultParamsIds.length < signedOrders.length) {
                const nullId = new BigNumber(0);
                marketBuyOrders.defaultParamsIds.push(nullId);
            }
        });
        return marketBuyOrders;
    },
    createBatchCancel(signedOrders: SignedOrder[], defaultParamsIds: BigNumber[] = []) {
        const batchCancel: BatchCancelOrders = {
            orders: [],
            defaultParamsIds,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderStruct = orderUtils.getOrderStruct(signedOrder);
            batchCancel.orders.push(orderStruct);
            if (defaultParamsIds.length < signedOrders.length) {
                const nullId = new BigNumber(0);
                batchCancel.defaultParamsIds.push(nullId);
            }
        });
        return batchCancel;
    },
};
