import {
    AbiDefinition,
    AbiType,
    ContractAbi,
    DataItem,
    MethodAbi,
    Provider,
    TxData,
    TxDataPayable,
} from '@0xproject/types';
import { abiUtils, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethers from 'ethers';
import * as _ from 'lodash';

import { formatABIDataItem } from './utils';

export interface EthersInterfaceByFunctionSignature {
    [key: string]: ethers.Interface;
}

export class BaseContract {
    protected _ethersInterfacesByFunctionSignature: EthersInterfaceByFunctionSignature;
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
    protected _lookupEthersInterface(functionSignature: string): ethers.Interface {
        const ethersInterface = this._ethersInterfacesByFunctionSignature[functionSignature];
        if (_.isUndefined(ethersInterface)) {
            throw new Error(`Failed to lookup method with function signature '${functionSignature}'`);
        }
        return ethersInterface;
    }
    protected _lookupAbi(functionSignature: string): MethodAbi {
        const methodAbi = _.find(this.abi, (abiDefinition: AbiDefinition) => {
            if (abiDefinition.type !== AbiType.Function) {
                return false;
            }
            const abiFunctionSignature = abiUtils.getFunctionSignature(abiDefinition);
            if (abiFunctionSignature === functionSignature) {
                return true;
            }
            return false;
        }) as MethodAbi;
        return methodAbi;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, defaults?: Partial<TxData>) {
        this._web3Wrapper = new Web3Wrapper(provider, defaults);
        this.abi = abi;
        this.address = address;
        const methodAbis = this.abi.filter(
            (abiDefinition: AbiDefinition) => abiDefinition.type === AbiType.Function,
        ) as MethodAbi[];
        this._ethersInterfacesByFunctionSignature = {};
        _.each(methodAbis, methodAbi => {
            const functionSignature = abiUtils.getFunctionSignature(methodAbi);
            this._ethersInterfacesByFunctionSignature[functionSignature] = new ethers.Interface([methodAbi]);
        });
    }
}
