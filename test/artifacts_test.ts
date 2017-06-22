import * as _ from 'lodash';
import * as chai from 'chai';
import * as BigNumber from 'bignumber.js';
import HDWalletProvider = require('truffle-hdwallet-provider');
import {chaiSetup} from './utils/chai_setup';
import {ZeroEx, Order} from '../src';
import {web3Factory} from './utils/web3_factory';
import {FillScenarios} from './utils/fill_scenarios';

chaiSetup.configure();
const expect = chai.expect;

// Those tests are slower cause they're talking to a remote node
const TIMEOUT = 10000;

describe('Artifacts', () => {
    describe('contracts are deployed on kovan', () => {
        const kovanRpcUrl = 'https://kovan.0xproject.com';
        const mnemonic = 'concert load couple harbor equip island argue ramp clarify fence smart topic';
        const web3Provider = new HDWalletProvider(mnemonic, kovanRpcUrl);
        const zeroEx = new ZeroEx(web3Provider);
        it('token registry contract is deployed', async () => {
            const tokens = await zeroEx.tokenRegistry.getTokensAsync();
        }).timeout(TIMEOUT);
        it('proxy contract is deployed', async () => {
            const [token] = await zeroEx.tokenRegistry.getTokensAsync();
            const allowance = await zeroEx.token.getProxyAllowanceAsync(token.address, ZeroEx.NULL_ADDRESS);
            expect(allowance).to.be.bignumber.equal(0);
        }).timeout(TIMEOUT);
        it('exchange contract is deployed', async () => {
            const userAddreses = await zeroEx.getAvailableAddressesAsync();
            const tokens = await zeroEx.tokenRegistry.getTokensAsync();
            const makerTokenAddress = tokens[0].address;
            const takerTokenAddress = tokens[1].address;
            // Unused anyway
            const zrxTokenAddress = ZeroEx.NULL_ADDRESS;
            const fillScenarios = new FillScenarios(zeroEx, userAddreses, tokens, zrxTokenAddress);
            const order: Order = {
                maker: userAddreses[0],
                taker: userAddreses[0],
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
                makerTokenAmount: new BigNumber(0),
                takerTokenAmount: new BigNumber(0),
                makerTokenAddress,
                takerTokenAddress,
                salt: ZeroEx.generatePseudoRandomSalt(),
                feeRecipient: ZeroEx.NULL_ADDRESS,
                expirationUnixTimestampSec: new BigNumber(2524604400),
            };
            const orderHash = await zeroEx.getOrderHashHexAsync(order);
        }).timeout(TIMEOUT);
    });
});
