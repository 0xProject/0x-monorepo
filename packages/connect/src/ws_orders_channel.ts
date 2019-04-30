import { OrdersChannelMessageTypes, OrdersChannelSubscriptionOpts } from '@0x/types';
import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
import * as WebSocket from 'websocket';

import { OrdersChannel, OrdersChannelHandler } from './types';
import { assert } from './utils/assert';
import { ordersChannelMessageParser } from './utils/orders_channel_message_parser';

export interface OrdersChannelSubscriptionOptsMap {
    [key: string]: OrdersChannelSubscriptionOpts;
}

/**
 * This class includes all the functionality related to interacting with a websocket endpoint
 * that implements the standard relayer API v0
 */
export class WebSocketOrdersChannel implements OrdersChannel {
    private readonly _client: WebSocket.w3cwebsocket;
    private readonly _handler: OrdersChannelHandler;
    private readonly _subscriptionOptsMap: OrdersChannelSubscriptionOptsMap = {};
    /**
     * Instantiates a new WebSocketOrdersChannel instance
     * @param   client               A WebSocket client
     * @param   handler              An OrdersChannelHandler instance that responds to various
     *                               channel updates
     * @return  An instance of WebSocketOrdersChannel
     */
    constructor(client: WebSocket.w3cwebsocket, handler: OrdersChannelHandler) {
        assert.isOrdersChannelHandler('handler', handler);
        // set private members
        this._client = client;
        this._handler = handler;
        // attach client callbacks
        this._client.onerror = err => {
            this._handler.onError(this, err);
        };
        this._client.onclose = () => {
            this._handler.onClose(this);
        };
        this._client.onmessage = message => {
            this._handleWebSocketMessage(message);
        };
    }
    /**
     * Subscribe to orderbook snapshots and updates from the websocket
     * @param   subscriptionOpts     An OrdersChannelSubscriptionOpts instance describing which
     *                               assetData pair to subscribe to
     */
    public subscribe(subscriptionOpts: OrdersChannelSubscriptionOpts): void {
        assert.isOrdersChannelSubscriptionOpts('subscriptionOpts', subscriptionOpts);
        assert.assert(this._client.readyState === WebSocket.w3cwebsocket.OPEN, 'WebSocket connection is closed');
        const requestId = uuid();
        this._subscriptionOptsMap[requestId] = subscriptionOpts;
        const subscribeMessage = {
            type: 'subscribe',
            channel: 'orders',
            requestId,
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
    private _handleWebSocketMessage(message: any): void {
        if (message.data === undefined) {
            this._handler.onError(this, new Error(`Message does not contain data. Url: ${this._client.url}`));
            return;
        }
        try {
            const data = message.data;
            const parserResult = ordersChannelMessageParser.parse(data);
            const subscriptionOpts = this._subscriptionOptsMap[parserResult.requestId];
            if (subscriptionOpts === undefined) {
                this._handler.onError(
                    this,
                    new Error(`Message has unknown requestId. Url: ${this._client.url} Message: ${data}`),
                );
                return;
            }
            switch (parserResult.type) {
                case OrdersChannelMessageTypes.Update: {
                    this._handler.onUpdate(this, subscriptionOpts, parserResult.payload);
                    break;
                }
                default: {
                    this._handler.onError(
                        this,
                        new Error(`Message has unknown type parameter. Url: ${this._client.url} Message: ${data}`),
                        subscriptionOpts,
                    );
                }
            }
        } catch (error) {
            this._handler.onError(this, error);
        }
    }
}
