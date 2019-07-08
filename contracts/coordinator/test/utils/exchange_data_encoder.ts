import { IExchangeContract } from '@0x/contracts-exchange';
import { constants as devConstants, provider } from '@0x/contracts-test-utils';
import { SignedOrder } from '@0x/types';

import { constants } from './index';

export const exchangeDataEncoder = {
    encodeOrdersToExchangeData(fnName: string, orders: SignedOrder[]): string {
        const exchangeInstance = new IExchangeContract(devConstants.NULL_ADDRESS, provider);
        let data;
        if (constants.SINGLE_FILL_FN_NAMES.indexOf(fnName) !== -1) {
            data = (exchangeInstance as any)[fnName].getABIEncodedTransactionData(
                orders[0],
                orders[0].takerAssetAmount,
                orders[0].signature,
            );
        } else if (constants.BATCH_FILL_FN_NAMES.indexOf(fnName) !== -1) {
            data = (exchangeInstance as any)[fnName].getABIEncodedTransactionData(
                orders,
                orders.map(order => order.takerAssetAmount),
                orders.map(order => order.signature),
            );
        } else if (constants.MARKET_FILL_FN_NAMES.indexOf(fnName) !== -1) {
            data = (exchangeInstance as any)[fnName].getABIEncodedTransactionData(
                orders,
                orders.map(order => order.takerAssetAmount).reduce((prev, curr) => prev.plus(curr)),
                orders.map(order => order.signature),
            );
        } else if (fnName === constants.MATCH_ORDERS) {
            data = exchangeInstance.matchOrders.getABIEncodedTransactionData(
                orders[0],
                orders[1],
                orders[0].signature,
                orders[1].signature,
            );
        } else if (fnName === constants.CANCEL_ORDER) {
            data = exchangeInstance.cancelOrder.getABIEncodedTransactionData(orders[0]);
        } else if (fnName === constants.BATCH_CANCEL_ORDERS) {
            data = exchangeInstance.batchCancelOrders.getABIEncodedTransactionData(orders);
        } else if (fnName === constants.CANCEL_ORDERS_UP_TO) {
            data = exchangeInstance.cancelOrdersUpTo.getABIEncodedTransactionData(devConstants.ZERO_AMOUNT);
        } else {
            throw new Error(`Error: ${fnName} not a supported function`);
        }
        return data;
    },
};
