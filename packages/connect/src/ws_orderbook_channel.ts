import {assert} from '@0xproject/assert';
import {schemas} from '@0xproject/json-schemas';
import * as _ from 'lodash';
import * as WebSocket from 'websocket';

import {
    OrderbookChannel,
    OrderbookChannelHandler,
    OrderbookChannelMessageTypes,
    OrderbookChannelSubscriptionOpts,
    SignedOrder,
    WebsocketClientEventType,
    WebsocketConnectionEventType,
} from './types';
import {orderbookChannelMessageParsers} from './utils/orderbook_channel_message_parsers';

/**
 * This class includes all the functionality related to interacting with a websocket endpoint
 * that implements the standard relayer API v0
 */
export class WebSocketOrderbookChannel implements OrderbookChannel {
    private apiEndpointUrl: string;
    private client: WebSocket.client;
    private connectionIfExists?: WebSocket.connection;
    private subscriptionCounter = 0;
    /**
     * Instantiates a new WebSocketOrderbookChannel instance
     * @param   url                 The relayer API base WS url you would like to interact with
     * @return  An instance of WebSocketOrderbookChannel
     */
    constructor(url: string) {
        assert.isUri('url', url);
        this.apiEndpointUrl = url;
        this.client = new WebSocket.client();
    }
    /**
     * Subscribe to orderbook snapshots and updates from the websocket
     * @param   subscriptionOpts     An OrderbookChannelSubscriptionOpts instance describing which
     *                               token pair to subscribe to
     * @param   handler              An OrderbookChannelHandler instance that responds to various
     *                               channel updates
     */
    public subscribe(subscriptionOpts: OrderbookChannelSubscriptionOpts, handler: OrderbookChannelHandler): void {
        assert.doesConformToSchema(
            'subscriptionOpts', subscriptionOpts, schemas.relayerApiOrderbookChannelSubscribePayload);
        assert.isFunction('handler.onSnapshot', _.get(handler, 'onSnapshot'));
        assert.isFunction('handler.onUpdate', _.get(handler, 'onUpdate'));
        assert.isFunction('handler.onError', _.get(handler, 'onError'));
        assert.isFunction('handler.onClose', _.get(handler, 'onClose'));
        this.subscriptionCounter += 1;
        const subscribeMessage = {
            type: 'subscribe',
            channel: 'orderbook',
            requestId: this.subscriptionCounter,
            payload: subscriptionOpts,
        };
        this._getConnection((error, connection) => {
            if (!_.isUndefined(error)) {
                handler.onError(this, subscriptionOpts, error);
            } else if (!_.isUndefined(connection) && connection.connected) {
                connection.on(WebsocketConnectionEventType.Error, wsError => {
                    handler.onError(this, subscriptionOpts, wsError);
                });
                connection.on(WebsocketConnectionEventType.Close, () => {
                    handler.onClose(this, subscriptionOpts);
                });
                connection.on(WebsocketConnectionEventType.Message, message => {
                    this._handleWebSocketMessage(subscribeMessage.requestId, subscriptionOpts, message, handler);
                });
                connection.sendUTF(JSON.stringify(subscribeMessage));
            }
        });
    }
    /**
     * Close the websocket and stop receiving updates
     */
    public close() {
        if (!_.isUndefined(this.connectionIfExists)) {
            this.connectionIfExists.close();
        }
    }
    private _getConnection(callback: (error?: Error, connection?: WebSocket.connection) => void) {
        if (!_.isUndefined(this.connectionIfExists) && this.connectionIfExists.connected) {
            callback(undefined, this.connectionIfExists);
        } else {
            this.client.on(WebsocketClientEventType.Connect, connection => {
                this.connectionIfExists = connection;
                callback(undefined, this.connectionIfExists);
            });
            this.client.on(WebsocketClientEventType.ConnectFailed, error => {
                callback(error, undefined);
            });
            this.client.connect(this.apiEndpointUrl);
        }
    }
    private _handleWebSocketMessage(requestId: number, subscriptionOpts: OrderbookChannelSubscriptionOpts,
                                    message: WebSocket.IMessage, handler: OrderbookChannelHandler): void {
        if (!_.isUndefined(message.utf8Data)) {
            try {
                const utf8Data = message.utf8Data;
                const parserResult = orderbookChannelMessageParsers.parser(utf8Data);
                const type = parserResult.type;
                if (parserResult.requestId === requestId) {
                    switch (parserResult.type) {
                        case (OrderbookChannelMessageTypes.Snapshot): {
                            handler.onSnapshot(this, subscriptionOpts, parserResult.payload);
                            break;
                        }
                        case (OrderbookChannelMessageTypes.Update): {
                            handler.onUpdate(this, subscriptionOpts, parserResult.payload);
                            break;
                        }
                        default: {
                            handler.onError(
                                this, subscriptionOpts, new Error(`Message has missing a type parameter: ${utf8Data}`));
                        }
                    }
                }
            } catch (error) {
                handler.onError(this, subscriptionOpts, error);
            }
        } else {
            handler.onError(this, subscriptionOpts, new Error(`Message does not contain utf8Data`));
        }
    }
}
