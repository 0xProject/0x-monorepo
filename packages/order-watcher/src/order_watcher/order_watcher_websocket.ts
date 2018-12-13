import { ContractAddresses } from '@0x/contract-addresses';
import { OrderState, SignedOrder } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import { Provider } from 'ethereum-types';
import * as http from 'http';
import * as WebSocket from 'websocket';

import { webSocketRequestSchema, webSocketUtf8MessageSchema } from '../schemas/websocket_schemas';
import {
    OnOrderStateChangeCallback,
    OrderWatcherAction,
    OrderWatcherConfig,
    WebSocketRequest,
    WebSocketResponse,
} from '../types';
import { assert } from '../utils/assert';

import { OrderWatcher } from './order_watcher';

const DEFAULT_HTTP_PORT = 8080;

// Wraps the OrderWatcher functionality in a WebSocket server. Motivations:
// 1) Users can watch orders via non-typescript programs.
// 2) Better encapsulation so that users can work
export class OrderWatcherWebSocketServer {
    public readonly _orderWatcher: OrderWatcher; // public for testing
    private readonly _httpServer: http.Server;
    private readonly _connectionStore: Set<WebSocket.connection>;
    private readonly _wsServer: WebSocket.server;
    /**
     *  Recover types lost when the payload is stringified.
     */
    private static _parseSignedOrder(rawRequest: any): SignedOrder {
        const bigNumberFields = [
            'salt',
            'makerFee',
            'takerFee',
            'makerAssetAmount',
            'takerAssetAmount',
            'expirationTimeSeconds',
        ];
        for (const field of bigNumberFields) {
            rawRequest[field] = new BigNumber(rawRequest[field]);
        }
        return rawRequest;
    }

    /**
     * Instantiate a new WebSocket server which provides OrderWatcher functionality
     *  @param provider Web3 provider to use for JSON RPC calls.
     *  @param networkId NetworkId to watch orders on.
     *  @param contractAddresses Optional contract addresses. Defaults to known
     *  addresses based on networkId.
     *  @param partialConfig Optional configurations.
     */
    constructor(
        provider: Provider,
        networkId: number,
        contractAddresses?: ContractAddresses,
        partialConfig?: Partial<OrderWatcherConfig>,
    ) {
        this._orderWatcher = new OrderWatcher(provider, networkId, contractAddresses, partialConfig);
        this._connectionStore = new Set();
        this._httpServer = http.createServer();
        this._wsServer = new WebSocket.server({
            httpServer: this._httpServer,
            // Avoid setting autoAcceptConnections to true as it defeats all
            // standard cross-origin protection facilities built into the protocol
            // and the browser. Also ensures that a request event is emitted by
            // the server whenever a new WebSocket request is made.
            autoAcceptConnections: false,
        });

        this._wsServer.on('request', async (request: any) => {
            // Designed for usage pattern where client and server are run on the same
            // machine by the same user. As such, no security checks are in place.
            const connection: WebSocket.connection = request.accept(null, request.origin);
            logUtils.log(`${new Date()} [Server] Accepted connection from origin ${request.origin}.`);
            connection.on('message', await this._onMessageCallbackAsync.bind(this, connection));
            connection.on('close', this._onCloseCallback.bind(this, connection));
            this._connectionStore.add(connection);
        });

        // Have the WebSocket server subscribe to the OrderWatcher to receive updates.
        // These updates are then broadcast to clients in the _connectionStore.
        const broadcastCallback: OnOrderStateChangeCallback = this._broadcastCallback.bind(this);
        this._orderWatcher.subscribe(broadcastCallback);
    }

    /**
     * Activates the WebSocket server by having its HTTP server start listening.
     */
    public listen(): void {
        const port = process.env.ORDER_WATCHER_HTTP_PORT || DEFAULT_HTTP_PORT;
        this._httpServer.listen(port, () => {
            logUtils.log(`${new Date()} [Server] Listening on port ${port}`);
        });
    }

    /**
     * Deactivates the WebSocket server by stopping the HTTP server from accepting
     * new connections.
     */
    public close(): void {
        this._httpServer.close();
    }

    private async _onMessageCallbackAsync(connection: WebSocket.connection, message: any): Promise<void> {
        const response: WebSocketResponse = {
            action: null,
            success: false,
            result: null,
        };
        try {
            assert.doesConformToSchema('message', message, webSocketUtf8MessageSchema);
            const request: WebSocketRequest = JSON.parse(message.utf8Data);
            assert.doesConformToSchema('request', request, webSocketRequestSchema);
            response.action = request.action;
            response.success = true;
            response.result = await this._routeRequestAsync(request);
        } catch (err) {
            response.result = err.toString();
        }
        logUtils.log(`${new Date()} [Server] OrderWatcher output: ${JSON.stringify(response)}`);
        connection.sendUTF(JSON.stringify(response));
    }

    private _onCloseCallback(connection: WebSocket.connection): void {
        this._connectionStore.delete(connection);
        logUtils.log(`${new Date()} [Server] Client ${connection.remoteAddress} disconnected.`);
    }

    private async _routeRequestAsync(request: WebSocketRequest): Promise<any> {
        logUtils.log(`${new Date()} [Server] Request received: ${request.action}`);
        let result = null;
        switch (request.action) {
            case OrderWatcherAction.AddOrder: {
                const signedOrder: SignedOrder = OrderWatcherWebSocketServer._parseSignedOrder(request.signedOrder);
                await this._orderWatcher.addOrderAsync(signedOrder);
                break;
            }
            case OrderWatcherAction.RemoveOrder: {
                const orderHash = request.orderHash || '_';
                this._orderWatcher.removeOrder(orderHash);
                break;
            }
            case OrderWatcherAction.GetStats: {
                result = this._orderWatcher.getStats();
                break;
            }
            default:
                // Should never reach here. Should be caught by JSON schema check.
                throw new Error(`[Server] Invalid request action: ${request.action}`);
        }
        return result;
    }

    /**
     * Broadcasts OrderState changes to ALL connected clients. At the moment,
     * we do not support clients subscribing to only a subset of orders. As such,
     * Client B will be notified of changes to an order that Client A added.
     */
    private _broadcastCallback(err: Error | null, orderState?: OrderState): void {
        this._connectionStore.forEach((connection: WebSocket.connection) => {
            const response: WebSocketResponse = {
                action: OrderWatcherAction.Update,
                success: true,
                result: orderState || err,
            };
            connection.sendUTF(JSON.stringify(response));
        });
    }
}
