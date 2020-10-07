import { assert } from '@0x/assert';
import { EIP712TypedData } from '@0x/types';
import { addressUtils } from '@0x/utils';
import * as bip39 from 'bip39';
import HDNode = require('hdkey');
import * as _ from 'lodash';

import { DerivedHDKeyInfo, MnemonicWalletSubproviderConfigs, PartialTxParams, WalletSubproviderErrors } from '../types';
import { walletUtils } from '../utils/wallet_utils';

import { BaseWalletSubprovider } from './base_wallet_subprovider';
import { PrivateKeyWalletSubprovider } from './private_key_wallet';

const DEFAULT_BASE_DERIVATION_PATH = `44'/60'/0'/0`;
const DEFAULT_NUM_ADDRESSES_TO_FETCH = 10;
const DEFAULT_ADDRESS_SEARCH_LIMIT = 1000;

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * This subprovider intercepts all account related RPC requests (e.g message/transaction signing, etc...) and handles
 * all requests with accounts derived from the supplied mnemonic.
 */
export class MnemonicWalletSubprovider extends BaseWalletSubprovider {
    private readonly _addressSearchLimit: number;
    private _baseDerivationPath: string;
    private _derivedKeyInfo: DerivedHDKeyInfo;
    private readonly _mnemonic: string;

    /**
     * Instantiates a MnemonicWalletSubprovider. Defaults to baseDerivationPath set to `44'/60'/0'/0`.
     * This is the default in TestRPC/Ganache, it can be overridden if desired.
     * @param config Configuration for the mnemonic wallet, must contain the mnemonic
     * @return MnemonicWalletSubprovider instance
     */
    constructor(config: MnemonicWalletSubproviderConfigs) {
        assert.isString('mnemonic', config.mnemonic);
        const baseDerivationPath = config.baseDerivationPath || DEFAULT_BASE_DERIVATION_PATH;
        assert.isString('baseDerivationPath', baseDerivationPath);
        const addressSearchLimit = config.addressSearchLimit || DEFAULT_ADDRESS_SEARCH_LIMIT;
        assert.isNumber('addressSearchLimit', addressSearchLimit);
        super();

        this._mnemonic = config.mnemonic;
        this._baseDerivationPath = baseDerivationPath;
        this._addressSearchLimit = addressSearchLimit;
        this._derivedKeyInfo = this._initialDerivedKeyInfo(this._baseDerivationPath);
    }
    /**
     * Retrieve the set derivation path
     * @returns derivation path
     */
    public getPath(): string {
        return this._baseDerivationPath;
    }
    /**
     * Set a desired derivation path when computing the available user addresses
     * @param baseDerivationPath The desired derivation path (e.g `44'/60'/0'`)
     */
    public setPath(baseDerivationPath: string): void {
        this._baseDerivationPath = baseDerivationPath;
        this._derivedKeyInfo = this._initialDerivedKeyInfo(this._baseDerivationPath);
    }
    /**
     * Retrieve the accounts associated with the mnemonic.
     * This method is implicitly called when issuing a `eth_accounts` JSON RPC request
     * via your providerEngine instance.
     * @param numberOfAccounts Number of accounts to retrieve (default: 10)
     * @return An array of accounts
     */
    public async getAccountsAsync(numberOfAccounts: number = DEFAULT_NUM_ADDRESSES_TO_FETCH): Promise<string[]> {
        const derivedKeys = walletUtils.calculateDerivedHDKeyInfos(this._derivedKeyInfo, numberOfAccounts);
        const accounts = _.map(derivedKeys, k => k.address);
        return accounts;
    }

    /**
     * Signs a transaction with the account specificed by the `from` field in txParams.
     * If you've added this Subprovider to your  app's provider, you can simply send
     * an `eth_sendTransaction` JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param txParams Parameters of the transaction to sign
     * @return Signed transaction hex string
     */
    public async signTransactionAsync(txParams: PartialTxParams): Promise<string> {
        if (txParams.from === undefined || !addressUtils.isAddress(txParams.from)) {
            throw new Error(WalletSubproviderErrors.FromAddressMissingOrInvalid);
        }
        const privateKeyWallet = this._privateKeyWalletForAddress(txParams.from);
        const signedTx = privateKeyWallet.signTransactionAsync(txParams);
        return signedTx;
    }
    /**
     * Sign a personal Ethereum signed message. The signing account will be the account
     * associated with the provided address. If you've added the MnemonicWalletSubprovider to
     * your app's provider, you can simply send an `eth_sign` or `personal_sign` JSON RPC request,
     * and this method will be called auto-magically. If you are not using this via a ProviderEngine
     * instance, you can call it directly.
     * @param data Hex string message to sign
     * @param address Address of the account to sign with
     * @return Signature hex string (order: rsv)
     */
    public async signPersonalMessageAsync(data: string, address: string): Promise<string> {
        if (data === undefined) {
            throw new Error(WalletSubproviderErrors.DataMissingForSignPersonalMessage);
        }
        assert.isHexString('data', data);
        assert.isETHAddressHex('address', address);
        const privateKeyWallet = this._privateKeyWalletForAddress(address);
        const sig = await privateKeyWallet.signPersonalMessageAsync(data, address);
        return sig;
    }
    /**
     * Sign an EIP712 Typed Data message. The signing account will be the account
     * associated with the provided address. If you've added this MnemonicWalletSubprovider to
     * your app's provider, you can simply send an `eth_signTypedData` JSON RPC request, and
     * this method will be called auto-magically. If you are not using this via a ProviderEngine
     *  instance, you can call it directly.
     * @param address Address of the account to sign with
     * @param data the typed data object
     * @return Signature hex string (order: rsv)
     */
    public async signTypedDataAsync(address: string, typedData: EIP712TypedData): Promise<string> {
        if (typedData === undefined) {
            throw new Error(WalletSubproviderErrors.DataMissingForSignPersonalMessage);
        }
        assert.isETHAddressHex('address', address);
        const privateKeyWallet = this._privateKeyWalletForAddress(address);
        const sig = await privateKeyWallet.signTypedDataAsync(address, typedData);
        return sig;
    }
    private _privateKeyWalletForAddress(address: string): PrivateKeyWalletSubprovider {
        const derivedKeyInfo = this._findDerivedKeyInfoForAddress(address);
        const privateKeyHex = derivedKeyInfo.hdKey.privateKey.toString('hex');
        const privateKeyWallet = new PrivateKeyWalletSubprovider(privateKeyHex);
        return privateKeyWallet;
    }
    private _findDerivedKeyInfoForAddress(address: string): DerivedHDKeyInfo {
        const matchedDerivedKeyInfo = walletUtils.findDerivedKeyInfoForAddressIfExists(
            address,
            this._derivedKeyInfo,
            this._addressSearchLimit,
        );
        if (matchedDerivedKeyInfo === undefined) {
            throw new Error(`${WalletSubproviderErrors.AddressNotFound}: ${address}`);
        }
        return matchedDerivedKeyInfo;
    }
    private _initialDerivedKeyInfo(baseDerivationPath: string): DerivedHDKeyInfo {
        const seed = bip39.mnemonicToSeed(this._mnemonic);
        const hdKey = HDNode.fromMasterSeed(seed);
        // Walk down to base derivation level (i.e m/44'/60'/0') and create an initial key at that level
        // all children will then be walked relative (i.e m/0)
        const parentKeyDerivationPath = `m/${baseDerivationPath}`;
        const parentHDKeyAtDerivationPath = hdKey.derive(parentKeyDerivationPath);
        const address = walletUtils.addressOfHDKey(parentHDKeyAtDerivationPath);
        const derivedKeyInfo = {
            address,
            baseDerivationPath,
            derivationPath: parentKeyDerivationPath,
            hdKey: parentHDKeyAtDerivationPath,
        };
        return derivedKeyInfo;
    }
}
