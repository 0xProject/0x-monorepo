import {SignedOrder} from './types';

export interface RelayerApiTokenTradeInfo {
    address: string;
    symbol: string;
    decimals: number;
    minAmount: string;
    maxAmount: string;
    precision: number;
}

export interface RelayerApiTokenTradeInfo {
    tokenA: RelayerApiTokenTradeInfo;
    tokenB: RelayerApiTokenTradeInfo;
}

export type OrderState = 'OPEN'|'EXPIRED'|'CLOSED'|'UNFUNDED';

export interface RelayerApiOrderResponse {
    signedOrder: SignedOrder;
    state: OrderState;
    pending: {
        fillAmount: number;
        cancelAmount: number;
    };
    remainingTakerTokenAmount: number;
}

export interface RelayerApiFeesRequest {
    maker: string;
    taker: string;
    makerTokenAddress: string;
    takerTokenAddress: string;
    makerTokenAmount: string;
    takerTokenAmount: string;
}

export interface RelayerApiFeesResponse {
    makerFee: string;
    takerFee: string;
    feesRecipient: string;
    takerToSpecify: string;
}
