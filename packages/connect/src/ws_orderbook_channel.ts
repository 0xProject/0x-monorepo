import * as _ from 'lodash';
import * as WebSocket from 'websocket';

import {
    OrderbookChannel,
    OrderbookChannelHandler,
    OrderbookChannelSubscriptionOpts,
    OrdersChannelMessageTypes,
} from './types';
import { assert } from './utils/assert';
import { orderbookChannelMessageParser } from './utils/orderbook_channel_message_parser';

/**
 * This class includes all the functionality related to interacting with a websocket endpoint
 * that implements the standard relayer API v0
 */
export class WebSocketOrderbookChannel implements OrderbookChannel {
    private readonly _client: WebSocket.w3cwebsocket;
    private readonly _handler: OrderbookChannelHandler;
    private readonly _subscriptionOptsList: OrderbookChannelSubscriptionOpts[] = [];
    /**
     * Instantiates a new WebSocketOrderbookChannel instance
     * @param   client               A WebSocket client
     * @param   handler              An OrderbookChannelHandler instance that responds to various
     *                               channel updates
     * @return  An instance of WebSocketOrderbookChannel
     */
    constructor(client: WebSocket.w3cwebsocket, handler: OrderbookChannelHandler) {
        assert.isOrderbookChannelHandler('handler', handler);
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
     * @param   subscriptionOpts     An OrderbookChannelSubscriptionOpts instance describing which
     *                               assetData pair to subscribe to
     */
    public subscribe(subscriptionOpts: OrderbookChannelSubscriptionOpts): void {
        assert.isOrderbookChannelSubscriptionOpts('subscriptionOpts', subscriptionOpts);
        assert.assert(this._client.readyState === WebSocket.w3cwebsocket.OPEN, 'WebSocket connection is closed');
        this._subscriptionOptsList.push(subscriptionOpts);
        // TODO: update requestId management to use UUIDs for v2
        const subscribeMessage = {
            type: 'subscribe',
            channel: 'orderbook',
            requestId: this._subscriptionOptsList.length - 1,
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
        if (_.isUndefined(message.data)) {
            this._handler.onError(this, new Error(`Message does not contain data. Url: ${this._client.url}`));
            return;
        }
        try {
            const data = message.data;
            const parserResult = orderbookChannelMessageParser.parse(data);
            const subscriptionOpts = this._subscriptionOptsList[parserResult.requestId];
            if (_.isUndefined(subscriptionOpts)) {
                this._handler.onError(
                    this,
                    new Error(`Message has unknown requestId. Url: ${this._client.url} Message: ${data}`),
                );
                return;
            }
            switch (parserResult.type) {
                case OrdersChannelMessageTypes.Snapshot: {
                    this._handler.onSnapshot(this, subscriptionOpts, parserResult.payload);
                    break;
                }
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
