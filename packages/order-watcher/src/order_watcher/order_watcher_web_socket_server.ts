import { ContractAddresses } from '@0x/contract-addresses';
import { schemas } from '@0x/json-schemas';
import { OrderStateInvalid, OrderStateValid, SignedOrder } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import { SupportedProvider } from 'ethereum-types';
import * as http from 'http';
import * as WebSocket from 'websocket';

import { GetStatsResult, OrderWatcherConfig, OrderWatcherMethod, WebSocketRequest, WebSocketResponse } from '../types';
import { assert } from '../utils/assert';

import { OrderWatcher } from './order_watcher';

const DEFAULT_HTTP_PORT = 8080;
const JSON_RPC_VERSION = '2.0';

// Wraps the OrderWatcher functionality in a WebSocket server. Motivations:
// 1) Users can watch orders via non-typescript programs.
// 2) Better encapsulation so that users can work
export class OrderWatcherWebSocketServer {
    private readonly _orderWatcher: OrderWatcher;
    private readonly _httpServer: http.Server;
    private readonly _connectionStore: Set<WebSocket.connection>;
    private readonly _wsServer: WebSocket.server;
    private readonly _isVerbose: boolean;
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
     *  @param supportedProvider Web3 provider to use for JSON RPC calls.
     *  @param networkId NetworkId to watch orders on.
     *  @param contractAddresses Optional contract addresses. Defaults to known
     *  addresses based on networkId.
     *  @param orderWatcherConfig OrderWatcher configurations. isVerbose sets the verbosity for the WebSocket server aswell.
     *  @param isVerbose Whether to enable verbose logging. Defaults to true.
     */
    constructor(
        supportedProvider: SupportedProvider,
        networkId: number,
        contractAddresses?: ContractAddresses,
        orderWatcherConfig?: Partial<OrderWatcherConfig>,
    ) {
        this._isVerbose =
            orderWatcherConfig !== undefined && orderWatcherConfig.isVerbose !== undefined
                ? orderWatcherConfig.isVerbose
                : true;
        this._orderWatcher = new OrderWatcher(supportedProvider, networkId, contractAddresses, orderWatcherConfig);
        this._connectionStore = new Set();
        this._httpServer = http.createServer();
        this._wsServer = new WebSocket.server({
            httpServer: this._httpServer,
            // Avoid setting autoAcceptConnections to true as it defeats all
            // standard cross-origin protection facilities built into the protocol
            // and the browser.
            // Source: https://www.npmjs.com/package/websocket#server-example
            // Also ensures that a request event is emitted by
            // the server whenever a new WebSocket request is made.
            autoAcceptConnections: false,
        });

        this._wsServer.on('request', async (request: any) => {
            // Designed for usage pattern where client and server are run on the same
            // machine by the same user. As such, no security checks are in place.
            const connection: WebSocket.connection = request.accept(null, request.origin);
            this._log(`${new Date()} [Server] Accepted connection from origin ${request.origin}.`);
            connection.on('message', this._onMessageCallbackAsync.bind(this, connection));
            connection.on('close', this._onCloseCallback.bind(this, connection));
            this._connectionStore.add(connection);
        });
    }

    /**
     * Activates the WebSocket server by subscribing to the OrderWatcher and
     * starting the WebSocket's HTTP server
     */
    public start(): void {
        // Have the WebSocket server subscribe to the OrderWatcher to receive updates.
        // These updates are then broadcast to clients in the _connectionStore.
        this._orderWatcher.subscribe(this._broadcastCallback.bind(this));

        const port = process.env.ORDER_WATCHER_HTTP_PORT || DEFAULT_HTTP_PORT;
        this._httpServer.listen(port, () => {
            this._log(`${new Date()} [Server] Listening on port ${port}`);
        });
    }

    /**
     * Deactivates the WebSocket server by stopping the HTTP server from accepting
     * new connections and unsubscribing from the OrderWatcher
     */
    public stop(): void {
        this._httpServer.close();
        this._orderWatcher.unsubscribe();
    }

    private _log(...args: any[]): void {
        if (this._isVerbose) {
            logUtils.log(...args);
        }
    }

    private async _onMessageCallbackAsync(connection: WebSocket.connection, message: any): Promise<void> {
        let response: WebSocketResponse;
        let id: number | null = null;
        try {
            assert.doesConformToSchema('message', message, schemas.orderWatcherWebSocketUtf8MessageSchema);
            const request: WebSocketRequest = JSON.parse(message.utf8Data);
            id = request.id;
            assert.doesConformToSchema('request', request, schemas.orderWatcherWebSocketRequestSchema);
            assert.isString(request.jsonrpc, JSON_RPC_VERSION);
            response = {
                id,
                jsonrpc: JSON_RPC_VERSION,
                method: request.method,
                result: await this._routeRequestAsync(request),
            };
        } catch (err) {
            response = {
                id,
                jsonrpc: JSON_RPC_VERSION,
                method: null,
                error: err.toString(),
            };
        }
        this._log(`${new Date()} [Server] OrderWatcher output: ${JSON.stringify(response)}`);
        connection.sendUTF(JSON.stringify(response));
    }

    private _onCloseCallback(connection: WebSocket.connection): void {
        this._connectionStore.delete(connection);
        this._log(`${new Date()} [Server] Client ${connection.remoteAddress} disconnected.`);
    }

    private async _routeRequestAsync(request: WebSocketRequest): Promise<GetStatsResult | undefined> {
        this._log(`${new Date()} [Server] Request received: ${request.method}`);
        switch (request.method) {
            case OrderWatcherMethod.AddOrder: {
                const signedOrder: SignedOrder = OrderWatcherWebSocketServer._parseSignedOrder(
                    request.params.signedOrder,
                );
                await this._orderWatcher.addOrderAsync(signedOrder);
                break;
            }
            case OrderWatcherMethod.RemoveOrder: {
                this._orderWatcher.removeOrder(request.params.orderHash || 'undefined');
                break;
            }
            case OrderWatcherMethod.GetStats: {
                return this._orderWatcher.getStats();
            }
            default:
                // Should never reach here. Should be caught by JSON schema check.
                throw new Error(`Unexpected default case hit for request.method`);
        }
        return undefined;
    }

    /**
     * Broadcasts OrderState changes to ALL connected clients. At the moment,
     * we do not support clients subscribing to only a subset of orders. As such,
     * Client B will be notified of changes to an order that Client A added.
     */
    private _broadcastCallback(err: Error | null, orderState?: OrderStateValid | OrderStateInvalid | undefined): void {
        const method = OrderWatcherMethod.Update;
        const response =
            err === null
                ? {
                      jsonrpc: JSON_RPC_VERSION,
                      method,
                      result: orderState,
                  }
                : {
                      jsonrpc: JSON_RPC_VERSION,
                      method,
                      error: {
                          code: -32000,
                          message: err.message,
                      },
                  };
        this._connectionStore.forEach((connection: WebSocket.connection) => {
            connection.sendUTF(JSON.stringify(response));
        });
    }
}
