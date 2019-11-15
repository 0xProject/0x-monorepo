import { assert } from '@0x/assert';
import { schemas } from '@0x/json-schemas';
import {
    AbiEncoder,
    abiUtils,
    BigNumber,
    decodeBytesAsRevertError,
    decodeThrownErrorAsRevertError,
    providerUtils,
    RevertError,
    StringRevertError,
} from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import {
    AbiDefinition,
    AbiType,
    BlockParam,
    CallData,
    ConstructorAbi,
    ContractAbi,
    DataItem,
    MethodAbi,
    SupportedProvider,
    TransactionReceiptWithDecodedLogs,
    TxData,
    TxDataPayable,
} from 'ethereum-types';
import Account from 'ethereumjs-account';
import * as util from 'ethereumjs-util';
import { default as VM } from 'ethereumjs-vm';
import PStateManager from 'ethereumjs-vm/dist/state/promisified';
import * as _ from 'lodash';

export { methodAbiToFunctionSignature } from './utils';

import { AwaitTransactionSuccessOpts } from './types';
import { formatABIDataItem } from './utils';

export { SubscriptionManager } from './subscription_manager';

export {
    ContractEvent,
    SendTransactionOpts,
    AwaitTransactionSuccessOpts,
    ContractFunctionObj,
    ContractTxFunctionObj,
    SubscriptionErrors,
} from './types';

export interface AbiEncoderByFunctionSignature {
    [key: string]: AbiEncoder.Method;
}

const ARBITRARY_PRIVATE_KEY = 'e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109';

// tslint:disable: max-classes-per-file
/**
 * @dev A promise-compatible type that exposes a `txHash` field.
 *      Not used by BaseContract, but generated contracts will return it in
 *      `awaitTransactionSuccessAsync()`.
 *      Maybe there's a better place for this.
 */
export class PromiseWithTransactionHash<T> implements Promise<T> {
    public readonly txHashPromise: Promise<string>;
    private readonly _promise: Promise<T>;
    constructor(txHashPromise: Promise<string>, promise: Promise<T>) {
        this.txHashPromise = txHashPromise;
        this._promise = promise;
    }
    // tslint:disable:promise-function-async
    // tslint:disable:async-suffix
    public then<TResult>(
        onFulfilled?: (v: T) => TResult | Promise<TResult>,
        onRejected?: (reason: any) => Promise<never>,
    ): Promise<TResult> {
        return this._promise.then<TResult>(onFulfilled, onRejected);
    }
    public catch<TResult>(onRejected?: (reason: any) => Promise<TResult>): Promise<TResult | T> {
        return this._promise.catch(onRejected);
    }
    // tslint:enable:promise-function-async
    // tslint:enable:async-suffix
    get [Symbol.toStringTag](): 'Promise' {
        return this._promise[Symbol.toStringTag];
    }
}

export class BaseContract {
    protected _abiEncoderByFunctionSignature: AbiEncoderByFunctionSignature;
    protected _web3Wrapper: Web3Wrapper;
    public abi: ContractAbi;
    public address: string;
    public contractName: string;
    public constructorArgs: any[] = [];
    public _deployedBytecodeIfExists?: Buffer;
    private _evmIfExists?: VM;
    private _evmAccountIfExists?: Buffer;
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
        if (constructorAbiIfExists !== undefined) {
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
    protected static _throwIfCallResultIsRevertError(rawCallResult: string): void {
        // Try to decode the call result as a revert error.
        let revert: RevertError;
        try {
            revert = decodeBytesAsRevertError(rawCallResult);
        } catch (err) {
            // Can't decode it as a revert error, so assume it didn't revert.
            return;
        }
        throw revert;
    }
    protected static _throwIfThrownErrorIsRevertError(error: Error): void {
        // Try to decode a thrown error.
        let revertError: RevertError;
        try {
            revertError = decodeThrownErrorAsRevertError(error);
            // Re-cast StringRevertErrors as plain Errors for backwards-compatibility.
            if (revertError instanceof StringRevertError) {
                throw new Error(revertError.values.message as string);
            }
        } catch (err) {
            // Can't decode it.
            return;
        }
        throw revertError;
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
    protected static async _applyDefaultsToContractTxDataAsync<T extends Partial<TxData | TxDataPayable>>(
        txData: T,
        estimateGasAsync?: (txData: T) => Promise<number>,
    ): Promise<TxData> {
        const removeUndefinedProperties = _.pickBy.bind(_);
        const txDataWithDefaults = removeUndefinedProperties(txData);
        if (txDataWithDefaults.gas === undefined && estimateGasAsync !== undefined) {
            txDataWithDefaults.gas = await estimateGasAsync(txDataWithDefaults);
        }
        if (txDataWithDefaults.from !== undefined) {
            txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
        }
        return txDataWithDefaults;
    }
    protected static _assertCallParams(callData: Partial<CallData>, defaultBlock?: BlockParam): void {
        assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        if (defaultBlock !== undefined) {
            assert.isBlockParam('defaultBlock', defaultBlock);
        }
    }
    protected _promiseWithTransactionHash(
        txHashPromise: Promise<string>,
        opts: AwaitTransactionSuccessOpts,
    ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
        return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
            txHashPromise,
            (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                // When the transaction hash resolves, wait for it to be mined.
                return this._web3Wrapper.awaitTransactionSuccessAsync(
                    await txHashPromise,
                    opts.pollingIntervalMs,
                    opts.timeoutMs,
                );
            })(),
        );
    }
    protected async _applyDefaultsToTxDataAsync<T extends Partial<TxData | TxDataPayable>>(
        txData: T,
        estimateGasAsync?: (txData: T) => Promise<number>,
    ): Promise<TxData> {
        // Gas amount sourced with the following priorities:
        // 1. Optional param passed in to public method call
        // 2. Global config passed in at library instantiation
        // 3. Gas estimate calculation + safety margin
        const removeUndefinedProperties = _.pickBy.bind(_);
        const txDataWithDefaults = {
            to: this.address,
            ...removeUndefinedProperties(this._web3Wrapper.getContractDefaults()),
            ...removeUndefinedProperties(txData),
        };
        if (txDataWithDefaults.gas === undefined && estimateGasAsync !== undefined) {
            txDataWithDefaults.gas = await estimateGasAsync(txDataWithDefaults);
        }
        if (txDataWithDefaults.from !== undefined) {
            txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
        }
        return txDataWithDefaults;
    }
    protected async _evmExecAsync(encodedData: string): Promise<string> {
        const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');
        const addressBuf = Buffer.from(this.address.substr(2), 'hex');
        // should only run once, the first time it is called
        if (this._evmIfExists === undefined) {
            const vm = new VM({});
            const psm = new PStateManager(vm.stateManager);

            // create an account with 1 ETH
            const accountPk = Buffer.from(ARBITRARY_PRIVATE_KEY, 'hex');
            const accountAddress = util.privateToAddress(accountPk);
            const account = new Account({ balance: 1e18 });
            await psm.putAccount(accountAddress, account);

            // 'deploy' the contract
            if (this._deployedBytecodeIfExists === undefined) {
                const contractCode = await this._web3Wrapper.getContractCodeAsync(this.address);
                this._deployedBytecodeIfExists = Buffer.from(contractCode.substr(2), 'hex');
            }
            await psm.putContractCode(addressBuf, this._deployedBytecodeIfExists);

            // save for later
            this._evmIfExists = vm;
            this._evmAccountIfExists = accountAddress;
        }
        let rawCallResult;
        try {
            const result = await this._evmIfExists.runCall({
                to: addressBuf,
                caller: this._evmAccountIfExists,
                origin: this._evmAccountIfExists,
                data: encodedDataBytes,
            });
            rawCallResult = `0x${result.execResult.returnValue.toString('hex')}`;
        } catch (err) {
            BaseContract._throwIfThrownErrorIsRevertError(err);
            throw err;
        }

        BaseContract._throwIfCallResultIsRevertError(rawCallResult);
        return rawCallResult;
    }
    protected async _performCallAsync(callData: Partial<CallData>, defaultBlock?: BlockParam): Promise<string> {
        const callDataWithDefaults = await this._applyDefaultsToTxDataAsync(callData);
        let rawCallResult: string;
        try {
            rawCallResult = await this._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
        } catch (err) {
            BaseContract._throwIfThrownErrorIsRevertError(err);
            throw err;
        }
        BaseContract._throwIfCallResultIsRevertError(rawCallResult);
        return rawCallResult;
    }
    protected _lookupAbiEncoder(functionSignature: string): AbiEncoder.Method {
        const abiEncoder = this._abiEncoderByFunctionSignature[functionSignature];
        if (abiEncoder === undefined) {
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
    /// @dev Constructs a contract wrapper.
    /// @param contractName Name of contract.
    /// @param abi of the contract.
    /// @param address of the deployed contract.
    /// @param supportedProvider for communicating with an ethereum node.
    /// @param logDecodeDependencies the name and ABI of contracts whose event logs are
    ///        decoded by this wrapper.
    /// @param deployedBytecode the deployedBytecode of the contract, used for executing
    ///        pure Solidity functions in memory. This is different from the bytecode.
    constructor(
        contractName: string,
        abi: ContractAbi,
        address: string,
        supportedProvider: SupportedProvider,
        callAndTxnDefaults?: Partial<CallData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode?: string,
    ) {
        assert.isString('contractName', contractName);
        assert.isETHAddressHex('address', address);
        if (deployedBytecode !== undefined && deployedBytecode !== '') {
            assert.isHexString('deployedBytecode', deployedBytecode);
            this._deployedBytecodeIfExists = Buffer.from(deployedBytecode.substr(2), 'hex');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        if (callAndTxnDefaults !== undefined) {
            assert.doesConformToSchema('callAndTxnDefaults', callAndTxnDefaults, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
        }
        this.contractName = contractName;
        this._web3Wrapper = new Web3Wrapper(provider, callAndTxnDefaults);
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
            this._web3Wrapper.abiDecoder.addABI(abi, contractName);
        });
        _.each(logDecodeDependencies, (dependencyAbi, dependencyName) => {
            this._web3Wrapper.abiDecoder.addABI(dependencyAbi, dependencyName);
        });
    }
}
