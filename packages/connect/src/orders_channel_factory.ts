import * as WebSocket from 'websocket';

import { OrdersChannel, OrdersChannelHandler } from './types';
import { assert } from './utils/assert';
import { WebSocketOrdersChannel } from './ws_orders_channel';

export const ordersChannelFactory = {
    /**
     * Instantiates a new WebSocketOrdersChannel instance
     * @param   url                  The relayer API base WS url you would like to interact with
     * @param   handler              An OrdersChannelHandler instance that responds to various
     *                               channel updates
     * @return  An OrdersChannel Promise
     */
    async createWebSocketOrdersChannelAsync(url: string, handler: OrdersChannelHandler): Promise<OrdersChannel> {
        assert.isUri('url', url);
        assert.isOrdersChannelHandler('handler', handler);
        return new Promise<OrdersChannel>((resolve, reject) => {
            const client = new WebSocket.w3cwebsocket(url);
            client.onopen = () => {
                const ordersChannel = new WebSocketOrdersChannel(client, handler);
                resolve(ordersChannel);
            };
            client.onerror = err => {
                reject(err);
            };
        });
    },
};
