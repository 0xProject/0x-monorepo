import { abiUtils, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import {
    AbiDefinition,
    AbiType,
    ConstructorAbi,
    ContractAbi,
    DataItem,
    MethodAbi,
    Provider,
    TxData,
    TxDataPayable,
} from 'ethereum-types';
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
    public contractName: string;
    public constructorArgs: any[] = [];
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
    protected static _lookupConstructorAbi(abi: ContractAbi): ConstructorAbi {
        const constructorAbiIfExists = _.find(
            abi,
            (abiDefinition: AbiDefinition) => abiDefinition.type === AbiType.Constructor,
            // tslint:disable-next-line:no-unnecessary-type-assertion
        ) as ConstructorAbi | undefined;
        if (!_.isUndefined(constructorAbiIfExists)) {
            return constructorAbiIfExists;
        } else {
            // If the constructor is not explicitly defined, it won't be included in the ABI. It is
            // still callable however, so we construct what the ABI would look like were it to exist.
            const defaultConstructorAbi: ConstructorAbi = {
                type: AbiType.Constructor,
                stateMutability: 'nonpayable',
                payable: false,
                inputs: [],
            };
            return defaultConstructorAbi;
        }
    }
    protected static _bnToBigNumber(type: string, value: any): any {
        return _.isObject(value) && value._bn ? new BigNumber(value.toString()) : value;
    }
    protected static async _applyDefaultsToTxDataAsync<T extends Partial<TxData | TxDataPayable>>(
        txData: T,
        txDefaults: Partial<TxData>,
        estimateGasAsync?: (txData: T) => Promise<number>,
    ): Promise<TxData> {
        // Gas amount sourced with the following priorities:
        // 1. Optional param passed in to public method call
        // 2. Global config passed in at library instantiation
        // 3. Gas estimate calculation + safety margin
        const removeUndefinedProperties = _.pickBy;
        const txDataWithDefaults: TxData = {
            ...removeUndefinedProperties(txDefaults),
            ...removeUndefinedProperties(txData as any),
            // HACK: TS can't prove that T is spreadable.
            // Awaiting https://github.com/Microsoft/TypeScript/pull/13288 to be merged
        } as any;
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
    constructor(
        contractName: string,
        abi: ContractAbi,
        address: string,
        provider: Provider,
        txDefaults?: Partial<TxData>,
    ) {
        this.contractName = contractName;
        this._web3Wrapper = new Web3Wrapper(provider, txDefaults);
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
