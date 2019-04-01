import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from './constants';
import { orderUtils } from './order_utils';
import { BatchCancelOrders, BatchFillOrders, MarketBuyOrders, MarketSellOrders } from './types';

export const formatters = {
    createBatchFill(signedOrders: SignedOrder[], takerAssetFillAmounts: BigNumber[] = []): BatchFillOrders {
        const batchFill: BatchFillOrders = {
            orders: [],
            signatures: [],
            takerAssetFillAmounts,
        };
        _.forEach(signedOrders, signedOrder => {
            const orderWithoutDomain = orderUtils.getOrderWithoutDomain(signedOrder);
            batchFill.orders.push(orderWithoutDomain);
            batchFill.signatures.push(signedOrder.signature);
            if (takerAssetFillAmounts.length < signedOrders.length) {
                batchFill.takerAssetFillAmounts.push(signedOrder.takerAssetAmount);
            }
        });
        return batchFill;
    },
    createMarketSellOrders(signedOrders: SignedOrder[], takerAssetFillAmount: BigNumber): MarketSellOrders {
        const marketSellOrders: MarketSellOrders = {
            orders: [],
            signatures: [],
            takerAssetFillAmount,
        };
        _.forEach(signedOrders, (signedOrder, i) => {
            const orderWithoutDomain = orderUtils.getOrderWithoutDomain(signedOrder);
            if (i !== 0) {
                orderWithoutDomain.takerAssetData = constants.NULL_BYTES;
            }
            marketSellOrders.orders.push(orderWithoutDomain);
            marketSellOrders.signatures.push(signedOrder.signature);
        });
        return marketSellOrders;
    },
    createMarketBuyOrders(signedOrders: SignedOrder[], makerAssetFillAmount: BigNumber): MarketBuyOrders {
        const marketBuyOrders: MarketBuyOrders = {
            orders: [],
            signatures: [],
            makerAssetFillAmount,
        };
        _.forEach(signedOrders, (signedOrder, i) => {
            const orderWithoutDomain = orderUtils.getOrderWithoutDomain(signedOrder);
            if (i !== 0) {
                orderWithoutDomain.makerAssetData = constants.NULL_BYTES;
            }
            marketBuyOrders.orders.push(orderWithoutDomain);
            marketBuyOrders.signatures.push(signedOrder.signature);
        });
        return marketBuyOrders;
    },
    createBatchCancel(signedOrders: SignedOrder[]): BatchCancelOrders {
        const batchCancel: BatchCancelOrders = {
            orders: [],
        };
        _.forEach(signedOrders, signedOrder => {
            const orderWithoutDomain = orderUtils.getOrderWithoutDomain(signedOrder);
            batchCancel.orders.push(orderWithoutDomain);
        });
        return batchCancel;
    },
};
