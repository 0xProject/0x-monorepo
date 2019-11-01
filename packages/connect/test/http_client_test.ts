import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as dirtyChai from 'dirty-chai';
import * as fetchMock from 'fetch-mock';
import 'mocha';

import { HttpClient } from '../src/index';

import { assetDataPairsResponse } from './fixtures/standard_relayer_api/asset_pairs';
import * as assetDataPairsResponseJSON from './fixtures/standard_relayer_api/asset_pairs.json';
import { feeRecipientsResponse } from './fixtures/standard_relayer_api/fee_recipients';
import * as feeRecipientsResponseJSON from './fixtures/standard_relayer_api/fee_recipients.json';
import { orderResponse } from './fixtures/standard_relayer_api/order/0xabc67323774bdbd24d94f977fa9ac94a50f016026fd13f42990861238897721f';
import * as orderResponseJSON from './fixtures/standard_relayer_api/order/0xabc67323774bdbd24d94f977fa9ac94a50f016026fd13f42990861238897721f.json';
import { orderConfigResponse } from './fixtures/standard_relayer_api/order_config';
import * as orderConfigResponseJSON from './fixtures/standard_relayer_api/order_config.json';
import { orderbookResponse } from './fixtures/standard_relayer_api/orderbook';
import * as orderbookJSON from './fixtures/standard_relayer_api/orderbook.json';
import { ordersResponse } from './fixtures/standard_relayer_api/orders';
import * as ordersResponseJSON from './fixtures/standard_relayer_api/orders.json';

chai.config.includeStack = true;
chai.use(dirtyChai);
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('HttpClient', () => {
    const relayUrl = 'https://example.com';
    const relayerClient = new HttpClient(relayUrl);
    beforeEach(() => {
        fetchMock.restore();
    });
    describe('#constructor', () => {
        it('should remove trailing slashes from api url', async () => {
            const urlWithTrailingSlash = 'https://slash.com/';
            const urlWithoutTrailingSlash = 'https://slash.com';
            const client = new HttpClient(urlWithTrailingSlash);
            const sanitizedUrl = (client as any)._apiEndpointUrl;
            expect(sanitizedUrl).to.be.deep.equal(urlWithoutTrailingSlash);
        });
    });
    describe('#getAssetPairsAsync', () => {
        const url = `${relayUrl}/asset_pairs`;
        it('gets assetData pairs with default options when none are provided', async () => {
            fetchMock.get(url, assetDataPairsResponseJSON);
            const assetDataPairs = await relayerClient.getAssetPairsAsync();
            expect(assetDataPairs).to.be.deep.equal(assetDataPairsResponse);
        });
        it('gets assetData pairs with specified request options', async () => {
            const assetData = '0xf47261b04c32345ced77393b3530b1eed0f346429d';
            const assetPairsRequestOpts = {
                assetDataA: assetData,
                page: 3,
                perPage: 50,
                networkId: 42,
            };
            const urlWithQuery = `${url}?assetDataA=${assetData}&networkId=42&page=3&perPage=50`;
            fetchMock.get(urlWithQuery, assetDataPairsResponseJSON);
            const assetDataPairs = await relayerClient.getAssetPairsAsync(assetPairsRequestOpts);
            expect(assetDataPairs).to.be.deep.equal(assetDataPairsResponse);
        });
        it('throws an error for invalid JSON response', async () => {
            fetchMock.get(url, { test: 'dummy' });
            expect(relayerClient.getAssetPairsAsync()).to.be.rejected();
        });
    });
    describe('#getOrdersAsync', () => {
        const url = `${relayUrl}/orders`;
        it('gets orders with default options when none are provided', async () => {
            fetchMock.get(url, ordersResponseJSON);
            const orders = await relayerClient.getOrdersAsync();
            expect(orders).to.be.deep.equal(ordersResponse);
        });
        it('gets orders with specified request options', async () => {
            const assetDataAddress = '0x323b5d4c32345ced77393b3530b1eed0f346429d';
            const ordersRequest = {
                assetDataAddress,
                page: 3,
                perPage: 50,
                networkId: 42,
            };
            const urlWithQuery = `${url}?assetDataAddress=${assetDataAddress}&networkId=42&page=3&perPage=50`;
            fetchMock.get(urlWithQuery, ordersResponseJSON);
            const orders = await relayerClient.getOrdersAsync(ordersRequest);
            expect(orders).to.be.deep.equal(ordersResponse);
        });
        it('throws an error for invalid JSON response', async () => {
            fetchMock.get(url, { test: 'dummy' });
            expect(relayerClient.getOrdersAsync()).to.be.rejected();
        });
    });
    describe('#getOrderAsync', () => {
        const orderHash = '0xabc67323774bdbd24d94f977fa9ac94a50f016026fd13f42990861238897721f';
        const url = `${relayUrl}/order/${orderHash}`;
        it('gets order', async () => {
            fetchMock.get(url, orderResponseJSON);
            const order = await relayerClient.getOrderAsync(orderHash);
            expect(order).to.be.deep.equal(orderResponse);
        });
        it('throws an error for invalid JSON response', async () => {
            fetchMock.get(url, { test: 'dummy' });
            expect(relayerClient.getOrderAsync(orderHash)).to.be.rejected();
        });
    });
    describe('#getOrderBookAsync', () => {
        const request = {
            baseAssetData: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
            quoteAssetData: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
        };
        const url = `${relayUrl}/orderbook`;
        it('gets orderbook with default page options when none are provided', async () => {
            const urlWithQuery = `${url}?baseAssetData=${request.baseAssetData}&quoteAssetData=${
                request.quoteAssetData
            }`;
            fetchMock.get(urlWithQuery, orderbookJSON);
            const orderbook = await relayerClient.getOrderbookAsync(request);
            expect(orderbook).to.be.deep.equal(orderbookResponse);
        });
        it('gets orderbook with specified page options', async () => {
            const urlWithQuery = `${url}?baseAssetData=${
                request.baseAssetData
            }&networkId=42&page=3&perPage=50&quoteAssetData=${request.quoteAssetData}`;
            fetchMock.get(urlWithQuery, orderbookJSON);
            const pagedRequestOptions = {
                page: 3,
                perPage: 50,
                networkId: 42,
            };
            const orderbook = await relayerClient.getOrderbookAsync(request, pagedRequestOptions);
            expect(orderbook).to.be.deep.equal(orderbookResponse);
        });
        it('throws an error for invalid JSON response', async () => {
            fetchMock.get(url, { test: 'dummy' });
            expect(relayerClient.getOrderbookAsync(request)).to.be.rejected();
        });
    });
    describe('#getOrderConfigAsync', () => {
        const request = {
            makerAddress: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
            takerAddress: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
            makerAssetAmount: new BigNumber('10000000000000000'),
            takerAssetAmount: new BigNumber('20000000000000000'),
            expirationTimeSeconds: new BigNumber('1532560590'),
            makerAssetData: '0xf47261b04c32345ced77393b3530b1eed0f346429d',
            takerAssetData: '0x0257179264389b814a946f3e92105513705ca6b990',
            exchangeAddress: '0x12459c951127e0c374ff9105dda097662a027093',
        };
        const url = `${relayUrl}/order_config`;
        it('gets order config', async () => {
            fetchMock.post(url, orderConfigResponseJSON);
            const fees = await relayerClient.getOrderConfigAsync(request);
            expect(fees).to.be.deep.equal(orderConfigResponse);
        });
        it('does not mutate input', async () => {
            fetchMock.post(url, orderConfigResponseJSON);
            const makerAssetAmountBefore = request.makerAssetAmount;
            const takerAssetAmountBefore = request.takerAssetAmount;
            const expirationTimeSecondsBefore = request.expirationTimeSeconds;
            await relayerClient.getOrderConfigAsync(request);
            expect(makerAssetAmountBefore).to.be.deep.equal(request.makerAssetAmount);
            expect(takerAssetAmountBefore).to.be.deep.equal(request.takerAssetAmount);
            expect(expirationTimeSecondsBefore).to.be.deep.equal(request.expirationTimeSeconds);
        });
        it('throws an error for invalid JSON response', async () => {
            fetchMock.post(url, { test: 'dummy' });
            expect(relayerClient.getOrderConfigAsync(request)).to.be.rejected();
        });
    });
    describe('#getFeeRecipientsAsync', () => {
        const url = `${relayUrl}/fee_recipients`;
        it('gets fee recipients with default page options when none are provided', async () => {
            fetchMock.get(url, feeRecipientsResponseJSON);
            const feeRecipients = await relayerClient.getFeeRecipientsAsync();
            expect(feeRecipients).to.be.deep.equal(feeRecipientsResponse);
        });
        it('gets fee recipient with specified page options', async () => {
            const urlWithQuery = `${url}?networkId=42&page=3&perPage=50`;
            fetchMock.get(urlWithQuery, feeRecipientsResponseJSON);
            const pagedRequestOptions = {
                page: 3,
                perPage: 50,
                networkId: 42,
            };
            const feeRecipients = await relayerClient.getFeeRecipientsAsync(pagedRequestOptions);
            expect(feeRecipients).to.be.deep.equal(feeRecipientsResponse);
        });
        it('throws an error for invalid JSON response', async () => {
            fetchMock.get(url, { test: 'dummy' });
            expect(relayerClient.getFeeRecipientsAsync()).to.be.rejected();
        });
    });
});
