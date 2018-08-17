import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

export interface Client {
    getAssetPairsAsync: (requestOpts?: AssetPairsRequestOpts & PagedRequestOpts) => Promise<PaginatedCollection<AssetPairsItem>>;
    getOrdersAsync: (requestOpts?: OrdersRequestOpts & PagedRequestOpts) => Promise<PaginatedCollection<APIOrder>>;
    getOrderAsync: (orderHash: string) => Promise<APIOrder>;
    getOrderbookAsync: (request: OrderbookRequest, requestOpts?: PagedRequestOpts) => Promise<OrderbookResponse>;
    getOrderConfigAsync: (request: OrderConfigRequest) => Promise<OrderConfigResponse>;
    getFeeRecipientsAsync: (requestOpts?: PagedRequestOpts) => Promise<FeeRecipientsResponse>;
    submitOrderAsync: (signedOrder: SignedOrder) => Promise<void>;
}

export interface OrdersChannel {
    subscribe: (subscriptionOpts: OrdersChannelSubscriptionOpts) => void;
    close: () => void;
}

/**
 * baseAssetData: The address of assetData designated as the baseToken in the currency pair calculation of price
 * quoteAssetData: The address of assetData designated as the quoteToken in the currency pair calculation of price
 * limit: Maximum number of bids and asks in orderbook snapshot
 */
export interface OrdersChannelSubscriptionOpts {
    baseAssetData: string;
    quoteAssetData: string;
    limit: number;
}

export interface OrdersChannelHandler {
    onUpdate: (
        channel: OrdersChannel,
        subscriptionOpts: OrdersChannelSubscriptionOpts,
        order: APIOrder,
    ) => void;
    onError: (channel: OrdersChannel, err: Error, subscriptionOpts?: OrdersChannelSubscriptionOpts) => void;
    onClose: (channel: OrdersChannel) => void;
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

export type OrdersResponse = PaginatedCollection<APIOrder>;

export interface APIOrder {
    order: SignedOrder;
    metaData: object;
}

export interface AssetPairsRequestOpts {
    assetDataA?: string;
    assetDataB?: string;
}

export type AssetPairsResponse = PaginatedCollection<AssetPairsItem>;

export interface AssetPairsItem {
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
    makerAssetProxyId?: string;
    takerAssetProxyId?: string;
    makerAssetAddress?: string;
    takerAssetAddress?: string;
    exchangeAddress?: string;
    senderAddress?: string;
    makerAssetData?: string;
    takerAssetData?: string;
    makerAddress?: string;
    takerAddress?: string;
    traderAddress?: string;
    feeRecipientAddress?: string;
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
    makerAddress: string;
    takerAddress: string;
    makerAssetAmount: string;
    takerAssetAmount: string;
    makerAssetData: string;
    takerAssetData: string;
    exchangeAddress: string;
    expirationTimeSeconds: string;
}

export interface OrderConfigResponse {
    makerFee: BigNumber;
    takerFee: BigNumber;
    feeRecipientAddress: string;
    senderAddress: string;
}

export type FeeRecipientsResponse = PaginatedCollection<string>;

export interface RequestOpts {
    networkId?: number;
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
