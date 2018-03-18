import Eth from '@ledgerhq/hw-app-eth';
// HACK: This depdency is optional and tslint skips optional depdencies
// tslint:disable-next-line:no-implicit-dependencies
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import * as chai from 'chai';
import promisify = require('es6-promisify');
import * as ethUtils from 'ethereumjs-util';
import * as _ from 'lodash';
import Web3 = require('web3');
import Web3ProviderEngine = require('web3-provider-engine');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { LedgerSubprovider } from '../../src';
import { DoneCallback, LedgerEthereumClient } from '../../src/types';
import { chaiSetup } from '../chai_setup';
import { reportCallbackErrors } from '../utils/report_callback_errors';

chaiSetup.configure();
const expect = chai.expect;

async function ledgerEthereumNodeJsClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await TransportNodeHid.create();
    const ledgerEthClient = new Eth(ledgerConnection);
    return ledgerEthClient;
}

const TESTRPC_DERIVATION_PATH = `m/44'/60'/0'/0`;
const TEST_RPC_ACCOUNT_0 = '0x5409ed021d9299bf6814279a6a1411a7e866a631';

describe('LedgerSubprovider', () => {
    let ledgerSubprovider: LedgerSubprovider;
    const networkId: number = 42;
    before(async () => {
        ledgerSubprovider = new LedgerSubprovider({
            networkId,
            ledgerEthereumClientFactoryAsync: ledgerEthereumNodeJsClientFactoryAsync,
            derivationPath: TESTRPC_DERIVATION_PATH,
        });
    });
    describe('direct method calls', () => {
        it('returns default number of accounts', async () => {
            const accounts = await ledgerSubprovider.getAccountsAsync();
            expect(accounts[0]).to.not.be.an('undefined');
            expect(accounts.length).to.be.equal(10);
        });
        it('returns the expected first account from a ledger set up with the test mnemonic', async () => {
            const accounts = await ledgerSubprovider.getAccountsAsync();
            expect(accounts[0]).to.be.equal(TEST_RPC_ACCOUNT_0);
        });
        it('returns requested number of accounts', async () => {
            const numberOfAccounts = 20;
            const accounts = await ledgerSubprovider.getAccountsAsync(numberOfAccounts);
            expect(accounts[0]).to.not.be.an('undefined');
            expect(accounts.length).to.be.equal(numberOfAccounts);
        });
        it('signs a personal message', async () => {
            const data = ethUtils.bufferToHex(ethUtils.toBuffer('hello world'));
            const ecSignatureHex = await ledgerSubprovider.signPersonalMessageAsync(data);
            expect(ecSignatureHex.length).to.be.equal(132);
            expect(ecSignatureHex.substr(0, 2)).to.be.equal('0x');
        });
        it('signs a transaction', async () => {
            const tx = {
                nonce: '0x00',
                gas: '0x2710',
                to: '0x0000000000000000000000000000000000000000',
                value: '0x00',
                chainId: 3,
                from: TEST_RPC_ACCOUNT_0,
            };
            const txHex = await ledgerSubprovider.signTransactionAsync(tx);
            expect(txHex).to.be.equal(
                '0xf85f8080822710940000000000000000000000000000000000000000808078a0712854c73c69445cc1b22a7c3d7312ff9a97fe4ffba35fd636e8236b211b6e7ca0647cee031615e52d916c7c707025bc64ad525d8f1b9876c3435a863b42743178',
            );
        });
    });
    describe('calls through a provider', () => {
        let defaultProvider: Web3ProviderEngine;
        let ledgerProvider: Web3ProviderEngine;
        before(() => {
            ledgerProvider = new Web3ProviderEngine();
            ledgerProvider.addProvider(ledgerSubprovider);
            const httpProvider = new RpcSubprovider({
                rpcUrl: 'http://localhost:8545',
            });
            ledgerProvider.addProvider(httpProvider);
            ledgerProvider.start();

            defaultProvider = new Web3ProviderEngine();
            defaultProvider.addProvider(httpProvider);
            defaultProvider.start();
        });
        it('returns a list of accounts', (done: DoneCallback) => {
            const payload = {
                jsonrpc: '2.0',
                method: 'eth_accounts',
                params: [],
                id: 1,
            };
            const callback = reportCallbackErrors(done)((err: Error, response: Web3.JSONRPCResponsePayload) => {
                expect(err).to.be.a('null');
                expect(response.result.length).to.be.equal(10);
                done();
            });
            ledgerProvider.sendAsync(payload, callback);
        });
        it('signs a personal message with eth_sign', (done: DoneCallback) => {
            (async () => {
                const messageHex = ethUtils.bufferToHex(ethUtils.toBuffer('hello world'));
                const accounts = await ledgerSubprovider.getAccountsAsync();
                const signer = accounts[0];
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sign',
                    params: [signer, messageHex],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: Web3.JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result.length).to.be.equal(132);
                    expect(response.result.substr(0, 2)).to.be.equal('0x');
                    done();
                });
                ledgerProvider.sendAsync(payload, callback);
            })().catch(done);
        });
        it('signs a personal message with personal_sign', (done: DoneCallback) => {
            (async () => {
                const messageHex = ethUtils.bufferToHex(ethUtils.toBuffer('hello world'));
                const accounts = await ledgerSubprovider.getAccountsAsync();
                const signer = accounts[0];
                const payload = {
                    jsonrpc: '2.0',
                    method: 'personal_sign',
                    params: [messageHex, signer],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: Web3.JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result.length).to.be.equal(132);
                    expect(response.result.substr(0, 2)).to.be.equal('0x');
                    done();
                });
                ledgerProvider.sendAsync(payload, callback);
            })().catch(done);
        });
        it('signs a transaction', (done: DoneCallback) => {
            const tx = {
                to: '0xafa3f8684e54059998bc3a7b0d2b0da075154d66',
                value: '0x00',
            };
            const payload = {
                jsonrpc: '2.0',
                method: 'eth_signTransaction',
                params: [tx],
                id: 1,
            };
            const callback = reportCallbackErrors(done)((err: Error, response: Web3.JSONRPCResponsePayload) => {
                expect(err).to.be.a('null');
                expect(response.result.raw.length).to.be.equal(206);
                expect(response.result.raw.substr(0, 2)).to.be.equal('0x');
                done();
            });
            ledgerProvider.sendAsync(payload, callback);
        });
        it('signs and sends a transaction', (done: DoneCallback) => {
            (async () => {
                const accounts = await ledgerSubprovider.getAccountsAsync();

                // Give first account on Ledger sufficient ETH to complete tx send
                let tx = {
                    to: accounts[0],
                    from: TEST_RPC_ACCOUNT_0,
                    value: '0x8ac7230489e80000', // 10 ETH
                };
                let payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sendTransaction',
                    params: [tx],
                    id: 1,
                };
                await promisify(defaultProvider.sendAsync, defaultProvider)(payload);

                // Send transaction from Ledger
                tx = {
                    to: '0xafa3f8684e54059998bc3a7b0d2b0da075154d66',
                    from: accounts[0],
                    value: '0xde0b6b3a7640000',
                };
                payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sendTransaction',
                    params: [tx],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: Web3.JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    const result = response.result;
                    expect(result.length).to.be.equal(66);
                    expect(result.substr(0, 2)).to.be.equal('0x');
                    done();
                });
                ledgerProvider.sendAsync(payload, callback);
            })().catch(done);
        });
    });
});
