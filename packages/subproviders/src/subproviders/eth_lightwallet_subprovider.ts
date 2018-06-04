import { assert } from '@0xproject/assert';
import { ECSignatureBuffer } from '@0xproject/types';
import { addressUtils } from '@0xproject/utils';
import * as lightwallet from 'eth-lightwallet';
import EthereumTx = require('ethereumjs-tx');
import * as _ from 'lodash';

import { PartialTxParams, WalletSubproviderErrors } from '../types';

import { BaseWalletSubprovider } from './base_wallet_subprovider';

/*
 * This class implements the web3-provider-engine subprovider interface and forwards
 * requests involving user accounts and signing operations to eth-lightwallet
 *
 * Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class EthLightwalletSubprovider extends BaseWalletSubprovider {
    private _signing: any;
    private _keystore: any;
    private _pwDerivedKey: Uint8Array;

    constructor(signing: lightwallet.signing, keystore: lightwallet.keystore, pwDerivedKey: Uint8Array) {
        super();

        this._signing = signing;
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
        if (_.isUndefined(txParams.from) || !addressUtils.isAddress(txParams.from)) {
            throw new Error(WalletSubproviderErrors.FromAddressMissingOrInvalid);
        }

        const tx = new EthereumTx(txParams);
        const txHex = tx.serialize().toString('hex');
        let signedTxHex: string = this._signing.signTx(
            this._keystore,
            this._pwDerivedKey,
            txHex,
            txParams.from,
            this._keystore.hdPathString,
        );

        signedTxHex = `0x${signedTxHex}`;

        return signedTxHex;
    }

    /**
     * Sign a personal Ethereum signed message. The signing account will be the account
     * associated with the provided address.
     * If you've added the EthLightwalletSubprovider to your app's provider, you can simply send an `eth_sign`
     * or `personal_sign` JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param data Hex string message to sign
     * @param address Address of the account to sign with
     * @return Signature hex string (order: rsv)
     */
    public async signPersonalMessageAsync(data: string, address: string): Promise<string> {
        if (_.isUndefined(data)) {
            throw new Error(WalletSubproviderErrors.DataMissingForSignPersonalMessage);
        }
        assert.isHexString('data', data);
        assert.isETHAddressHex('address', address);
        const result: ECSignatureBuffer = await this._signing.signMsgHash(
            this._keystore,
            this._pwDerivedKey,
            data,
            address,
            this._keystore.hdPathString,
        );

        const signature = this._signing.concatSig(result);

        return signature;
    }
}
