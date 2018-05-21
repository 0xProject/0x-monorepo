import { TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { MultiSigWalletContract } from '../contract_wrappers/generated/multi_sig_wallet';
import { MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract } from '../contract_wrappers/generated/multi_sig_wallet_with_time_lock_except_remove_authorized_address';

import { constants } from './constants';
import { LogDecoder } from './log_decoder';

export class MultiSigWrapper {
    private _multiSig: MultiSigWalletContract;
    private _logDecoder: LogDecoder = new LogDecoder(constants.TESTRPC_NETWORK_ID);
    private _zeroEx: ZeroEx;
    constructor(multiSigContract: MultiSigWalletContract, zeroEx: ZeroEx) {
        this._multiSig = multiSigContract;
        this._zeroEx = zeroEx;
    }
    public async submitTransactionAsync(
        destination: string,
        data: string,
        from: string,
        opts: { value?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const value = _.isUndefined(opts.value) ? new BigNumber(0) : opts.value;
        const txHash = await this._multiSig.submitTransaction.sendTransactionAsync(destination, value, data, {
            from,
        });
        const tx = await this._getTxWithDecodedMultiSigLogs(txHash);
        return tx;
    }
    public async confirmTransactionAsync(txId: BigNumber, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._multiSig.confirmTransaction.sendTransactionAsync(txId, { from });
        const tx = await this._getTxWithDecodedMultiSigLogs(txHash);
        return tx;
    }
    public async executeTransactionAsync(txId: BigNumber, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._multiSig.executeTransaction.sendTransactionAsync(txId, { from });
        const tx = await this._getTxWithDecodedMultiSigLogs(txHash);
        return tx;
    }
    public async executeRemoveAuthorizedAddressAsync(
        txId: BigNumber,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await (this
            ._multiSig as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract).executeRemoveAuthorizedAddress.sendTransactionAsync(
            txId,
            { from },
        );
        const tx = await this._getTxWithDecodedMultiSigLogs(txHash);
        return tx;
    }
    private async _getTxWithDecodedMultiSigLogs(txHash: string) {
        const tx = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        tx.logs = _.filter(tx.logs, log => log.address === this._multiSig.address);
        tx.logs = _.map(tx.logs, log => this._logDecoder.decodeLogOrThrow(log));
        return tx;
    }
}
