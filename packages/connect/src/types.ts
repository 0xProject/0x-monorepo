import {SignedOrder} from '0x.js';
import {BigNumber} from 'bignumber.js';

export interface Client {
    getTokenPairsAsync: (request?: TokenPairsRequest) => Promise<TokenPairsItem[]>;
    getOrdersAsync: (request?: OrdersRequest) => Promise<SignedOrder[]>;
    getOrderAsync: (orderHash: string) => Promise<SignedOrder>;
    getOrderbookAsync: (request: OrderbookRequest) => Promise<OrderbookResponse>;
    getFeesAsync: (request: FeesRequest) => Promise<FeesResponse>;
    submitOrderAsync: (signedOrder: SignedOrder) => Promise<void>;
}

export interface OrderbookChannel {
    subscribe: (subscriptionOpts: OrderbookChannelSubscriptionOpts, handler: OrderbookChannelHandler) => void;
    close: () => void;
}

export interface OrderbookChannelHandler {
    onSnapshot: (channel: OrderbookChannel, snapshot: OrderbookResponse) => void;
    onUpdate: (channel: OrderbookChannel, order: SignedOrder) => void;
    onError: (channel: OrderbookChannel, err: Error) => void;
    onClose: (channel: OrderbookChannel) => void;
}

export type OrderbookChannelMessage =
    SnapshotOrderbookChannelMessage |
    UpdateOrderbookChannelMessage |
    UnknownOrderbookChannelMessage;

export enum OrderbookChannelMessageTypes {
    Snapshot = 'snapshot',
    Update = 'update',
    Unknown = 'unknown',
}

export interface SnapshotOrderbookChannelMessage {
    type: OrderbookChannelMessageTypes.Snapshot;
    payload: OrderbookResponse;
}

export interface UpdateOrderbookChannelMessage {
    type: OrderbookChannelMessageTypes.Update;
    payload: SignedOrder;
}

export interface UnknownOrderbookChannelMessage {
    type: OrderbookChannelMessageTypes.Unknown;
    payload: undefined;
}

/*
 * baseTokenAddress: The address of token designated as the baseToken in the currency pair calculation of price
 * quoteTokenAddress: The address of token designated as the quoteToken in the currency pair calculation of price
 * snapshot: If true, a snapshot of the orderbook will be sent before the updates to the orderbook
 * limit: Maximum number of bids and asks in orderbook snapshot
 */
export interface OrderbookChannelSubscriptionOpts {
    baseTokenAddress: string;
    quoteTokenAddress: string;
    snapshot: boolean;
    limit: number;
}

export interface TokenPairsRequest {
    tokenA?: string;
    tokenB?: string;
}

export interface TokenPairsItem {
    tokenA: TokenTradeInfo;
    tokenB: TokenTradeInfo;
}

export interface TokenTradeInfo {
    address: string;
    minAmount: BigNumber;
    maxAmount: BigNumber;
    precision: number;
}

export interface OrdersRequest {
    exchangeContractAddress?: string;
    tokenAddress?: string;
    makerTokenAddress?: string;
    takerTokenAddress?: string;
    tokenA?: string;
    tokenB?: string;
    maker?: string;
    taker?: string;
    trader?: string;
    feeRecipient?: string;
}

export interface OrderbookRequest {
    baseTokenAddress: string;
    quoteTokenAddress: string;
}

export interface OrderbookResponse {
    bids: SignedOrder[];
    asks: SignedOrder[];
}

export interface FeesRequest {
    exchangeContractAddress: string;
    maker: string;
    taker: string;
    makerTokenAddress: string;
    takerTokenAddress: string;
    makerTokenAmount: BigNumber;
    takerTokenAmount: BigNumber;
    expirationUnixTimestampSec: BigNumber;
    salt: BigNumber;
}

export interface FeesResponse {
    feeRecipient: string;
    makerFee: BigNumber;
    takerFee: BigNumber;
}
