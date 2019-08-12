import { HttpClient } from '@0x/connect';
import * as sinon from 'sinon';

import { Orderbook } from '../src';

import { createOrder } from './utils';

describe('Orderbook', () => {
    const httpEndpoint = 'https://localhost';
    const makerAssetData = '0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359';
    const takerAssetData = '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    afterEach(() => {
        sinon.restore();
    });
    describe('#getOrdersAsync', () => {
        test('returns the orders stored', async () => {
            const records = [createOrder(makerAssetData, takerAssetData)];
            sinon.stub(HttpClient.prototype, 'getOrdersAsync').callsFake(async () =>
                Promise.resolve({
                    records,
                    total: 1,
                    perPage: 1,
                    page: 1,
                }),
            );
            const orderbook = Orderbook.getOrderbookForPollingProvider({ httpEndpoint, pollingIntervalMs: 5 });
            const orders = await orderbook.getOrdersAsync(makerAssetData, takerAssetData);
            expect(orders.length).toBe(1);
        });
    });
    describe('#addOrdersAsync', () => {
        test('propagates the order rejection', async () => {
            sinon
                .stub(HttpClient.prototype, 'getOrdersAsync')
                .callsFake(async () => Promise.resolve({ records: [], total: 0, perPage: 0, page: 1 }));
            sinon.stub(HttpClient.prototype, 'submitOrderAsync').callsFake(async () => Promise.reject('INVALID_ORDER'));
            const orderbook = Orderbook.getOrderbookForPollingProvider({ httpEndpoint, pollingIntervalMs: 5 });
            const result = await orderbook.addOrdersAsync([createOrder(makerAssetData, takerAssetData).order]);
            expect(result.rejected.length).toBe(1);
            expect(result.accepted.length).toBe(0);
        });
        test('propagates the order accepted', async () => {
            sinon
                .stub(HttpClient.prototype, 'getOrdersAsync')
                .callsFake(async () => Promise.resolve({ records: [], total: 0, perPage: 0, page: 1 }));
            sinon.stub(HttpClient.prototype, 'submitOrderAsync').callsFake(async () => Promise.resolve());
            const orderbook = Orderbook.getOrderbookForPollingProvider({ httpEndpoint, pollingIntervalMs: 5 });
            const result = await orderbook.addOrdersAsync([createOrder(makerAssetData, takerAssetData).order]);
            expect(result.rejected.length).toBe(0);
            expect(result.accepted.length).toBe(1);
        });
    });
    describe('#getAvailableAssetDatasAsync', () => {
        test('gets the available assets', async () => {
            sinon
                .stub(HttpClient.prototype, 'getAssetPairsAsync')
                .callsFake(async () => Promise.resolve({ records: [], total: 0, perPage: 0, page: 1 }));
            const orderbook = Orderbook.getOrderbookForPollingProvider({ httpEndpoint, pollingIntervalMs: 5 });
            const result = await orderbook.getAvailableAssetDatasAsync();
            expect(result.length).toBe(0);
        });
    });
});
