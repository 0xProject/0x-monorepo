import { ContractAbi, DataItem, Provider, TxData, TxDataPayable } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethersContracts from 'ethers-contracts';
import * as _ from 'lodash';

import { formatABIDataItem } from './utils';

export class BaseContract {
    protected _ethersInterface: ethersContracts.Interface;
    protected _web3Wrapper: Web3Wrapper;
    public abi: ContractAbi;
    public address: string;
    protected static _formatABIDataItemList(
        abis: DataItem[],
        values: any[],
        formatter: (type: string, value: any) => any,
    ): any {
        return _.map(values, (value: any, i: number) => formatABIDataItem(abis[i], value, formatter));
    }
    protected static _lowercaseAddress(type: string, value: string): string {
        return type === 'address' ? value.toLowerCase() : value;
    }
    protected static _bigNumberToString(type: string, value: any): any {
        return _.isObject(value) && value.isBigNumber ? value.toString() : value;
    }
    protected static _bnToBigNumber(type: string, value: any): any {
        return _.isObject(value) && value._bn ? new BigNumber(value.toString()) : value;
    }
    protected async _applyDefaultsToTxDataAsync<T extends Partial<TxData | TxDataPayable>>(
        txData: T,
        estimateGasAsync?: (txData: T) => Promise<number>,
    ): Promise<TxData> {
        // Gas amount sourced with the following priorities:
        // 1. Optional param passed in to public method call
        // 2. Global config passed in at library instantiation
        // 3. Gas estimate calculation + safety margin
        const removeUndefinedProperties = _.pickBy;
        const txDataWithDefaults = ({
            to: this.address,
            ...removeUndefinedProperties(this._web3Wrapper.getContractDefaults()),
            ...removeUndefinedProperties(txData as any),
            // HACK: TS can't prove that T is spreadable.
            // Awaiting https://github.com/Microsoft/TypeScript/pull/13288 to be merged
        } as any) as TxData;
        if (_.isUndefined(txDataWithDefaults.gas) && !_.isUndefined(estimateGasAsync)) {
            const estimatedGas = await estimateGasAsync(txData);
            txDataWithDefaults.gas = estimatedGas;
        }
        return txDataWithDefaults;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, defaults?: Partial<TxData>) {
        this._web3Wrapper = new Web3Wrapper(provider, defaults);
        this.abi = abi;
        this.address = address;
        this._ethersInterface = new ethersContracts.Interface(abi);
    }
}
