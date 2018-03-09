import { TxData, TxDataPayable } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethersContracts from 'ethers-contracts';
import * as _ from 'lodash';
import * as Web3 from 'web3';

export class BaseContract {
    protected _ethersInterface: ethersContracts.Interface;
    protected _web3Wrapper: Web3Wrapper;
    public abi: Web3.ContractAbi;
    public address: string;
    protected static _transformABIData(
        abis: Web3.DataItem[],
        values: any[],
        transformation: (type: string, value: any) => any,
    ): any {
        return _.map(values, (value: any, i: number) => {
            if (abis[i].type === 'tuple') {
                const transformedTuple = BaseContract._transformABIData(
                    abis[i].components,
                    _.values(value),
                    transformation,
                );
                return BaseContract._transformTypedData(abis[i].type, transformedTuple, transformation);
            }
            // HACK: We transform tuple values that are nested one level deep.
            // TODO: Support arbitrary levels of nesting.
            if (abis[i].type === 'tuple[]') {
                const transformedTupleArray = _.map(value, tuple =>
                    BaseContract._transformABIData(abis[i].components, _.values(tuple), transformation),
                );
                return BaseContract._transformTypedData(abis[i].type, transformedTupleArray, transformation);
            }
            return BaseContract._transformTypedData(abis[i].type, value, transformation);
        });
    }
    protected static _lowercaseAddress(type: string, value: string): string {
        return type === 'address' ? value.toLowerCase() : value;
    }
    protected static _bigNumberToString(type: string, value: string): string {
        return _.isObject(value) && (value as any).isBigNumber ? value.toString() : value;
    }
    private static _transformTypedData(
        type: string,
        values: any,
        transformation: (type: string, value: any) => any,
    ): any {
        const trailingArrayRegex = /\[\d*\]$/;
        if (type.match(trailingArrayRegex)) {
            const arrayItemType = type.replace(trailingArrayRegex, '');
            return _.map(values, value => this._transformTypedData(arrayItemType, value, transformation));
        } else {
            return transformation(type, values);
        }
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
        const txDataWithDefaults = {
            to: this.address,
            ...removeUndefinedProperties(this._web3Wrapper.getContractDefaults()),
            ...removeUndefinedProperties(txData as any),
            // HACK: TS can't prove that T is spreadable.
            // Awaiting https://github.com/Microsoft/TypeScript/pull/13288 to be merged
        };
        if (_.isUndefined(txDataWithDefaults.gas) && !_.isUndefined(estimateGasAsync)) {
            const estimatedGas = await estimateGasAsync(txData);
            txDataWithDefaults.gas = estimatedGas;
        }
        return txDataWithDefaults;
    }
    constructor(web3Wrapper: Web3Wrapper, abi: Web3.ContractAbi, address: string) {
        this._web3Wrapper = web3Wrapper;
        this.abi = abi;
        this.address = address;
        this._ethersInterface = new ethersContracts.Interface(abi);
    }
}
