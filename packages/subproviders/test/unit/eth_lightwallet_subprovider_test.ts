import { JSONRPCResponsePayload } from '@0xproject/types';
import * as chai from 'chai';
import * as lightwallet from 'eth-lightwallet';
import Web3ProviderEngine = require('web3-provider-engine');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { EthLightwalletSubprovider } from '../../src';
import { DoneCallback } from '../../src/types';
import { chaiSetup } from '../chai_setup';
import { ganacheSubprovider } from '../utils/ganache_subprovider';
import { reportCallbackErrors } from '../utils/report_callback_errors';

chaiSetup.configure();
const expect = chai.expect;
const FAKE_ADDRESS = '0x44be42fd88e22387c43ba9b75941aa3e680dae25';
const NUM_GENERATED_ADDRESSES = 10;
const PASSWORD = 'supersecretpassword99';
const SEED_PHRASE = 'dilemma hollow outer pony cube season start stereo surprise when edit blast';
const SALT = 'kvODghzs7Ff1uqHyI0P3wI4Hso4w4iWT2e9qmrWz0y4';
const HD_PATH_STRING = `m/44'/60'/0'`;

describe('EthLightwalletSubprovider', () => {
    let ethLightwalletSubprovider: EthLightwalletSubprovider;
    before(async () => {
        const options = {
            password: PASSWORD,
            seedPhrase: SEED_PHRASE,
            salt: SALT,
            hdPathString: HD_PATH_STRING,
        };

        const createVaultAsync = async (vaultOptions: lightwallet.VaultOptions) => {
            return new Promise<lightwallet.keystore>(resolve => {
                // Create Vault
                lightwallet.keystore.createVault(vaultOptions, (err: Error, vaultKeystore) => {
                    resolve(vaultKeystore);
                });
            });
        };

        const deriveKeyFromPasswordAsync = async (vaultKeystore: lightwallet.keystore) => {
            return new Promise<Uint8Array>(resolve => {
                vaultKeystore.keyFromPassword(PASSWORD, (err: Error, passwordDerivedKey: Uint8Array) => {
                    resolve(passwordDerivedKey);
                });
            });
        };

        const keystore: lightwallet.keystore = await createVaultAsync(options);
        const pwDerivedKey: Uint8Array = await deriveKeyFromPasswordAsync(keystore);

        // Generate 10 addresses
        keystore.generateNewAddress(pwDerivedKey, NUM_GENERATED_ADDRESSES);

        // Initialize Subprovider
        ethLightwalletSubprovider = new EthLightwalletSubprovider(lightwallet.signing, keystore, pwDerivedKey);
    });
    describe('direct method calls', () => {
        describe('success cases', () => {
            it('returns a list of accounts', async () => {
                const accounts = await ethLightwalletSubprovider.getAccountsAsync();
                expect(accounts[0]).to.be.equal(FAKE_ADDRESS);
                expect(accounts.length).to.be.equal(NUM_GENERATED_ADDRESSES);
            });
            it('signs a personal message hash', async () => {
                const signingAccount = (await ethLightwalletSubprovider.getAccountsAsync())[0];

                // Keccak-256 hash of 'hello world'
                const messageHash = '0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad';
                const ecSignatureHex =
                    await ethLightwalletSubprovider.signPersonalMessageAsync(messageHash, signingAccount);
                expect(ecSignatureHex).to.be.equal(
                    // tslint:disable-next-line:max-line-length
                    '0xa46b696c1aa8f91dbb33d1a66f6440bf3cf334c9dc45dc389668c1e60e2db31e259400b41f31632fa994837054c5345c88dc455c13931332489029adee6fd24d1b',
                );
            });
        });
    });
    describe('calls through a provider', () => {
        let provider: Web3ProviderEngine;
        before(() => {
            provider = new Web3ProviderEngine();
            provider.addProvider(ethLightwalletSubprovider);
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
                    expect(response.result.length).to.be.equal(NUM_GENERATED_ADDRESSES);
                    expect(response.result[0]).to.be.equal(FAKE_ADDRESS);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs a personal message hash with eth_sign', (done: DoneCallback) => {
                // Keccak-256 hash of 'hello world'
                const messageHash = '0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad';
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sign',
                    params: ['0x44be42fd88e22387c43ba9b75941aa3e680dae25', messageHash],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    expect(err).to.be.a('null');
                    expect(response.result).to.be.equal(
                        // tslint:disable-next-line:max-line-length
                        '0xa46b696c1aa8f91dbb33d1a66f6440bf3cf334c9dc45dc389668c1e60e2db31e259400b41f31632fa994837054c5345c88dc455c13931332489029adee6fd24d1b',
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
                    from: '0x44be42fd88e22387c43ba9b75941aa3e680dae25',
                };
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_signTransaction',
                    params: [tx],
                    id: 1,
                };
                const callback = reportCallbackErrors(done)((err: Error, response: JSONRPCResponsePayload) => {
                    const expectedResponseLength = 192;

                    expect(err).to.be.a('null');
                    expect(response.result.raw.length).to.be.equal(expectedResponseLength);
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
        });
    });
});
