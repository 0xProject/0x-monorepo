import * as chai from 'chai';
import * as BigNumber from 'bignumber.js';
import {web3Factory} from './utils/web3_factory';
import {ZeroEx} from '../src/';
import {chaiSetup} from './utils/chai_setup';
import {Web3Wrapper} from '../src/web3_wrapper';
import {constants} from './utils/constants';
import {SchemaValidator, schemas} from '0x-json-schemas';

chaiSetup.configure();
chai.config.includeStack = true;
const expect = chai.expect;

// We need to have a mock API server in order to test that
describe.skip('Relay API', () => {
    const relay = new ZeroEx.Relay('http://0.0.0.0:8000');
    const schemaValidator = new SchemaValidator();
    describe('#getTokenPairsAsync', () => {
        it('gets token pairs', async () => {
            const tokenPairs = await relay.getTokenPairsAsync();
            expect(schemaValidator.isValid(tokenPairs, schemas.relayerApiTokenPairsResponseSchema)).to.be.true();
        });
    });
    describe('#getOrdersAsync', () => {
        it('gets orders', async () => {
            const orders = await relay.getOrdersAsync();
            expect(schemaValidator.isValid(orders, schemas.relayerApiOrdersResponseSchema)).to.be.true();
        });
    });
    describe('#getOrderAsync', () => {
        it('gets order', async () => {
            const orderHash = '0xdeadbeef';
            const order = await relay.getOrderAsync(orderHash);
            expect(schemaValidator.isValid(order, schemas.relayerApiOrderResponseSchema)).to.be.true();
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
            const fees = await relay.getFeesAsync(params);
            expect(schemaValidator.isValid(fees, schemas.relayerApiFeesResponseSchema)).to.be.true();
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
            await relay.submitOrderAsync(signedOrder);
        });
    });
});
