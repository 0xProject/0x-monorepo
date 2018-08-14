import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

export interface Client {
    getAssetPairsAsync: (requestOpts?: AssetPairsRequestOpts & PagedRequestOpts) => Promise<PaginatedCollection<TokenPairsItem>>;
    getOrdersAsync: (requestOpts?: OrdersRequestOpts & PagedRequestOpts) => Promise<PaginatedCollection<APIOrder>>;
    getOrderAsync: (orderHash: string) => Promise<APIOrder>;
    getOrderbookAsync: (request: OrderbookRequest, requestOpts?: PagedRequestOpts) => Promise<OrderbookResponse>;
    getOrderConfigAsync: (request: OrderConfigRequest) => Promise<OrderConfigResponse>;
    getFeeRecipients: () => Promise<PaginatedCollection<string>>;
    submitOrderAsync: (signedOrder: SignedOrder) => Promise<void>;
}

export interface OrderbookChannel {
    subscribe: (subscriptionOpts: OrderbookChannelSubscriptionOpts) => void;
    close: () => void;
}

/**
 * baseAssetData: The address of assetData designated as the baseToken in the currency pair calculation of price
 * quoteAssetData: The address of assetData designated as the quoteToken in the currency pair calculation of price
 * snapshot: If true, a snapshot of the orderbook will be sent before the updates to the orderbook
 * limit: Maximum number of bids and asks in orderbook snapshot
 */
export interface OrderbookChannelSubscriptionOpts {
    baseAssetData: string;
    quoteAssetData: string;
    snapshot: boolean;
    limit: number;
}

export interface OrderbookChannelHandler {
    onUpdate: (
        channel: OrderbookChannel,
        subscriptionOpts: OrderbookChannelSubscriptionOpts,
        order: APIOrder,
    ) => void;
    onError: (channel: OrderbookChannel, err: Error, subscriptionOpts?: OrderbookChannelSubscriptionOpts) => void;
    onClose: (channel: OrderbookChannel) => void;
}

export type OrdersChannelMessage =
    | UpdateOrdersChannelMessage
    | UnknownOrdersChannelMessage;

export enum OrdersChannelMessageTypes {
    Update = 'update',
    Unknown = 'unknown',
}

export interface UpdateOrdersChannelMessage {
    type: OrdersChannelMessageTypes.Update;
    requestId: number;
    payload: APIOrder;
}

export interface UnknownOrdersChannelMessage {
    type: OrdersChannelMessageTypes.Unknown;
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

export interface APIOrder {
    order: SignedOrder;
    metaData: object;
}

export interface AssetPairsRequestOpts {
    assetDataA?: string;
    assetDataB?: string;
}

export interface TokenPairsItem {
    assetDataA: Asset;
    assetDataB: Asset;
}

export interface Asset {
    assetData: string;
    minAmount: BigNumber;
    maxAmount: BigNumber;
    precision: number;
}

export interface OrdersRequestOpts {
    exchangeAddress?: string;
    tokenAddress?: string;
    makerTokenAddress?: string;
    takerTokenAddress?: string;
    maker?: string;
    taker?: string;
    trader?: string;
    feeRecipient?: string;
}

export interface OrderbookRequest {
    baseAssetData: string;
    quoteAssetData: string;
}

export interface OrderbookResponse {
    bids: PaginatedCollection<APIOrder>;
    asks: PaginatedCollection<APIOrder>;
}

export interface PaginatedCollection<T> {
    total: number;
    page: number;
    perPage: number;
    records: T[];
}

export interface OrderConfigRequest {
    exchangeAddress: string;
    maker: string;
    taker: string;
    makerTokenAddress: string;
    takerTokenAddress: string;
    makerAssetAmount: BigNumber;
    takerAssetAmount: BigNumber;
    expirationTimeSeconds: BigNumber;
    salt: BigNumber;
}

export interface OrderConfigResponse {
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
