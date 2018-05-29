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

/**
 * This class includes all the functionality related to interacting with a websocket endpoint
 * that implements the standard relayer API v0
 */
export class WebSocketOrderbookChannel implements OrderbookChannel {
    private _client: WebSocket.w3cwebsocket;
    private _handler: OrderbookChannelHandler;
    private _subscriptionOptsList: OrderbookChannelSubscriptionOpts[] = [];
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
     *                               token pair to subscribe to
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
        // if we get a message with no data, alert all handlers and return
        if (_.isUndefined(message.data)) {
            this._handler.onError(this, new Error(`Message does not contain utf8Data`));
            return;
        }
        // try to parse the message data and route it to the correct handler
        try {
            const utf8Data = message.data;
            const parserResult = orderbookChannelMessageParser.parse(utf8Data);
            const subscriptionOpts = this._subscriptionOptsList[parserResult.requestId];
            if (_.isUndefined(subscriptionOpts)) {
                this._handler.onError(this, new Error(`Message has unknown requestId: ${utf8Data}`));
                return;
            }
            switch (parserResult.type) {
                case OrderbookChannelMessageTypes.Snapshot: {
                    this._handler.onSnapshot(this, subscriptionOpts, parserResult.payload);
                    break;
                }
                case OrderbookChannelMessageTypes.Update: {
                    this._handler.onUpdate(this, subscriptionOpts, parserResult.payload);
                    break;
                }
                default: {
                    this._handler.onError(this, new Error(`Message has unknown type parameter: ${utf8Data}`));
                }
            }
        } catch (error) {
            this._handler.onError(this, error);
        }
    }
}
