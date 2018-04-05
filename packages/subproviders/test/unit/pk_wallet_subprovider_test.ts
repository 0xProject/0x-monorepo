import { JSONRPCResponsePayload } from '@0xproject/types';
import * as chai from 'chai';
import * as ethUtils from 'ethereumjs-util';
import * as _ from 'lodash';
import Web3ProviderEngine = require('web3-provider-engine');

import { GanacheSubprovider, PKWalletSubprovider } from '../../src/';
import {
    DoneCallback,
    LedgerCommunicationClient,
    LedgerSubproviderErrors,
    WalletSubproviderErrors,
} from '../../src/types';
import { chaiSetup } from '../chai_setup';
import { reportCallbackErrors } from '../utils/report_callback_errors';

chaiSetup.configure();
const expect = chai.expect;
const TEST_RPC_ACCOUNT_0 = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
const TEST_ACCOUNT_PRIVATE_KEY = 'F2F48EE19680706196E2E339E5DA3491186E0C4C5030670656B0E0164837257D';

describe('PKWalletSubprovider', () => {
    let subprovider: PKWalletSubprovider;
    before(async () => {
        subprovider = new PKWalletSubprovider(TEST_ACCOUNT_PRIVATE_KEY);
    });
    describe('direct method calls', () => {
        describe('success cases', () => {
            it('returns the account', async () => {
                const accounts = await subprovider.getAccountsAsync();
                expect(accounts[0]).to.be.equal(TEST_RPC_ACCOUNT_0);
                expect(accounts.length).to.be.equal(1);
            });
            it('signs a personal message', async () => {
                const data = ethUtils.bufferToHex(ethUtils.toBuffer('hello world'));
                const ecSignatureHex = await subprovider.signPersonalMessageAsync(data);
                expect(ecSignatureHex).to.be.equal(
                    '0x1b0ec5e2908e993d0c8ab6b46da46be2688fdf03c7ea6686075de37392e50a7d7fcc531446699132fbda915bd989882e0064d417018773a315fb8d43ed063c9b00',
                );
            });
            it('signs a transaction', async () => {
                const tx = {
                    nonce: '0x00',
                    gasPrice: '0x0',
                    gas: '0x2710',
                    to: '0x0000000000000000000000000000000000000000',
                    value: '0x00',
                    chainId: 3,
                    from: TEST_RPC_ACCOUNT_0,
                };
                const txHex = await subprovider.signTransactionAsync(tx);
                expect(txHex).to.be.equal(
                    '0xf85f808082271094000000000000000000000000000000000000000080802aa018894834d89899f71f6d8e74e6992fea34914c3b6d8090495f738086ca18f15da056e3333ec6c7465512a49558a84b56ec358718feaf0b162bda9aa6c40824ede4',
                );
            });
        });
    });
    describe('calls through a provider', () => {
        let provider: Web3ProviderEngine;
        before(() => {
            provider = new Web3ProviderEngine();
            provider.addProvider(subprovider);
            const ganacheSubprovider = new GanacheSubprovider({});
            provider.addProvider(ganacheSubprovider);
            provider.start();
        });
        describe('success cases', () => {
            it('returns a list of accounts', (done: DoneCallback) => {
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_accounts',
                    params: [],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result[0]).to.be.equal(TEST_RPC_ACCOUNT_0);
                    expect(response.result.length).to.be.equal(1);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs a personal message with eth_sign', (done: DoneCallback) => {
                const messageHex = ethUtils.bufferToHex(ethUtils.toBuffer('hello world'));
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sign',
                    params: ['0x0000000000000000000000000000000000000000', messageHex],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result).to.be.equal(
                        '0x1b0ec5e2908e993d0c8ab6b46da46be2688fdf03c7ea6686075de37392e50a7d7fcc531446699132fbda915bd989882e0064d417018773a315fb8d43ed063c9b00',
                    );
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs a personal message with personal_sign', (done: DoneCallback) => {
                const messageHex = ethUtils.bufferToHex(ethUtils.toBuffer('hello world'));
                const payload = {
                    jsonrpc: '2.0',
                    method: 'personal_sign',
                    params: [messageHex, '0x0000000000000000000000000000000000000000'],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result).to.be.equal(
                        '0x1b0ec5e2908e993d0c8ab6b46da46be2688fdf03c7ea6686075de37392e50a7d7fcc531446699132fbda915bd989882e0064d417018773a315fb8d43ed063c9b00',
                    );
                    done();
                });
                provider.sendAsync(payload, callback);
            });
        });
        describe('failure cases', () => {
            it('should throw if `data` param not hex when calling eth_sign', (done: DoneCallback) => {
                const nonHexMessage = 'hello world';
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sign',
                    params: ['0x0000000000000000000000000000000000000000', nonHexMessage],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal('Expected data to be of type HexString, encountered: hello world');
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('should throw if `data` param not hex when calling personal_sign', (done: DoneCallback) => {
                const nonHexMessage = 'hello world';
                const payload = {
                    jsonrpc: '2.0',
                    method: 'personal_sign',
                    params: [nonHexMessage, '0x0000000000000000000000000000000000000000'],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal('Expected data to be of type HexString, encountered: hello world');
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('should throw if `from` param missing when calling eth_sendTransaction', (done: DoneCallback) => {
                const tx = {
                    to: '0xafa3f8684e54059998bc3a7b0d2b0da075154d66',
                    value: '0xde0b6b3a7640000',
                };
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sendTransaction',
                    params: [tx],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal(WalletSubproviderErrors.SenderInvalidOrNotSupplied);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('should throw if `from` param invalid address when calling eth_sendTransaction', (done: DoneCallback) => {
                const tx = {
                    to: '0xafa3f8684e54059998bc3a7b0d2b0da075154d66',
                    from: '0xIncorrectEthereumAddress',
                    value: '0xde0b6b3a7640000',
                };
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sendTransaction',
                    params: [tx],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal(WalletSubproviderErrors.SenderInvalidOrNotSupplied);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
        });
    });
});
