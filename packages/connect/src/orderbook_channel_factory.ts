// import * as WebSocket from 'websocket';

import { BrowserWebSocketOrderbookChannel } from './browser_ws_orderbook_channel';
import { NodeWebSocketOrderbookChannel } from './node_ws_orderbook_channel';

export const orderbookChannelFactory = {
    async createBrowserOrderbookChannelAsync(url: string): Promise<BrowserWebSocketOrderbookChannel> {
        return new Promise<BrowserWebSocketOrderbookChannel>((resolve, reject) => {
            const client = new WebSocket(url);
            console.log(client);
            client.onopen = () => {
                const orderbookChannel = new BrowserWebSocketOrderbookChannel(client);
                console.log(orderbookChannel);
                resolve(orderbookChannel);
            };
            client.onerror = err => {
                reject(err);
            };
        });
    },
    // async createNodeOrderbookChannelAsync(url: string): Promise<NodeWebSocketOrderbookChannel> {
    //     return new Promise<BrowserWebSocketOrderbookChannel>((resolve, reject) => {
    //         const client = new WebSocket.w3cwebsocket(url);
    //         client.onopen = () => {
    //             const orderbookChannel = new BrowserWebSocketOrderbookChannel(client);
    //             resolve(orderbookChannel);
    //         };
    //         client.onerror = err => {
    //             reject(err);
    //         };
    //     });
    // },
};
