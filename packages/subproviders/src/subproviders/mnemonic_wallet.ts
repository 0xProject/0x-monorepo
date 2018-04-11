import { assert } from '@0xproject/assert';
import * as bip39 from 'bip39';
import ethUtil = require('ethereumjs-util');
import HDNode = require('hdkey');
import * as _ from 'lodash';

import { DerivedHDKey, PartialTxParams, WalletSubproviderErrors } from '../types';
import { walletUtils } from '../utils/wallet_utils';

import { BaseWalletSubprovider } from './base_wallet_subprovider';
import { PrivateKeyWalletSubprovider } from './private_key_wallet';

const DEFAULT_DERIVATION_PATH = `44'/60'/0'/0`;

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * This subprovider intercepts all account related RPC requests (e.g message/transaction signing, etc...) and handles
 * all requests with accounts derived from the supplied mnemonic.
 */
export class MnemonicWalletSubprovider extends BaseWalletSubprovider {
    private _addressSearchLimit: number;
    private _derivationBasePath: string;
    private _derivedKey: DerivedHDKey;
    /**
     * Instantiates a MnemonicWalletSubprovider. Defaults to derivationPath set to `44'/60'/0'/0`.
     * This is the default in TestRPC/Ganache, this can be overridden if desired.
     * @param mnemonic The mnemonic seed
     * @param derivationBasePath The derivation path, defaults to `44'/60'/0'/0`
     * @param addressSearchLimit The limit on address search attempts before raising `WalletSubproviderErrors.AddressNotFound`
     * @return MnemonicWalletSubprovider instance
     */
    constructor(
        mnemonic: string,
        derivationBasePath: string = DEFAULT_DERIVATION_PATH,
        addressSearchLimit: number = walletUtils.DEFAULT_ADDRESS_SEARCH_LIMIT,
    ) {
        assert.isString('mnemonic', mnemonic);
        assert.isString('derivationPath', derivationBasePath);
        assert.isNumber('addressSearchLimit', addressSearchLimit);
        super();
        const seed = bip39.mnemonicToSeed(mnemonic);
        const hdKey = HDNode.fromMasterSeed(seed);
        this._derivationBasePath = derivationBasePath;
        this._derivedKey = {
            address: walletUtils.addressOfHDKey(hdKey),
            derivationBasePath: this._derivationBasePath,
            derivationPath: `${this._derivationBasePath}/${0}`,
            derivationIndex: 0,
            hdKey,
            isChildKey: false,
        };
        this._addressSearchLimit = addressSearchLimit;
    }
    /**
     * Retrieve the set derivation path
     * @returns derivation path
     */
    public getPath(): string {
        return this._derivationBasePath;
    }
    /**
     * Set a desired derivation path when computing the available user addresses
     * @param derivationPath The desired derivation path (e.g `44'/60'/0'`)
     */
    public setPath(derivationPath: string) {
        this._derivationBasePath = derivationPath;
        this._derivedKey = {
            ...this._derivedKey,
            derivationBasePath: this._derivationBasePath,
        };
    }
    /**
     * Retrieve the accounts associated with the mnemonic.
     * This method is implicitly called when issuing a `eth_accounts` JSON RPC request
     * via your providerEngine instance.
     * @param numberOfAccounts Number of accounts to retrieve (default: 10)
     * @return An array of accounts
     */
    public async getAccountsAsync(
        numberOfAccounts: number = walletUtils.DEFAULT_NUM_ADDRESSES_TO_FETCH,
    ): Promise<string[]> {
        const derivedKeys = walletUtils.calculateDerivedHDKeys(this._derivedKey, numberOfAccounts);
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
        const privateKeyWallet = this._privateKeyWalletFromAddress(txParams.from);
        const signedTx = privateKeyWallet.signTransactionAsync(txParams);
        return signedTx;
    }
    /**
     * Sign a personal Ethereum signed message. The signing address used will be
     * address provided or the first address derived from the set path.
     * If you've added the MnemonicWalletSubprovider to your app's provider, you can simply send an `eth_sign`
     * or `personal_sign` JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param data Message to sign
     * @param address Address to sign with
     * @return Signature hex string (order: rsv)
     */
    public async signPersonalMessageAsync(data: string, address: string): Promise<string> {
        const privateKeyWallet = this._privateKeyWalletFromAddress(address);
        const sig = await privateKeyWallet.signPersonalMessageAsync(data, address);
        return sig;
    }
    private _privateKeyWalletFromAddress(address: string): PrivateKeyWalletSubprovider {
        const derivedKey = this._findDerivedKeyByPublicAddress(address);
        const privateKeyHex = derivedKey.hdKey.privateKey.toString('hex');
        const privateKeyWallet = new PrivateKeyWalletSubprovider(privateKeyHex);
        return privateKeyWallet;
    }
    private _findDerivedKeyByPublicAddress(address: string): DerivedHDKey {
        if (_.isUndefined(address)) {
            throw new Error(WalletSubproviderErrors.FromAddressMissingOrInvalid);
        }
        const matchedDerivedKey = walletUtils.findDerivedKeyByAddress(
            address,
            this._derivedKey,
            this._addressSearchLimit,
        );
        if (_.isUndefined(matchedDerivedKey)) {
            throw new Error(`${WalletSubproviderErrors.AddressNotFound}: ${address}`);
        }
        return matchedDerivedKey;
    }
}
