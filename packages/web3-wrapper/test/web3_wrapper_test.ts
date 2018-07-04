import * as chai from 'chai';
import { BlockParamLiteral } from 'ethereum-types';
import * as Ganache from 'ganache-core';
import * as _ from 'lodash';
import 'mocha';

import { utils } from '../src/utils';
import { Web3Wrapper } from '../src/web3_wrapper';

import { chaiSetup } from './utils/chai_setup';
chaiSetup.configure();

const { expect } = chai;

const NUM_GANACHE_ADDRESSES = 10;

describe('Web3Wrapper tests', () => {
    const NETWORK_ID = 50;
    const provider = Ganache.provider({ network_id: NETWORK_ID });
    const web3Wrapper = new Web3Wrapper(provider);
    let addresses: string[];
    before(async () => {
        addresses = await web3Wrapper.getAvailableAddressesAsync();
    });
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
            const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
            expect(availableAddresses.length).to.be.equal(NUM_GANACHE_ADDRESSES);
            expect(Web3Wrapper.isAddress(availableAddresses[0])).to.equal(true);
        });
    });
    describe('#getBalanceInWeiAsync', () => {
        it('gets the users balance in wei', async () => {
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
    describe('#signMessageAsync', () => {
        it('should sign message', async () => {
            const message = '0xdeadbeef';
            const signer = addresses[1];
            const signature = await web3Wrapper.signMessageAsync(signer, message);
            const signatureLength = 132;
            expect(signature.length).to.be.equal(signatureLength);
        });
    });
    describe('#getBlockNumberAsync', () => {
        it('get block number', async () => {
            const blockNumber = await web3Wrapper.getBlockNumberAsync();
            expect(typeof blockNumber).to.be.equal('number');
        });
    });
    describe('#getBlockAsync', () => {
        it('gets block when supplied a valid BlockParamLiteral value', async () => {
            const blockParamLiteral = BlockParamLiteral.Earliest;
            const block = await web3Wrapper.getBlockAsync(blockParamLiteral);
            expect(block.number).to.be.equal(0);
            expect(utils.isBigNumber(block.difficulty)).to.equal(true);
            expect(_.isNumber(block.gasLimit)).to.equal(true);
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
    describe('#getBlockWithTransactionDataAsync', () => {
        it('gets block when supplied a valid BlockParamLiteral value', async () => {
            const blockParamLiteral = BlockParamLiteral.Earliest;
            const block = await web3Wrapper.getBlockWithTransactionDataAsync(blockParamLiteral);
            expect(block.number).to.be.equal(0);
            expect(utils.isBigNumber(block.difficulty)).to.equal(true);
            expect(_.isNumber(block.gasLimit)).to.equal(true);
        });
        it('should throw if supplied invalid blockParam value', async () => {
            const invalidBlockParam = 'deadbeef';
            expect(web3Wrapper.getBlockWithTransactionDataAsync(invalidBlockParam)).to.eventually.to.be.rejected();
        });
    });
    describe('#getBlockTimestampAsync', () => {
        it('gets block timestamp', async () => {
            const blockParamLiteral = BlockParamLiteral.Earliest;
            const timestamp = await web3Wrapper.getBlockTimestampAsync(blockParamLiteral);
            expect(_.isNumber(timestamp)).to.be.equal(true);
        });
    });
});
