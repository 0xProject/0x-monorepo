import * as WebSocket from 'websocket';

import { OrderbookChannel } from './types';
import { assert } from './utils/assert';
import { WebSocketOrderbookChannel } from './ws_orderbook_channel';

export const orderbookChannelFactory = {
    /**
     * Instantiates a new WebSocketOrderbookChannel instance
     * @param   url The relayer API base WS url you would like to interact with
     * @return  An OrderbookChannel Promise
     */
    async createWebSocketOrderbookChannelAsync(url: string): Promise<OrderbookChannel> {
        assert.isUri('url', url);
        return new Promise<OrderbookChannel>((resolve, reject) => {
            const client = new WebSocket.w3cwebsocket(url);
            client.onopen = () => {
                const orderbookChannel = new WebSocketOrderbookChannel(client);
                resolve(orderbookChannel);
            };
            client.onerror = err => {
                reject(err);
            };
        });
    },
};
