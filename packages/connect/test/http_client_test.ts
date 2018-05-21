import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as dirtyChai from 'dirty-chai';
import * as fetchMock from 'fetch-mock';
import 'make-promises-safe';
import 'mocha';

import { HttpClient } from '../src/index';

import { feesResponse } from './fixtures/standard_relayer_api/fees';
import * as feesResponseJSON from './fixtures/standard_relayer_api/fees.json';
import { orderResponse } from './fixtures/standard_relayer_api/order/0xabc67323774bdbd24d94f977fa9ac94a50f016026fd13f42990861238897721f';
import * as orderResponseJSON from './fixtures/standard_relayer_api/order/0xabc67323774bdbd24d94f977fa9ac94a50f016026fd13f42990861238897721f.json';
import { orderbookResponse } from './fixtures/standard_relayer_api/orderbook';
import * as orderbookJSON from './fixtures/standard_relayer_api/orderbook.json';
import { ordersResponse } from './fixtures/standard_relayer_api/orders';
import * as ordersResponseJSON from './fixtures/standard_relayer_api/orders.json';
import { tokenPairsResponse } from './fixtures/standard_relayer_api/token_pairs';
import * as tokenPairsResponseJSON from './fixtures/standard_relayer_api/token_pairs.json';

chai.config.includeStack = true;
chai.use(dirtyChai);
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('HttpClient', () => {
    const relayUrl = 'https://example.com';
    const relayerClient = new HttpClient(relayUrl);
    afterEach(() => {
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
    describe('#getTokenPairsAsync', () => {
        const url = `${relayUrl}/token_pairs`;
        it('gets token pairs with default options when none are provided', async () => {
            const urlWithQuery = `${url}?page=1&per_page=100`;
            fetchMock.get(urlWithQuery, tokenPairsResponseJSON);
            const tokenPairs = await relayerClient.getTokenPairsAsync();
            expect(tokenPairs).to.be.deep.equal(tokenPairsResponse);
        });
        it('gets token pairs with specified request options', async () => {
            const tokenAddress = '0x323b5d4c32345ced77393b3530b1eed0f346429d';
            const tokenPairsRequestOpts = {
                tokenA: tokenAddress,
                page: 3,
                perPage: 50,
            };
            const urlWithQuery = `${url}?page=3&per_page=50&tokenA=${tokenAddress}`;
            fetchMock.get(urlWithQuery, tokenPairsResponseJSON);
            const tokenPairs = await relayerClient.getTokenPairsAsync(tokenPairsRequestOpts);
            expect(tokenPairs).to.be.deep.equal(tokenPairsResponse);
        });
        it('throws an error for invalid JSON response', async () => {
            fetchMock.get(url, { test: 'dummy' });
            expect(relayerClient.getTokenPairsAsync()).to.be.rejected();
        });
    });
    describe('#getOrdersAsync', () => {
        const url = `${relayUrl}/orders`;
        it('gets orders with default options when none are provided', async () => {
            const urlWithQuery = `${url}?page=1&per_page=100`;
            fetchMock.get(urlWithQuery, ordersResponseJSON);
            const orders = await relayerClient.getOrdersAsync();
            expect(orders).to.be.deep.equal(ordersResponse);
        });
        it('gets orders with specified request options', async () => {
            const tokenAddress = '0x323b5d4c32345ced77393b3530b1eed0f346429d';
            const ordersRequest = {
                tokenAddress,
                page: 3,
                perPage: 50,
            };
            const urlWithQuery = `${url}?page=3&per_page=50&tokenAddress=${tokenAddress}`;
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
            baseTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
            quoteTokenAddress: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
        };
        const url = `${relayUrl}/orderbook`;
        it('gets orderbook with default page options when none are provided', async () => {
            const urlWithQuery = `${url}?baseTokenAddress=${
                request.baseTokenAddress
            }&page=1&per_page=100&quoteTokenAddress=${request.quoteTokenAddress}`;
            fetchMock.get(urlWithQuery, orderbookJSON);
            const orderbook = await relayerClient.getOrderbookAsync(request);
            expect(orderbook).to.be.deep.equal(orderbookResponse);
        });
        it('gets orderbook with specified page options', async () => {
            const urlWithQuery = `${url}?baseTokenAddress=${
                request.baseTokenAddress
            }&page=3&per_page=50&quoteTokenAddress=${request.quoteTokenAddress}`;
            fetchMock.get(urlWithQuery, orderbookJSON);
            const pagedRequestOptions = {
                page: 3,
                perPage: 50,
            };
            const orderbook = await relayerClient.getOrderbookAsync(request, pagedRequestOptions);
            expect(orderbook).to.be.deep.equal(orderbookResponse);
        });
        it('throws an error for invalid JSON response', async () => {
            fetchMock.get(url, { test: 'dummy' });
            expect(relayerClient.getOrderbookAsync(request)).to.be.rejected();
        });
    });
    describe('#getFeesAsync', () => {
        const request = {
            exchangeContractAddress: '0x12459c951127e0c374ff9105dda097662a027093',
            maker: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
            taker: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
            makerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
            takerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
            makerTokenAmount: new BigNumber('10000000000000000000'),
            takerTokenAmount: new BigNumber('30000000000000000000'),
            salt: new BigNumber('256'),
            expirationUnixTimestampSec: new BigNumber('42'),
        };
        const url = `${relayUrl}/fees`;
        it('gets fees', async () => {
            fetchMock.post(url, feesResponseJSON);
            const fees = await relayerClient.getFeesAsync(request);
            expect(fees).to.be.deep.equal(feesResponse);
        });
        it('does not mutate input', async () => {
            fetchMock.post(url, feesResponseJSON);
            const makerTokenAmountBefore = new BigNumber(request.makerTokenAmount);
            const takerTokenAmountBefore = new BigNumber(request.takerTokenAmount);
            const saltBefore = new BigNumber(request.salt);
            const expirationUnixTimestampSecBefore = new BigNumber(request.expirationUnixTimestampSec);
            await relayerClient.getFeesAsync(request);
            expect(makerTokenAmountBefore).to.be.deep.equal(request.makerTokenAmount);
            expect(takerTokenAmountBefore).to.be.deep.equal(request.takerTokenAmount);
            expect(saltBefore).to.be.deep.equal(request.salt);
            expect(expirationUnixTimestampSecBefore).to.be.deep.equal(request.expirationUnixTimestampSec);
        });
        it('throws an error for invalid JSON response', async () => {
            fetchMock.post(url, { test: 'dummy' });
            expect(relayerClient.getFeesAsync(request)).to.be.rejected();
        });
    });
});
