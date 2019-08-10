import { ExchangeFunctionName } from './types';

export const constants = {
    // These are functions not secured by the `nonReentrant`, directly or
    // indirectly (by calling a function that has the modifier).
    REENTRANT_FUNCTIONS: [
        'batchExecuteTransactions',
        'executeTransaction',
        'registerAssetProxy',
        'simulateDispatchTransferFromCalls',
        'transferOwnership',
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
    MARKET_FILL_FN_NAMES: [ExchangeFunctionName.MarketBuyOrders, ExchangeFunctionName.MarketSellOrders],
};

export enum ValidatorWalletAction {
    Reject = 0,
    Accept = 1,
    Revert = 2,
    UpdateState = 3,
    MatchSignatureHash = 4,
    NTypes = 5,
}

export enum ValidatorWalletDataType {
    None = 0,
    Order = 1,
    ZeroExTransaction = 2,
    NTypes = 3,
}
