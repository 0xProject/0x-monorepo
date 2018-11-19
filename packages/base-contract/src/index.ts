import { abiUtils, BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
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
    [key: string]: ethers.utils.Interface;
}

const REVERT_ERROR_SELECTOR = '08c379a0';
const REVERT_ERROR_SELECTOR_OFFSET = 2;
const REVERT_ERROR_SELECTOR_BYTES_LENGTH = 4;
const REVERT_ERROR_SELECTOR_END = REVERT_ERROR_SELECTOR_OFFSET + REVERT_ERROR_SELECTOR_BYTES_LENGTH * 2;

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
    protected static _bigNumberToString(_type: string, value: any): any {
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
    protected static _bnToBigNumber(_type: string, value: any): any {
        return _.isObject(value) && value._hex ? new BigNumber(value.toString()) : value;
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
        const removeUndefinedProperties = _.pickBy.bind(_);
        const txDataWithDefaults = {
            ...removeUndefinedProperties(txDefaults),
            ...removeUndefinedProperties(txData),
        };
        if (_.isUndefined(txDataWithDefaults.gas) && !_.isUndefined(estimateGasAsync)) {
            txDataWithDefaults.gas = await estimateGasAsync(txDataWithDefaults);
        }
        return txDataWithDefaults;
    }
    protected static _throwIfRevertWithReasonCallResult(rawCallResult: string): void {
        if (rawCallResult.slice(REVERT_ERROR_SELECTOR_OFFSET, REVERT_ERROR_SELECTOR_END) === REVERT_ERROR_SELECTOR) {
            const revertReason = ethers.utils.defaultAbiCoder.decode(
                ['string'],
                ethers.utils.hexDataSlice(rawCallResult, REVERT_ERROR_SELECTOR_BYTES_LENGTH),
            );
            throw new Error(revertReason);
        }
    }
    // Throws if the given arguments cannot be safely/correctly encoded based on
    // the given inputAbi. An argument may not be considered safely encodeable
    // if it overflows the corresponding Solidity type, there is a bug in the
    // encoder, or the encoder performs unsafe type coercion.
    public static strictArgumentEncodingCheck(inputAbi: DataItem[], args: any[]): void {
        const coder = new ethers.utils.AbiCoder();
        const params = abiUtils.parseEthersParams(inputAbi);
        const rawEncoded = coder.encode(inputAbi, args);
        const rawDecoded = coder.decode(inputAbi, rawEncoded);
        for (let i = 0; i < rawDecoded.length; i++) {
            const original = args[i];
            const decoded = rawDecoded[i];
            if (!abiUtils.isAbiDataEqual(params.names[i], params.types[i], original, decoded)) {
                throw new Error(
                    `Cannot safely encode argument: ${params.names[i]} (${original}) of type ${
                        params.types[i]
                    }. (Possible type overflow or other encoding error)`,
                );
            }
        }
    }
    protected _lookupEthersInterface(functionSignature: string): ethers.utils.Interface {
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
            // tslint:disable-next-line:no-unnecessary-type-assertion
            const abiFunctionSignature = abiUtils.getFunctionSignature(abiDefinition as MethodAbi);
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
            this._ethersInterfacesByFunctionSignature[functionSignature] = new ethers.utils.Interface([methodAbi]);
        });
    }
}
