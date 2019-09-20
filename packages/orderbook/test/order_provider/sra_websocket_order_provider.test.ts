import { HttpClient, ordersChannelFactory, OrdersChannelHandler } from '@0x/connect';
import * as sinon from 'sinon';

import { SRAWebsocketOrderProvider } from '../../src';
import { BaseOrderProvider } from '../../src/order_provider/base_order_provider';
import { OrderStore } from '../../src/order_store';
import { createOrder } from '../utils';

// tslint:disable-next-line:no-empty
const NOOP = () => {};

describe('SRAWebsocketOrderProvider', () => {
    let orderStore: OrderStore;
    let provider: BaseOrderProvider;
    const httpEndpoint = 'https://localhost';
    const websocketEndpoint = 'wss://localhost';
    const makerAssetData = '0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359';
    const takerAssetData = '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const stubs: sinon.SinonStub[] = [];
    afterEach(() => {
        void provider.destroyAsync();
        stubs.forEach(s => s.restore());
    });
    beforeEach(() => {
        orderStore = new OrderStore();
    });
    describe('#createSubscriptionForAssetPairAsync', () => {
        test('fetches order on  first subscription', async () => {
            const httpStub = sinon
                .stub(HttpClient.prototype, 'getOrdersAsync')
                .callsFake(async () => Promise.resolve({ records: [], total: 0, perPage: 0, page: 1 }));
            stubs.push(
                sinon
                    .stub(ordersChannelFactory, 'createWebSocketOrdersChannelAsync')
                    .callsFake(async () => Promise.resolve({ subscribe: NOOP, close: NOOP })),
            );
            stubs.push(httpStub);
            provider = new SRAWebsocketOrderProvider({ httpEndpoint, websocketEndpoint }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            expect(httpStub.callCount).toBe(2);
        });
        test('fetches once when the same subscription is called', async () => {
            const stub = sinon
                .stub(HttpClient.prototype, 'getOrdersAsync')
                .callsFake(async () => Promise.resolve({ records: [], total: 0, perPage: 0, page: 1 }));
            stubs.push(
                sinon
                    .stub(ordersChannelFactory, 'createWebSocketOrdersChannelAsync')
                    .callsFake(async () => Promise.resolve({ subscribe: NOOP, close: NOOP })),
            );
            stubs.push(stub);
            provider = new SRAWebsocketOrderProvider({ httpEndpoint, websocketEndpoint }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            expect(stub.callCount).toBe(2);
        });
        test('adds orders from the subscription', async () => {
            const stub = sinon.stub(HttpClient.prototype, 'getOrdersAsync').callsFake(async () =>
                Promise.resolve({
                    records: [],
                    total: 0,
                    perPage: 1,
                    page: 1,
                }),
            );
            stubs.push(stub);
            let handler: OrdersChannelHandler | undefined;
            const wsStub = sinon
                .stub(ordersChannelFactory, 'createWebSocketOrdersChannelAsync')
                .callsFake(async (_url, updateHandler) => {
                    handler = updateHandler;
                    return Promise.resolve({ subscribe: NOOP, close: NOOP });
                });
            stubs.push(wsStub);
            provider = new SRAWebsocketOrderProvider({ httpEndpoint, websocketEndpoint }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            expect(handler).not.toBe(undefined);
            if (handler) {
                const channel = '';
                const subscriptionOpts = {};
                const orders = [createOrder(makerAssetData, takerAssetData)];
                handler.onUpdate(channel as any, subscriptionOpts as any, orders);
            }
            expect(stub.callCount).toBe(2);
            expect(wsStub.callCount).toBe(1);
            const storedOrders = orderStore.getOrderSetForAssets(makerAssetData, takerAssetData);
            expect(storedOrders.size()).toBe(1);
        });
        test('stores the orders', async () => {
            stubs.push(
                sinon.stub(HttpClient.prototype, 'getOrdersAsync').callsFake(async () =>
                    Promise.resolve({
                        records: [createOrder(makerAssetData, takerAssetData)],
                        total: 1,
                        perPage: 1,
                        page: 1,
                    }),
                ),
            );
            stubs.push(
                sinon
                    .stub(ordersChannelFactory, 'createWebSocketOrdersChannelAsync')
                    .callsFake(async () => Promise.resolve({ subscribe: NOOP, close: NOOP })),
            );
            provider = new SRAWebsocketOrderProvider({ httpEndpoint, websocketEndpoint }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            const orders = orderStore.getOrderSetForAssets(makerAssetData, takerAssetData);
            expect(orders.size()).toBe(1);
        });
        test('reconnects on channel close', async () => {
            stubs.push(
                sinon.stub(HttpClient.prototype, 'getOrdersAsync').callsFake(async () =>
                    Promise.resolve({
                        records: [],
                        total: 0,
                        perPage: 1,
                        page: 1,
                    }),
                ),
            );
            let handler: OrdersChannelHandler | undefined;
            const wsStub = sinon
                .stub(ordersChannelFactory, 'createWebSocketOrdersChannelAsync')
                .callsFake(async (_url, updateHandler) => {
                    handler = updateHandler;
                    return Promise.resolve({ subscribe: NOOP, close: NOOP });
                });
            stubs.push(wsStub);
            provider = new SRAWebsocketOrderProvider({ httpEndpoint, websocketEndpoint }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            expect(handler).not.toBe(undefined);
            (handler as OrdersChannelHandler).onClose(undefined as any);
            // Creates the new connection
            expect(wsStub.callCount).toBe(2);
        });
    });
});
