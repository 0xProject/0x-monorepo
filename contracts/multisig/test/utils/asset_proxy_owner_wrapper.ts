import { artifacts as proxyArtifacts } from '@0x/contracts-asset-proxy';
import { LogDecoder, Web3ProviderEngine } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { AssetProxyOwnerContract, TestAssetProxyOwnerContract } from '../../src';
import { artifacts } from '../../src/artifacts';

export class AssetProxyOwnerWrapper {
    private readonly _assetProxyOwner: AssetProxyOwnerContract | TestAssetProxyOwnerContract;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _logDecoder: LogDecoder;
    constructor(
        assetproxyOwnerContract: AssetProxyOwnerContract | TestAssetProxyOwnerContract,
        provider: Web3ProviderEngine,
    ) {
        this._assetProxyOwner = assetproxyOwnerContract;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._logDecoder = new LogDecoder(this._web3Wrapper, { ...artifacts, ...proxyArtifacts });
    }
    public async submitTransactionAsync(
        destination: string,
        data: string,
        from: string,
        opts: { value?: BigNumber } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const value = opts.value === undefined ? new BigNumber(0) : opts.value;
        const txHash = await this._assetProxyOwner.submitTransaction.sendTransactionAsync(destination, value, data, {
            from,
        });
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async confirmTransactionAsync(txId: BigNumber, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._assetProxyOwner.confirmTransaction.sendTransactionAsync(txId, { from });
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async revokeConfirmationAsync(txId: BigNumber, from: string): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._assetProxyOwner.revokeConfirmation.sendTransactionAsync(txId, { from });
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
    public async executeTransactionAsync(
        txId: BigNumber,
        from: string,
        opts: { gas?: number } = {},
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txHash = await this._assetProxyOwner.executeTransaction.sendTransactionAsync(txId, {
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
            ._assetProxyOwner as TestAssetProxyOwnerContract).executeRemoveAuthorizedAddressAtIndex.sendTransactionAsync(
            txId,
            {
                from,
            },
        );
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(txHash);
        return tx;
    }
}
