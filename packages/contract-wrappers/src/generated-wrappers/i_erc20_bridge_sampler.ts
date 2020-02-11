// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma enum-naming
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import {
    AwaitTransactionSuccessOpts,
    ContractFunctionObj,
    ContractTxFunctionObj,
    SendTransactionOpts,
    BaseContract,
    PromiseWithTransactionHash,
    methodAbiToFunctionSignature,
    linkLibrariesInBytecode,
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
    MethodAbi,
    TransactionReceiptWithDecodedLogs,
    TxData,
    TxDataPayable,
    SupportedProvider,
} from 'ethereum-types';
import { BigNumber, classUtils, hexUtils, logUtils, providerUtils } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

/* istanbul ignore next */
// tslint:disable:array-type
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class IERC20BridgeSamplerContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode: string | undefined;
    public static contractName = 'IERC20BridgeSampler';
    private readonly _methodABIIndex: { [name: string]: number } = {};
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<IERC20BridgeSamplerContract> {
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
        return IERC20BridgeSamplerContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
        );
    }

    public static async deployWithLibrariesFrom0xArtifactAsync(
        artifact: ContractArtifact,
        libraryArtifacts: { [libraryName: string]: ContractArtifact },
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<IERC20BridgeSamplerContract> {
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        if (artifact.compilerOutput === undefined) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const abi = artifact.compilerOutput.abi;
        const logDecodeDependenciesAbiOnly: { [contractName: string]: ContractAbi } = {};
        if (Object.keys(logDecodeDependencies) !== undefined) {
            for (const key of Object.keys(logDecodeDependencies)) {
                logDecodeDependenciesAbiOnly[key] = logDecodeDependencies[key].compilerOutput.abi;
            }
        }
        const libraryAddresses = await IERC20BridgeSamplerContract._deployLibrariesAsync(
            artifact,
            libraryArtifacts,
            new Web3Wrapper(provider),
            txDefaults,
        );
        const bytecode = linkLibrariesInBytecode(artifact, libraryAddresses);
        return IERC20BridgeSamplerContract.deployAsync(
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
    ): Promise<IERC20BridgeSamplerContract> {
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
        logUtils.log(`IERC20BridgeSampler successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new IERC20BridgeSamplerContract(
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
                inputs: [
                    {
                        name: 'callDatas',
                        type: 'bytes[]',
                    },
                ],
                name: 'batchCall',
                outputs: [
                    {
                        name: 'callResults',
                        type: 'bytes[]',
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
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'orderSignatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'getOrderFillableMakerAssetAmounts',
                outputs: [
                    {
                        name: 'orderFillableMakerAssetAmounts',
                        type: 'uint256[]',
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
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'orderSignatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'getOrderFillableTakerAssetAmounts',
                outputs: [
                    {
                        name: 'orderFillableTakerAssetAmounts',
                        type: 'uint256[]',
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
                        name: 'takerToken',
                        type: 'address',
                    },
                    {
                        name: 'makerToken',
                        type: 'address',
                    },
                    {
                        name: 'makerTokenAmounts',
                        type: 'uint256[]',
                    },
                ],
                name: 'sampleBuysFromEth2Dai',
                outputs: [
                    {
                        name: 'takerTokenAmounts',
                        type: 'uint256[]',
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
                        name: 'takerToken',
                        type: 'address',
                    },
                    {
                        name: 'makerToken',
                        type: 'address',
                    },
                    {
                        name: 'makerTokenAmounts',
                        type: 'uint256[]',
                    },
                ],
                name: 'sampleBuysFromUniswap',
                outputs: [
                    {
                        name: 'takerTokenAmounts',
                        type: 'uint256[]',
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
                        name: 'takerToken',
                        type: 'address',
                    },
                    {
                        name: 'makerToken',
                        type: 'address',
                    },
                    {
                        name: 'takerTokenAmounts',
                        type: 'uint256[]',
                    },
                ],
                name: 'sampleSellsFromEth2Dai',
                outputs: [
                    {
                        name: 'makerTokenAmounts',
                        type: 'uint256[]',
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
                        name: 'takerToken',
                        type: 'address',
                    },
                    {
                        name: 'makerToken',
                        type: 'address',
                    },
                    {
                        name: 'takerTokenAmounts',
                        type: 'uint256[]',
                    },
                ],
                name: 'sampleSellsFromKyberNetwork',
                outputs: [
                    {
                        name: 'makerTokenAmounts',
                        type: 'uint256[]',
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
                        name: 'takerToken',
                        type: 'address',
                    },
                    {
                        name: 'makerToken',
                        type: 'address',
                    },
                    {
                        name: 'takerTokenAmounts',
                        type: 'uint256[]',
                    },
                ],
                name: 'sampleSellsFromUniswap',
                outputs: [
                    {
                        name: 'makerTokenAmounts',
                        type: 'uint256[]',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
        ] as ContractAbi;
        return abi;
    }

    protected static async _deployLibrariesAsync(
        artifact: ContractArtifact,
        libraryArtifacts: { [libraryName: string]: ContractArtifact },
        web3Wrapper: Web3Wrapper,
        txDefaults: Partial<TxData>,
        libraryAddresses: { [libraryName: string]: string } = {},
    ): Promise<{ [libraryName: string]: string }> {
        const links = artifact.compilerOutput.evm.bytecode.linkReferences;
        // Go through all linked libraries, recursively deploying them if necessary.
        for (const link of Object.values(links)) {
            for (const libraryName of Object.keys(link)) {
                if (!libraryAddresses[libraryName]) {
                    // Library not yet deployed.
                    const libraryArtifact = libraryArtifacts[libraryName];
                    if (!libraryArtifact) {
                        throw new Error(`Missing artifact for linked library "${libraryName}"`);
                    }
                    // Deploy any dependent libraries used by this library.
                    await IERC20BridgeSamplerContract._deployLibrariesAsync(
                        libraryArtifact,
                        libraryArtifacts,
                        web3Wrapper,
                        txDefaults,
                        libraryAddresses,
                    );
                    // Deploy this library.
                    const linkedLibraryBytecode = linkLibrariesInBytecode(libraryArtifact, libraryAddresses);
                    const txDataWithDefaults = await BaseContract._applyDefaultsToContractTxDataAsync(
                        {
                            data: linkedLibraryBytecode,
                            ...txDefaults,
                        },
                        web3Wrapper.estimateGasAsync.bind(web3Wrapper),
                    );
                    const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
                    logUtils.log(`transactionHash: ${txHash}`);
                    const { contractAddress } = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
                    logUtils.log(`${libraryArtifact.contractName} successfully deployed at ${contractAddress}`);
                    libraryAddresses[libraryArtifact.contractName] = contractAddress as string;
                }
            }
        }
        return libraryAddresses;
    }

    public getFunctionSignature(methodName: string): string {
        const index = this._methodABIIndex[methodName];
        const methodAbi = IERC20BridgeSamplerContract.ABI()[index] as MethodAbi; // tslint:disable-line:no-unnecessary-type-assertion
        const functionSignature = methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }

    public getABIDecodedTransactionData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as IERC20BridgeSamplerContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode<T>(callData);
        return abiDecodedCallData;
    }

    public getABIDecodedReturnData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as IERC20BridgeSamplerContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue<T>(callData);
        return abiDecodedCallData;
    }

    public getSelector(methodName: string): string {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as IERC20BridgeSamplerContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }

    /**
     * Call multiple public functions on this contract in a single transaction.
     * @param callDatas ABI-encoded call data for each function call.
     * @returns callResults ABI-encoded results data for each call.
     */
    public batchCall(callDatas: string[]): ContractFunctionObj<string[]> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isArray('callDatas', callDatas);
        const functionSignature = 'batchCall(bytes[])';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string[]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<string[]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [callDatas]);
            },
        };
    }
    /**
     * Queries the fillable maker asset amounts of native orders.
     * @param orders Native orders to query.
     * @param orderSignatures Signatures for each respective order in `orders`.
     * @returns orderFillableMakerAssetAmounts How much maker asset can be filled         by each order in &#x60;orders&#x60;.
     */
    public getOrderFillableMakerAssetAmounts(
        orders: Array<{
            makerAddress: string;
            takerAddress: string;
            feeRecipientAddress: string;
            senderAddress: string;
            makerAssetAmount: BigNumber;
            takerAssetAmount: BigNumber;
            makerFee: BigNumber;
            takerFee: BigNumber;
            expirationTimeSeconds: BigNumber;
            salt: BigNumber;
            makerAssetData: string;
            takerAssetData: string;
            makerFeeAssetData: string;
            takerFeeAssetData: string;
        }>,
        orderSignatures: string[],
    ): ContractFunctionObj<BigNumber[]> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isArray('orders', orders);
        assert.isArray('orderSignatures', orderSignatures);
        const functionSignature =
            'getOrderFillableMakerAssetAmounts((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[])';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber[]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [orders, orderSignatures]);
            },
        };
    }
    /**
     * Queries the fillable taker asset amounts of native orders.
     * @param orders Native orders to query.
     * @param orderSignatures Signatures for each respective order in `orders`.
     * @returns orderFillableTakerAssetAmounts How much taker asset can be filled         by each order in &#x60;orders&#x60;.
     */
    public getOrderFillableTakerAssetAmounts(
        orders: Array<{
            makerAddress: string;
            takerAddress: string;
            feeRecipientAddress: string;
            senderAddress: string;
            makerAssetAmount: BigNumber;
            takerAssetAmount: BigNumber;
            makerFee: BigNumber;
            takerFee: BigNumber;
            expirationTimeSeconds: BigNumber;
            salt: BigNumber;
            makerAssetData: string;
            takerAssetData: string;
            makerFeeAssetData: string;
            takerFeeAssetData: string;
        }>,
        orderSignatures: string[],
    ): ContractFunctionObj<BigNumber[]> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isArray('orders', orders);
        assert.isArray('orderSignatures', orderSignatures);
        const functionSignature =
            'getOrderFillableTakerAssetAmounts((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[])';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber[]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [orders, orderSignatures]);
            },
        };
    }
    /**
     * Sample buy quotes from Eth2Dai/Oasis.
     * @param takerToken Address of the taker token (what to sell).
     * @param makerToken Address of the maker token (what to buy).
     * @returns takerTokenAmounts Taker amounts sold at each maker token         amount.
     */
    public sampleBuysFromEth2Dai(
        takerToken: string,
        makerToken: string,
        makerTokenAmounts: BigNumber[],
    ): ContractFunctionObj<BigNumber[]> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isString('takerToken', takerToken);
        assert.isString('makerToken', makerToken);
        assert.isArray('makerTokenAmounts', makerTokenAmounts);
        const functionSignature = 'sampleBuysFromEth2Dai(address,address,uint256[])';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber[]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    takerToken.toLowerCase(),
                    makerToken.toLowerCase(),
                    makerTokenAmounts,
                ]);
            },
        };
    }
    /**
     * Sample buy quotes from Uniswap.
     * @param takerToken Address of the taker token (what to sell).
     * @param makerToken Address of the maker token (what to buy).
     * @param makerTokenAmounts Maker token sell amount for each sample.
     * @returns takerTokenAmounts Taker amounts sold at each maker token         amount.
     */
    public sampleBuysFromUniswap(
        takerToken: string,
        makerToken: string,
        makerTokenAmounts: BigNumber[],
    ): ContractFunctionObj<BigNumber[]> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isString('takerToken', takerToken);
        assert.isString('makerToken', makerToken);
        assert.isArray('makerTokenAmounts', makerTokenAmounts);
        const functionSignature = 'sampleBuysFromUniswap(address,address,uint256[])';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber[]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    takerToken.toLowerCase(),
                    makerToken.toLowerCase(),
                    makerTokenAmounts,
                ]);
            },
        };
    }
    /**
     * Sample sell quotes from Eth2Dai/Oasis.
     * @param takerToken Address of the taker token (what to sell).
     * @param makerToken Address of the maker token (what to buy).
     * @param takerTokenAmounts Taker token sell amount for each sample.
     * @returns makerTokenAmounts Maker amounts bought at each taker token         amount.
     */
    public sampleSellsFromEth2Dai(
        takerToken: string,
        makerToken: string,
        takerTokenAmounts: BigNumber[],
    ): ContractFunctionObj<BigNumber[]> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isString('takerToken', takerToken);
        assert.isString('makerToken', makerToken);
        assert.isArray('takerTokenAmounts', takerTokenAmounts);
        const functionSignature = 'sampleSellsFromEth2Dai(address,address,uint256[])';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber[]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    takerToken.toLowerCase(),
                    makerToken.toLowerCase(),
                    takerTokenAmounts,
                ]);
            },
        };
    }
    /**
     * Sample sell quotes from Kyber.
     * @param takerToken Address of the taker token (what to sell).
     * @param makerToken Address of the maker token (what to buy).
     * @param takerTokenAmounts Taker token sell amount for each sample.
     * @returns makerTokenAmounts Maker amounts bought at each taker token         amount.
     */
    public sampleSellsFromKyberNetwork(
        takerToken: string,
        makerToken: string,
        takerTokenAmounts: BigNumber[],
    ): ContractFunctionObj<BigNumber[]> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isString('takerToken', takerToken);
        assert.isString('makerToken', makerToken);
        assert.isArray('takerTokenAmounts', takerTokenAmounts);
        const functionSignature = 'sampleSellsFromKyberNetwork(address,address,uint256[])';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber[]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    takerToken.toLowerCase(),
                    makerToken.toLowerCase(),
                    takerTokenAmounts,
                ]);
            },
        };
    }
    /**
     * Sample sell quotes from Uniswap.
     * @param takerToken Address of the taker token (what to sell).
     * @param makerToken Address of the maker token (what to buy).
     * @param takerTokenAmounts Taker token sell amount for each sample.
     * @returns makerTokenAmounts Maker amounts bought at each taker token         amount.
     */
    public sampleSellsFromUniswap(
        takerToken: string,
        makerToken: string,
        takerTokenAmounts: BigNumber[],
    ): ContractFunctionObj<BigNumber[]> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isString('takerToken', takerToken);
        assert.isString('makerToken', makerToken);
        assert.isArray('takerTokenAmounts', takerTokenAmounts);
        const functionSignature = 'sampleSellsFromUniswap(address,address,uint256[])';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber[]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                BaseContract._throwIfUnexpectedEmptyCallResult(rawCallResult, abiEncoder);
                return abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    takerToken.toLowerCase(),
                    makerToken.toLowerCase(),
                    takerTokenAmounts,
                ]);
            },
        };
    }

    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = IERC20BridgeSamplerContract.deployedBytecode,
    ) {
        super(
            'IERC20BridgeSampler',
            IERC20BridgeSamplerContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        IERC20BridgeSamplerContract.ABI().forEach((item, index) => {
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
