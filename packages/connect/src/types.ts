import { ECSignature, Order, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

export interface Client {
    getTokenPairsAsync: (requestOpts?: TokenPairsRequestOpts & PagedRequestOpts) => Promise<TokenPairsItem[]>;
    getOrdersAsync: (requestOpts?: OrdersRequestOpts & PagedRequestOpts) => Promise<SignedOrder[]>;
    getOrderAsync: (orderHash: string) => Promise<SignedOrder>;
    getOrderbookAsync: (request: OrderbookRequest, requestOpts?: PagedRequestOpts) => Promise<OrderbookResponse>;
    getFeesAsync: (request: FeesRequest) => Promise<FeesResponse>;
    submitOrderAsync: (signedOrder: SignedOrder) => Promise<void>;
}

export interface OrderbookChannel {
    subscribe: (subscriptionOpts: OrderbookChannelSubscriptionOpts, handler: OrderbookChannelHandler) => void;
    close: () => void;
}

/**
 * heartbeatInterval: Interval in milliseconds that the orderbook channel should ping the underlying websocket. Default: 15000
 */
export interface WebSocketOrderbookChannelConfig {
    heartbeatIntervalMs?: number;
}

/**
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

export interface OrderbookChannelHandler {
    onSnapshot: (
        channel: OrderbookChannel,
        subscriptionOpts: OrderbookChannelSubscriptionOpts,
        snapshot: OrderbookResponse,
    ) => void;
    onUpdate: (
        channel: OrderbookChannel,
        subscriptionOpts: OrderbookChannelSubscriptionOpts,
        order: SignedOrder,
    ) => void;
    onError: (channel: OrderbookChannel, subscriptionOpts: OrderbookChannelSubscriptionOpts, err: Error) => void;
    onClose: (channel: OrderbookChannel, subscriptionOpts: OrderbookChannelSubscriptionOpts) => void;
}

export type OrderbookChannelMessage =
    | SnapshotOrderbookChannelMessage
    | UpdateOrderbookChannelMessage
    | UnknownOrderbookChannelMessage;

export enum OrderbookChannelMessageTypes {
    Snapshot = 'snapshot',
    Update = 'update',
    Unknown = 'unknown',
}

export interface SnapshotOrderbookChannelMessage {
    type: OrderbookChannelMessageTypes.Snapshot;
    requestId: number;
    payload: OrderbookResponse;
}

export interface UpdateOrderbookChannelMessage {
    type: OrderbookChannelMessageTypes.Update;
    requestId: number;
    payload: SignedOrder;
}

export interface UnknownOrderbookChannelMessage {
    type: OrderbookChannelMessageTypes.Unknown;
    requestId: number;
    payload: undefined;
}

export enum WebsocketConnectionEventType {
    Close = 'close',
    Error = 'error',
    Message = 'message',
}

export enum WebsocketClientEventType {
    Connect = 'connect',
    ConnectFailed = 'connectFailed',
}

export interface TokenPairsRequestOpts {
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

export interface OrdersRequestOpts {
    exchangeContractAddress?: string;
    tokenAddress?: string;
    makerTokenAddress?: string;
    takerTokenAddress?: string;
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

export interface PagedRequestOpts {
    page?: number;
    perPage?: number;
}

export interface HttpRequestOptions {
    params?: object;
    payload?: object;
}

export enum HttpRequestType {
    Get = 'GET',
    Post = 'POST',
}
