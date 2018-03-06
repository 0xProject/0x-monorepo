import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { BatchCancelOrders, BatchFillOrders, MarketFillOrders, SignedOrder } from './types';

export const formatters = {
    createBatchFill(signedOrders: SignedOrder[], takerTokenFillAmounts: BigNumber[] = []) {
        const batchFill: BatchFillOrders = {
            orders: [],
            signatures: [],
            takerTokenFillAmounts,
        };
        _.forEach(signedOrders, signedOrder => {
            batchFill.orders.push({
                makerAddress: signedOrder.makerAddress,
                takerAddress: signedOrder.takerAddress,
                makerTokenAddress: signedOrder.makerTokenAddress,
                takerTokenAddress: signedOrder.takerTokenAddress,
                feeRecipientAddress: signedOrder.feeRecipientAddress,
                makerTokenAmount: signedOrder.makerTokenAmount,
                takerTokenAmount: signedOrder.takerTokenAmount,
                makerFeeAmount: signedOrder.makerFeeAmount,
                takerFeeAmount: signedOrder.takerFeeAmount,
                expirationTimeSeconds: signedOrder.expirationTimeSeconds,
                salt: signedOrder.salt,
            });
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
            marketFillOrders.orders.push({
                makerAddress: signedOrder.makerAddress,
                takerAddress: signedOrder.takerAddress,
                makerTokenAddress: signedOrder.makerTokenAddress,
                takerTokenAddress: signedOrder.takerTokenAddress,
                feeRecipientAddress: signedOrder.feeRecipientAddress,
                makerTokenAmount: signedOrder.makerTokenAmount,
                takerTokenAmount: signedOrder.takerTokenAmount,
                makerFeeAmount: signedOrder.makerFeeAmount,
                takerFeeAmount: signedOrder.takerFeeAmount,
                expirationTimeSeconds: signedOrder.expirationTimeSeconds,
                salt: signedOrder.salt,
            });
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
            batchCancel.orders.push({
                makerAddress: signedOrder.makerAddress,
                takerAddress: signedOrder.takerAddress,
                makerTokenAddress: signedOrder.makerTokenAddress,
                takerTokenAddress: signedOrder.takerTokenAddress,
                feeRecipientAddress: signedOrder.feeRecipientAddress,
                makerTokenAmount: signedOrder.makerTokenAmount,
                takerTokenAmount: signedOrder.takerTokenAmount,
                makerFeeAmount: signedOrder.makerFeeAmount,
                takerFeeAmount: signedOrder.takerFeeAmount,
                expirationTimeSeconds: signedOrder.expirationTimeSeconds,
                salt: signedOrder.salt,
            });
            if (takerTokenCancelAmounts.length < signedOrders.length) {
                batchCancel.takerTokenCancelAmounts.push(signedOrder.takerTokenAmount);
            }
        });
        return batchCancel;
    },
};
