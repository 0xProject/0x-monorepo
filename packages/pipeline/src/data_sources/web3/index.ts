import { Web3ProviderEngine } from '@0x/subproviders';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { BlockWithoutTransactionData, Transaction } from 'ethereum-types';

export class Web3Source {
    private readonly _web3Wrapper: Web3Wrapper;
    constructor(provider: Web3ProviderEngine) {
        this._web3Wrapper = new Web3Wrapper(provider);
    }

    public async getBlockInfoAsync(blockNumber: number): Promise<BlockWithoutTransactionData> {
        const block = await this._web3Wrapper.getBlockIfExistsAsync(blockNumber);
        if (block == null) {
            return Promise.reject(new Error(`Could not find block for given block number: ${blockNumber}`));
        }
        return block;
    }

    public async getTransactionInfoAsync(txHash: string): Promise<Transaction> {
        return this._web3Wrapper.getTransactionByHashAsync(txHash);
    }
}
