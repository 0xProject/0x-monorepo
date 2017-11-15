import * as _ from 'lodash';
import * as WebSocket from 'websocket';
import {assert} from '@0xproject/assert';
import {schemas} from '@0xproject/json-schemas';
import {SignedOrder} from '0x.js';
import {
    OrderbookChannel,
    OrderbookChannelHandler,
    OrderbookChannelMessageTypes,
    OrderbookChannelSubscriptionOpts,
} from './types';
import {orderbookChannelMessageParsers} from './utils/orderbook_channel_message_parsers';

enum ConnectionEventType {
    Close = 'close',
    Error = 'error',
    Message = 'message',
}

enum ClientEventType {
    Connect = 'connect',
    ConnectFailed = 'connectFailed',
}

/**
 * This class includes all the functionality related to interacting with a websocket endpoint
 * that implements the standard relayer API v0
 */
export class WebSocketOrderbookChannel implements OrderbookChannel {
    private apiEndpointUrl: string;
    private client: WebSocket.client;
    private connectionIfExists?: WebSocket.connection;
    /**
     * Instantiates a new WebSocketOrderbookChannel instance
     * @param   url                 The base url for making API calls
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
        const subscribeMessage = {
            type: 'subscribe',
            channel: 'orderbook',
            payload: subscriptionOpts,
        };
        this._getConnection((error, connection) => {
            if (!_.isUndefined(error)) {
                handler.onError(this, error);
            } else if (!_.isUndefined(connection) && connection.connected) {
                connection.on(ConnectionEventType.Error, wsError => {
                    handler.onError(this, wsError);
                });
                connection.on(ConnectionEventType.Close, () => {
                    handler.onClose(this);
                });
                connection.on(ConnectionEventType.Message, message => {
                    this._handleWebSocketMessage(message, handler);
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
            this.client.on(ClientEventType.Connect, connection => {
                this.connectionIfExists = connection;
                callback(undefined, this.connectionIfExists);
            });
            this.client.on(ClientEventType.ConnectFailed, error => {
                callback(error, undefined);
            });
            this.client.connect(this.apiEndpointUrl);
        }
    }
    private _handleWebSocketMessage(message: WebSocket.IMessage, handler: OrderbookChannelHandler): void {
        if (!_.isUndefined(message.utf8Data)) {
            try {
                const utf8Data = message.utf8Data;
                const parserResult = orderbookChannelMessageParsers.parser(utf8Data);
                const type = parserResult.type;
                switch (parserResult.type) {
                    case (OrderbookChannelMessageTypes.Snapshot): {
                        handler.onSnapshot(this, parserResult.payload);
                        break;
                    }
                    case (OrderbookChannelMessageTypes.Update): {
                        handler.onUpdate(this, parserResult.payload);
                        break;
                    }
                    default: {
                        handler.onError(this, new Error(`Message has missing a type parameter: ${utf8Data}`));
                    }
                }
            } catch (error) {
                handler.onError(this, error);
            }
        } else {
            handler.onError(this, new Error(`Message does not contain utf8Data`));
        }
    }
}
