import { AbiEncoder, abiUtils, BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import {
    AbiDefinition,
    AbiType,
    BlockParam,
    ConstructorAbi,
    ContractAbi,
    DataItem,
    MethodAbi,
    SupportedProvider,
    TxData,
    TxDataPayable,
} from 'ethereum-types';
import * as _ from 'lodash';

import { formatABIDataItem } from './utils';

export interface AbiEncoderByFunctionSignature {
    [key: string]: AbiEncoder.Method;
}

const REVERT_ERROR_SELECTOR = '08c379a0';
const REVERT_ERROR_SELECTOR_OFFSET = 2;
const REVERT_ERROR_SELECTOR_BYTES_LENGTH = 4;
const REVERT_ERROR_SELECTOR_END = REVERT_ERROR_SELECTOR_OFFSET + REVERT_ERROR_SELECTOR_BYTES_LENGTH * 2;
function isHexString(value: any, length?: number): boolean {
    if (typeof value !== 'string' || !value.match(/^0x[0-9A-Fa-f]*$/)) {
        return false;
    }
    if (length && value.length !== length * 2 + 2) {
        return false;
    }
    return true;
}
function hexDataSlice(data: string, offset: number, endOffset?: number): string {
    if (!isHexString(data)) {
        throw new Error(`Invalid Hex Data ${data}`);
    }
    if (data.length % 2 !== 0) {
        throw new Error(`Hex Data length must be even ${data}`);
    }
    const localOffset = offset * 2 + 2;

    if (endOffset != null) {
        return `0x${data.substring(localOffset, endOffset * 2 + 2)}`;
    }

    return `0x${data.substring(localOffset)}`;
}

export class BaseContract {
    protected _abiEncoderByFunctionSignature: AbiEncoderByFunctionSignature;
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
        return BigNumber.isBigNumber(value) ? value.toString() : value;
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
            const revertReasonArray = AbiEncoder.create('(string)').decodeAsArray(
                hexDataSlice(rawCallResult, REVERT_ERROR_SELECTOR_BYTES_LENGTH),
            );
            if (revertReasonArray.length !== 1) {
                throw new Error(
                    `Cannot safely decode revert reason: Expected an array with one element, got ${revertReasonArray}`,
                );
            }
            const revertReason = revertReasonArray[0];
            throw new Error(revertReason);
        }
    }
    // Throws if the given arguments cannot be safely/correctly encoded based on
    // the given inputAbi. An argument may not be considered safely encodeable
    // if it overflows the corresponding Solidity type, there is a bug in the
    // encoder, or the encoder performs unsafe type coercion.
    public static strictArgumentEncodingCheck(inputAbi: DataItem[], args: any[]): string {
        const abiEncoder = AbiEncoder.create(inputAbi);
        const params = abiUtils.parseEthersParams(inputAbi);
        const rawEncoded = abiEncoder.encode(args);
        const rawDecoded = abiEncoder.decodeAsArray(rawEncoded);
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
        return rawEncoded;
    }
    protected async _callAsync(
        to: string,
        data: string,
        txData: Partial<TxData> = {},
        defaultBlock?: BlockParam,
    ): Promise<string> {
        const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            {
                to,
                ...txData,
                data,
            },
            this._web3Wrapper.getContractDefaults(),
        );
        const rawCallResult = await this._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
        BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
        return rawCallResult;
    }
    protected async _sendTransactionAsync(
        to: string,
        data: string,
        txData: Partial<TxData> = {},
        estimateGasAsync?: (txData: Partial<TxData>) => Promise<number>,
    ): Promise<string> {
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            {
                to,
                ...txData,
                data,
            },
            this._web3Wrapper.getContractDefaults(),
            estimateGasAsync,
        );
        const txHash = await this._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        return txHash;
    }
    protected async _estimateGasAsync(to: string, data: string, txData: Partial<TxData> = {}): Promise<number> {
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            {
                to,
                ...txData,
                data,
            },
            this._web3Wrapper.getContractDefaults(),
        );
        const gas = await this._web3Wrapper.estimateGasAsync(txDataWithDefaults);
        return gas;
    }
    protected _lookupAbiEncoder(functionSignature: string): AbiEncoder.Method {
        const abiEncoder = this._abiEncoderByFunctionSignature[functionSignature];
        if (_.isUndefined(abiEncoder)) {
            throw new Error(`Failed to lookup method with function signature '${functionSignature}'`);
        }
        return abiEncoder;
    }
    protected _lookupAbi(functionSignature: string): MethodAbi {
        const methodAbi = _.find(this.abi, (abiDefinition: AbiDefinition) => {
            if (abiDefinition.type !== AbiType.Function) {
                return false;
            }
            // tslint:disable-next-line:no-unnecessary-type-assertion
            const abiFunctionSignature = new AbiEncoder.Method(abiDefinition as MethodAbi).getSignature();
            if (abiFunctionSignature === functionSignature) {
                return true;
            }
            return false;
        }) as MethodAbi;
        return methodAbi;
    }
    protected _strictEncodeArguments(functionSignature: string, functionArguments: any): string {
        const abiEncoder = this._lookupAbiEncoder(functionSignature);
        const inputAbi = abiEncoder.getDataItem().components;
        if (inputAbi === undefined) {
            throw new Error(`Undefined Method Input ABI`);
        }
        const abiEncodedArguments = abiEncoder.encode(functionArguments);
        return abiEncodedArguments;
    }
    constructor(
        contractName: string,
        abi: ContractAbi,
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
    ) {
        this.contractName = contractName;
        this._web3Wrapper = new Web3Wrapper(supportedProvider, txDefaults);
        this.abi = abi;
        this.address = address;
        const methodAbis = this.abi.filter(
            (abiDefinition: AbiDefinition) => abiDefinition.type === AbiType.Function,
        ) as MethodAbi[];
        this._abiEncoderByFunctionSignature = {};
        _.each(methodAbis, methodAbi => {
            const abiEncoder = new AbiEncoder.Method(methodAbi);
            const functionSignature = abiEncoder.getSignature();
            this._abiEncoderByFunctionSignature[functionSignature] = abiEncoder;
        });
    }
}
