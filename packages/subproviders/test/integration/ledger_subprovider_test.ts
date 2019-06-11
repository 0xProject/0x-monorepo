import { DoneCallback } from '@0x/types';
import { promisify, providerUtils } from '@0x/utils';
import Eth from '@ledgerhq/hw-app-eth';
// HACK: This dependency is optional and tslint skips optional dependencies
// tslint:disable-next-line:no-implicit-dependencies
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import * as chai from 'chai';
import { JSONRPCResponsePayload } from 'ethereum-types';
import * as ethUtils from 'ethereumjs-util';

import { LedgerSubprovider, RPCSubprovider, Web3ProviderEngine } from '../../src';
import { LedgerEthereumClient } from '../../src/types';
import { chaiSetup } from '../chai_setup';
import { fixtureData } from '../utils/fixture_data';
import { reportCallbackErrors } from '../utils/report_callback_errors';

chaiSetup.configure();
const expect = chai.expect;
const DEFAULT_NUM_ACCOUNTS = 10;
const EXPECTED_SIGNATURE_LENGTH = 132;

async function ledgerEthereumNodeJsClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await TransportNodeHid.create();
    const ledgerEthClient = new Eth(ledgerConnection);
    return ledgerEthClient;
}

describe('LedgerSubprovider', () => {
    let ledgerSubprovider: LedgerSubprovider;
    const networkId: number = fixtureData.NETWORK_ID;
    before(async () => {
        ledgerSubprovider = new LedgerSubprovider({
            networkId,
            ledgerEthereumClientFactoryAsync: ledgerEthereumNodeJsClientFactoryAsync,
            baseDerivationPath: fixtureData.TESTRPC_BASE_DERIVATION_PATH,
        });
    });
    describe('direct method calls', () => {
        it('returns default number of accounts', async () => {
            const accounts = await ledgerSubprovider.getAccountsAsync();
            expect(accounts[0]).to.not.be.an('undefined');
            expect(accounts.length).to.be.equal(DEFAULT_NUM_ACCOUNTS);
        });
        it('returns the expected accounts from a ledger set up with the test mnemonic', async () => {
            const accounts = await ledgerSubprovider.getAccountsAsync();
            expect(accounts[0]).to.be.equal(fixtureData.TEST_RPC_ACCOUNT_0);
            expect(accounts[1]).to.be.equal(fixtureData.TEST_RPC_ACCOUNT_1);
        });
        it('returns requested number of accounts', async () => {
            const numberOfAccounts = 20;
            const accounts = await ledgerSubprovider.getAccountsAsync(numberOfAccounts);
            expect(accounts[0]).to.not.be.an('undefined');
            expect(accounts.length).to.be.equal(numberOfAccounts);
        });
        it('signs a personal message', async () => {
            const data = ethUtils.bufferToHex(ethUtils.toBuffer(fixtureData.PERSONAL_MESSAGE_STRING));
            const ecSignatureHex = await ledgerSubprovider.signPersonalMessageAsync(
                data,
                fixtureData.TEST_RPC_ACCOUNT_0,
            );
            expect(ecSignatureHex).to.be.equal(fixtureData.PERSONAL_MESSAGE_SIGNED_RESULT);
        });
        it('signs a personal message with second address', async () => {
            const data = ethUtils.bufferToHex(ethUtils.toBuffer(fixtureData.PERSONAL_MESSAGE_STRING));
            const ecSignatureHex = await ledgerSubprovider.signPersonalMessageAsync(
                data,
                fixtureData.TEST_RPC_ACCOUNT_1,
            );
            expect(ecSignatureHex).to.be.equal(fixtureData.PERSONAL_MESSAGE_ACCOUNT_1_SIGNED_RESULT);
        });
        it('signs a transaction', async () => {
            const txHex = await ledgerSubprovider.signTransactionAsync(fixtureData.TX_DATA);
            expect(txHex).to.be.equal(fixtureData.TX_DATA_SIGNED_RESULT);
        });
        it('signs a transaction with the second address', async () => {
            const txData = { ...fixtureData.TX_DATA, from: fixtureData.TEST_RPC_ACCOUNT_1 };
            const txHex = await ledgerSubprovider.signTransactionAsync(txData);
            expect(txHex).to.be.equal(fixtureData.TX_DATA_ACCOUNT_1_SIGNED_RESULT);
        });
    });
    describe('calls through a provider', () => {
        let defaultProvider: Web3ProviderEngine;
        let ledgerProvider: Web3ProviderEngine;
        before(() => {
            ledgerProvider = new Web3ProviderEngine();
            ledgerProvider.addProvider(ledgerSubprovider);
            const httpProvider = new RPCSubprovider('http://localhost:8545');
            ledgerProvider.addProvider(httpProvider);
            providerUtils.startProviderEngine(ledgerProvider);

            defaultProvider = new Web3ProviderEngine();
            defaultProvider.addProvider(httpProvider);
            providerUtils.startProviderEngine(defaultProvider);
        });
        it('returns a list of accounts', (done: DoneCallback) => {
            const payload = {
                jsonrpc: '2.0',
                method: 'eth_accounts',
                params: [],
                id: 1,
            };
            const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                expect(err).to.be.a('null');
                expect(response.result.length).to.be.equal(DEFAULT_NUM_ACCOUNTS);
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
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result.length).to.be.equal(EXPECTED_SIGNATURE_LENGTH);
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
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result.length).to.be.equal(EXPECTED_SIGNATURE_LENGTH);
                    expect(response.result.substr(0, 2)).to.be.equal('0x');
                    done();
                });
                ledgerProvider.sendAsync(payload, callback);
            })().catch(done);
        });
        it('signs a transaction', (done: DoneCallback) => {
            const payload = {
                jsonrpc: '2.0',
                method: 'eth_signTransaction',
                params: [fixtureData.TX_DATA],
                id: 1,
            };
            const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                expect(err).to.be.a('null');
                expect(response.result.raw).to.be.equal(fixtureData.TX_DATA_SIGNED_RESULT);
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
                    from: fixtureData.TEST_RPC_ACCOUNT_0,
                    value: '0x8ac7230489e80000', // 10 ETH
                };
                let payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sendTransaction',
                    params: [tx],
                    id: 1,
                };
                await promisify(defaultProvider.sendAsync.bind(defaultProvider))(payload);

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
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    const result = response.result;
                    const signedTxLength = 66;
                    expect(result.length).to.be.equal(signedTxLength);
                    expect(result.substr(0, 2)).to.be.equal('0x');
                    done();
                });
                ledgerProvider.sendAsync(payload, callback);
            })().catch(done);
        });
    });
});
