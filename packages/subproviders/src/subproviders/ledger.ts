import { assert } from '@0xproject/assert';
import { addressUtils } from '@0xproject/utils';
import EthereumTx = require('ethereumjs-tx');
import ethUtil = require('ethereumjs-util');
import HDNode = require('hdkey');
import * as _ from 'lodash';
import { Lock } from 'semaphore-async-await';
import * as Web3 from 'web3';

import {
    Callback,
    LedgerEthereumClient,
    LedgerEthereumClientFactoryAsync,
    LedgerSubproviderConfigs,
    LedgerSubproviderErrors,
    PartialTxParams,
    ResponseWithTxParams,
} from '../types';

import { Subprovider } from './subprovider';

const DEFAULT_DERIVATION_PATH = `44'/60'/0'`;
const DEFAULT_NUM_ADDRESSES_TO_FETCH = 10;
const ASK_FOR_ON_DEVICE_CONFIRMATION = false;
const SHOULD_GET_CHAIN_CODE = true;

/**
 * Subprovider for interfacing with a user's [Ledger Nano S](https://www.ledgerwallet.com/products/ledger-nano-s).
 * This subprovider intercepts all account related RPC requests (e.g message/transaction signing, etc...) and
 * re-routes them to a Ledger device plugged into the users computer.
 */
export class LedgerSubprovider extends Subprovider {
    private _nonceLock = new Lock();
    private _connectionLock = new Lock();
    private _networkId: number;
    private _derivationPath: string;
    private _derivationPathIndex: number;
    private _ledgerEthereumClientFactoryAsync: LedgerEthereumClientFactoryAsync;
    private _ledgerClientIfExists?: LedgerEthereumClient;
    private _shouldAlwaysAskForConfirmation: boolean;
    private static _validateSender(sender: string) {
        if (_.isUndefined(sender) || !addressUtils.isAddress(sender)) {
            throw new Error(LedgerSubproviderErrors.SenderInvalidOrNotSupplied);
        }
    }
    /**
     * Instantiates a LedgerSubprovider
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
     * Sign a personal Ethereum signed message. The signing address will be to one
     * retrieved given a derivationPath and pathIndex set on the subprovider.
     * The Ledger adds the Ethereum signed message prefix on-device.  If you've added
     * the LedgerSubprovider to your app's provider, you can simply send an `eth_sign`
     * or `personal_sign` JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param data Message to sign
     * @return Signature hex string (order: rsv)
     */
    public async signPersonalMessageAsync(data: string): Promise<string> {
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
    // Required to implement this public interface which doesn't conform to our linting rule.
    // tslint:disable-next-line:async-suffix underscore-private-and-protected
    private async handleRequest(
        payload: Web3.JSONRPCRequestPayload,
        next: Callback,
        end: (err: Error | null, result?: any) => void,
    ) {
        let accounts;
        let txParams;
        switch (payload.method) {
            case 'eth_coinbase':
                try {
                    accounts = await this.getAccountsAsync();
                    end(null, accounts[0]);
                } catch (err) {
                    end(err);
                }
                return;

            case 'eth_accounts':
                try {
                    accounts = await this.getAccountsAsync();
                    end(null, accounts);
                } catch (err) {
                    end(err);
                }
                return;

            case 'eth_sendTransaction':
                txParams = payload.params[0];
                try {
                    LedgerSubprovider._validateSender(txParams.from);
                    const result = await this._sendTransactionAsync(txParams);
                    end(null, result);
                } catch (err) {
                    end(err);
                }
                return;

            case 'eth_signTransaction':
                txParams = payload.params[0];
                try {
                    const result = await this._signTransactionWithoutSendingAsync(txParams);
                    end(null, result);
                } catch (err) {
                    end(err);
                }
                return;

            case 'eth_sign':
            case 'personal_sign':
                const data = payload.method === 'eth_sign' ? payload.params[1] : payload.params[0];
                try {
                    if (_.isUndefined(data)) {
                        throw new Error(LedgerSubproviderErrors.DataMissingForSignPersonalMessage);
                    }
                    assert.isHexString('data', data);
                    const ecSignatureHex = await this.signPersonalMessageAsync(data);
                    end(null, ecSignatureHex);
                } catch (err) {
                    end(err);
                }
                return;

            default:
                next();
                return;
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
    private async _sendTransactionAsync(txParams: PartialTxParams): Promise<string> {
        await this._nonceLock.acquire();
        try {
            // fill in the extras
            const filledParams = await this._populateMissingTxParamsAsync(txParams);
            // sign it
            const signedTx = await this.signTransactionAsync(filledParams);
            // emit a submit
            const payload = {
                method: 'eth_sendRawTransaction',
                params: [signedTx],
            };
            const result = await this.emitPayloadAsync(payload);
            this._nonceLock.release();
            return result.result;
        } catch (err) {
            this._nonceLock.release();
            throw err;
        }
    }
    private async _signTransactionWithoutSendingAsync(txParams: PartialTxParams): Promise<ResponseWithTxParams> {
        await this._nonceLock.acquire();
        try {
            // fill in the extras
            const filledParams = await this._populateMissingTxParamsAsync(txParams);
            // sign it
            const signedTx = await this.signTransactionAsync(filledParams);

            this._nonceLock.release();
            const result = {
                raw: signedTx,
                tx: txParams,
            };
            return result;
        } catch (err) {
            this._nonceLock.release();
            throw err;
        }
    }
    private async _populateMissingTxParamsAsync(txParams: PartialTxParams): Promise<PartialTxParams> {
        if (_.isUndefined(txParams.gasPrice)) {
            const gasPriceResult = await this.emitPayloadAsync({
                method: 'eth_gasPrice',
                params: [],
            });
            const gasPrice = gasPriceResult.result.toString();
            txParams.gasPrice = gasPrice;
        }
        if (_.isUndefined(txParams.nonce)) {
            const nonceResult = await this.emitPayloadAsync({
                method: 'eth_getTransactionCount',
                params: [txParams.from, 'pending'],
            });
            const nonce = nonceResult.result;
            txParams.nonce = nonce;
        }
        if (_.isUndefined(txParams.gas)) {
            const gasResult = await this.emitPayloadAsync({
                method: 'eth_estimateGas',
                params: [txParams],
            });
            const gas = gasResult.result.toString();
            txParams.gas = gas;
        }
        return txParams;
    }
}
