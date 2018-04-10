import { assert } from '@0xproject/assert';
import * as bip39 from 'bip39';
import ethUtil = require('ethereumjs-util');
import HDNode = require('hdkey');
import * as _ from 'lodash';

import { DerivedHDKey, PartialTxParams, WalletSubproviderErrors } from '../types';
import { walletUtils } from '../walletUtils';

import { BaseWalletSubprovider } from './base_wallet_subprovider';
import { PrivateKeyWalletSubprovider } from './private_key_wallet_subprovider';

const DEFAULT_DERIVATION_PATH = `44'/60'/0'`;
const DEFAULT_NUM_ADDRESSES_TO_FETCH = 10;
const DEFAULT_ADDRESS_SEARCH_LIMIT = 1000;

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * This subprovider intercepts all account related RPC requests (e.g message/transaction signing, etc...) and handles
 * all requests with accounts derived from the supplied mnemonic.
 */
export class MnemonicWalletSubprovider extends BaseWalletSubprovider {
    private _addressSearchLimit: number;
    private _derivationPath: string;
    private _hdKey: HDNode;

    constructor(
        mnemonic: string,
        derivationPath: string = DEFAULT_DERIVATION_PATH,
        addressSearchLimit: number = DEFAULT_ADDRESS_SEARCH_LIMIT,
    ) {
        assert.isString('mnemonic', mnemonic);
        assert.isString('derivationPath', derivationPath);
        assert.isNumber('addressSearchLimit', addressSearchLimit);
        super();
        this._hdKey = HDNode.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
        this._derivationPath = derivationPath;
        this._addressSearchLimit = addressSearchLimit;
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
     * Retrieve the accounts associated with the mnemonic.
     * This method is implicitly called when issuing a `eth_accounts` JSON RPC request
     * via your providerEngine instance.
     * @return An array of accounts
     */
    public async getAccountsAsync(numberOfAccounts: number = DEFAULT_NUM_ADDRESSES_TO_FETCH): Promise<string[]> {
        const derivedKeys = walletUtils._calculateDerivedHDKeys(this._hdKey, this._derivationPath, numberOfAccounts);
        const accounts = _.map(derivedKeys, 'address');
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
        const derivedKey = _.isUndefined(txParams.from)
            ? walletUtils._firstDerivedKey(this._hdKey, this._derivationPath)
            : this._findDerivedKeyByPublicAddress(txParams.from);
        const privateKeyWallet = new PrivateKeyWalletSubprovider(derivedKey.hdKey.privateKey.toString('hex'));
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
     * @param address Address to sign with
     * @return Signature hex string (order: rsv)
     */
    public async signPersonalMessageAsync(data: string, address?: string): Promise<string> {
        const derivedKey = _.isUndefined(address)
            ? walletUtils._firstDerivedKey(this._hdKey, this._derivationPath)
            : this._findDerivedKeyByPublicAddress(address);
        const privateKeyWallet = new PrivateKeyWalletSubprovider(derivedKey.hdKey.privateKey.toString('hex'));
        const sig = await privateKeyWallet.signPersonalMessageAsync(data, derivedKey.address);
        return sig;
    }
    private _findDerivedKeyByPublicAddress(address: string): DerivedHDKey {
        const matchedDerivedKey = walletUtils._findDerivedKeyByAddress(
            address,
            this._hdKey,
            this._derivationPath,
            this._addressSearchLimit,
        );
        if (_.isUndefined(matchedDerivedKey)) {
            throw new Error(`${WalletSubproviderErrors.AddressNotFound}: ${address}`);
        }
        return matchedDerivedKey;
    }
}
