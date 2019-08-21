import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

export interface AbiDecodedFillOrderData {
    order: SignedOrder;
    takerAssetFillAmount: BigNumber;
    signature: string;
}

export enum ExchangeFunctionName {
    BatchCancelOrders = 'batchCancelOrders',
    BatchExecuteTransactions = 'batchExecuteTransactions',
    BatchFillOrKillOrders = 'batchFillOrKillOrders',
    BatchFillOrders = 'batchFillOrders',
    BatchFillOrdersNoThrow = 'batchFillOrdersNoThrow',
    BatchMatchOrders = 'batchMatchOrders',
    BatchMatchordersWithMaximalFill = 'batchMatchOrdersWithMaximalFill',
    CancelOrder = 'cancelOrder',
    CancelOrdersUpTo = 'cancelOrdersUpTo',
    ExecuteTransaction = 'executeTransaction',
    FillOrKillOrder = 'fillOrKillOrder',
    FillOrder = 'fillOrder',
    FillOrderNoThrow = 'fillOrderNoThrow',
    MarketBuyOrders = 'marketBuyOrders',
    MarketSellOrders = 'marketSellOrders',
    MatchOrders = 'matchOrders',
    MatchOrdersWithMaximalFill = 'matchOrdersWithMaximalFill',
    PreSign = 'preSign',
    RegisterAssetProxy = 'registerAssetProxy',
    SetSignatureValidatorApproval = 'setSignatureValidatorApproval',
    SimulateDispatchTransferFromCalls = 'simulateDispatchTransferFromCalls',
    TransferOwnership = 'transferOwnership',
    UpdateProtocolFeeMultiplier = 'updateProtocolFeeMultiplier',
    UpdateStakingAddress = 'updateStakingAddress',
    UpdateWethAddress = 'updateWethAddress',
}
