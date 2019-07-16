import { providerUtils } from '@0x/utils';
import * as chai from 'chai';
import { JSONRPCResponsePayload } from 'ethereum-types';
import * as ethUtils from 'ethereumjs-util';

import { GanacheSubprovider, PrivateKeyWalletSubprovider, Web3ProviderEngine } from '../../src/';
import { DoneCallback, WalletSubproviderErrors } from '../../src/types';
import { chaiSetup } from '../chai_setup';
import { fixtureData } from '../utils/fixture_data';
import { reportCallbackErrors } from '../utils/report_callback_errors';

chaiSetup.configure();
const expect = chai.expect;

describe('PrivateKeyWalletSubprovider', () => {
    let subprovider: PrivateKeyWalletSubprovider;
    before(async () => {
        subprovider = new PrivateKeyWalletSubprovider(fixtureData.TEST_RPC_ACCOUNT_0_ACCOUNT_PRIVATE_KEY);
    });
    describe('direct method calls', () => {
        describe('success cases', () => {
            it('returns the account', async () => {
                const accounts = await subprovider.getAccountsAsync();
                expect(accounts[0]).to.be.equal(fixtureData.TEST_RPC_ACCOUNT_0);
                expect(accounts.length).to.be.equal(1);
            });
            it('signs a personal message', async () => {
                const data = ethUtils.bufferToHex(ethUtils.toBuffer(fixtureData.PERSONAL_MESSAGE_STRING));
                const ecSignatureHex = await subprovider.signPersonalMessageAsync(data, fixtureData.TEST_RPC_ACCOUNT_0);
                expect(ecSignatureHex).to.be.equal(fixtureData.PERSONAL_MESSAGE_SIGNED_RESULT);
            });
            it('signs a transaction', async () => {
                const txHex = await subprovider.signTransactionAsync(fixtureData.TX_DATA);
                expect(txHex).to.be.equal(fixtureData.TX_DATA_SIGNED_RESULT);
            });
            it('signs a transaction where the tx.origin is checksummed.', async () => {
                const TX_DATA_CHECKSUMMED_ORIGIN = {
                    ...fixtureData.TX_DATA,
                    from: fixtureData.TEST_RPC_ACCOUNT_0_CHECKSUMMED,
                };
                const txHex = await subprovider.signTransactionAsync(TX_DATA_CHECKSUMMED_ORIGIN);
                expect(txHex).to.be.equal(fixtureData.TX_DATA_SIGNED_RESULT);
            });
            it('signs an EIP712 sign typed data message', async () => {
                const signature = await subprovider.signTypedDataAsync(
                    fixtureData.TEST_RPC_ACCOUNT_0,
                    fixtureData.EIP712_TEST_TYPED_DATA,
                );
                expect(signature).to.be.equal(fixtureData.EIP712_TEST_TYPED_DATA_SIGNED_RESULT);
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
                    expect(response.result[0]).to.be.equal(fixtureData.TEST_RPC_ACCOUNT_0);
                    expect(response.result.length).to.be.equal(1);
                    done();
                });
                provider.sendAsync(payload, callback);
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
                provider.sendAsync(payload, callback);
            });
            it('signs a personal message with eth_sign', (done: DoneCallback) => {
                const messageHex = ethUtils.bufferToHex(ethUtils.toBuffer(fixtureData.PERSONAL_MESSAGE_STRING));
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sign',
                    params: [fixtureData.TEST_RPC_ACCOUNT_0, messageHex],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result).to.be.equal(fixtureData.PERSONAL_MESSAGE_SIGNED_RESULT);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs a personal message with personal_sign', (done: DoneCallback) => {
                const messageHex = ethUtils.bufferToHex(ethUtils.toBuffer(fixtureData.PERSONAL_MESSAGE_STRING));
                const payload = {
                    jsonrpc: '2.0',
                    method: 'personal_sign',
                    params: [messageHex, fixtureData.TEST_RPC_ACCOUNT_0],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result).to.be.equal(fixtureData.PERSONAL_MESSAGE_SIGNED_RESULT);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs an EIP712 sign typed data message with eth_signTypedData', (done: DoneCallback) => {
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_signTypedData',
                    params: [fixtureData.TEST_RPC_ACCOUNT_0, fixtureData.EIP712_TEST_TYPED_DATA],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result).to.be.equal(fixtureData.EIP712_TEST_TYPED_DATA_SIGNED_RESULT);
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
                    params: [fixtureData.TEST_RPC_ACCOUNT_0, nonHexMessage],
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
                    params: [nonHexMessage, fixtureData.TEST_RPC_ACCOUNT_0],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, _response: JSONRPCResponsePayload) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal('Expected data to be of type HexString, encountered: hello world');
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('should throw if `address` param is not the address from private key when calling personal_sign', (done: DoneCallback) => {
                const messageHex = ethUtils.bufferToHex(ethUtils.toBuffer(fixtureData.PERSONAL_MESSAGE_STRING));
                const payload = {
                    jsonrpc: '2.0',
                    method: 'personal_sign',
                    params: [messageHex, fixtureData.TEST_RPC_ACCOUNT_1],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, _response: JSONRPCResponsePayload) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal(
                        `Requested to sign message with address: ${
                            fixtureData.TEST_RPC_ACCOUNT_1
                        }, instantiated with address: ${fixtureData.TEST_RPC_ACCOUNT_0}`,
                    );
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
            it('should throw if `address` param not found when calling personal_sign', (done: DoneCallback) => {
                const messageHex = ethUtils.bufferToHex(ethUtils.toBuffer(fixtureData.PERSONAL_MESSAGE_STRING));
                const payload = {
                    jsonrpc: '2.0',
                    method: 'personal_sign',
                    params: [messageHex, '0x0'],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, _response: JSONRPCResponsePayload) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal(`Expected address to be of type ETHAddressHex, encountered: 0x0`);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
        });
    });
});
