import { constants, provider } from '@0x/contracts-test-utils';
import { orderHashUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';

import { constants as exchangeConstants, ExchangeFunctionName, IExchangeContract } from '../../src';

export const exchangeDataEncoder = {
    encodeOrdersToExchangeData(fnName: ExchangeFunctionName, orders: SignedOrder[] = []): string {
        const exchangeInstance = new IExchangeContract(constants.NULL_ADDRESS, provider);
        let data;
        if (exchangeConstants.SINGLE_FILL_FN_NAMES.indexOf(fnName) !== -1) {
            data = (exchangeInstance as any)
                [fnName](orders[0], orders[0].takerAssetAmount, orders[0].signature)
                .getABIEncodedTransactionData();
        } else if (exchangeConstants.BATCH_FILL_FN_NAMES.indexOf(fnName) !== -1) {
            data = (exchangeInstance as any)
                [fnName](orders, orders.map(order => order.takerAssetAmount), orders.map(order => order.signature))
                .getABIEncodedTransactionData();
        } else if (exchangeConstants.MARKET_FILL_FN_NAMES.indexOf(fnName) !== -1) {
            const fillAsset = /Buy/.test(fnName) ? 'makerAssetAmount' : 'takerAssetAmount';
            data = (exchangeInstance as any)
                [fnName](
                    orders,
                    orders.map(order => order[fillAsset]).reduce((prev, curr) => prev.plus(curr)),
                    orders.map(order => order.signature),
                )
                .getABIEncodedTransactionData();
        } else if (exchangeConstants.MATCH_ORDER_FN_NAMES.indexOf(fnName) !== -1) {
            data = exchangeInstance
                .matchOrders(orders[0], orders[1], orders[0].signature, orders[1].signature)
                .getABIEncodedTransactionData();
        } else if (fnName === ExchangeFunctionName.CancelOrder) {
            data = exchangeInstance.cancelOrder(orders[0]).getABIEncodedTransactionData();
        } else if (fnName === ExchangeFunctionName.BatchCancelOrders) {
            data = exchangeInstance.batchCancelOrders(orders).getABIEncodedTransactionData();
        } else if (fnName === ExchangeFunctionName.CancelOrdersUpTo) {
            data = exchangeInstance.cancelOrdersUpTo(constants.ZERO_AMOUNT).getABIEncodedTransactionData();
        } else if (fnName === ExchangeFunctionName.PreSign) {
            data = exchangeInstance.preSign(orderHashUtils.getOrderHashHex(orders[0])).getABIEncodedTransactionData();
        } else if (fnName === ExchangeFunctionName.SetSignatureValidatorApproval) {
            data = exchangeInstance
                .setSignatureValidatorApproval(constants.NULL_ADDRESS, true)
                .getABIEncodedTransactionData();
        } else {
            throw new Error(`Error: ${fnName} not a supported function`);
        }
        return data;
    },
};
