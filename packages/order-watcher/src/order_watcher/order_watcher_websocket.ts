import { ContractAddresses } from '@0x/contract-addresses';
import { SignedOrder } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import { Provider } from 'ethereum-types';
import * as http from 'http';
import * as WebSocket from 'websocket';

import { webSocketUtf8MessageSchema } from '../schemas/websocket_utf8_message_schema';
import { OnOrderStateChangeCallback, OrderWatcherConfig } from '../types';
import { assert } from '../utils/assert';

import { OrderWatcher } from './order_watcher';

const DEFAULT_HTTP_PORT = 8080;

const enum OrderWatcherAction {
    // Actions initiated by the user.
    getStats = 'getStats',
    addOrderAsync = 'addOrderAsync',
    removeOrder = 'removeOrder',
    // These are spontaneous; they are primarily orderstate changes.
    orderWatcherUpdate = 'orderWatcherUpdate',
    // `subscribe` and `unsubscribe` are methods of OrderWatcher, but we don't
    // need to expose them to the WebSocket server user because the user implicitly
    // subscribes and unsubscribes by connecting and disconnecting from the server.
}

// Users have to create a json object of this format and attach it to
// the data field of their WebSocket message to interact with this server.
interface WebSocketRequestData {
    action: OrderWatcherAction;
    params: any;
}

// Users should expect a json object of this format in the data field
// of the WebSocket messages that this server sends out.
interface WebSocketResponseData {
    action: OrderWatcherAction;
    success: number;
    result: any;
}

// Wraps the OrderWatcher functionality in a WebSocket server. Motivations:
// 1) Users can watch orders via non-typescript programs.
// 2) Better encapsulation so that users can work
export class OrderWatcherWebSocketServer {
    public httpServer: http.Server;
    public readonly _orderWatcher: OrderWatcher;
    private readonly _connectionStore: Set<WebSocket.connection>;
    private readonly _wsServer: WebSocket.server;
    /**
     * Instantiate a new web socket server which provides OrderWatcher functionality
     *  @param provider Web3 provider to use for JSON RPC calls (for OrderWatcher)
     *  @param networkId NetworkId to watch orders on (for OrderWatcher)
     *  @param contractAddresses Optional contract addresses. Defaults to known
     *  addresses based on networkId (for OrderWatcher)
     *  @param partialConfig Optional configurations (for OrderWatcher)
     */
    constructor(
        provider: Provider,
        networkId: number,
        contractAddresses?: ContractAddresses,
        partialConfig?: Partial<OrderWatcherConfig>,
    ) {
        this._orderWatcher = new OrderWatcher(provider, networkId, contractAddresses, partialConfig);
        this._connectionStore = new Set();
        this.httpServer = http.createServer();
        this._wsServer = new WebSocket.server({
            httpServer: this.httpServer,
            autoAcceptConnections: false,
        });

        this._wsServer.on('request', (request: any) => {
            // Designed for usage pattern where client and server are run on the same
            // machine by the same user. As such, no security checks are in place.
            const connection: WebSocket.connection = request.accept(null, request.origin);
            logUtils.log(`${new Date()} [Server] Accepted connection from origin ${request.origin}.`);
            connection.on('message', this._messageCallback.bind(this, connection));
            connection.on('close', this._closeCallback.bind(this, connection));
            this._connectionStore.add(connection);
        });

        // Have the WebSocket server subscribe to the OrderWatcher to receive updates.
        // These updates are then broadcast to clients in the _connectionStore.
        this._orderWatcher.subscribe(this._broadcastCallback);
    }

    /**
     * Activates the WebSocket server by having its HTTP server start listening.
     */
    public listen(): void {
        this.httpServer.listen(DEFAULT_HTTP_PORT, () => {
            logUtils.log(`${new Date()} [Server] Listening on port ${DEFAULT_HTTP_PORT}`);
        });
    }

    public close(): void {
        this.httpServer.close();
    }

    private _messageCallback(connection: WebSocket.connection, message: any): void {
        assert.doesConformToSchema('message', message, webSocketUtf8MessageSchema);
        const requestData: WebSocketRequestData = JSON.parse(message.utf8Data);
        const responseData = this._routeRequest(requestData);
        logUtils.log(`${new Date()} [Server] OrderWatcher output: ${JSON.stringify(responseData)}`);
        connection.sendUTF(JSON.stringify(responseData));
    }

    private _closeCallback(connection: WebSocket.connection): void {
        this._connectionStore.delete(connection);
        logUtils.log(`${new Date()} [Server] Client ${connection.remoteAddress} disconnected.`);
    }

    private _routeRequest(requestData: WebSocketRequestData): WebSocketResponseData {
        const responseData: WebSocketResponseData = {
            action: requestData.action,
            success: 0,
            result: undefined,
        };

        try {
            logUtils.log(`${new Date()} [Server] Request received: ${requestData.action}`);
            switch (requestData.action) {
                case 'addOrderAsync': {
                    const signedOrder: SignedOrder = this._parseSignedOrder(requestData);
                    // tslint:disable-next-line:no-floating-promises
                    this._orderWatcher.addOrderAsync(signedOrder); // Ok to fireNforget
                    break;
                }
                case 'removeOrder': {
                    this._orderWatcher.removeOrder(requestData.params.orderHash);
                    break;
                }
                case 'getStats': {
                    responseData.result = this._orderWatcher.getStats();
                    break;
                }
                default:
                    throw new Error(`[Server] Invalid request action: ${requestData.action}`);
            }
            responseData.success = 1;
        } catch (err) {
            responseData.result = { error: err.toString() };
        }
        return responseData;
    }

    /**
     * Broadcasts OrderState changes to ALL connected clients. At the moment,
     * we do not support clients subscribing to only a subset of orders. As such,
     * Client B will be notified of changes to an order that Client A added.
     */
    private readonly _broadcastCallback: OnOrderStateChangeCallback = (err, orderState) => {
        this._connectionStore.forEach((connection: WebSocket.connection) => {
            const responseData: WebSocketResponseData = {
                action: OrderWatcherAction.orderWatcherUpdate,
                success: 1,
                result: orderState || err,
            };
            connection.sendUTF(JSON.stringify(responseData));
        });
        // tslint:disable-next-line:semicolon
    }; // tslint thinks this is a class method, It's actally a property that holds a function.

    /**
     * Recover types lost when the payload is stringified.
     */
    private readonly _parseSignedOrder = (requestData: WebSocketRequestData) => {
        const signedOrder = requestData.params.signedOrder;
        const bigNumberFields = [
            'salt',
            'makerFee',
            'takerFee',
            'makerAssetAmount',
            'takerAssetAmount',
            'expirationTimeSeconds',
        ];
        for (const field of bigNumberFields) {
            signedOrder[field] = new BigNumber(signedOrder[field]);
        }
        return signedOrder;
        // tslint:disable-next-line:semicolon
    }; // tslint thinks this is a class method, It's actally a property that holds a function.
}
