import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

export interface AbiDecodedFillOrderData {
    order: SignedOrder;
    takerAssetFillAmount: BigNumber;
    signature: string;
}

export enum ExchangeFunctionName {
    FillOrder = 'fillOrder',
    FillOrKillOrder = 'fillOrKillOrder',
    FillOrderNoThrow = 'fillOrderNoThrow',
    BatchFillOrders = 'batchFillOrders',
    BatchFillOrKillOrders = 'batchFillOrKillOrders',
    BatchFillOrdersNoThrow = 'batchFillOrdersNoThrow',
    MarketBuyOrders = 'marketBuyOrders',
    MarketSellOrders = 'marketSellOrders',
    MatchOrders = 'matchOrders',
    CancelOrder = 'cancelOrder',
    BatchCancelOrders = 'batchCancelOrders',
    CancelOrdersUpTo = 'cancelOrdersUpTo',
    PreSign = 'preSign',
    SetSignatureValidatorApproval = 'setSignatureValidatorApproval',
}
