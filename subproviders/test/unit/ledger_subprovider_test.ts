import { providerUtils } from '@0x/utils';
import * as chai from 'chai';
import { JSONRPCResponsePayload } from 'ethereum-types';
import * as ethUtils from 'ethereumjs-util';
import * as _ from 'lodash';

import { LedgerSubprovider, Web3ProviderEngine } from '../../src';
import {
    DoneCallback,
    LedgerCommunicationClient,
    LedgerSubproviderErrors,
    WalletSubproviderErrors,
} from '../../src/types';
import { chaiSetup } from '../chai_setup';
import { fixtureData } from '../utils/fixture_data';
import { ganacheSubprovider } from '../utils/ganache_subprovider';
import { reportCallbackErrors } from '../utils/report_callback_errors';

chaiSetup.configure();
const expect = chai.expect;
const FAKE_ADDRESS = '0xb088a3bc93f71b4de97b9de773e9647645983688';
const DEFAULT_NUM_ACCOUNTS = 10;

describe('LedgerSubprovider', () => {
    const networkId: number = 42;
    let ledgerSubprovider: LedgerSubprovider;
    before(async () => {
        const ledgerEthereumClientFactoryAsync = async () => {
            // tslint:disable:no-object-literal-type-assertion
            const ledgerEthClient = {
                getAddress: async () => {
                    const publicKey =
                        '04f428290f4c5ed6a198f71b8205f488141dbb3f0840c923bbfa798ecbee6370986c03b5575d94d506772fb48a6a44e345e4ebd4f028a6f609c44b655d6d3e71a1';
                    const chainCode = 'ac055a5537c0c7e9e02d14a197cad6b857836da2a12043b46912a37d959b5ae8';
                    const address = '0xBa388BA5e5EEF2c6cE42d831c2B3A28D3c99bdB1';
                    return {
                        publicKey,
                        address,
                        chainCode,
                    };
                },
                signPersonalMessage: async () => {
                    const ecSignature = {
                        v: 28,
                        r: 'a6cc284bff14b42bdf5e9286730c152be91719d478605ec46b3bebcd0ae49148',
                        s: '0652a1a7b742ceb0213d1e744316e285f41f878d8af0b8e632cbca4c279132d0',
                    };
                    return ecSignature;
                },
                signTransaction: async (_derivationPath: string, _txHex: string) => {
                    const ecSignature = {
                        v: '77',
                        r: '88a95ef1378487bc82be558e82c8478baf840c545d5b887536bb1da63673a98b',
                        s: '019f4a4b9a107d1e6752bf7f701e275f28c13791d6e76af895b07373462cefaa',
                    };
                    return ecSignature;
                },
                transport: {
                    close: _.noop.bind(_),
                } as LedgerCommunicationClient,
            };
            // tslint:enable:no-object-literal-type-assertion
            return ledgerEthClient;
        };
        ledgerSubprovider = new LedgerSubprovider({
            networkId,
            ledgerEthereumClientFactoryAsync,
        });
    });
    describe('direct method calls', () => {
        describe('success cases', () => {
            it('returns default number of accounts', async () => {
                const accounts = await ledgerSubprovider.getAccountsAsync();
                expect(accounts[0]).to.be.equal(FAKE_ADDRESS);
                expect(accounts.length).to.be.equal(DEFAULT_NUM_ACCOUNTS);
            });
            it('returns requested number of accounts', async () => {
                const numberOfAccounts = 20;
                const accounts = await ledgerSubprovider.getAccountsAsync(numberOfAccounts);
                expect(accounts[0]).to.be.equal(FAKE_ADDRESS);
                expect(accounts.length).to.be.equal(numberOfAccounts);
            });
            it('signs a personal message', async () => {
                const data = ethUtils.bufferToHex(ethUtils.toBuffer(fixtureData.PERSONAL_MESSAGE_STRING));
                const ecSignatureHex = await ledgerSubprovider.signPersonalMessageAsync(data, FAKE_ADDRESS);
                expect(ecSignatureHex).to.be.equal(
                    '0xa6cc284bff14b42bdf5e9286730c152be91719d478605ec46b3bebcd0ae491480652a1a7b742ceb0213d1e744316e285f41f878d8af0b8e632cbca4c279132d001',
                );
            });
        });
        describe('failure cases', () => {
            it('cannot open multiple simultaneous connections to the Ledger device', async () => {
                const data = ethUtils.bufferToHex(ethUtils.toBuffer('hello world'));
                return expect(
                    Promise.all([
                        ledgerSubprovider.getAccountsAsync(),
                        ledgerSubprovider.signPersonalMessageAsync(data, FAKE_ADDRESS),
                    ]),
                ).to.be.rejectedWith(LedgerSubproviderErrors.MultipleOpenConnectionsDisallowed);
            });
        });
    });
    describe('calls through a provider', () => {
        let provider: Web3ProviderEngine;
        before(() => {
            provider = new Web3ProviderEngine();
            provider.addProvider(ledgerSubprovider);
            provider.addProvider(ganacheSubprovider);
            providerUtils.startProviderEngine(provider);
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
                    expect(response.result.length).to.be.equal(DEFAULT_NUM_ACCOUNTS);
                    expect(response.result[0]).to.be.equal(FAKE_ADDRESS);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs a personal message with eth_sign', (done: DoneCallback) => {
                const messageHex = ethUtils.bufferToHex(ethUtils.toBuffer('hello world'));
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sign',
                    params: [FAKE_ADDRESS, messageHex],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result).to.be.equal(
                        '0xa6cc284bff14b42bdf5e9286730c152be91719d478605ec46b3bebcd0ae491480652a1a7b742ceb0213d1e744316e285f41f878d8af0b8e632cbca4c279132d001',
                    );
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs a personal message with personal_sign', (done: DoneCallback) => {
                const messageHex = ethUtils.bufferToHex(ethUtils.toBuffer(fixtureData.PERSONAL_MESSAGE_STRING));
                const payload = {
                    jsonrpc: '2.0',
                    method: 'personal_sign',
                    params: [messageHex, FAKE_ADDRESS],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result).to.be.equal(
                        '0xa6cc284bff14b42bdf5e9286730c152be91719d478605ec46b3bebcd0ae491480652a1a7b742ceb0213d1e744316e285f41f878d8af0b8e632cbca4c279132d001',
                    );
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs a transaction', (done: DoneCallback) => {
                const tx = {
                    to: '0xafa3f8684e54059998bc3a7b0d2b0da075154d66',
                    value: '0x00',
                    gasPrice: '0x00',
                    nonce: '0x00',
                    gas: '0x00',
                    from: FAKE_ADDRESS,
                };
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_signTransaction',
                    params: [tx],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    const rawTxLength = 192;
                    expect(response.result.raw.length).to.be.equal(rawTxLength);
                    expect(response.result.raw.substr(0, 2)).to.be.equal('0x');
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
                    params: [FAKE_ADDRESS, nonHexMessage],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, _response: JSONRPCResponsePayload) => {
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
                    params: [nonHexMessage, FAKE_ADDRESS],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, _response: JSONRPCResponsePayload) => {
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
                const callback = reportCallbackErrors(done)((err: Error, _response: JSONRPCResponsePayload) => {
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
                const callback = reportCallbackErrors(done)((err: Error, _response: JSONRPCResponsePayload) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal(WalletSubproviderErrors.SenderInvalidOrNotSupplied);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
        });
    });
});
