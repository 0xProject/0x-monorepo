import { ExchangeFunctionName } from './types';

export const constants = {
    FUNCTIONS_WITH_MUTEX: [
        'FILL_ORDER',
        'FILL_OR_KILL_ORDER',
        'BATCH_FILL_ORDERS',
        'BATCH_FILL_OR_KILL_ORDERS',
        'MARKET_BUY_ORDERS',
        'MARKET_SELL_ORDERS',
        'MATCH_ORDERS',
        'CANCEL_ORDER',
        'BATCH_CANCEL_ORDERS',
        'CANCEL_ORDERS_UP_TO',
        'PRE_SIGN',
        'SET_SIGNATURE_VALIDATOR_APPROVAL',
        'SET_ORDER_VALIDATOR_APPROVAL',
    ],
    SINGLE_FILL_FN_NAMES: [
        ExchangeFunctionName.FillOrder,
        ExchangeFunctionName.FillOrKillOrder,
        ExchangeFunctionName.FillOrderNoThrow,
    ],
    BATCH_FILL_FN_NAMES: [
        ExchangeFunctionName.BatchFillOrders,
        ExchangeFunctionName.BatchFillOrKillOrders,
        ExchangeFunctionName.BatchFillOrdersNoThrow,
    ],
    MARKET_FILL_FN_NAMES: [
        ExchangeFunctionName.MarketBuyOrders,
        ExchangeFunctionName.MarketBuyOrdersNoThrow,
        ExchangeFunctionName.MarketSellOrders,
        ExchangeFunctionName.MarketSellOrdersNoThrow,
    ],
};

export enum ValidatorWalletAction {
    Reject = 0,
    Accept = 1,
    Revert = 2,
    UpdateState = 3,
    ValidateSignature = 4,
    NTypes = 5,
}
