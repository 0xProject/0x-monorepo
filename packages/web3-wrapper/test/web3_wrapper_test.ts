import * as chai from 'chai';
import * as Ganache from 'ganache-core';
import 'mocha';

import { Web3Wrapper } from '../src';

import { chaiSetup } from './utils/chai_setup';
chaiSetup.configure();

const { expect } = chai;

describe('Web3Wrapper tests', () => {
    const NETWORK_ID = 50;
    const provider = Ganache.provider({ network_id: NETWORK_ID });
    const web3Wrapper = new Web3Wrapper(provider);
    describe('#isAddress', () => {
        it('correctly checks if a string is a valid ethereum address', () => {
            expect(Web3Wrapper.isAddress('0x0')).to.be.false();
            expect(Web3Wrapper.isAddress('0xdeadbeef')).to.be.false();
            expect(Web3Wrapper.isAddress('42')).to.be.false();
            expect(Web3Wrapper.isAddress('weth.thetoken.eth')).to.be.false();
            expect(Web3Wrapper.isAddress('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')).to.be.true();
            expect(Web3Wrapper.isAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')).to.be.true();
        });
    });
    describe('#getNodeVersionAsync', () => {
        it('gets the node version', async () => {
            const nodeVersion = await web3Wrapper.getNodeVersionAsync();
            const NODE_VERSION = 'EthereumJS TestRPC/v2.1.0/ethereum-js';
            expect(nodeVersion).to.be.equal(NODE_VERSION);
        });
    });
    describe('#getNetworkIdAsync', () => {
        it('gets the network id', async () => {
            const networkId = await web3Wrapper.getNetworkIdAsync();
            expect(networkId).to.be.equal(NETWORK_ID);
        });
    });
});
