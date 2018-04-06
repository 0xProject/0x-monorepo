import { assert } from '@0xproject/assert';
import { JSONRPCRequestPayload } from '@0xproject/types';
import { addressUtils } from '@0xproject/utils';
import EthereumTx = require('ethereumjs-tx');
import ethUtil = require('ethereumjs-util');
import HDNode = require('hdkey');
import * as _ from 'lodash';
import { Lock } from 'semaphore-async-await';

import {
    Callback,
    LedgerEthereumClient,
    LedgerEthereumClientFactoryAsync,
    LedgerSubproviderConfigs,
    LedgerSubproviderErrors,
    PartialTxParams,
    ResponseWithTxParams,
    WalletSubproviderErrors,
} from '../types';

import { BaseWalletSubprovider } from './base_wallet_subprovider';

const DEFAULT_DERIVATION_PATH = `44'/60'/0'`;
const DEFAULT_NUM_ADDRESSES_TO_FETCH = 10;
const ASK_FOR_ON_DEVICE_CONFIRMATION = false;
const SHOULD_GET_CHAIN_CODE = true;

/**
 * Subprovider for interfacing with a user's [Ledger Nano S](https://www.ledgerwallet.com/products/ledger-nano-s).
 * This subprovider intercepts all account related RPC requests (e.g message/transaction signing, etc...) and
 * re-routes them to a Ledger device plugged into the users computer.
 */
export class LedgerSubprovider extends BaseWalletSubprovider {
    private _nonceLock = new Lock();
    private _connectionLock = new Lock();
    private _networkId: number;
    private _derivationPath: string;
    private _derivationPathIndex: number;
    private _ledgerEthereumClientFactoryAsync: LedgerEthereumClientFactoryAsync;
    private _ledgerClientIfExists?: LedgerEthereumClient;
    private _shouldAlwaysAskForConfirmation: boolean;
    /**
     * Instantiates a LedgerSubprovider. Defaults to derivationPath set to `44'/60'/0'`.
     * TestRPC/Ganache defaults to `m/44'/60'/0'/0`, so set this in the configs if desired.
     * @param config Several available configurations
     * @return LedgerSubprovider instance
     */
    constructor(config: LedgerSubproviderConfigs) {
        super();
        this._networkId = config.networkId;
        this._ledgerEthereumClientFactoryAsync = config.ledgerEthereumClientFactoryAsync;
        this._derivationPath = config.derivationPath || DEFAULT_DERIVATION_PATH;
        this._shouldAlwaysAskForConfirmation =
            !_.isUndefined(config.accountFetchingConfigs) &&
            !_.isUndefined(config.accountFetchingConfigs.shouldAskForOnDeviceConfirmation)
                ? config.accountFetchingConfigs.shouldAskForOnDeviceConfirmation
                : ASK_FOR_ON_DEVICE_CONFIRMATION;
        this._derivationPathIndex = 0;
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
     * Retrieve a users Ledger accounts. The accounts are derived from the derivationPath,
     * master public key and chainCode. Because of this, you can request as many accounts
     * as you wish and it only requires a single request to the Ledger device. This method
     * is automatically called when issuing a `eth_accounts` JSON RPC request via your providerEngine
     * instance.
     * @param numberOfAccounts Number of accounts to retrieve (default: 10)
     * @return An array of accounts
     */
    public async getAccountsAsync(numberOfAccounts: number = DEFAULT_NUM_ADDRESSES_TO_FETCH): Promise<string[]> {
        this._ledgerClientIfExists = await this._createLedgerClientAsync();

        let ledgerResponse;
        try {
            ledgerResponse = await this._ledgerClientIfExists.getAddress(
                this._derivationPath,
                this._shouldAlwaysAskForConfirmation,
                SHOULD_GET_CHAIN_CODE,
            );
        } finally {
            await this._destroyLedgerClientAsync();
        }

        const hdKey = new HDNode();
        hdKey.publicKey = new Buffer(ledgerResponse.publicKey, 'hex');
        hdKey.chainCode = new Buffer(ledgerResponse.chainCode, 'hex');

        const accounts: string[] = [];
        for (let i = 0; i < numberOfAccounts; i++) {
            const derivedHDNode = hdKey.derive(`m/${i + this._derivationPathIndex}`);
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
     * Sign a transaction with the Ledger. If you've added the LedgerSubprovider to your
     * app's provider, you can simply send an `eth_sendTransaction` JSON RPC request, and
     * this method will be called auto-magically. If you are not using this via a ProviderEngine
     * instance, you can call it directly.
     * @param txParams Parameters of the transaction to sign
     * @return Signed transaction hex string
     */
    public async signTransactionAsync(txParams: PartialTxParams): Promise<string> {
        LedgerSubprovider._validateTxParams(txParams);
        this._ledgerClientIfExists = await this._createLedgerClientAsync();

        const tx = new EthereumTx(txParams);

        // Set the EIP155 bits
        tx.raw[6] = Buffer.from([this._networkId]); // v
        tx.raw[7] = Buffer.from([]); // r
        tx.raw[8] = Buffer.from([]); // s

        const txHex = tx.serialize().toString('hex');
        try {
            const derivationPath = this._getDerivationPath();
            const result = await this._ledgerClientIfExists.signTransaction(derivationPath, txHex);
            // Store signature in transaction
            tx.r = Buffer.from(result.r, 'hex');
            tx.s = Buffer.from(result.s, 'hex');
            tx.v = Buffer.from(result.v, 'hex');

            // EIP155: v should be chain_id * 2 + {35, 36}
            const signedChainId = Math.floor((tx.v[0] - 35) / 2);
            if (signedChainId !== this._networkId) {
                await this._destroyLedgerClientAsync();
                const err = new Error(LedgerSubproviderErrors.TooOldLedgerFirmware);
                throw err;
            }

            const signedTxHex = `0x${tx.serialize().toString('hex')}`;
            await this._destroyLedgerClientAsync();
            return signedTxHex;
        } catch (err) {
            await this._destroyLedgerClientAsync();
            throw err;
        }
    }
    /**
     * Sign a personal Ethereum signed message. The signing address will be the one
     * retrieved given a derivationPath and pathIndex set on the subprovider.
     * The Ledger adds the Ethereum signed message prefix on-device.  If you've added
     * the LedgerSubprovider to your app's provider, you can simply send an `eth_sign`
     * or `personal_sign` JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param data Message to sign
     * @return Signature hex string (order: rsv)
     */
    public async signPersonalMessageAsync(data: string): Promise<string> {
        if (_.isUndefined(data)) {
            throw new Error(WalletSubproviderErrors.DataMissingForSignPersonalMessage);
        }
        assert.isHexString('data', data);
        this._ledgerClientIfExists = await this._createLedgerClientAsync();
        try {
            const derivationPath = this._getDerivationPath();
            const result = await this._ledgerClientIfExists.signPersonalMessage(
                derivationPath,
                ethUtil.stripHexPrefix(data),
            );
            const v = result.v - 27;
            let vHex = v.toString(16);
            if (vHex.length < 2) {
                vHex = `0${v}`;
            }
            const signature = `0x${result.r}${result.s}${vHex}`;
            await this._destroyLedgerClientAsync();
            return signature;
        } catch (err) {
            await this._destroyLedgerClientAsync();
            throw err;
        }
    }
    private _getDerivationPath() {
        const derivationPath = `${this.getPath()}/${this._derivationPathIndex}`;
        return derivationPath;
    }
    private async _createLedgerClientAsync(): Promise<LedgerEthereumClient> {
        await this._connectionLock.acquire();
        if (!_.isUndefined(this._ledgerClientIfExists)) {
            this._connectionLock.release();
            throw new Error(LedgerSubproviderErrors.MultipleOpenConnectionsDisallowed);
        }
        const ledgerEthereumClient = await this._ledgerEthereumClientFactoryAsync();
        this._connectionLock.release();
        return ledgerEthereumClient;
    }
    private async _destroyLedgerClientAsync() {
        await this._connectionLock.acquire();
        if (_.isUndefined(this._ledgerClientIfExists)) {
            this._connectionLock.release();
            return;
        }
        await this._ledgerClientIfExists.transport.close();
        this._ledgerClientIfExists = undefined;
        this._connectionLock.release();
    }
}
