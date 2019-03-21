import { providerUtils } from '@0x/utils';
import * as chai from 'chai';
import * as lightwallet from 'eth-lightwallet';
import { JSONRPCResponsePayload } from 'ethereum-types';
import * as ethUtils from 'ethereumjs-util';

import { EthLightwalletSubprovider, Web3ProviderEngine } from '../../src';
import { DoneCallback } from '../../src/types';
import { chaiSetup } from '../chai_setup';
import { fixtureData } from '../utils/fixture_data';
import { ganacheSubprovider } from '../utils/ganache_subprovider';
import { reportCallbackErrors } from '../utils/report_callback_errors';

chaiSetup.configure();
const expect = chai.expect;

const DEFAULT_NUM_ACCOUNTS = 10;
const PASSWORD = 'supersecretpassword99';
const SALT = 'kvODghzs7Ff1uqHyI0P3wI4Hso4w4iWT2e9qmrWz0y4';

describe('EthLightwalletSubprovider', () => {
    let ethLightwalletSubprovider: EthLightwalletSubprovider;
    before(async () => {
        const options = {
            password: PASSWORD,
            seedPhrase: fixtureData.TEST_RPC_MNEMONIC,
            salt: SALT,
            hdPathString: fixtureData.TESTRPC_BASE_DERIVATION_PATH,
        };
        const createVaultAsync = async (vaultOptions: lightwallet.VaultOptions) => {
            return new Promise<lightwallet.keystore>(resolve => {
                lightwallet.keystore.createVault(vaultOptions, (err: Error, vaultKeystore) => {
                    if (err) {
                        throw new Error(`Failed to createVault: ${err}`);
                    }
                    resolve(vaultKeystore);
                });
            });
        };
        const deriveKeyFromPasswordAsync = async (vaultKeystore: lightwallet.keystore) => {
            return new Promise<Uint8Array>(resolve => {
                vaultKeystore.keyFromPassword(PASSWORD, (err: Error, passwordDerivedKey: Uint8Array) => {
                    if (err) {
                        throw new Error(`Failed to get key from password: ${err}`);
                    }
                    resolve(passwordDerivedKey);
                });
            });
        };
        const keystore: lightwallet.keystore = await createVaultAsync(options);
        const pwDerivedKey: Uint8Array = await deriveKeyFromPasswordAsync(keystore);

        // Generate 10 addresses
        keystore.generateNewAddress(pwDerivedKey, DEFAULT_NUM_ACCOUNTS);

        ethLightwalletSubprovider = new EthLightwalletSubprovider(keystore, pwDerivedKey);
    });
    describe('direct method calls', () => {
        describe('success cases', () => {
            it('returns a list of accounts', async () => {
                const accounts = await ethLightwalletSubprovider.getAccountsAsync();
                expect(accounts[0]).to.be.equal(fixtureData.TEST_RPC_ACCOUNT_0);
                expect(accounts[1]).to.be.equal(fixtureData.TEST_RPC_ACCOUNT_1);
                expect(accounts.length).to.be.equal(DEFAULT_NUM_ACCOUNTS);
            });
            it('signs a personal message hash', async () => {
                const accounts = await ethLightwalletSubprovider.getAccountsAsync();
                const signingAccount = accounts[0];
                const data = ethUtils.bufferToHex(ethUtils.toBuffer(fixtureData.PERSONAL_MESSAGE_STRING));
                const ecSignatureHex = await ethLightwalletSubprovider.signPersonalMessageAsync(data, signingAccount);
                expect(ecSignatureHex).to.be.equal(fixtureData.PERSONAL_MESSAGE_SIGNED_RESULT);
            });
            it('signs a transaction', async () => {
                const txHex = await ethLightwalletSubprovider.signTransactionAsync(fixtureData.TX_DATA);
                expect(txHex).to.be.equal(fixtureData.TX_DATA_SIGNED_RESULT);
            });
            it('signs an EIP712 sign typed data message', async () => {
                const signature = await ethLightwalletSubprovider.signTypedDataAsync(
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
            provider.addProvider(ethLightwalletSubprovider);
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
                    expect(response.result.length).to.be.equal(DEFAULT_NUM_ACCOUNTS);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs a personal message hash with eth_sign', (done: DoneCallback) => {
                const data = ethUtils.bufferToHex(ethUtils.toBuffer(fixtureData.PERSONAL_MESSAGE_STRING));
                const account = fixtureData.TEST_RPC_ACCOUNT_0;
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sign',
                    params: [account, data],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result).to.be.equal(fixtureData.PERSONAL_MESSAGE_SIGNED_RESULT);
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
        });
    });
});
