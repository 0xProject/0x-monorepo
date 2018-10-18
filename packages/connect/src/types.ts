import {
    APIOrder,
    AssetPairsItem,
    AssetPairsRequestOpts,
    FeeRecipientsResponse,
    OrderbookRequest,
    OrderbookResponse,
    OrderConfigRequest,
    OrderConfigResponse,
    OrdersChannelSubscriptionOpts,
    OrdersRequestOpts,
    PagedRequestOpts,
    PaginatedCollection,
    SignedOrder,
} from '@0x/types';

export interface Client {
    getAssetPairsAsync: (
        requestOpts?: AssetPairsRequestOpts & PagedRequestOpts,
    ) => Promise<PaginatedCollection<AssetPairsItem>>;
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

export interface OrdersChannelHandler {
    onUpdate: (channel: OrdersChannel, subscriptionOpts: OrdersChannelSubscriptionOpts, orders: APIOrder[]) => void;
    onError: (channel: OrdersChannel, err: Error, subscriptionOpts?: OrdersChannelSubscriptionOpts) => void;
    onClose: (channel: OrdersChannel) => void;
}

export interface HttpRequestOptions {
    params?: object;
    payload?: object;
}

export enum HttpRequestType {
    Get = 'GET',
    Post = 'POST',
}
