import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { Order } from './order';
import { BatchCancelOrders, BatchFillOrders, MarketFillOrders } from './types';

export const formatters = {
    createBatchFill(
        orders: Order[],
        fillTakerTokenAmounts: BigNumber[] = [],
    ) {
        const batchFill: BatchFillOrders = {
            orderAddresses: [],
            orderValues: [],
            fillTakerTokenAmounts,
            v: [],
            r: [],
            s: [],
        };
        _.forEach(orders, order => {
            batchFill.orderAddresses.push([
                order.params.maker,
                order.params.taker,
                order.params.makerToken,
                order.params.takerToken,
                order.params.feeRecipient,
            ]);
            batchFill.orderValues.push([
                order.params.makerTokenAmount,
                order.params.takerTokenAmount,
                order.params.makerFee,
                order.params.takerFee,
                order.params.expirationTimestampInSec,
                order.params.salt,
            ]);
            batchFill.v.push(order.params.v as number);
            batchFill.r.push(order.params.r as string);
            batchFill.s.push(order.params.s as string);
            if (fillTakerTokenAmounts.length < orders.length) {
                batchFill.fillTakerTokenAmounts.push(order.params.takerTokenAmount);
            }
        });
        return batchFill;
    },
    createMarketFillOrders(
        orders: Order[],
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
        orders.forEach(order => {
            marketFillOrders.orderAddresses.push([
                order.params.maker,
                order.params.taker,
                order.params.makerToken,
                order.params.takerToken,
                order.params.feeRecipient,
            ]);
            marketFillOrders.orderValues.push([
                order.params.makerTokenAmount,
                order.params.takerTokenAmount,
                order.params.makerFee,
                order.params.takerFee,
                order.params.expirationTimestampInSec,
                order.params.salt,
            ]);
            marketFillOrders.v.push(order.params.v as number);
            marketFillOrders.r.push(order.params.r as string);
            marketFillOrders.s.push(order.params.s as string);
        });
        return marketFillOrders;
    },
    createBatchCancel(orders: Order[], cancelTakerTokenAmounts: BigNumber[] = []) {
        const batchCancel: BatchCancelOrders = {
            orderAddresses: [],
            orderValues: [],
            cancelTakerTokenAmounts,
        };
        orders.forEach(order => {
            batchCancel.orderAddresses.push([
                order.params.maker,
                order.params.taker,
                order.params.makerToken,
                order.params.takerToken,
                order.params.feeRecipient,
            ]);
            batchCancel.orderValues.push([
                order.params.makerTokenAmount,
                order.params.takerTokenAmount,
                order.params.makerFee,
                order.params.takerFee,
                order.params.expirationTimestampInSec,
                order.params.salt,
            ]);
            if (cancelTakerTokenAmounts.length < orders.length) {
                batchCancel.cancelTakerTokenAmounts.push(order.params.takerTokenAmount);
            }
        });
        return batchCancel;
    },
};
