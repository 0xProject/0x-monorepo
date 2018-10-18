import { EIP712TypedData } from '@0x/types';
import * as lightwallet from 'eth-lightwallet';

import { PartialTxParams } from '../types';

import { BaseWalletSubprovider } from './base_wallet_subprovider';
import { PrivateKeyWalletSubprovider } from './private_key_wallet';

/*
 * This class implements the web3-provider-engine subprovider interface and forwards
 * requests involving user accounts and signing operations to eth-lightwallet
 *
 * Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class EthLightwalletSubprovider extends BaseWalletSubprovider {
    private readonly _keystore: lightwallet.keystore;
    private readonly _pwDerivedKey: Uint8Array;
    /**
     * Instantiate an EthLightwalletSubprovider
     * @param keystore The EthLightWallet keystore you wish to use
     * @param pwDerivedKey The password derived key to use
     * @return EthLightwalletSubprovider instance
     */
    constructor(keystore: lightwallet.keystore, pwDerivedKey: Uint8Array) {
        super();
        this._keystore = keystore;
        this._pwDerivedKey = pwDerivedKey;
    }
    /**
     * Retrieve the accounts associated with the eth-lightwallet instance.
     * This method is implicitly called when issuing a `eth_accounts` JSON RPC request
     * via your providerEngine instance.
     *
     * @return An array of accounts
     */
    public async getAccountsAsync(): Promise<string[]> {
        const accounts = this._keystore.getAddresses();
        return accounts;
    }
    /**
     * Signs a transaction with the account specificed by the `from` field in txParams.
     * If you've added this Subprovider to your app's provider, you can simply send
     * an `eth_sendTransaction` JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param txParams Parameters of the transaction to sign
     * @return Signed transaction hex string
     */
    public async signTransactionAsync(txParams: PartialTxParams): Promise<string> {
        // Lightwallet loses the chain id information when hex encoding the transaction
        // this results in a different signature on certain networks. PrivateKeyWallet
        // respects this as it uses the parameters passed in
        let privateKey = this._keystore.exportPrivateKey(txParams.from, this._pwDerivedKey);
        const privateKeyWallet = new PrivateKeyWalletSubprovider(privateKey);
        privateKey = '';
        const privateKeySignature = await privateKeyWallet.signTransactionAsync(txParams);
        return privateKeySignature;
    }
    /**
     * Sign a personal Ethereum signed message. The signing account will be the account
     * associated with the provided address.
     * If you've added this Subprovider to your app's provider, you can simply send an `eth_sign`
     * or `personal_sign` JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param data Hex string message to sign
     * @param address Address of the account to sign with
     * @return Signature hex string (order: rsv)
     */
    public async signPersonalMessageAsync(data: string, address: string): Promise<string> {
        let privateKey = this._keystore.exportPrivateKey(address, this._pwDerivedKey);
        const privateKeyWallet = new PrivateKeyWalletSubprovider(privateKey);
        privateKey = '';
        const result = privateKeyWallet.signPersonalMessageAsync(data, address);
        return result;
    }
    /**
     * Sign an EIP712 Typed Data message. The signing address will associated with the provided address.
     * If you've added this Subprovider to your app's provider, you can simply send an `eth_signTypedData`
     * JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param address Address of the account to sign with
     * @param data the typed data object
     * @return Signature hex string (order: rsv)
     */
    public async signTypedDataAsync(address: string, typedData: EIP712TypedData): Promise<string> {
        let privateKey = this._keystore.exportPrivateKey(address, this._pwDerivedKey);
        const privateKeyWallet = new PrivateKeyWalletSubprovider(privateKey);
        privateKey = '';
        const result = privateKeyWallet.signTypedDataAsync(address, typedData);
        return result;
    }
}
