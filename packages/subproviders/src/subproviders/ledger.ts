import { assert } from '@0xproject/assert';
import { addressUtils } from '@0xproject/utils';
import EthereumTx = require('ethereumjs-tx');
import ethUtil = require('ethereumjs-util');
import HDNode = require('hdkey');
import * as _ from 'lodash';
import { Lock } from 'semaphore-async-await';
import * as Web3 from 'web3';

import {
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
    public getPath(): string {
        return this._derivationPath;
    }
    public setPath(derivationPath: string) {
        this._derivationPath = derivationPath;
    }
    public setPathIndex(pathIndex: number) {
        this._derivationPathIndex = pathIndex;
    }
    // Required to implement this public interface which doesn't conform to our linting rule.
    // tslint:disable-next-line:async-suffix
    public async handleRequest(
        payload: Web3.JSONRPCRequestPayload,
        next: () => void,
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
