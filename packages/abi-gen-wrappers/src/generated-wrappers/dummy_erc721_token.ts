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

export type DummyERC721TokenEventArgs =
    | DummyERC721TokenApprovalEventArgs
    | DummyERC721TokenApprovalForAllEventArgs
    | DummyERC721TokenTransferEventArgs;

export enum DummyERC721TokenEvents {
    Approval = 'Approval',
    ApprovalForAll = 'ApprovalForAll',
    Transfer = 'Transfer',
}

export interface DummyERC721TokenApprovalEventArgs extends DecodedLogArgs {
    _owner: string;
    _approved: string;
    _tokenId: BigNumber;
}

export interface DummyERC721TokenApprovalForAllEventArgs extends DecodedLogArgs {
    _owner: string;
    _operator: string;
    _approved: boolean;
}

export interface DummyERC721TokenTransferEventArgs extends DecodedLogArgs {
    _from: string;
    _to: string;
    _tokenId: BigNumber;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class DummyERC721TokenContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode: string | undefined;
    private readonly _methodABIIndex: { [name: string]: number } = {};
    private readonly _subscriptionManager: SubscriptionManager<DummyERC721TokenEventArgs, DummyERC721TokenEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
        _name: string,
        _symbol: string,
    ): Promise<DummyERC721TokenContract> {
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
        return DummyERC721TokenContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
            _name,
            _symbol,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
        _name: string,
        _symbol: string,
    ): Promise<DummyERC721TokenContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_name, _symbol] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_name, _symbol],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_name, _symbol]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`DummyERC721Token successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new DummyERC721TokenContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [_name, _symbol];
        return contractInstance;
    }

    /**
     * @returns      The contract ABI
     */
    public static ABI(): ContractAbi {
        const abi = [
            {
                inputs: [
                    {
                        name: '_name',
                        type: 'string',
                    },
                    {
                        name: '_symbol',
                        type: 'string',
                    },
                ],
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor',
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
                        name: '_approved',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_tokenId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'Approval',
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
                        name: '_operator',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_approved',
                        type: 'bool',
                        indexed: false,
                    },
                ],
                name: 'ApprovalForAll',
                outputs: [],
                type: 'event',
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
                        name: '_tokenId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'Transfer',
                outputs: [],
                type: 'event',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_approved',
                        type: 'address',
                    },
                    {
                        name: '_tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'approve',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
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
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                    },
                    {
                        name: '_tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'burn',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: '_tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'getApproved',
                outputs: [
                    {
                        name: '',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'view',
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
                        name: '_operator',
                        type: 'address',
                    },
                ],
                name: 'isApprovedForAll',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'view',
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
                        name: '_tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'mint',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
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
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'owner',
                outputs: [
                    {
                        name: '',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: '_tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'ownerOf',
                outputs: [
                    {
                        name: '',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'view',
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
                        name: '_tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'safeTransferFrom',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
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
                        name: '_tokenId',
                        type: 'uint256',
                    },
                    {
                        name: '_data',
                        type: 'bytes',
                    },
                ],
                name: 'safeTransferFrom',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_operator',
                        type: 'address',
                    },
                    {
                        name: '_approved',
                        type: 'bool',
                    },
                ],
                name: 'setApprovalForAll',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
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
                stateMutability: 'view',
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
                        name: '_tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'transferFrom',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'newOwner',
                        type: 'address',
                    },
                ],
                name: 'transferOwnership',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
        ] as ContractAbi;
        return abi;
    }

    public getFunctionSignature(methodName: string): string {
        const index = this._methodABIIndex[methodName];
        const methodAbi = DummyERC721TokenContract.ABI()[index] as MethodAbi; // tslint:disable-line:no-unnecessary-type-assertion
        const functionSignature = methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }
    public getABIDecodedTransactionData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as DummyERC721TokenContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode<T>(callData);
        return abiDecodedCallData;
    }
    public getABIDecodedReturnData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as DummyERC721TokenContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue<T>(callData);
        return abiDecodedCallData;
    }
    public getSelector(methodName: string): string {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as DummyERC721TokenContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }

    /**
     * The zero address indicates there is no approved address.
     * Throws unless `msg.sender` is the current NFT owner, or an authorized
     * operator of the current owner.
     * @param _approved The new approved NFT controller
     * @param _tokenId The NFT to approve
     */
    public approve(_approved: string, _tokenId: BigNumber): ContractTxFunctionObj<void> {
        const self = (this as any) as DummyERC721TokenContract;
        assert.isString('_approved', _approved);
        assert.isBigNumber('_tokenId', _tokenId);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('approve(address,uint256)', [
                    _approved.toLowerCase(),
                    _tokenId,
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
                    _approved.toLowerCase(),
                    _tokenId,
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
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('approve(address,uint256)', [
                    _approved.toLowerCase(),
                    _tokenId,
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
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('approve(address,uint256)', [
                    _approved.toLowerCase(),
                    _tokenId,
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * NFTs assigned to the zero address are considered invalid, and this
     * function throws for queries about the zero address.
     * @param _owner An address for whom to query the balance
     * @returns The number of NFTs owned by &#x60;_owner&#x60;, possibly zero
     */
    public balanceOf(_owner: string): ContractFunctionObj<BigNumber> {
        const self = (this as any) as DummyERC721TokenContract;
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
    /**
     * Function to burn a token
     * Reverts if the given token ID doesn't exist or not called by contract owner
     * @param _owner Owner of token with given token ID
     * @param _tokenId ID of the token to be burned by the msg.sender
     */
    public burn(_owner: string, _tokenId: BigNumber): ContractTxFunctionObj<void> {
        const self = (this as any) as DummyERC721TokenContract;
        assert.isString('_owner', _owner);
        assert.isBigNumber('_tokenId', _tokenId);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('burn(address,uint256)', [
                    _owner.toLowerCase(),
                    _tokenId,
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
                const encodedData = self._strictEncodeArguments('burn(address,uint256)', [
                    _owner.toLowerCase(),
                    _tokenId,
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
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('burn(address,uint256)', [
                    _owner.toLowerCase(),
                    _tokenId,
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
                const abiEncoder = self._lookupAbiEncoder('burn(address,uint256)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('burn(address,uint256)', [
                    _owner.toLowerCase(),
                    _tokenId,
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Throws if `_tokenId` is not a valid NFT.
     * @param _tokenId The NFT to find the approved address for
     * @returns The approved address for this NFT, or the zero address if there is none
     */
    public getApproved(_tokenId: BigNumber): ContractFunctionObj<string> {
        const self = (this as any) as DummyERC721TokenContract;
        assert.isBigNumber('_tokenId', _tokenId);

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
                const encodedData = self._strictEncodeArguments('getApproved(uint256)', [_tokenId]);
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
                const abiEncoder = self._lookupAbiEncoder('getApproved(uint256)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('getApproved(uint256)', [_tokenId]);
                return abiEncodedTransactionData;
            },
        };
    }
    public isApprovedForAll(_owner: string, _operator: string): ContractFunctionObj<boolean> {
        const self = (this as any) as DummyERC721TokenContract;
        assert.isString('_owner', _owner);
        assert.isString('_operator', _operator);

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<boolean> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('isApprovedForAll(address,address)', [
                    _owner.toLowerCase(),
                    _operator.toLowerCase(),
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
                const abiEncoder = self._lookupAbiEncoder('isApprovedForAll(address,address)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('isApprovedForAll(address,address)', [
                    _owner.toLowerCase(),
                    _operator.toLowerCase(),
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Function to mint a new token
     * Reverts if the given token ID already exists
     * @param _to Address of the beneficiary that will own the minted token
     * @param _tokenId ID of the token to be minted by the msg.sender
     */
    public mint(_to: string, _tokenId: BigNumber): ContractTxFunctionObj<void> {
        const self = (this as any) as DummyERC721TokenContract;
        assert.isString('_to', _to);
        assert.isBigNumber('_tokenId', _tokenId);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('mint(address,uint256)', [_to.toLowerCase(), _tokenId]);
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
                const encodedData = self._strictEncodeArguments('mint(address,uint256)', [_to.toLowerCase(), _tokenId]);
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
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('mint(address,uint256)', [_to.toLowerCase(), _tokenId]);
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
                const abiEncoder = self._lookupAbiEncoder('mint(address,uint256)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('mint(address,uint256)', [
                    _to.toLowerCase(),
                    _tokenId,
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    public name(): ContractFunctionObj<string> {
        const self = (this as any) as DummyERC721TokenContract;

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
    public owner(): ContractFunctionObj<string> {
        const self = (this as any) as DummyERC721TokenContract;

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
                const encodedData = self._strictEncodeArguments('owner()', []);
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
                const abiEncoder = self._lookupAbiEncoder('owner()');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('owner()', []);
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * NFTs assigned to zero address are considered invalid, and queries
     * about them do throw.
     * @param _tokenId The identifier for an NFT
     * @returns The address of the owner of the NFT
     */
    public ownerOf(_tokenId: BigNumber): ContractFunctionObj<string> {
        const self = (this as any) as DummyERC721TokenContract;
        assert.isBigNumber('_tokenId', _tokenId);

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
                const encodedData = self._strictEncodeArguments('ownerOf(uint256)', [_tokenId]);
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
                const abiEncoder = self._lookupAbiEncoder('ownerOf(uint256)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('ownerOf(uint256)', [_tokenId]);
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * This works identically to the other function with an extra data parameter,
     * except this function just sets data to "".
     * @param _from The current owner of the NFT
     * @param _to The new owner
     * @param _tokenId The NFT to transfer
     */
    public safeTransferFrom1(_from: string, _to: string, _tokenId: BigNumber): ContractTxFunctionObj<void> {
        const self = (this as any) as DummyERC721TokenContract;
        assert.isString('_from', _from);
        assert.isString('_to', _to);
        assert.isBigNumber('_tokenId', _tokenId);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256)', [
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _tokenId,
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
                const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256)', [
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _tokenId,
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
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256)', [
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _tokenId,
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
                const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments(
                    'safeTransferFrom(address,address,uint256)',
                    [_from.toLowerCase(), _to.toLowerCase(), _tokenId],
                );
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Throws unless `msg.sender` is the current owner, an authorized
     * operator, or the approved address for this NFT. Throws if `_from` is
     * not the current owner. Throws if `_to` is the zero address. Throws if
     * `_tokenId` is not a valid NFT. When transfer is complete, this function
     * checks if `_to` is a smart contract (code size > 0). If so, it calls
     * `onERC721Received` on `_to` and throws if the return value is not
     * `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
     * @param _from The current owner of the NFT
     * @param _to The new owner
     * @param _tokenId The NFT to transfer
     * @param _data Additional data with no specified format, sent in call to `_to`
     */
    public safeTransferFrom2(
        _from: string,
        _to: string,
        _tokenId: BigNumber,
        _data: string,
    ): ContractTxFunctionObj<void> {
        const self = (this as any) as DummyERC721TokenContract;
        assert.isString('_from', _from);
        assert.isString('_to', _to);
        assert.isBigNumber('_tokenId', _tokenId);
        assert.isString('_data', _data);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256,bytes)', [
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _tokenId,
                    _data,
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
                const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256,bytes)', [
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _tokenId,
                    _data,
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
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256,bytes)', [
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _tokenId,
                    _data,
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
                const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256,bytes)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments(
                    'safeTransferFrom(address,address,uint256,bytes)',
                    [_from.toLowerCase(), _to.toLowerCase(), _tokenId, _data],
                );
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Emits the ApprovalForAll event. The contract MUST allow
     * multiple operators per owner.
     * @param _operator Address to add to the set of authorized operators
     * @param _approved True if the operator is approved, false to revoke approval
     */
    public setApprovalForAll(_operator: string, _approved: boolean): ContractTxFunctionObj<void> {
        const self = (this as any) as DummyERC721TokenContract;
        assert.isString('_operator', _operator);
        assert.isBoolean('_approved', _approved);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('setApprovalForAll(address,bool)', [
                    _operator.toLowerCase(),
                    _approved,
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
                const encodedData = self._strictEncodeArguments('setApprovalForAll(address,bool)', [
                    _operator.toLowerCase(),
                    _approved,
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
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('setApprovalForAll(address,bool)', [
                    _operator.toLowerCase(),
                    _approved,
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
                const abiEncoder = self._lookupAbiEncoder('setApprovalForAll(address,bool)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('setApprovalForAll(address,bool)', [
                    _operator.toLowerCase(),
                    _approved,
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    public symbol(): ContractFunctionObj<string> {
        const self = (this as any) as DummyERC721TokenContract;

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
    /**
     * Throws unless `msg.sender` is the current owner, an authorized
     * operator, or the approved address for this NFT. Throws if `_from` is
     * not the current owner. Throws if `_to` is the zero address. Throws if
     * `_tokenId` is not a valid NFT.
     * @param _from The current owner of the NFT
     * @param _to The new owner
     * @param _tokenId The NFT to transfer
     */
    public transferFrom(_from: string, _to: string, _tokenId: BigNumber): ContractTxFunctionObj<void> {
        const self = (this as any) as DummyERC721TokenContract;
        assert.isString('_from', _from);
        assert.isString('_to', _to);
        assert.isBigNumber('_tokenId', _tokenId);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('transferFrom(address,address,uint256)', [
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _tokenId,
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
                    _tokenId,
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
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
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
                    _tokenId,
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
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('transferFrom(address,address,uint256)', [
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _tokenId,
                ]);
                return abiEncodedTransactionData;
            },
        };
    }
    public transferOwnership(newOwner: string): ContractTxFunctionObj<void> {
        const self = (this as any) as DummyERC721TokenContract;
        assert.isString('newOwner', newOwner);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
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
                const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
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
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
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
                const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('transferOwnership(address)', [
                    newOwner.toLowerCase(),
                ]);
                return abiEncodedTransactionData;
            },
        };
    }

    /**
     * Subscribe to an event type emitted by the DummyERC721Token contract.
     * @param eventName The DummyERC721Token contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends DummyERC721TokenEventArgs>(
        eventName: DummyERC721TokenEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, DummyERC721TokenEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            DummyERC721TokenContract.ABI(),
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
     * @param eventName The DummyERC721Token contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends DummyERC721TokenEventArgs>(
        eventName: DummyERC721TokenEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, DummyERC721TokenEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            DummyERC721TokenContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = DummyERC721TokenContract.deployedBytecode,
    ) {
        super(
            'DummyERC721Token',
            DummyERC721TokenContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<DummyERC721TokenEventArgs, DummyERC721TokenEvents>(
            DummyERC721TokenContract.ABI(),
            this._web3Wrapper,
        );
        DummyERC721TokenContract.ABI().forEach((item, index) => {
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
