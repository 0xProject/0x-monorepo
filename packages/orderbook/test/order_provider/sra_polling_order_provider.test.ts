import { HttpClient } from '@0x/connect';
import * as sinon from 'sinon';

import { SRAPollingOrderProvider } from '../../src';
import { BaseOrderProvider } from '../../src/order_provider/base_order_provider';
import { OrderStore } from '../../src/order_store';
import { utils } from '../../src/utils';
import { createOrder } from '../utils';

describe('SRAPollingOrderProvider', () => {
    let orderStore: OrderStore;
    let provider: BaseOrderProvider;
    const httpEndpoint = 'https://localhost';
    const makerAssetData = '0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359';
    const takerAssetData = '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    afterEach(() => {
        void provider.destroyAsync();
        sinon.restore();
    });
    beforeEach(() => {
        orderStore = new OrderStore();
    });
    describe('#createSubscriptionForAssetPairAsync', () => {
        test('fetches order on first subscription', async () => {
            const stub = sinon
                .stub(HttpClient.prototype, 'getOrdersAsync')
                .callsFake(async () => Promise.resolve({ records: [], total: 0, perPage: 0, page: 1 }));
            provider = new SRAPollingOrderProvider({ httpEndpoint, pollingIntervalMs: 5 }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            expect(stub.callCount).toBe(2);
        });
        test('fetches once when the same subscription is created', async () => {
            const stub = sinon
                .stub(HttpClient.prototype, 'getOrdersAsync')
                .callsFake(async () => Promise.resolve({ records: [], total: 0, perPage: 0, page: 1 }));
            provider = new SRAPollingOrderProvider({ httpEndpoint, pollingIntervalMs: 5 }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            expect(stub.callCount).toBe(2);
        });
        test('periodically polls for orders', async () => {
            const stub = sinon.stub(HttpClient.prototype, 'getOrdersAsync').callsFake(async () =>
                Promise.resolve({
                    records: [createOrder(makerAssetData, takerAssetData)],
                    total: 1,
                    perPage: 1,
                    page: 1,
                }),
            );
            provider = new SRAPollingOrderProvider({ httpEndpoint, pollingIntervalMs: 1 }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            await utils.delayAsync(5);
            expect(stub.callCount).toBeGreaterThan(2);
        });
        test('stores the orders returned from the API response', async () => {
            const records = [createOrder(makerAssetData, takerAssetData)];
            sinon.stub(HttpClient.prototype, 'getOrdersAsync').callsFake(async () =>
                Promise.resolve({
                    records,
                    total: 1,
                    perPage: 1,
                    page: 1,
                }),
            );
            provider = new SRAPollingOrderProvider({ httpEndpoint, pollingIntervalMs: 30000 }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            const orders = orderStore.getOrderSetForAssets(makerAssetData, takerAssetData);
            expect(orders.size()).toBe(1);
        });
        test('removes the order from the set when the API response no longer returns the order', async () => {
            const records = [createOrder(makerAssetData, takerAssetData)];
            sinon.stub(HttpClient.prototype, 'getOrdersAsync').callsFake(async () =>
                Promise.resolve({
                    records,
                    total: 1,
                    perPage: 1,
                    page: 1,
                }),
            );
            provider = new SRAPollingOrderProvider({ httpEndpoint, pollingIntervalMs: 5 }, orderStore);
            await provider.createSubscriptionForAssetPairAsync(makerAssetData, takerAssetData);
            const orders = orderStore.getOrderSetForAssets(makerAssetData, takerAssetData);
            expect(orders.size()).toBe(1);
            // Delete the record from the API response
            records.splice(0, 1);
            await utils.delayAsync(5);
            expect(orders.size()).toBe(0);
        });
    });
});
