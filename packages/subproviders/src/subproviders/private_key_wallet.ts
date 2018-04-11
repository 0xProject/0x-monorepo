import { assert } from '@0xproject/assert';
import EthereumTx = require('ethereumjs-tx');
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { PartialTxParams, WalletSubproviderErrors } from '../types';

import { BaseWalletSubprovider } from './base_wallet_subprovider';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * This subprovider intercepts all account related RPC requests (e.g message/transaction signing, etc...) and handles
 * all requests with the supplied Ethereum private key.
 */
export class PrivateKeyWalletSubprovider extends BaseWalletSubprovider {
    private _address: string;
    private _privateKeyBuffer: Buffer;
    /**
     * Instantiates a PrivateKeyWalletSubprovider.
     * @param privateKey The corresponding private key to an Ethereum address
     * @return PrivateKeyWalletSubprovider instance
     */
    constructor(privateKey: string) {
        assert.isString('privateKey', privateKey);
        super();
        this._privateKeyBuffer = new Buffer(privateKey, 'hex');
        this._address = `0x${ethUtil.privateToAddress(this._privateKeyBuffer).toString('hex')}`;
    }
    /**
     * Retrieve the account associated with the supplied private key.
     * This method is implicitly called when issuing a `eth_accounts` JSON RPC request
     * via your providerEngine instance.
     * @return An array of accounts
     */
    public async getAccountsAsync(): Promise<string[]> {
        return [this._address];
    }
    /**
     * Sign a transaction with the private key. If you've added this Subprovider to your
     * app's provider, you can simply send an `eth_sendTransaction` JSON RPC request, and
     * this method will be called auto-magically. If you are not using this via a ProviderEngine
     * instance, you can call it directly.
     * @param txParams Parameters of the transaction to sign
     * @return Signed transaction hex string
     */
    public async signTransactionAsync(txParams: PartialTxParams): Promise<string> {
        PrivateKeyWalletSubprovider._validateTxParams(txParams);
        if (!_.isUndefined(txParams.from) && txParams.from !== this._address) {
            throw new Error(
                `Requested to sign transaction with address: ${txParams.from}, instantiated with address: ${
                    this._address
                }`,
            );
        }
        const tx = new EthereumTx(txParams);
        tx.sign(this._privateKeyBuffer);
        const rawTx = `0x${tx.serialize().toString('hex')}`;
        return rawTx;
    }
    /**
     * Sign a personal Ethereum signed message. The signing address will be calculated from the private key.
     * The address must be provided it must match the address calculated from the private key.
     * If you've added this Subprovider to your app's provider, you can simply send an `eth_sign`
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
        if (address !== this._address) {
            throw new Error(
                `Requested to sign message with address: ${address}, instantiated with address: ${this._address}`,
            );
        }
        const dataBuff = ethUtil.toBuffer(data);
        const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
        const sig = ethUtil.ecsign(msgHashBuff, this._privateKeyBuffer);
        const rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
        return rpcSig;
    }
}
