import { assert } from '@0xproject/assert';
import { schemas } from '@0xproject/json-schemas';
import * as _ from 'lodash';
import * as WebSocket from 'websocket';

import { schemas as clientSchemas } from './schemas/schemas';
import {
    OrderbookChannel,
    OrderbookChannelHandler,
    OrderbookChannelMessageTypes,
    OrderbookChannelSubscriptionOpts,
    WebsocketClientEventType,
    WebsocketConnectionEventType,
    WebSocketOrderbookChannelConfig,
} from './types';
import { orderbookChannelMessageParser } from './utils/orderbook_channel_message_parser';

const DEFAULT_HEARTBEAT_INTERVAL_MS = 15000;
const MINIMUM_HEARTBEAT_INTERVAL_MS = 10;

/**
 * This class includes all the functionality related to interacting with a websocket endpoint
 * that implements the standard relayer API v0
 */
export class WebSocketOrderbookChannel implements OrderbookChannel {
    private _apiEndpointUrl: string;
    private _client: WebSocket.client;
    private _connectionIfExists?: WebSocket.connection;
    private _heartbeatTimerIfExists?: NodeJS.Timer;
    private _subscriptionCounter = 0;
    private _heartbeatIntervalMs: number;
    /**
     * Instantiates a new WebSocketOrderbookChannel instance
     * @param   url                 The relayer API base WS url you would like to interact with
     * @param   config              The configuration object. Look up the type for the description.
     * @return  An instance of WebSocketOrderbookChannel
     */
    constructor(url: string, config?: WebSocketOrderbookChannelConfig) {
        assert.isUri('url', url);
        if (!_.isUndefined(config)) {
            assert.doesConformToSchema('config', config, clientSchemas.webSocketOrderbookChannelConfigSchema);
        }
        this._apiEndpointUrl = url;
        this._heartbeatIntervalMs =
            _.isUndefined(config) || _.isUndefined(config.heartbeatIntervalMs)
                ? DEFAULT_HEARTBEAT_INTERVAL_MS
                : config.heartbeatIntervalMs;
        this._client = new WebSocket.client();
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
            'subscriptionOpts',
            subscriptionOpts,
            schemas.relayerApiOrderbookChannelSubscribePayload,
        );
        assert.isFunction('handler.onSnapshot', _.get(handler, 'onSnapshot'));
        assert.isFunction('handler.onUpdate', _.get(handler, 'onUpdate'));
        assert.isFunction('handler.onError', _.get(handler, 'onError'));
        assert.isFunction('handler.onClose', _.get(handler, 'onClose'));
        this._subscriptionCounter += 1;
        const subscribeMessage = {
            type: 'subscribe',
            channel: 'orderbook',
            requestId: this._subscriptionCounter,
            payload: subscriptionOpts,
        };
        this._getConnection((error, connection) => {
            if (!_.isUndefined(error)) {
                handler.onError(this, subscriptionOpts, error);
            } else if (!_.isUndefined(connection) && connection.connected) {
                connection.on(WebsocketConnectionEventType.Error, wsError => {
                    handler.onError(this, subscriptionOpts, wsError);
                });
                connection.on(WebsocketConnectionEventType.Close, (code: number, desc: string) => {
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
    public close(): void {
        if (!_.isUndefined(this._connectionIfExists)) {
            this._connectionIfExists.close();
        }
        if (!_.isUndefined(this._heartbeatTimerIfExists)) {
            clearInterval(this._heartbeatTimerIfExists);
        }
    }
    private _getConnection(callback: (error?: Error, connection?: WebSocket.connection) => void): void {
        if (!_.isUndefined(this._connectionIfExists) && this._connectionIfExists.connected) {
            callback(undefined, this._connectionIfExists);
        } else {
            this._client.on(WebsocketClientEventType.Connect, connection => {
                this._connectionIfExists = connection;
                if (this._heartbeatIntervalMs >= MINIMUM_HEARTBEAT_INTERVAL_MS) {
                    this._heartbeatTimerIfExists = setInterval(() => {
                        connection.ping('');
                    }, this._heartbeatIntervalMs);
                } else {
                    callback(
                        new Error(
                            `Heartbeat interval is ${
                                this._heartbeatIntervalMs
                            }ms which is less than the required minimum of ${MINIMUM_HEARTBEAT_INTERVAL_MS}ms`,
                        ),
                        undefined,
                    );
                }
                callback(undefined, this._connectionIfExists);
            });
            this._client.on(WebsocketClientEventType.ConnectFailed, error => {
                callback(error, undefined);
            });
            this._client.connect(this._apiEndpointUrl);
        }
    }
    private _handleWebSocketMessage(
        requestId: number,
        subscriptionOpts: OrderbookChannelSubscriptionOpts,
        message: WebSocket.IMessage,
        handler: OrderbookChannelHandler,
    ): void {
        if (!_.isUndefined(message.utf8Data)) {
            try {
                const utf8Data = message.utf8Data;
                const parserResult = orderbookChannelMessageParser.parse(utf8Data);
                if (parserResult.requestId === requestId) {
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
                                new Error(`Message has missing a type parameter: ${utf8Data}`),
                            );
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
