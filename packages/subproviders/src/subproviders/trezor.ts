import { assert } from '@0x/assert';
import { addressUtils } from '@0x/utils';
import EthereumTx = require('ethereumjs-tx');
import * as _ from 'lodash';

import hdkey from 'ethereumjs-wallet/hdkey';

import {
    PartialTxParams,
    TrezorConnectResponse,
    TrezorGetAddressResponsePayload,
    TrezorResponseErrorPayload,
    TrezorSignMsgResponsePayload,
    TrezorSignTxResponsePayload,
    TrezorSubproviderConfig,
    WalletSubproviderErrors,
} from '../types';

import { BaseWalletSubprovider } from './base_wallet_subprovider';

const PRIVATE_KEY_PATH = `m/44'/60'/0'/0`;
const DEFAULT_NUM_ADDRESSES_TO_FETCH = 10;

export class TrezorSubprovider extends BaseWalletSubprovider {
    private readonly _privateKeyPath: string;
    private _cachedAccounts: string[];
    private readonly _trezorConnectClientApi: any;
    /**
     * Instantiates a TrezorSubprovider. Defaults to private key path set to `m/44'/60'/0'/0/`.
     * Must be initialized with trezor-connect API module https://github.com/trezor/connect.
     * @param TrezorSubprovider config object containing trezor-connect API
     * @return TrezorSubprovider instance
     */
    constructor(config: TrezorSubproviderConfig) {
        super();
        this._privateKeyPath = PRIVATE_KEY_PATH;
        this._cachedAccounts = [];
        this._trezorConnectClientApi = config.trezorConnectClientApi;
    }
    /**
     * Retrieve a users Trezor account. This method is automatically called
     * when issuing a `eth_accounts` JSON RPC request via your providerEngine
     * instance.
     * @return An array of accounts
     */
    public async getAccountsAsync(numberOfAccounts: number = DEFAULT_NUM_ADDRESSES_TO_FETCH): Promise<string[]> {
        if (this._cachedAccounts.length) {
            return this._cachedAccounts;
        }
        const accounts: string[] = [];

        const response: TrezorConnectResponse = await this._trezorConnectClientApi.getPublicKey({ path: this._privateKeyPath });

        if (response.success) {
            const payload: TrezorGetAddressResponsePayload = response.payload;
            const hdPubKey = hdkey.fromExtendedKey(payload.xpub);
            for (let i = 0; i < numberOfAccounts; i++) {
                accounts.push(hdPubKey.deriveChild(i).getWallet().getAddressString());
            }
            this._cachedAccounts = accounts;
        } else {
            const payload: TrezorResponseErrorPayload = response.payload;
            throw new Error(payload.error);
        }

        return accounts;
    }
    /**
     * Signs a transaction on the Trezor with the account specificed by the `from` field in txParams.
     * If you've added the TrezorSubprovider to your app's provider, you can simply send an `eth_sendTransaction`
     * JSON RPC request, and this method will be called auto-magically. If you are not using this via a ProviderEngine
     * instance, you can call it directly.
     * @param txParams Parameters of the transaction to sign
     * @return Signed transaction hex string
     */
    public async signTransactionAsync(txData: PartialTxParams, networkId: number): Promise<string> {
        if (_.isUndefined(txData.from) || !addressUtils.isAddress(txData.from)) {
            throw new Error(WalletSubproviderErrors.FromAddressMissingOrInvalid);
        }
        txData.value = txData.value ? txData.value : '0x0';
        txData.data = txData.data ? txData.data : '0x';
        txData.gas = txData.gas ? txData.gas : '0x0';
        txData.gasPrice = txData.gasPrice ? txData.gasPrice : '0x0';

        const accountIndex = this._cachedAccounts.indexOf(txData.from);
        if (accountIndex === -1) {
            throw new Error(WalletSubproviderErrors.AddressNotFound);
        }
        const response: TrezorConnectResponse = await this._trezorConnectClientApi.ethereumSignTransaction({
            path: `${this._privateKeyPath}/${accountIndex}`,
            transaction: {
                to: txData.to,
                value: txData.value,
                data: txData.data,
                chainId: networkId,
                nonce: txData.nonce,
                gasLimit: txData.gas,
                gasPrice: txData.gasPrice,
            },
        });

        if (response.success) {
            const payload: TrezorSignTxResponsePayload = response.payload;
            const tx = new EthereumTx(txData);

            // Set the EIP155 bits
            const vIndex = 6;
            tx.raw[vIndex] = Buffer.from([1]); // v
            const rIndex = 7;
            tx.raw[rIndex] = Buffer.from([]); // r
            const sIndex = 8;
            tx.raw[sIndex] = Buffer.from([]); // s

            // slice off leading 0x
            tx.v = Buffer.from(payload.v.slice(2), 'hex');
            tx.r = Buffer.from(payload.r.slice(2), 'hex');
            tx.s = Buffer.from(payload.s.slice(2), 'hex');

            return `0x${tx.serialize().toString('hex')}`;
        } else {
            const payload: TrezorResponseErrorPayload = response.payload;
            throw new Error(payload.error);
        }
    }
    /**
     * Sign a personal Ethereum signed message. The signing account will be the account
     * associated with the provided address. If you've added the TrezorSubprovider to
     * your app's provider, you can simply send an `eth_sign` or `personal_sign` JSON RPC
     * request, and this method will be called auto-magically.
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
        const accountIndex = this._cachedAccounts.indexOf(address);
        if (accountIndex === -1) {
            throw new Error(WalletSubproviderErrors.AddressNotFound);
        }
        const response: TrezorConnectResponse = await this._trezorConnectClientApi.ethereumSignMessage({
            path: `${this._privateKeyPath}/${accountIndex}`,
            message: data,
            hex: false,
        });

        if (response.success) {
            const payload: TrezorSignMsgResponsePayload = response.payload;
            return `0x${payload.signature}`;
        } else {
            const payload: TrezorResponseErrorPayload = response.payload;
            throw new Error(payload.error);
        }
    }
    /**
     * TODO:: eth_signTypedData is currently not supported on Trezor devices.
     * @param address Address of the account to sign with
     * @param data the typed data object
     * @return Signature hex string (order: rsv)
     */
    // tslint:disable-next-line:prefer-function-over-method
    public async signTypedDataAsync(address: string, typedData: any): Promise<string> {
        throw new Error(WalletSubproviderErrors.MethodNotSupported);
    }
}
