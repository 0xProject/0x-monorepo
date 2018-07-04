import * as chai from 'chai';
import { BlockParamLiteral } from 'ethereum-types';
import * as Ganache from 'ganache-core';
import 'mocha';

import { Web3Wrapper } from '../src';

import { chaiSetup } from './utils/chai_setup';
chaiSetup.configure();

const { expect } = chai;

const NUM_GANACHE_ADDRESSES = 10;

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
            const NODE_VERSION = 'EthereumJS TestRPC/v2.1.2/ethereum-js';
            expect(nodeVersion).to.be.equal(NODE_VERSION);
        });
    });
    describe('#getNetworkIdAsync', () => {
        it('gets the network id', async () => {
            const networkId = await web3Wrapper.getNetworkIdAsync();
            expect(networkId).to.be.equal(NETWORK_ID);
        });
    });
    describe('#getNetworkIdAsync', () => {
        it('gets the network id', async () => {
            const networkId = await web3Wrapper.getNetworkIdAsync();
            expect(networkId).to.be.equal(NETWORK_ID);
        });
    });
    describe('#getAvailableAddressesAsync', () => {
        it('gets the available addresses', async () => {
            const addresses = await web3Wrapper.getAvailableAddressesAsync();
            expect(addresses.length).to.be.equal(NUM_GANACHE_ADDRESSES);
        });
    });
    describe('#getBalanceInWeiAsync', () => {
        it('gets the users balance in wei', async () => {
            const addresses = await web3Wrapper.getAvailableAddressesAsync();
            const secondAccount = addresses[1];
            const balanceInWei = await web3Wrapper.getBalanceInWeiAsync(secondAccount);
            const tenEthInWei = 100000000000000000000;
            expect(balanceInWei).to.be.bignumber.equal(tenEthInWei);
        });
        it('should throw if supplied owner not an Ethereum address hex string', async () => {
            const invalidEthAddress = 'deadbeef';
            expect(web3Wrapper.getBalanceInWeiAsync(invalidEthAddress)).to.eventually.to.be.rejected();
        });
    });
    describe('#getBlockAsync', () => {
        it('gets block when supplied a valid BlockParamLiteral value', async () => {
            const blockParamLiteral = BlockParamLiteral.Earliest;
            const block = await web3Wrapper.getBlockAsync(blockParamLiteral);
            expect(block.number).to.be.equal(0);
        });
        it('gets block when supplied a block number', async () => {
            const blockParamLiteral = 0;
            const block = await web3Wrapper.getBlockAsync(blockParamLiteral);
            expect(block.number).to.be.equal(0);
        });
        it('gets block when supplied a block hash', async () => {
            const blockParamLiteral = 0;
            const block = await web3Wrapper.getBlockAsync(blockParamLiteral);
            const sameBlock = await web3Wrapper.getBlockAsync(block.hash as string);
            expect(sameBlock.number).to.be.equal(0);
        });
        it('should throw if supplied invalid blockParam value', async () => {
            const invalidBlockParam = 'deadbeef';
            expect(web3Wrapper.getBlockAsync(invalidBlockParam)).to.eventually.to.be.rejected();
        });
    });
});
