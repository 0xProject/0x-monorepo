import { BigNumber } from '@0x/utils';

export const constants = {
    SINGLE_FILL_FN_NAMES: ['fillOrder', 'fillOrKillOrder', 'fillOrderNoThrow'],
    BATCH_FILL_FN_NAMES: ['batchFillOrders', 'batchFillOrKillOrders', 'batchFillOrdersNoThrow'],
    MARKET_FILL_FN_NAMES: ['marketBuyOrders', 'marketBuyOrdersNoThrow', 'marketSellOrders', 'marketSellOrdersNoThrow'],
    MATCH_ORDERS: 'matchOrders',
    CANCEL_ORDERS: 'cancelOrders',
    BATCH_CANCEL_ORDERS: 'batchCancelOrders',
    CANCEL_ORDERS_UP_TO: 'cancelOrdersUpTo',
    TIME_BUFFER: new BigNumber(1000),
};
