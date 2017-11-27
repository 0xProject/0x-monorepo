import * as _ from 'lodash';
import Web3 = require('web3');
import * as EthereumTx from 'ethereumjs-tx';
import ethUtil = require('ethereumjs-util');
import * as ledger from 'ledgerco';
import HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet');
import {constants} from 'ts/utils/constants';
import {LedgerEthConnection, SignPersonalMessageParams, TxParams} from 'ts/types';

const NUM_ADDRESSES_TO_FETCH = 10;
const ASK_FOR_ON_DEVICE_CONFIRMATION = false;
const SHOULD_GET_CHAIN_CODE = false;

export class LedgerWallet {
    public isU2FSupported: boolean;
    public getAccounts: (callback: (err: Error, accounts: string[]) => void) => void;
    public signMessage: (msgParams: SignPersonalMessageParams,
                         callback: (err: Error, result?: string) => void) => void;
    public signTransaction: (txParams: TxParams,
                             callback: (err: Error, result?: string) => void) => void;
    private getNetworkId: () => number;
    private path: string;
    private pathIndex: number;
    private ledgerEthConnection: LedgerEthConnection;
    private accounts: string[];
    constructor(getNetworkIdFn: () => number) {
        this.path = constants.DEFAULT_DERIVATION_PATH;
        this.pathIndex = 0;
        this.isU2FSupported = false;
        this.getNetworkId = getNetworkIdFn;
        this.getAccounts = this.getAccountsAsync.bind(this);
        this.signMessage = this.signPersonalMessageAsync.bind(this);
        this.signTransaction = this.signTransactionAsync.bind(this);
    }
    public getPath(): string {
        return this.path;
    }
    public setPath(derivationPath: string) {
        this.path = derivationPath;
        // HACK: Must re-assign getAccounts, signMessage and signTransaction since they were
        // previously bound to old values of this.path
        this.getAccounts = this.getAccountsAsync.bind(this);
        this.signMessage = this.signPersonalMessageAsync.bind(this);
        this.signTransaction = this.signTransactionAsync.bind(this);
    }
    public setPathIndex(pathIndex: number) {
        this.pathIndex = pathIndex;
        // HACK: Must re-assign signMessage & signTransaction since they it was previously bound to
        // old values of this.path
        this.signMessage = this.signPersonalMessageAsync.bind(this);
        this.signTransaction = this.signTransactionAsync.bind(this);
    }
    public async getAccountsAsync(callback: (err: Error, accounts: string[]) => void) {
        if (!_.isUndefined(this.ledgerEthConnection)) {
            callback(null, []);
            return;
        }
        this.ledgerEthConnection = await this.createLedgerConnectionAsync();

        const accounts = [];
        for (let i = 0; i < NUM_ADDRESSES_TO_FETCH; i++) {
            try {
                const derivationPath = `${this.path}/${i}`;
                const result = await this.ledgerEthConnection.getAddress_async(
                    derivationPath, ASK_FOR_ON_DEVICE_CONFIRMATION, SHOULD_GET_CHAIN_CODE,
                );
                accounts.push(result.address.toLowerCase());
            } catch (err) {
                await this.closeLedgerConnectionAsync();
                callback(err, null);
                return;
            }
        }

        await this.closeLedgerConnectionAsync();
        callback(null, accounts);
    }
    public async signTransactionAsync(txParams: TxParams, callback: (err: Error, result?: string) => void) {
        const tx = new EthereumTx(txParams);

        const networkId = this.getNetworkId();
        const chainId = networkId; // Same thing

        // Set the EIP155 bits
        tx.raw[6] = Buffer.from([chainId]);  // v
        tx.raw[7] = Buffer.from([]);         // r
        tx.raw[8] = Buffer.from([]);         // s

        const txHex = tx.serialize().toString('hex');

        this.ledgerEthConnection = await this.createLedgerConnectionAsync();

        try {
            const derivationPath = this.getDerivationPath();
            const result = await this.ledgerEthConnection.signTransaction_async(derivationPath, txHex);

            // Store signature in transaction
            tx.v = new Buffer(result.v, 'hex');
            tx.r = new Buffer(result.r, 'hex');
            tx.s = new Buffer(result.s, 'hex');

            // EIP155: v should be chain_id * 2 + {35, 36}
            const signedChainId = Math.floor((tx.v[0] - 35) / 2);
            if (signedChainId !== chainId) {
                const err = new Error('TOO_OLD_LEDGER_FIRMWARE');
                callback(err, null);
                return;
            }

            const signedTxHex = `0x${tx.serialize().toString('hex')}`;
            await this.closeLedgerConnectionAsync();
            callback(null, signedTxHex);
        } catch (err) {
            await this.closeLedgerConnectionAsync();
            callback(err, null);
        }
    }
    public async signPersonalMessageAsync(msgParams: SignPersonalMessageParams,
                                          callback: (err: Error, result?: string) => void) {
        if (!_.isUndefined(this.ledgerEthConnection)) {
            callback(new Error('Another request is in progress.'));
            return;
        }
        this.ledgerEthConnection = await this.createLedgerConnectionAsync();

        try {
            const derivationPath = this.getDerivationPath();
            const result = await this.ledgerEthConnection.signPersonalMessage_async(
                derivationPath, ethUtil.stripHexPrefix(msgParams.data),
            );
            const v = _.parseInt(result.v) - 27;
            let vHex = v.toString(16);
            if (vHex.length < 2) {
                vHex = `0${v}`;
            }
            const signature = `0x${result.r}${result.s}${vHex}`;
            await this.closeLedgerConnectionAsync();
            callback(null, signature);
        } catch (err) {
            await this.closeLedgerConnectionAsync();
            callback(err, null);
        }
    }
    private async createLedgerConnectionAsync() {
        if (!_.isUndefined(this.ledgerEthConnection)) {
            throw new Error('Multiple open connections to the Ledger disallowed.');
        }
        const ledgerConnection = await ledger.comm_u2f.create_async();
        const ledgerEthConnection = new ledger.eth(ledgerConnection);
        return ledgerEthConnection;
    }
    private async closeLedgerConnectionAsync() {
        if (_.isUndefined(this.ledgerEthConnection)) {
            return;
        }
        await this.ledgerEthConnection.comm.close_async();
        this.ledgerEthConnection = undefined;
    }
    private getDerivationPath() {
        const derivationPath = `${this.path}/${this.pathIndex}`;
        return derivationPath;
    }
}

export const ledgerWalletSubproviderFactory = (getNetworkIdFn: () => number): LedgerWallet => {
    const ledgerWallet = new LedgerWallet(getNetworkIdFn);
    const ledgerWalletSubprovider = new HookedWalletSubprovider(ledgerWallet) as LedgerWallet;
    ledgerWalletSubprovider.getPath = ledgerWallet.getPath.bind(ledgerWallet);
    ledgerWalletSubprovider.setPath = ledgerWallet.setPath.bind(ledgerWallet);
    ledgerWalletSubprovider.setPathIndex = ledgerWallet.setPathIndex.bind(ledgerWallet);
    return ledgerWalletSubprovider;
};
