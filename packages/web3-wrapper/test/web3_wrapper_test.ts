import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { BlockParamLiteral, JSONRPCErrorCallback, JSONRPCRequestPayload, TransactionReceipt } from 'ethereum-types';
import * as Ganache from 'ganache-core';
import * as _ from 'lodash';
import 'mocha';

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
            const NODE_VERSION = 'EthereumJS TestRPC/v2.6.0/ethereum-js';
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
        it('should throw if the provider returns an error', async () => {
            const message = '0xdeadbeef';
            const signer = addresses[1];
            const fakeProvider = {
                async sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback): Promise<void> {
                    callback(new Error('User denied message signature'));
                },
            };
            const errorWeb3Wrapper = new Web3Wrapper(fakeProvider);
            expect(errorWeb3Wrapper.signMessageAsync(signer, message)).to.be.rejectedWith(
                'User denied message signature',
            );
        });
    });
    describe('#getBlockNumberAsync', () => {
        it('get block number', async () => {
            const blockNumber = await web3Wrapper.getBlockNumberAsync();
            expect(typeof blockNumber).to.be.equal('number');
        });
    });
    describe('#getTransactionReceiptAsync/awaitTransactionSuccessAsync', () => {
        it('get block number', async () => {
            const payload = { from: addresses[0], to: addresses[1], value: 1 };
            const txHash = await web3Wrapper.sendTransactionAsync(payload);
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
            const receiptIfExists = await web3Wrapper.getTransactionReceiptIfExistsAsync(txHash);
            expect(receiptIfExists).to.not.be.undefined();
            const receipt = receiptIfExists as TransactionReceipt;
            expect(receipt.transactionIndex).to.be.a('number');
            expect(receipt.transactionHash).to.be.equal(txHash);
        });
    });
    describe('#getBlockIfExistsAsync', () => {
        it('gets block when supplied a valid BlockParamLiteral value', async () => {
            const blockParamLiteral = BlockParamLiteral.Earliest;
            const blockIfExists = await web3Wrapper.getBlockIfExistsAsync(blockParamLiteral);
            if (blockIfExists === undefined) {
                throw new Error('Expected block to exist');
            }
            expect(blockIfExists.number).to.be.equal(0);
            expect(BigNumber.isBigNumber(blockIfExists.difficulty)).to.equal(true);
            expect(_.isNumber(blockIfExists.gasLimit)).to.equal(true);
        });
        it('gets block when supplied a block number', async () => {
            const blockParamLiteral = 0;
            const blockIfExists = await web3Wrapper.getBlockIfExistsAsync(blockParamLiteral);
            if (blockIfExists === undefined) {
                throw new Error('Expected block to exist');
            }
            expect(blockIfExists.number).to.be.equal(0);
        });
        it('gets block when supplied a block hash', async () => {
            const blockParamLiteral = 0;
            const blockIfExists = await web3Wrapper.getBlockIfExistsAsync(blockParamLiteral);
            if (blockIfExists === undefined) {
                throw new Error('Expected block to exist');
            }
            const sameBlockIfExists = await web3Wrapper.getBlockIfExistsAsync(blockIfExists.hash as string);
            if (sameBlockIfExists === undefined) {
                throw new Error('Expected block to exist');
            }
            expect(sameBlockIfExists.number).to.be.equal(0);
        });
        it('should throw if supplied invalid blockParam value', async () => {
            const invalidBlockParam = 'deadbeef';
            expect(web3Wrapper.getBlockIfExistsAsync(invalidBlockParam)).to.eventually.to.be.rejected();
        });
    });
    describe('#getBlockWithTransactionDataAsync', () => {
        it('gets block when supplied a valid BlockParamLiteral value', async () => {
            const blockParamLiteral = BlockParamLiteral.Earliest;
            const block = await web3Wrapper.getBlockWithTransactionDataAsync(blockParamLiteral);
            expect(block.number).to.be.equal(0);
            expect(BigNumber.isBigNumber(block.difficulty)).to.equal(true);
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
