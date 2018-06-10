import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

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
            const orderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(signedOrder);
            batchFill.orders.push(orderWithoutExchangeAddress);
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
            const orderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(signedOrder);
            if (i !== 0) {
                orderWithoutExchangeAddress.takerAssetData = `0x${_.repeat(
                    '0',
                    signedOrders[0].takerAssetData.length - 2,
                )}`;
            }
            marketSellOrders.orders.push(orderWithoutExchangeAddress);
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
            const orderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(signedOrder);
            if (i !== 0) {
                orderWithoutExchangeAddress.makerAssetData = `0x${_.repeat(
                    '0',
                    signedOrders[0].makerAssetData.length - 2,
                )}`;
            }
            marketBuyOrders.orders.push(orderWithoutExchangeAddress);
            marketBuyOrders.signatures.push(signedOrder.signature);
        });
        return marketBuyOrders;
    },
    createBatchCancel(signedOrders: SignedOrder[]): BatchCancelOrders {
        const batchCancel: BatchCancelOrders = {
            orders: [],
        };
        _.forEach(signedOrders, signedOrder => {
            const orderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(signedOrder);
            batchCancel.orders.push(orderWithoutExchangeAddress);
        });
        return batchCancel;
    },
};
