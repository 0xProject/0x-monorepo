// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import {
    BaseContract,
    EventCallback,
    IndexedFilterValues,
    SubscriptionManager,
    PromiseWithTransactionHash,
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
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

export type CoordinatorRegistryEventArgs = CoordinatorRegistryCoordinatorEndpointSetEventArgs;

export enum CoordinatorRegistryEvents {
    CoordinatorEndpointSet = 'CoordinatorEndpointSet',
}

export interface CoordinatorRegistryCoordinatorEndpointSetEventArgs extends DecodedLogArgs {
    coordinatorOperator: string;
    coordinatorEndpoint: string;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class CoordinatorRegistryContract extends BaseContract {
    /**
     * Called by a Coordinator operator to set the endpoint of their Coordinator.
     */
    public setCoordinatorEndpoint = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param coordinatorEndpoint endpoint of the Coordinator.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(coordinatorEndpoint: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('coordinatorEndpoint', coordinatorEndpoint);
            const self = (this as any) as CoordinatorRegistryContract;
            const encodedData = self._strictEncodeArguments('setCoordinatorEndpoint(string)', [coordinatorEndpoint]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.setCoordinatorEndpoint.estimateGasAsync.bind(self, coordinatorEndpoint),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param coordinatorEndpoint endpoint of the Coordinator.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            coordinatorEndpoint: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('coordinatorEndpoint', coordinatorEndpoint);
            const self = (this as any) as CoordinatorRegistryContract;
            const txHashPromise = self.setCoordinatorEndpoint.sendTransactionAsync(coordinatorEndpoint, txData);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param coordinatorEndpoint endpoint of the Coordinator.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(coordinatorEndpoint: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('coordinatorEndpoint', coordinatorEndpoint);
            const self = (this as any) as CoordinatorRegistryContract;
            const encodedData = self._strictEncodeArguments('setCoordinatorEndpoint(string)', [coordinatorEndpoint]);
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param coordinatorEndpoint endpoint of the Coordinator.
         */
        async callAsync(
            coordinatorEndpoint: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('coordinatorEndpoint', coordinatorEndpoint);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as CoordinatorRegistryContract;
            const encodedData = self._strictEncodeArguments('setCoordinatorEndpoint(string)', [coordinatorEndpoint]);
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('setCoordinatorEndpoint(string)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param coordinatorEndpoint endpoint of the Coordinator.
         */
        getABIEncodedTransactionData(coordinatorEndpoint: string): string {
            assert.isString('coordinatorEndpoint', coordinatorEndpoint);
            const self = (this as any) as CoordinatorRegistryContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('setCoordinatorEndpoint(string)', [
                coordinatorEndpoint,
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as CoordinatorRegistryContract;
            const abiEncoder = self._lookupAbiEncoder('setCoordinatorEndpoint(string)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as CoordinatorRegistryContract;
            const abiEncoder = self._lookupAbiEncoder('setCoordinatorEndpoint(string)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
            coordinatorEndpoint: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).setCoordinatorEndpoint.callAsync(coordinatorEndpoint, txData);
            const txHash = await (this as any).setCoordinatorEndpoint.sendTransactionAsync(coordinatorEndpoint, txData);
            return txHash;
        },
    };
    /**
     * Gets the endpoint for a Coordinator.
     */
    public getCoordinatorEndpoint = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param coordinatorOperator operator of the Coordinator endpoint.
         */
        async callAsync(
            coordinatorOperator: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            assert.isString('coordinatorOperator', coordinatorOperator);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as CoordinatorRegistryContract;
            const encodedData = self._strictEncodeArguments('getCoordinatorEndpoint(address)', [
                coordinatorOperator.toLowerCase(),
            ]);
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getCoordinatorEndpoint(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param coordinatorOperator operator of the Coordinator endpoint.
         */
        getABIEncodedTransactionData(coordinatorOperator: string): string {
            assert.isString('coordinatorOperator', coordinatorOperator);
            const self = (this as any) as CoordinatorRegistryContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getCoordinatorEndpoint(address)', [
                coordinatorOperator.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as CoordinatorRegistryContract;
            const abiEncoder = self._lookupAbiEncoder('getCoordinatorEndpoint(address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as CoordinatorRegistryContract;
            const abiEncoder = self._lookupAbiEncoder('getCoordinatorEndpoint(address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    private readonly _subscriptionManager: SubscriptionManager<CoordinatorRegistryEventArgs, CoordinatorRegistryEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<CoordinatorRegistryContract> {
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
        return CoordinatorRegistryContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
    ): Promise<CoordinatorRegistryContract> {
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
        logUtils.log(`CoordinatorRegistry successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new CoordinatorRegistryContract(
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
                constant: false,
                inputs: [
                    {
                        name: 'coordinatorEndpoint',
                        type: 'string',
                    },
                ],
                name: 'setCoordinatorEndpoint',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'coordinatorOperator',
                        type: 'address',
                    },
                ],
                name: 'getCoordinatorEndpoint',
                outputs: [
                    {
                        name: 'coordinatorEndpoint',
                        type: 'string',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                inputs: [],
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'coordinatorOperator',
                        type: 'address',
                        indexed: false,
                    },
                    {
                        name: 'coordinatorEndpoint',
                        type: 'string',
                        indexed: false,
                    },
                ],
                name: 'CoordinatorEndpointSet',
                outputs: [],
                type: 'event',
            },
        ] as ContractAbi;
        return abi;
    }
    /**
     * Subscribe to an event type emitted by the CoordinatorRegistry contract.
     * @param eventName The CoordinatorRegistry contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends CoordinatorRegistryEventArgs>(
        eventName: CoordinatorRegistryEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, CoordinatorRegistryEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            CoordinatorRegistryContract.ABI(),
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
     * @param eventName The CoordinatorRegistry contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends CoordinatorRegistryEventArgs>(
        eventName: CoordinatorRegistryEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, CoordinatorRegistryEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            CoordinatorRegistryContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
    ) {
        super(
            'CoordinatorRegistry',
            CoordinatorRegistryContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<CoordinatorRegistryEventArgs, CoordinatorRegistryEvents>(
            CoordinatorRegistryContract.ABI(),
            this._web3Wrapper,
        );
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
