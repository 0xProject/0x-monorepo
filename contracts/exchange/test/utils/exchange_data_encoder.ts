import { constants, provider } from '@0x/contracts-test-utils';
import { orderHashUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';

import { artifacts, constants as exchangeConstants, ExchangeFunctionName, IExchangeContract } from '../../src';

export const exchangeDataEncoder = {
    encodeOrdersToExchangeData(fnName: ExchangeFunctionName, orders: SignedOrder[] = []): string {
        const exchangeInstance = new IExchangeContract(
            artifacts.IExchange.compilerOutput.abi,
            constants.NULL_ADDRESS,
            provider,
        );
        let data;
        if (exchangeConstants.SINGLE_FILL_FN_NAMES.indexOf(fnName) !== -1) {
            data = (exchangeInstance as any)[fnName].getABIEncodedTransactionData(
                orders[0],
                orders[0].takerAssetAmount,
                orders[0].signature,
            );
        } else if (exchangeConstants.BATCH_FILL_FN_NAMES.indexOf(fnName) !== -1) {
            data = (exchangeInstance as any)[fnName].getABIEncodedTransactionData(
                orders,
                orders.map(order => order.takerAssetAmount),
                orders.map(order => order.signature),
            );
        } else if (exchangeConstants.MARKET_FILL_FN_NAMES.indexOf(fnName) !== -1) {
            data = (exchangeInstance as any)[fnName].getABIEncodedTransactionData(
                orders,
                orders.map(order => order.takerAssetAmount).reduce((prev, curr) => prev.plus(curr)),
                orders.map(order => order.signature),
            );
        } else if (fnName === ExchangeFunctionName.MatchOrders) {
            data = exchangeInstance.matchOrders.getABIEncodedTransactionData(
                orders[0],
                orders[1],
                orders[0].signature,
                orders[1].signature,
            );
        } else if (fnName === ExchangeFunctionName.CancelOrder) {
            data = exchangeInstance.cancelOrder.getABIEncodedTransactionData(orders[0]);
        } else if (fnName === ExchangeFunctionName.BatchCancelOrders) {
            data = exchangeInstance.batchCancelOrders.getABIEncodedTransactionData(orders);
        } else if (fnName === ExchangeFunctionName.CancelOrdersUpTo) {
            data = exchangeInstance.cancelOrdersUpTo.getABIEncodedTransactionData(constants.ZERO_AMOUNT);
        } else if (fnName === ExchangeFunctionName.PreSign) {
            data = exchangeInstance.preSign.getABIEncodedTransactionData(orderHashUtils.getOrderHashHex(orders[0]));
        } else if (fnName === ExchangeFunctionName.SetSignatureValidatorApproval) {
            data = exchangeInstance.setSignatureValidatorApproval.getABIEncodedTransactionData(
                constants.NULL_ADDRESS,
                true,
            );
        } else if (fnName === ExchangeFunctionName.SetOrderValidatorApproval) {
            data = exchangeInstance.setOrderValidatorApproval.getABIEncodedTransactionData(
                constants.NULL_ADDRESS,
                true,
            );
        } else {
            throw new Error(`Error: ${fnName} not a supported function`);
        }
        return data;
    },
};
