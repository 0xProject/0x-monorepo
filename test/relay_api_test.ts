import * as fetchMock from 'fetch-mock';
import * as chai from 'chai';
import * as BigNumber from 'bignumber.js';
import * as Sinon from 'sinon';
import {ZeroEx} from '../src/';
import {chaiSetup} from './utils/chai_setup';
import {Web3Wrapper} from '../src/web3_wrapper';
import {SchemaValidator, schemas} from '0x-json-schemas';
import {feesResponse} from './fixtures/standard_relayer_api/fees';
import {
    orderResponse,
} from './fixtures/standard_relayer_api/order/0xabc67323774bdbd24d94f977fa9ac94a50f016026fd13f42990861238897721f';
import {ordersResponse} from './fixtures/standard_relayer_api/orders';
import {tokenPairsResponse} from './fixtures/standard_relayer_api/token_pairs';
import * as feesResponseJSON from './fixtures/standard_relayer_api/fees.json';
import * as orderResponseJSON from './fixtures/standard_relayer_api/order/0xabc67323774bdbd24d94f977fa9ac94a50f016026fd13f42990861238897721f.json'; // tslint:disable-line
import * as ordersResponseJSON from './fixtures/standard_relayer_api/orders.json';
import * as tokenPairsResponseJSON from './fixtures/standard_relayer_api/token_pairs.json';

chaiSetup.configure();
chai.config.includeStack = true;
const expect = chai.expect;

// We need to have a mock API server in order to test that
describe('Relay API', () => {
    const relayUrl = 'https://example.com';
    const relay = new ZeroEx.Relay(relayUrl);
    const schemaValidator = new SchemaValidator();
    const responsePayload = {example: 'data'};
    afterEach(() => {
        fetchMock.restore();
    });
    describe('#getTokenPairsAsync', () => {
        it('gets token pairs', async () => {
            fetchMock.get(`${relayUrl}/v0/token_pairs`, tokenPairsResponseJSON);
            const tokenPairs = await relay.getTokenPairsAsync();
            expect(tokenPairs).to.be.deep.equal(tokenPairsResponse);
        });
    });
    describe('#getOrdersAsync', () => {
        it('gets orders', async () => {
            fetchMock.get(`${relayUrl}/v0/orders`, ordersResponseJSON);
            const orders = await relay.getOrdersAsync();
            expect(orders).to.be.deep.equal(ordersResponse);
        });
    });
    describe('#getOrderAsync', () => {
        it('gets order', async () => {
            const orderHash = '0xabc67323774bdbd24d94f977fa9ac94a50f016026fd13f42990861238897721f';
            fetchMock.get(`${relayUrl}/v0/order/${orderHash}`, orderResponseJSON);
            const order = await relay.getOrderAsync(orderHash);
            expect(order).to.be.deep.equal(orderResponse);
        });
    });
    describe('#getFeesAsync', () => {
        it('gets fees', async () => {
            const params = {
                maker: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
                taker: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
                makerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                takerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
                makerTokenAmount: new BigNumber('10000000000000000000'),
                takerTokenAmount: new BigNumber('30000000000000000000'),
            };
            fetchMock.post(`${relayUrl}/v0/fees`, JSON.stringify(feesResponseJSON));
            const fees = await relay.getFeesAsync(params);
            expect(fees).to.be.deep.equal(feesResponse);
        });
    });
    describe('#submitOrderAsync', () => {
        it('submits an order', async () => {
            const signedOrder = orderResponse.signedOrder;
            const signedOrderJSON = (orderResponseJSON as any).signedOrder;
            fetchMock.post(`${relayUrl}/v0/order`, orderResponseJSON);
            await relay.submitOrderAsync(signedOrder);
        });
    });
});
