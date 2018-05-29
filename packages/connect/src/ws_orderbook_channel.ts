import * as _ from 'lodash';
import * as WebSocket from 'websocket';

import {
    OrderbookChannel,
    OrderbookChannelHandler,
    OrderbookChannelMessageTypes,
    OrderbookChannelSubscriptionOpts,
    WebsocketClientEventType,
    WebsocketConnectionEventType,
} from './types';
import { assert } from './utils/assert';
import { orderbookChannelMessageParser } from './utils/orderbook_channel_message_parser';

interface Subscription {
    subscriptionOpts: OrderbookChannelSubscriptionOpts;
    handler: OrderbookChannelHandler;
}

/**
 * This class includes all the functionality related to interacting with a websocket endpoint
 * that implements the standard relayer API v0
 */
export class WebSocketOrderbookChannel implements OrderbookChannel {
    private _client: WebSocket.w3cwebsocket;
    private _subscriptions: Subscription[] = [];
    /**
     * Instantiates a new WebSocketOrderbookChannel instance
     * @param   url                 The relayer API base WS url you would like to interact with
     * @return  An instance of WebSocketOrderbookChannel
     */
    constructor(client: WebSocket.w3cwebsocket) {
        this._client = client;
        this._client.onerror = err => {
            this._alertAllHandlersToError(err);
        };
        this._client.onclose = () => {
            this._alertAllHandlersToClose();
        };
        this._client.onmessage = message => {
            this._handleWebSocketMessage(message);
        };
    }
    /**
     * Subscribe to orderbook snapshots and updates from the websocket
     * @param   subscriptionOpts     An OrderbookChannelSubscriptionOpts instance describing which
     *                               token pair to subscribe to
     * @param   handler              An OrderbookChannelHandler instance that responds to various
     *                               channel updates
     */
    public subscribe(subscriptionOpts: OrderbookChannelSubscriptionOpts, handler: OrderbookChannelHandler): void {
        assert.isOrderbookChannelSubscriptionOpts('subscriptionOpts', subscriptionOpts);
        assert.isOrderbookChannelHandler('handler', handler);
        assert.assert(this._client.readyState === WebSocket.w3cwebsocket.OPEN, 'WebSocket connection is closed');
        const newSubscription: Subscription = {
            subscriptionOpts,
            handler,
        };
        this._subscriptions.push(newSubscription);
        // TODO: update requestId management to use UUIDs for v2
        const subscribeMessage = {
            type: 'subscribe',
            channel: 'orderbook',
            requestId: this._subscriptions.length - 1,
            payload: subscriptionOpts,
        };
        this._client.send(JSON.stringify(subscribeMessage));
    }
    /**
     * Close the websocket and stop receiving updates
     */
    public close(): void {
        this._client.close();
    }
    /**
     * For use in cases where we need to alert all handlers of an error
     */
    private _alertAllHandlersToError(error: Error): void {
        _.forEach(this._subscriptions, subscription => {
            subscription.handler.onError(this, subscription.subscriptionOpts, error);
        });
    }
    private _alertAllHandlersToClose(): void {
        _.forEach(this._subscriptions, subscription => {
            subscription.handler.onClose(this, subscription.subscriptionOpts);
        });
    }
    private _handleWebSocketMessage(message: any): void {
        // if we get a message with no data, alert all handlers and return
        if (_.isUndefined(message.data)) {
            this._alertAllHandlersToError(new Error(`Message does not contain utf8Data`));
            return;
        }
        // try to parse the message data and route it to the correct handler
        try {
            const utf8Data = message.data;
            const parserResult = orderbookChannelMessageParser.parse(utf8Data);
            const subscription = this._subscriptions[parserResult.requestId];
            if (_.isUndefined(subscription)) {
                this._alertAllHandlersToError(new Error(`Message has unknown requestId: ${utf8Data}`));
                return;
            }
            const handler = subscription.handler;
            const subscriptionOpts = subscription.subscriptionOpts;
            switch (parserResult.type) {
                case OrderbookChannelMessageTypes.Snapshot: {
                    handler.onSnapshot(this, subscriptionOpts, parserResult.payload);
                    break;
                }
                case OrderbookChannelMessageTypes.Update: {
                    handler.onUpdate(this, subscriptionOpts, parserResult.payload);
                    break;
                }
                default: {
                    handler.onError(
                        this,
                        subscriptionOpts,
                        new Error(`Message has unknown type parameter: ${utf8Data}`),
                    );
                }
            }
        } catch (error) {
            this._alertAllHandlersToError(error);
        }
    }
}
