import { ExchangeFunctionName } from './types';

export const constants = {
    // These are functions not secured by the `nonReentrant`, directly or
    // indirectly (by calling a function that has the modifier).
    REENTRANT_FUNCTIONS: [
        ExchangeFunctionName.BatchExecuteTransactions,
        ExchangeFunctionName.ExecuteTransaction,
        ExchangeFunctionName.RegisterAssetProxy,
        ExchangeFunctionName.SimulateDispatchTransferFromCalls,
        ExchangeFunctionName.TransferOwnership,
        ExchangeFunctionName.SetProtocolFeeMultiplier,
        ExchangeFunctionName.SetProtocolFeeCollectorAddress,
    ],
    SINGLE_FILL_FN_NAMES: [ExchangeFunctionName.FillOrder, ExchangeFunctionName.FillOrKillOrder],
    BATCH_FILL_FN_NAMES: [
        ExchangeFunctionName.BatchFillOrders,
        ExchangeFunctionName.BatchFillOrKillOrders,
        ExchangeFunctionName.BatchFillOrdersNoThrow,
    ],
    MARKET_FILL_FN_NAMES: [
        ExchangeFunctionName.MarketBuyOrdersFillOrKill,
        ExchangeFunctionName.MarketSellOrdersFillOrKill,
        ExchangeFunctionName.MarketBuyOrdersNoThrow,
        ExchangeFunctionName.MarketSellOrdersNoThrow,
    ],
    MATCH_ORDER_FN_NAMES: [
        ExchangeFunctionName.MatchOrders,
        ExchangeFunctionName.MatchOrdersWithMaximalFill,
    ],
    BATCH_MATCH_ORDER_FN_NAMES: [
        ExchangeFunctionName.BatchMatchOrders,
        ExchangeFunctionName.BatchMatchOrdersWithMaximalFill,
    ],
    CANCEL_ORDER_FN_NAMES: [
        ExchangeFunctionName.CancelOrder,
        ExchangeFunctionName.BatchCancelOrders,
        ExchangeFunctionName.CancelOrdersUpTo,
    ],
};

export enum ValidatorWalletAction {
    Reject = 0,
    Accept = 1,
    Revert = 2,
    UpdateState = 3,
    MatchSignatureHash = 4,
    ReturnTrue = 5,
    ReturnNothing = 6,
    NTypes = 7,
}
