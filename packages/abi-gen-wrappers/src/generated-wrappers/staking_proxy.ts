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

export type StakingProxyEventArgs =
    | StakingProxyAuthorizedAddressAddedEventArgs
    | StakingProxyAuthorizedAddressRemovedEventArgs
    | StakingProxyOwnershipTransferredEventArgs
    | StakingProxyStakingContractAttachedToProxyEventArgs
    | StakingProxyStakingContractDetachedFromProxyEventArgs;

export enum StakingProxyEvents {
    AuthorizedAddressAdded = 'AuthorizedAddressAdded',
    AuthorizedAddressRemoved = 'AuthorizedAddressRemoved',
    OwnershipTransferred = 'OwnershipTransferred',
    StakingContractAttachedToProxy = 'StakingContractAttachedToProxy',
    StakingContractDetachedFromProxy = 'StakingContractDetachedFromProxy',
}

export interface StakingProxyAuthorizedAddressAddedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}

export interface StakingProxyAuthorizedAddressRemovedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}

export interface StakingProxyOwnershipTransferredEventArgs extends DecodedLogArgs {
    previousOwner: string;
    newOwner: string;
}

export interface StakingProxyStakingContractAttachedToProxyEventArgs extends DecodedLogArgs {
    newStakingContractAddress: string;
}

export interface StakingProxyStakingContractDetachedFromProxyEventArgs extends DecodedLogArgs {}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class StakingProxyContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode: string | undefined;
    private readonly _methodABIIndex: { [name: string]: number } = {};
    private readonly _subscriptionManager: SubscriptionManager<StakingProxyEventArgs, StakingProxyEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
        _stakingContract: string,
    ): Promise<StakingProxyContract> {
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
        return StakingProxyContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
            _stakingContract,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
        _stakingContract: string,
    ): Promise<StakingProxyContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_stakingContract] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_stakingContract],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_stakingContract]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToContractTxDataAsync(
            {
                data: txData,
                ...txDefaults,
            },
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`StakingProxy successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new StakingProxyContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [_stakingContract];
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
                        name: '_stakingContract',
                        type: 'address',
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
                        name: 'target',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'caller',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'AuthorizedAddressAdded',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'caller',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'AuthorizedAddressRemoved',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'previousOwner',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'newOwner',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'OwnershipTransferred',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'newStakingContractAddress',
                        type: 'address',
                        indexed: false,
                    },
                ],
                name: 'StakingContractAttachedToProxy',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [],
                name: 'StakingContractDetachedFromProxy',
                outputs: [],
                type: 'event',
            },
            {
                inputs: [],
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'fallback',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                    },
                ],
                name: 'addAuthorizedAddress',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'uint256',
                    },
                ],
                name: 'aggregatedStatsByEpoch',
                outputs: [
                    {
                        name: 'rewardsAvailable',
                        type: 'uint256',
                    },
                    {
                        name: 'numPoolsToFinalize',
                        type: 'uint256',
                    },
                    {
                        name: 'totalFeesCollected',
                        type: 'uint256',
                    },
                    {
                        name: 'totalWeightedStake',
                        type: 'uint256',
                    },
                    {
                        name: 'totalRewardsFinalized',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'assertValidStorageParams',
                outputs: [],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_stakingContract',
                        type: 'address',
                    },
                ],
                name: 'attachStakingContract',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'uint256',
                    },
                ],
                name: 'authorities',
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
                        name: 'index_0',
                        type: 'address',
                    },
                ],
                name: 'authorized',
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
                        name: 'data',
                        type: 'bytes[]',
                    },
                ],
                name: 'batchExecute',
                outputs: [
                    {
                        name: 'batchReturnData',
                        type: 'bytes[]',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'cobbDouglasAlphaDenominator',
                outputs: [
                    {
                        name: '',
                        type: 'uint32',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'cobbDouglasAlphaNumerator',
                outputs: [
                    {
                        name: '',
                        type: 'uint32',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'currentEpoch',
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
                constant: true,
                inputs: [],
                name: 'currentEpochStartTimeInSeconds',
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
                inputs: [],
                name: 'detachStakingContract',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'epochDurationInSeconds',
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
                constant: true,
                inputs: [],
                name: 'getAuthorizedAddresses',
                outputs: [
                    {
                        name: '',
                        type: 'address[]',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'lastPoolId',
                outputs: [
                    {
                        name: '',
                        type: 'bytes32',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'minimumPoolStake',
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
                        name: 'index_0',
                        type: 'address',
                    },
                ],
                name: 'poolIdByMaker',
                outputs: [
                    {
                        name: '',
                        type: 'bytes32',
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
                        name: 'index_0',
                        type: 'bytes32',
                    },
                    {
                        name: 'index_1',
                        type: 'uint256',
                    },
                ],
                name: 'poolStatsByEpoch',
                outputs: [
                    {
                        name: 'feesCollected',
                        type: 'uint256',
                    },
                    {
                        name: 'weightedStake',
                        type: 'uint256',
                    },
                    {
                        name: 'membersStake',
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
                        name: 'target',
                        type: 'address',
                    },
                ],
                name: 'removeAuthorizedAddress',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                    },
                    {
                        name: 'index',
                        type: 'uint256',
                    },
                ],
                name: 'removeAuthorizedAddressAtIndex',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'rewardDelegatedStakeWeight',
                outputs: [
                    {
                        name: '',
                        type: 'uint32',
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
                        name: 'index_0',
                        type: 'bytes32',
                    },
                ],
                name: 'rewardsByPoolId',
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
                constant: true,
                inputs: [],
                name: 'stakingContract',
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
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'address',
                    },
                ],
                name: 'validExchanges',
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
                constant: true,
                inputs: [],
                name: 'wethReservedForPoolRewards',
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
        ] as ContractAbi;
        return abi;
    }

    public getFunctionSignature(methodName: string): string {
        const index = this._methodABIIndex[methodName];
        const methodAbi = StakingProxyContract.ABI()[index] as MethodAbi; // tslint:disable-line:no-unnecessary-type-assertion
        const functionSignature = methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }
    public getABIDecodedTransactionData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as StakingProxyContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode<T>(callData);
        return abiDecodedCallData;
    }
    public getABIDecodedReturnData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as StakingProxyContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue<T>(callData);
        return abiDecodedCallData;
    }
    public getSelector(methodName: string): string {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as StakingProxyContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }

    /**
     * Authorizes an address.
     * @param target Address to authorize.
     */
    public addAuthorizedAddress(target: string): ContractTxFunctionObj<void> {
        const self = (this as any) as StakingProxyContract;
        assert.isString('target', target);
        const functionSignature = 'addAuthorizedAddress(address)';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments(functionSignature, [target.toLowerCase()]);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: encodedData },
                    this.estimateGasAsync.bind(this),
                );
                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }
                return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments(functionSignature, [target.toLowerCase()]);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({ ...txData, data: encodedData });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [target.toLowerCase()]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [target.toLowerCase()]);
            },
        };
    }
    public aggregatedStatsByEpoch(
        index_0: BigNumber,
    ): ContractFunctionObj<[BigNumber, BigNumber, BigNumber, BigNumber, BigNumber]> {
        const self = (this as any) as StakingProxyContract;
        assert.isBigNumber('index_0', index_0);
        const functionSignature = 'aggregatedStatsByEpoch(uint256)';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<[BigNumber, BigNumber, BigNumber, BigNumber, BigNumber]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [index_0]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber, BigNumber, BigNumber, BigNumber]>(
                    rawCallResult,
                );
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [index_0]);
            },
        };
    }
    /**
     * Asserts that an epoch is between 5 and 30 days long.
     */
    public assertValidStorageParams(): ContractFunctionObj<void> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'assertValidStorageParams()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    /**
     * Attach a staking contract; future calls will be delegated to the staking contract. Note that this is callable only by an authorized address.
     * @param _stakingContract Address of staking contract.
     */
    public attachStakingContract(_stakingContract: string): ContractTxFunctionObj<void> {
        const self = (this as any) as StakingProxyContract;
        assert.isString('_stakingContract', _stakingContract);
        const functionSignature = 'attachStakingContract(address)';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments(functionSignature, [_stakingContract.toLowerCase()]);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: encodedData },
                    this.estimateGasAsync.bind(this),
                );
                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }
                return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments(functionSignature, [_stakingContract.toLowerCase()]);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({ ...txData, data: encodedData });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [_stakingContract.toLowerCase()]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [_stakingContract.toLowerCase()]);
            },
        };
    }
    public authorities(index_0: BigNumber): ContractFunctionObj<string> {
        const self = (this as any) as StakingProxyContract;
        assert.isBigNumber('index_0', index_0);
        const functionSignature = 'authorities(uint256)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [index_0]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [index_0]);
            },
        };
    }
    public authorized(index_0: string): ContractFunctionObj<boolean> {
        const self = (this as any) as StakingProxyContract;
        assert.isString('index_0', index_0);
        const functionSignature = 'authorized(address)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<boolean> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [index_0.toLowerCase()]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [index_0.toLowerCase()]);
            },
        };
    }
    /**
     * Batch executes a series of calls to the staking contract.
     * @param data An array of data that encodes a sequence of functions to
     *         call in the staking contracts.
     */
    public batchExecute(data: string[]): ContractTxFunctionObj<string[]> {
        const self = (this as any) as StakingProxyContract;
        assert.isArray('data', data);
        const functionSignature = 'batchExecute(bytes[])';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments(functionSignature, [data]);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: encodedData },
                    this.estimateGasAsync.bind(this),
                );
                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }
                return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments(functionSignature, [data]);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({ ...txData, data: encodedData });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string[]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [data]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<string[]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [data]);
            },
        };
    }
    public cobbDouglasAlphaDenominator(): ContractFunctionObj<number> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'cobbDouglasAlphaDenominator()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<number> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<number>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public cobbDouglasAlphaNumerator(): ContractFunctionObj<number> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'cobbDouglasAlphaNumerator()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<number> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<number>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public currentEpoch(): ContractFunctionObj<BigNumber> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'currentEpoch()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public currentEpochStartTimeInSeconds(): ContractFunctionObj<BigNumber> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'currentEpochStartTimeInSeconds()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    /**
     * Detach the current staking contract. Note that this is callable only by an authorized address.
     */
    public detachStakingContract(): ContractTxFunctionObj<void> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'detachStakingContract()';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: encodedData },
                    this.estimateGasAsync.bind(this),
                );
                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }
                return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({ ...txData, data: encodedData });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public epochDurationInSeconds(): ContractFunctionObj<BigNumber> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'epochDurationInSeconds()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    /**
     * Gets all authorized addresses.
     * @returns Array of authorized addresses.
     */
    public getAuthorizedAddresses(): ContractFunctionObj<string[]> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'getAuthorizedAddresses()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string[]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<string[]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public lastPoolId(): ContractFunctionObj<string> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'lastPoolId()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public minimumPoolStake(): ContractFunctionObj<BigNumber> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'minimumPoolStake()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public owner(): ContractFunctionObj<string> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'owner()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public poolIdByMaker(index_0: string): ContractFunctionObj<string> {
        const self = (this as any) as StakingProxyContract;
        assert.isString('index_0', index_0);
        const functionSignature = 'poolIdByMaker(address)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [index_0.toLowerCase()]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [index_0.toLowerCase()]);
            },
        };
    }
    public poolStatsByEpoch(
        index_0: string,
        index_1: BigNumber,
    ): ContractFunctionObj<[BigNumber, BigNumber, BigNumber]> {
        const self = (this as any) as StakingProxyContract;
        assert.isString('index_0', index_0);
        assert.isBigNumber('index_1', index_1);
        const functionSignature = 'poolStatsByEpoch(bytes32,uint256)';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<[BigNumber, BigNumber, BigNumber]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [index_0, index_1]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber, BigNumber]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [index_0, index_1]);
            },
        };
    }
    /**
     * Removes authorizion of an address.
     * @param target Address to remove authorization from.
     */
    public removeAuthorizedAddress(target: string): ContractTxFunctionObj<void> {
        const self = (this as any) as StakingProxyContract;
        assert.isString('target', target);
        const functionSignature = 'removeAuthorizedAddress(address)';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments(functionSignature, [target.toLowerCase()]);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: encodedData },
                    this.estimateGasAsync.bind(this),
                );
                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }
                return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments(functionSignature, [target.toLowerCase()]);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({ ...txData, data: encodedData });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [target.toLowerCase()]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [target.toLowerCase()]);
            },
        };
    }
    /**
     * Removes authorizion of an address.
     * @param target Address to remove authorization from.
     * @param index Index of target in authorities array.
     */
    public removeAuthorizedAddressAtIndex(target: string, index: BigNumber): ContractTxFunctionObj<void> {
        const self = (this as any) as StakingProxyContract;
        assert.isString('target', target);
        assert.isBigNumber('index', index);
        const functionSignature = 'removeAuthorizedAddressAtIndex(address,uint256)';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments(functionSignature, [target.toLowerCase(), index]);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: encodedData },
                    this.estimateGasAsync.bind(this),
                );
                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }
                return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments(functionSignature, [target.toLowerCase(), index]);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({ ...txData, data: encodedData });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [target.toLowerCase(), index]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [target.toLowerCase(), index]);
            },
        };
    }
    public rewardDelegatedStakeWeight(): ContractFunctionObj<number> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'rewardDelegatedStakeWeight()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<number> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<number>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public rewardsByPoolId(index_0: string): ContractFunctionObj<BigNumber> {
        const self = (this as any) as StakingProxyContract;
        assert.isString('index_0', index_0);
        const functionSignature = 'rewardsByPoolId(bytes32)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [index_0]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [index_0]);
            },
        };
    }
    public stakingContract(): ContractFunctionObj<string> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'stakingContract()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    public transferOwnership(newOwner: string): ContractTxFunctionObj<void> {
        const self = (this as any) as StakingProxyContract;
        assert.isString('newOwner', newOwner);
        const functionSignature = 'transferOwnership(address)';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments(functionSignature, [newOwner.toLowerCase()]);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: encodedData },
                    this.estimateGasAsync.bind(this),
                );
                if (opts.shouldValidate !== false) {
                    await this.callAsync(txDataWithDefaults);
                }
                return self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            },
            awaitTransactionSuccessAsync(
                txData?: Partial<TxData>,
                opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
            ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
                return self._promiseWithTransactionHash(this.sendTransactionAsync(txData, opts), opts);
            },
            async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
                const encodedData = self._strictEncodeArguments(functionSignature, [newOwner.toLowerCase()]);
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({ ...txData, data: encodedData });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [newOwner.toLowerCase()]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [newOwner.toLowerCase()]);
            },
        };
    }
    public validExchanges(index_0: string): ContractFunctionObj<boolean> {
        const self = (this as any) as StakingProxyContract;
        assert.isString('index_0', index_0);
        const functionSignature = 'validExchanges(address)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<boolean> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, [index_0.toLowerCase()]);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [index_0.toLowerCase()]);
            },
        };
    }
    public wethReservedForPoolRewards(): ContractFunctionObj<BigNumber> {
        const self = (this as any) as StakingProxyContract;
        const functionSignature = 'wethReservedForPoolRewards()';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const encodedData = self._strictEncodeArguments(functionSignature, []);
                const rawCallResult = await self._performCallAsync({ ...callData, data: encodedData }, defaultBlock);
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }

    /**
     * Subscribe to an event type emitted by the StakingProxy contract.
     * @param eventName The StakingProxy contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends StakingProxyEventArgs>(
        eventName: StakingProxyEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, StakingProxyEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            StakingProxyContract.ABI(),
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
     * @param eventName The StakingProxy contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends StakingProxyEventArgs>(
        eventName: StakingProxyEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, StakingProxyEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            StakingProxyContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = StakingProxyContract.deployedBytecode,
    ) {
        super(
            'StakingProxy',
            StakingProxyContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<StakingProxyEventArgs, StakingProxyEvents>(
            StakingProxyContract.ABI(),
            this._web3Wrapper,
        );
        StakingProxyContract.ABI().forEach((item, index) => {
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
