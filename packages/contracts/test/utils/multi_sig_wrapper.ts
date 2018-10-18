import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { AssetProxyOwnerContract } from '../../generated-wrappers/asset_proxy_owner';
import { MultiSigWalletContract } from '../../generated-wrappers/multi_sig_wallet';

import { LogDecoder } from './log_decoder';

export class MultiSigWrapper {
    private readonly _multiSig: MultiSigWalletContract;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _logDecoder: LogDecoder;
    constructor(multiSigContract: MultiSigWalletContract, provider: Provider) {
        this._multiSig = multiSigContract;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._logDecoder = new LogDecoder(this._web3Wrapper);
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
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async confirmTransactionAsync(txId: BigNumber, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._multiSig.confirmTransaction.sendTransactionAsync(txId, { from });
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async revokeConfirmationAsync(txId: BigNumber, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._multiSig.revokeConfirmation.sendTransactionAsync(txId, { from });
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async executeTransactionAsync(
        txId: BigNumber,
        from: string,
        opts: { gas?: number } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._multiSig.executeTransaction.sendTransactionAsync(txId, {
            from,
            gas: opts.gas,
        });
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async executeRemoveAuthorizedAddressAtIndexAsync(
        txId: BigNumber,
        from: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const txHash = await (this
            ._multiSig as AssetProxyOwnerContract).executeRemoveAuthorizedAddressAtIndex.sendTransactionAsync(txId, {
            from,
        });
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
}
