import * as WebSocket from 'websocket';

import { OrderbookChannel, OrderbookChannelHandler } from './types';
import { assert } from './utils/assert';
import { WebSocketOrderbookChannel } from './ws_orderbook_channel';

export const orderbookChannelFactory = {
    /**
     * Instantiates a new WebSocketOrderbookChannel instance
     * @param   url                  The relayer API base WS url you would like to interact with
     * @param   handler              An OrderbookChannelHandler instance that responds to various
     *                               channel updates
     * @return  An OrderbookChannel Promise
     */
    async createWebSocketOrderbookChannelAsync(
        url: string,
        handler: OrderbookChannelHandler,
    ): Promise<OrderbookChannel> {
        assert.isUri('url', url);
        assert.isOrderbookChannelHandler('handler', handler);
        return new Promise<OrderbookChannel>((resolve, reject) => {
            const client = new WebSocket.w3cwebsocket(url);
            client.onopen = () => {
                const orderbookChannel = new WebSocketOrderbookChannel(client, handler);
                resolve(orderbookChannel);
            };
            client.onerror = err => {
                reject(err);
            };
        });
    },
};
