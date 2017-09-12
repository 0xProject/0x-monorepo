import * as fetchMock from 'fetch-mock';
import * as chai from 'chai';
import * as BigNumber from 'bignumber.js';
import * as Sinon from 'sinon';
import {ZeroEx} from '../src/';
import {chaiSetup} from './utils/chai_setup';
import {Web3Wrapper} from '../src/web3_wrapper';
import {SchemaValidator, schemas} from '0x-json-schemas';

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
            fetchMock.get(`${relayUrl}/v0/token_pairs`, responsePayload);
            const tokenPairs = await relay.getTokenPairsAsync();
            expect(tokenPairs).to.be.deep.equal(responsePayload);
        });
    });
    describe('#getOrdersAsync', () => {
        it('gets orders', async () => {
            fetchMock.get(`${relayUrl}/v0/orders`, responsePayload);
            const orders = await relay.getOrdersAsync();
            expect(orders).to.be.deep.equal(responsePayload);
        });
    });
    describe('#getOrderAsync', () => {
        it('gets order', async () => {
            const orderHash = '0xdeadbeef';
            fetchMock.get(`${relayUrl}/v0/order/${orderHash}`, responsePayload);
            const order = await relay.getOrderAsync(orderHash);
            expect(order).to.be.deep.equal(responsePayload);
        });
    });
    describe('#getFeesAsync', () => {
        it('gets fees', async () => {
            const params = {
                maker: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
                taker: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
                makerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                takerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
                makerTokenAmount: '10000000000000000000',
                takerTokenAmount: '30000000000000000000',
            };
            fetchMock.post(`${relayUrl}/v0/fees`, responsePayload);
            const fees = await relay.getFeesAsync(params);
            expect(fees).to.be.deep.equal(responsePayload);
        });
    });
    describe('#submitOrderAsync', () => {
        it('submits an order', async () => {
            const signedOrder = {
                maker: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
                taker: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
                makerFee: new BigNumber(100000000000000),
                takerFee: new BigNumber(200000000000000),
                makerTokenAmount: new BigNumber(10000000000000000),
                takerTokenAmount: new BigNumber(20000000000000000),
                makerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                takerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
                salt: new BigNumber(256),
                feeRecipient: '0xB046140686d052ffF581f63f8136CcE132e857dA',
                exchangeContractAddress: '0x12459C951127e0c374FF9105DdA097662A027093',
                expirationUnixTimestampSec: new BigNumber(42),
                ecSignature: {
                    v: 27,
                    r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
                    s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
                },
            };
            fetchMock.post(`${relayUrl}/v0/order`, responsePayload);
            await relay.submitOrderAsync(signedOrder);
        });
    });
});
