import { assert } from '@0xproject/assert';
import * as bip39 from 'bip39';
import ethUtil = require('ethereumjs-util');
import HDNode = require('hdkey');
import * as _ from 'lodash';

import { MnemonicSubproviderErrors, PartialTxParams } from '../types';

import { BaseWalletSubprovider } from './base_wallet_subprovider';
import { PrivateKeyWalletSubprovider } from './private_key_wallet_subprovider';

const DEFAULT_DERIVATION_PATH = `44'/60'/0'`;
const DEFAULT_NUM_ADDRESSES_TO_FETCH = 10;
const DEFAULT_ADDRESS_SEARCH_LIMIT = 100;

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * This subprovider intercepts all account related RPC requests (e.g message/transaction signing, etc...) and handles
 * all requests with accounts derived from the supplied mnemonic.
 */
export class MnemonicWalletSubprovider extends BaseWalletSubprovider {
    private _derivationPath: string;
    private _hdKey: HDNode;
    private _derivationPathIndex: number;
    constructor(mnemonic: string, derivationPath: string = DEFAULT_DERIVATION_PATH) {
        assert.isString('mnemonic', mnemonic);
        super();
        this._hdKey = HDNode.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
        this._derivationPathIndex = 0;
        this._derivationPath = derivationPath;
    }
    /**
     * Retrieve the set derivation path
     * @returns derivation path
     */
    public getPath(): string {
        return this._derivationPath;
    }
    /**
     * Set a desired derivation path when computing the available user addresses
     * @param derivationPath The desired derivation path (e.g `44'/60'/0'`)
     */
    public setPath(derivationPath: string) {
        this._derivationPath = derivationPath;
    }
    /**
     * Set the final derivation path index. If a user wishes to sign a message with the
     * 6th address in a derivation path, before calling `signPersonalMessageAsync`, you must
     * call this method with pathIndex `6`.
     * @param pathIndex Desired derivation path index
     */
    public setPathIndex(pathIndex: number) {
        this._derivationPathIndex = pathIndex;
    }
    /**
     * Retrieve the account associated with the supplied private key.
     * This method is implicitly called when issuing a `eth_accounts` JSON RPC request
     * via your providerEngine instance.
     * @return An array of accounts
     */
    public async getAccountsAsync(numberOfAccounts: number = DEFAULT_NUM_ADDRESSES_TO_FETCH): Promise<string[]> {
        const accounts: string[] = [];
        for (let i = 0; i < numberOfAccounts; i++) {
            const derivedHDNode = this._hdKey.derive(`m/${this._derivationPath}/${i + this._derivationPathIndex}`);
            const derivedPublicKey = derivedHDNode.publicKey;
            const shouldSanitizePublicKey = true;
            const ethereumAddressUnprefixed = ethUtil
                .publicToAddress(derivedPublicKey, shouldSanitizePublicKey)
                .toString('hex');
            const ethereumAddressPrefixed = ethUtil.addHexPrefix(ethereumAddressUnprefixed);
            accounts.push(ethereumAddressPrefixed.toLowerCase());
        }
        return accounts;
    }

    /**
     * Signs a transaction with the from account (if specificed in txParams) or the first account.
     * If you've added this Subprovider to your  app's provider, you can simply send
     * an `eth_sendTransaction` JSON RPC request, and * this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param txParams Parameters of the transaction to sign
     * @return Signed transaction hex string
     */
    public async signTransactionAsync(txParams: PartialTxParams): Promise<string> {
        const accounts = await this.getAccountsAsync();
        const hdKey = this._findHDKeyByPublicAddress(txParams.from || accounts[0]);
        const privateKeyWallet = new PrivateKeyWalletSubprovider(hdKey.privateKey.toString('hex'));
        const signedTx = privateKeyWallet.signTransactionAsync(txParams);
        return signedTx;
    }
    /**
     * Sign a personal Ethereum signed message. The signing address will be
     * derived from the set path.
     * If you've added the PKWalletSubprovider to your app's provider, you can simply send an `eth_sign`
     * or `personal_sign` JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param data Message to sign
     * @return Signature hex string (order: rsv)
     */
    public async signPersonalMessageAsync(data: string): Promise<string> {
        const accounts = await this.getAccountsAsync();
        const hdKey = this._findHDKeyByPublicAddress(accounts[0]);
        const privateKeyWallet = new PrivateKeyWalletSubprovider(hdKey.privateKey.toString('hex'));
        const sig = await privateKeyWallet.signPersonalMessageAsync(data);
        return sig;
    }

    private _findHDKeyByPublicAddress(address: string, searchLimit: number = DEFAULT_ADDRESS_SEARCH_LIMIT): HDNode {
        for (let i = 0; i < searchLimit; i++) {
            const derivedHDNode = this._hdKey.derive(`m/${this._derivationPath}/${i + this._derivationPathIndex}`);
            const derivedPublicKey = derivedHDNode.publicKey;
            const shouldSanitizePublicKey = true;
            const ethereumAddressUnprefixed = ethUtil
                .publicToAddress(derivedPublicKey, shouldSanitizePublicKey)
                .toString('hex');
            const ethereumAddressPrefixed = ethUtil.addHexPrefix(ethereumAddressUnprefixed);
            if (ethereumAddressPrefixed === address) {
                return derivedHDNode;
            }
        }
        throw new Error(MnemonicSubproviderErrors.AddressSearchExhausted);
    }
}
