import {
    APIOrder,
    OrdersChannelSubscriptionOpts,
} from '@0x/types';

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
