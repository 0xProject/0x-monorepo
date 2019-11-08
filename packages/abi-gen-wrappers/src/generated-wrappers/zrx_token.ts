// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma enum-naming
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import {
    AwaitTransactionSuccessOpts,
    ContractFunctionObj,
    ContractTxFunctionObj,
    SendTransactionOpts,
    BaseContract,
    SubscriptionManager,
    PromiseWithTransactionHash,
    methodAbiToFunctionSignature,
} from '@0x/base-contract';
import { schemas } from '@0x/json-schemas';
import {
    BlockParam,
    BlockParamLiteral,
    BlockRange,
    CallData,
    ContractAbi,
    ContractArtifact,
    DecodedLogArgs,
    LogWithDecodedArgs,
    MethodAbi,
    TransactionReceiptWithDecodedLogs,
    TxData,
    TxDataPayable,
    SupportedProvider,
} from 'ethereum-types';
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

export type ZRXTokenEventArgs = ZRXTokenTransferEventArgs | ZRXTokenApprovalEventArgs;

export enum ZRXTokenEvents {
    Transfer = 'Transfer',
    Approval = 'Approval',
}

export interface ZRXTokenTransferEventArgs extends DecodedLogArgs {
    _from: string;
    _to: string;
    _value: BigNumber;
}

export interface ZRXTokenApprovalEventArgs extends DecodedLogArgs {
    _owner: string;
    _spender: string;
    _value: BigNumber;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ZRXTokenContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode: string | undefined;
    private _methodABIIndex: { [name: string]: number } = {};
    private readonly _subscriptionManager: SubscriptionManager<ZRXTokenEventArgs, ZRXTokenEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<ZRXTokenContract> {
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        if (artifact.compilerOutput === undefined) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        const logDecodeDependenciesAbiOnly: { [contractName: string]: ContractAbi } = {};
        if (Object.keys(logDecodeDependencies) !== undefined) {
            for (const key of Object.keys(logDecodeDependencies)) {
                logDecodeDependenciesAbiOnly[key] = logDecodeDependencies[key].compilerOutput.abi;
            }
        }
        return ZRXTokenContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
    ): Promise<ZRXTokenContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [] = BaseContract._formatABIDataItemList(constructorAbi.inputs, [], BaseContract._bigNumberToString);
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, []);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`ZRXToken successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ZRXTokenContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [];
        return contractInstance;
    }

    /**
     * @returns      The contract ABI
     */
    public static ABI(): ContractAbi {
        const abi = [
            {
                constant: true,
                inputs: [],
                name: 'name',
                outputs: [
                    {
                        name: '',
                        type: 'string',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_spender',
                        type: 'address',
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'approve',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'totalSupply',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_from',
                        type: 'address',
                    },
                    {
                        name: '_to',
                        type: 'address',
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'transferFrom',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'decimals',
                outputs: [
                    {
                        name: '',
                        type: 'uint8',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                    },
                ],
                name: 'balanceOf',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'symbol',
                outputs: [
                    {
                        name: '',
                        type: 'string',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_to',
                        type: 'address',
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'transfer',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                    },
                    {
                        name: '_spender',
                        type: 'address',
                    },
                ],
                name: 'allowance',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                inputs: [],
                outputs: [],
                payable: false,
                type: 'constructor',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: '_from',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_to',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'Transfer',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_spender',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'Approval',
                outputs: [],
                type: 'event',
            },
        ] as ContractAbi;
        return abi;
    }

    public getFunctionSignature(methodName: string): string {
        const index = this._methodABIIndex[methodName];
        const methodAbi = ZRXTokenContract.ABI()[index] as MethodAbi;
        const functionSignature = methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }
    public getABIDecodedTransactionData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as ZRXTokenContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode<T>(callData);
        return abiDecodedCallData;
    }
    public getABIDecodedReturnData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as ZRXTokenContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue<T>(callData);
        return abiDecodedCallData;
    }
    public getSelector(methodName: string): string {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as ZRXTokenContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }

    public name(): ContractFunctionObj<string> {
        const self = (this as any) as ZRXTokenContract;

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('name()', []);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('name()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('name()', []);
                return abiEncodedTransactionData;
            },
        };
    }
    public approve(_spender: string, _value: BigNumber): ContractTxFunctionObj<boolean> {
        const self = (this as any) as ZRXTokenContract;
        assert.isString('_spender', _spender);
        assert.isBigNumber('_value', _value);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('approve(address,uint256)', [
                    _spender.toLowerCase(),
                    _value,
                ]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }

                const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                return txHash;
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                const txHashPromise = this.sendTransactionAsync(txData, opts);
                return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                    txHashPromise,
                    (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                        // When the transaction hash resolves, wait for it to be mined.
                        return self._web3Wrapper.awaitTransactionSuccessAsync(
                            await txHashPromise,
                            opts.pollingIntervalMs,
                            opts.timeoutMs,
                        );
                    })(),
                );
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments('approve(address,uint256)', [
                    _spender.toLowerCase(),
                    _value,
                ]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
                return gas;
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<boolean> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('approve(address,uint256)', [
                    _spender.toLowerCase(),
                    _value,
                ]);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('approve(address,uint256)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('approve(address,uint256)', [
                    _spender.toLowerCase(),
                    _value,
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    public totalSupply(): ContractFunctionObj<BigNumber> {
        const self = (this as any) as ZRXTokenContract;

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('totalSupply()', []);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('totalSupply()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('totalSupply()', []);
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * ERC20 transferFrom, modified such that an allowance of MAX_UINT represents an unlimited allowance.
     * @param _from Address to transfer from.
     * @param _to Address to transfer to.
     * @param _value Amount to transfer.
     * @returns Success of transfer.
     */
    public transferFrom(_from: string, _to: string, _value: BigNumber): ContractTxFunctionObj<boolean> {
        const self = (this as any) as ZRXTokenContract;
        assert.isString('_from', _from);
        assert.isString('_to', _to);
        assert.isBigNumber('_value', _value);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('transferFrom(address,address,uint256)', [
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _value,
                ]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }

                const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                return txHash;
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                const txHashPromise = this.sendTransactionAsync(txData, opts);
                return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                    txHashPromise,
                    (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                        // When the transaction hash resolves, wait for it to be mined.
                        return self._web3Wrapper.awaitTransactionSuccessAsync(
                            await txHashPromise,
                            opts.pollingIntervalMs,
                            opts.timeoutMs,
                        );
                    })(),
                );
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments('transferFrom(address,address,uint256)', [
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _value,
                ]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
                return gas;
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<boolean> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('transferFrom(address,address,uint256)', [
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _value,
                ]);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('transferFrom(address,address,uint256)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('transferFrom(address,address,uint256)', [
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _value,
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    public decimals(): ContractFunctionObj<number> {
        const self = (this as any) as ZRXTokenContract;

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<number> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('decimals()', []);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('decimals()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<number>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('decimals()', []);
                return abiEncodedTransactionData;
            },
        };
    }
    public balanceOf(_owner: string): ContractFunctionObj<BigNumber> {
        const self = (this as any) as ZRXTokenContract;
        assert.isString('_owner', _owner);

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('balanceOf(address)', [_owner.toLowerCase()]);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('balanceOf(address)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('balanceOf(address)', [
                    _owner.toLowerCase(),
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    public symbol(): ContractFunctionObj<string> {
        const self = (this as any) as ZRXTokenContract;

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('symbol()', []);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('symbol()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('symbol()', []);
                return abiEncodedTransactionData;
            },
        };
    }
    public transfer(_to: string, _value: BigNumber): ContractTxFunctionObj<boolean> {
        const self = (this as any) as ZRXTokenContract;
        assert.isString('_to', _to);
        assert.isBigNumber('_value', _value);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('transfer(address,uint256)', [
                    _to.toLowerCase(),
                    _value,
                ]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }

                const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                return txHash;
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                const txHashPromise = this.sendTransactionAsync(txData, opts);
                return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                    txHashPromise,
                    (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                        // When the transaction hash resolves, wait for it to be mined.
                        return self._web3Wrapper.awaitTransactionSuccessAsync(
                            await txHashPromise,
                            opts.pollingIntervalMs,
                            opts.timeoutMs,
                        );
                    })(),
                );
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments('transfer(address,uint256)', [
                    _to.toLowerCase(),
                    _value,
                ]);
                const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...txData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                if (txDataWithDefaults.from !== undefined) {
                    txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
                }

                const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
                return gas;
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<boolean> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('transfer(address,uint256)', [
                    _to.toLowerCase(),
                    _value,
                ]);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('transfer(address,uint256)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('transfer(address,uint256)', [
                    _to.toLowerCase(),
                    _value,
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    public allowance(_owner: string, _spender: string): ContractFunctionObj<BigNumber> {
        const self = (this as any) as ZRXTokenContract;
        assert.isString('_owner', _owner);
        assert.isString('_spender', _spender);

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('allowance(address,address)', [
                    _owner.toLowerCase(),
                    _spender.toLowerCase(),
                ]);
                let rawCallResult;

                const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                    {
                        to: self.address,
                        ...callData,
                        data: encodedData,
                    },
                    self._web3Wrapper.getContractDefaults(),
                );
                callDataWithDefaults.from = callDataWithDefaults.from
                    ? callDataWithDefaults.from.toLowerCase()
                    : callDataWithDefaults.from;
                try {
                    rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('allowance(address,address)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('allowance(address,address)', [
                    _owner.toLowerCase(),
                    _spender.toLowerCase(),
                ]);
                return abiEncodedTransactionData;
            },
        };
    }

    /**
     * Subscribe to an event type emitted by the ZRXToken contract.
     * @param eventName The ZRXToken contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends ZRXTokenEventArgs>(
        eventName: ZRXTokenEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, ZRXTokenEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            ZRXTokenContract.ABI(),
            callback,
            isVerbose,
            blockPollingIntervalMs,
        );
        return subscriptionToken;
    }
    /**
     * Cancel a subscription
     * @param subscriptionToken Subscription token returned by `subscribe()`
     */
    public unsubscribe(subscriptionToken: string): void {
        this._subscriptionManager.unsubscribe(subscriptionToken);
    }
    /**
     * Cancels all existing subscriptions
     */
    public unsubscribeAll(): void {
        this._subscriptionManager.unsubscribeAll();
    }
    /**
     * Gets historical logs without creating a subscription
     * @param eventName The ZRXToken contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends ZRXTokenEventArgs>(
        eventName: ZRXTokenEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, ZRXTokenEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            ZRXTokenContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = ZRXTokenContract.deployedBytecode,
    ) {
        super(
            'ZRXToken',
            ZRXTokenContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<ZRXTokenEventArgs, ZRXTokenEvents>(
            ZRXTokenContract.ABI(),
            this._web3Wrapper,
        );
        ZRXTokenContract.ABI().forEach((item, index) => {
            if (item.type === 'function') {
                const methodAbi = item as MethodAbi;
                this._methodABIIndex[methodAbi.name] = index;
            }
        });
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
