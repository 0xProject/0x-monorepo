import {assert} from '@0xproject/assert';
import {addressUtils} from '@0xproject/utils';
import promisify = require('es6-promisify');
import EthereumTx = require('ethereumjs-tx');
import ethUtil = require('ethereumjs-util');
import * as ledger from 'ledgerco';
import * as _ from 'lodash';
import Semaphore from 'semaphore-async-await';
import Web3 = require('web3');

import {
    LedgerEthereumClient,
    LedgerEthereumClientFactoryAsync,
    LedgerSubproviderConfigs,
    LedgerSubproviderErrors,
    PartialTxParams,
    ResponseWithTxParams,
} from '../types';

import {Subprovider} from './subprovider';

const DEFAULT_DERIVATION_PATH = `44'/60'/0'`;
const NUM_ADDRESSES_TO_FETCH = 10;
const ASK_FOR_ON_DEVICE_CONFIRMATION = false;
const SHOULD_GET_CHAIN_CODE = false;
const HEX_REGEX = /^[0-9A-Fa-f]+$/g;

export class LedgerSubprovider extends Subprovider {
    private _nonceLock: Semaphore;
    private _connectionLock: Semaphore;
    private _networkId: number;
    private _derivationPath: string;
    private _derivationPathIndex: number;
    private _ledgerEthereumClientFactoryAsync: LedgerEthereumClientFactoryAsync;
    private _ledgerClientIfExists?: LedgerEthereumClient;
    private _shouldAlwaysAskForConfirmation: boolean;
    private static isValidHex(data: string) {
        if (!_.isString(data)) {
            return false;
        }
        const isHexPrefixed = data.slice(0, 2) === '0x';
        if (!isHexPrefixed) {
            return false;
        }
        const nonPrefixed = data.slice(2);
        const isValid = nonPrefixed.match(HEX_REGEX);
        return isValid;
    }
    private static validateSender(sender: string) {
        if (_.isUndefined(sender) || !addressUtils.isAddress(sender)) {
            throw new Error(LedgerSubproviderErrors.SenderInvalidOrNotSupplied);
        }
    }
    constructor(config: LedgerSubproviderConfigs) {
        super();
        this._nonceLock = new Semaphore(1);
        this._connectionLock = new Semaphore(1);
        this._networkId = config.networkId;
        this._ledgerEthereumClientFactoryAsync = config.ledgerEthereumClientFactoryAsync;
        this._derivationPath = config.derivationPath || DEFAULT_DERIVATION_PATH;
        this._shouldAlwaysAskForConfirmation = !_.isUndefined(config.accountFetchingConfigs) &&
                                               !_.isUndefined(
                                                   config.accountFetchingConfigs.shouldAskForOnDeviceConfirmation,
                                               ) ?
                                               config.accountFetchingConfigs.shouldAskForOnDeviceConfirmation :
                                               ASK_FOR_ON_DEVICE_CONFIRMATION;
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
    public async handleRequest(
        payload: Web3.JSONRPCRequestPayload, next: () => void, end: (err: Error|null, result?: any) => void,
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
                    LedgerSubprovider.validateSender(txParams.from);
                    const result = await this.sendTransactionAsync(txParams);
                    end(null, result);
                } catch (err) {
                    end(err);
                }
                return;

            case 'eth_signTransaction':
                txParams = payload.params[0];
                try {
                    const result = await this.signTransactionWithoutSendingAsync(txParams);
                    end(null, result);
                } catch (err) {
                    end(err);
                }
                return;

            case 'personal_sign':
                const data = payload.params[0];
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
    public async getAccountsAsync(): Promise<string[]> {
        this._ledgerClientIfExists = await this.createLedgerClientAsync();

        // TODO: replace with generating addresses without hitting Ledger
        const accounts = [];
        for (let i = 0; i < NUM_ADDRESSES_TO_FETCH; i++) {
            try {
                const derivationPath = `${this._derivationPath}/${i + this._derivationPathIndex}`;
                const result = await this._ledgerClientIfExists.getAddress_async(
                    derivationPath, this._shouldAlwaysAskForConfirmation, SHOULD_GET_CHAIN_CODE,
                );
                accounts.push(result.address.toLowerCase());
            } catch (err) {
                await this.destoryLedgerClientAsync();
                throw err;
            }
        }
        await this.destoryLedgerClientAsync();
        return accounts;
    }
    public async signTransactionAsync(txParams: PartialTxParams): Promise<string> {
        this._ledgerClientIfExists = await this.createLedgerClientAsync();

        const tx = new EthereumTx(txParams);

        // Set the EIP155 bits
        tx.raw[6] = Buffer.from([this._networkId]); // v
        tx.raw[7] = Buffer.from([]); // r
        tx.raw[8] = Buffer.from([]); // s

        const txHex = tx.serialize().toString('hex');
        try {
            const derivationPath = this.getDerivationPath();
            const result = await this._ledgerClientIfExists.signTransaction_async(derivationPath, txHex);
            // Store signature in transaction
            tx.r = Buffer.from(result.r, 'hex');
            tx.s = Buffer.from(result.s, 'hex');
            tx.v = Buffer.from(result.v, 'hex');

            // EIP155: v should be chain_id * 2 + {35, 36}
            const signedChainId = Math.floor((tx.v[0] - 35) / 2);
            if (signedChainId !== this._networkId) {
                await this.destoryLedgerClientAsync();
                const err = new Error(LedgerSubproviderErrors.TooOldLedgerFirmware);
                throw err;
            }

            const signedTxHex = `0x${tx.serialize().toString('hex')}`;
            await this.destoryLedgerClientAsync();
            return signedTxHex;
        } catch (err) {
            await this.destoryLedgerClientAsync();
            throw err;
        }
    }
    public async signPersonalMessageAsync(data: string): Promise<string> {
        this._ledgerClientIfExists = await this.createLedgerClientAsync();
        try {
            const derivationPath = this.getDerivationPath();
            const result = await this._ledgerClientIfExists.signPersonalMessage_async(
                derivationPath, ethUtil.stripHexPrefix(data));
            const v = result.v - 27;
            let vHex = v.toString(16);
            if (vHex.length < 2) {
                vHex = `0${v}`;
            }
            const signature = `0x${result.r}${result.s}${vHex}`;
            await this.destoryLedgerClientAsync();
            return signature;
        } catch (err) {
            await this.destoryLedgerClientAsync();
            throw err;
        }
    }
    private getDerivationPath() {
        const derivationPath = `${this.getPath()}/${this._derivationPathIndex}`;
        return derivationPath;
    }
    private async createLedgerClientAsync(): Promise<LedgerEthereumClient> {
        await this._connectionLock.wait();
        if (!_.isUndefined(this._ledgerClientIfExists)) {
            this._connectionLock.signal();
            throw new Error(LedgerSubproviderErrors.MultipleOpenConnectionsDisallowed);
        }
        const ledgerEthereumClient = await this._ledgerEthereumClientFactoryAsync();
        this._connectionLock.signal();
        return ledgerEthereumClient;
    }
    private async destoryLedgerClientAsync() {
        await this._connectionLock.wait();
        if (_.isUndefined(this._ledgerClientIfExists)) {
            this._connectionLock.signal();
            return;
        }
        await this._ledgerClientIfExists.comm.close_async();
        this._ledgerClientIfExists = undefined;
        this._connectionLock.signal();
    }
    private async sendTransactionAsync(txParams: PartialTxParams): Promise<Web3.JSONRPCResponsePayload> {
        await this._nonceLock.wait();
        try {
            // fill in the extras
            const filledParams = await this.populateMissingTxParamsAsync(txParams);
            // sign it
            const signedTx = await this.signTransactionAsync(filledParams);
            // emit a submit
            const payload = {
                method: 'eth_sendRawTransaction',
                params: [signedTx],
            };
            const result = await this.emitPayloadAsync(payload);
            this._nonceLock.signal();
            return result;
        } catch (err) {
            this._nonceLock.signal();
            throw err;
        }
    }
    private async signTransactionWithoutSendingAsync(txParams: PartialTxParams): Promise<ResponseWithTxParams> {
        await this._nonceLock.wait();
        try {
            // fill in the extras
            const filledParams = await this.populateMissingTxParamsAsync(txParams);
            // sign it
            const signedTx = await this.signTransactionAsync(filledParams);

            this._nonceLock.signal();
            const result = {
                raw: signedTx,
                tx: txParams,
            };
            return result;
        } catch (err) {
            this._nonceLock.signal();
            throw err;
        }
    }
    private async populateMissingTxParamsAsync(txParams: PartialTxParams): Promise<PartialTxParams> {
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
