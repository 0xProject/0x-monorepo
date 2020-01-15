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
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

/* istanbul ignore next */
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
                        name: 'orders',
                        type: 'tuple[][]',
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
                        type: 'bytes[][]',
                    },
                    {
                        name: 'sources',
                        type: 'address[]',
                    },
                    {
                        name: 'makerTokenAmounts',
                        type: 'uint256[][]',
                    },
                ],
                name: 'queryBatchOrdersAndSampleBuys',
                outputs: [
                    {
                        name: 'ordersAndSamples',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'orderFillableAssetAmounts',
                                type: 'uint256[]',
                            },
                            {
                                name: 'tokenAmountsBySource',
                                type: 'uint256[][]',
                            },
                        ],
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
                        type: 'tuple[][]',
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
                        type: 'bytes[][]',
                    },
                    {
                        name: 'sources',
                        type: 'address[]',
                    },
                    {
                        name: 'takerTokenAmounts',
                        type: 'uint256[][]',
                    },
                ],
                name: 'queryBatchOrdersAndSampleSells',
                outputs: [
                    {
                        name: 'ordersAndSamples',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'orderFillableAssetAmounts',
                                type: 'uint256[]',
                            },
                            {
                                name: 'tokenAmountsBySource',
                                type: 'uint256[][]',
                            },
                        ],
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
                    {
                        name: 'sources',
                        type: 'address[]',
                    },
                    {
                        name: 'makerTokenAmounts',
                        type: 'uint256[]',
                    },
                ],
                name: 'queryOrdersAndSampleBuys',
                outputs: [
                    {
                        name: 'orderFillableMakerAssetAmounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'makerTokenAmountsBySource',
                        type: 'uint256[][]',
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
                    {
                        name: 'sources',
                        type: 'address[]',
                    },
                    {
                        name: 'takerTokenAmounts',
                        type: 'uint256[]',
                    },
                ],
                name: 'queryOrdersAndSampleSells',
                outputs: [
                    {
                        name: 'orderFillableTakerAssetAmounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'makerTokenAmountsBySource',
                        type: 'uint256[][]',
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
                        name: 'sources',
                        type: 'address[]',
                    },
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
                name: 'sampleBuys',
                outputs: [
                    {
                        name: 'takerTokenAmountsBySource',
                        type: 'uint256[][]',
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
                        name: 'sources',
                        type: 'address[]',
                    },
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
                name: 'sampleSells',
                outputs: [
                    {
                        name: 'makerTokenAmountsBySource',
                        type: 'uint256[][]',
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
                return abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [orders, orderSignatures]);
            },
        };
    }
    /**
     * Query batches of native orders and sample buy quotes on multiple DEXes at once.
     * @param orders Batches of Native orders to query.
     * @param orderSignatures Batches of Signatures for each respective order in
     *     `orders`.
     * @param sources Address of each DEX. Passing in an unsupported DEX will
     *     throw.
     * @param makerTokenAmounts Batches of Maker token sell amount for each sample.
     * @returns ordersAndSamples How much taker asset can be filled         by each order in &#x60;orders&#x60;. Taker amounts sold for each source at         each maker token amount. First indexed by source index, then sample         index
     */
    public queryBatchOrdersAndSampleBuys(
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
        }>[],
        orderSignatures: string[][],
        sources: string[],
        makerTokenAmounts: BigNumber[][],
    ): ContractFunctionObj<Array<{ orderFillableAssetAmounts: BigNumber[]; tokenAmountsBySource: BigNumber[][] }>> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isArray('orders', orders);
        assert.isArray('orderSignatures', orderSignatures);
        assert.isArray('sources', sources);
        assert.isArray('makerTokenAmounts', makerTokenAmounts);
        const functionSignature =
            'queryBatchOrdersAndSampleBuys((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[][],bytes[][],address[],uint256[][])';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<Array<{ orderFillableAssetAmounts: BigNumber[]; tokenAmountsBySource: BigNumber[][] }>> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<
                    Array<{ orderFillableAssetAmounts: BigNumber[]; tokenAmountsBySource: BigNumber[][] }>
                >(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    orders,
                    orderSignatures,
                    sources,
                    makerTokenAmounts,
                ]);
            },
        };
    }
    /**
     * Query batches of native orders and sample sell quotes on multiple DEXes at once.
     * @param orders Batches of Native orders to query.
     * @param orderSignatures Batches of Signatures for each respective order in
     *     `orders`.
     * @param sources Address of each DEX. Passing in an unsupported DEX will
     *     throw.
     * @param takerTokenAmounts Batches of Taker token sell amount for each sample.
     * @returns ordersAndSamples How much taker asset can be filled         by each order in &#x60;orders&#x60;. Maker amounts bought for each source at         each taker token amount. First indexed by source index, then sample         index.
     */
    public queryBatchOrdersAndSampleSells(
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
        }>[],
        orderSignatures: string[][],
        sources: string[],
        takerTokenAmounts: BigNumber[][],
    ): ContractFunctionObj<Array<{ orderFillableAssetAmounts: BigNumber[]; tokenAmountsBySource: BigNumber[][] }>> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isArray('orders', orders);
        assert.isArray('orderSignatures', orderSignatures);
        assert.isArray('sources', sources);
        assert.isArray('takerTokenAmounts', takerTokenAmounts);
        const functionSignature =
            'queryBatchOrdersAndSampleSells((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[][],bytes[][],address[],uint256[][])';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<Array<{ orderFillableAssetAmounts: BigNumber[]; tokenAmountsBySource: BigNumber[][] }>> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<
                    Array<{ orderFillableAssetAmounts: BigNumber[]; tokenAmountsBySource: BigNumber[][] }>
                >(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    orders,
                    orderSignatures,
                    sources,
                    takerTokenAmounts,
                ]);
            },
        };
    }
    /**
     * Query native orders and sample buy quotes on multiple DEXes at once.
     * @param orders Native orders to query.
     * @param orderSignatures Signatures for each respective order in `orders`.
     * @param sources Address of each DEX. Passing in an unsupported DEX will
     *     throw.
     * @param makerTokenAmounts Maker token buy amount for each sample.
     * @returns orderFillableMakerAssetAmounts How much maker asset can be filled         by each order in &#x60;orders&#x60;.takerTokenAmountsBySource Taker amounts sold for each source at         each maker token amount. First indexed by source index, then sample         index.
     */
    public queryOrdersAndSampleBuys(
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
        sources: string[],
        makerTokenAmounts: BigNumber[],
    ): ContractFunctionObj<[BigNumber[], BigNumber[][]]> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isArray('orders', orders);
        assert.isArray('orderSignatures', orderSignatures);
        assert.isArray('sources', sources);
        assert.isArray('makerTokenAmounts', makerTokenAmounts);
        const functionSignature =
            'queryOrdersAndSampleBuys((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],address[],uint256[])';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<[BigNumber[], BigNumber[][]]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<[BigNumber[], BigNumber[][]]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    orders,
                    orderSignatures,
                    sources,
                    makerTokenAmounts,
                ]);
            },
        };
    }
    /**
     * Query native orders and sample sell quotes on multiple DEXes at once.
     * @param orders Native orders to query.
     * @param orderSignatures Signatures for each respective order in `orders`.
     * @param sources Address of each DEX. Passing in an unsupported DEX will
     *     throw.
     * @param takerTokenAmounts Taker token sell amount for each sample.
     * @returns orderFillableTakerAssetAmounts How much taker asset can be filled         by each order in &#x60;orders&#x60;.makerTokenAmountsBySource Maker amounts bought for each source at         each taker token amount. First indexed by source index, then sample         index.
     */
    public queryOrdersAndSampleSells(
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
        sources: string[],
        takerTokenAmounts: BigNumber[],
    ): ContractFunctionObj<[BigNumber[], BigNumber[][]]> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isArray('orders', orders);
        assert.isArray('orderSignatures', orderSignatures);
        assert.isArray('sources', sources);
        assert.isArray('takerTokenAmounts', takerTokenAmounts);
        const functionSignature =
            'queryOrdersAndSampleSells((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],address[],uint256[])';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<[BigNumber[], BigNumber[][]]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<[BigNumber[], BigNumber[][]]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    orders,
                    orderSignatures,
                    sources,
                    takerTokenAmounts,
                ]);
            },
        };
    }
    /**
     * Query native orders and sample buy quotes on multiple DEXes at once.
     * @param sources Address of each DEX. Passing in an unsupported DEX will
     *     throw.
     * @param takerToken Address of the taker token (what to sell).
     * @param makerToken Address of the maker token (what to buy).
     * @param makerTokenAmounts Maker token buy amount for each sample.
     * @returns takerTokenAmountsBySource Taker amounts sold for each source at         each maker token amount. First indexed by source index, then sample         index.
     */
    public sampleBuys(
        sources: string[],
        takerToken: string,
        makerToken: string,
        makerTokenAmounts: BigNumber[],
    ): ContractFunctionObj<BigNumber[][]> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isArray('sources', sources);
        assert.isString('takerToken', takerToken);
        assert.isString('makerToken', makerToken);
        assert.isArray('makerTokenAmounts', makerTokenAmounts);
        const functionSignature = 'sampleBuys(address[],address,address,uint256[])';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber[][]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber[][]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    sources,
                    takerToken.toLowerCase(),
                    makerToken.toLowerCase(),
                    makerTokenAmounts,
                ]);
            },
        };
    }
    /**
     * Sample sell quotes on multiple DEXes at once.
     * @param sources Address of each DEX. Passing in an unsupported DEX will
     *     throw.
     * @param takerToken Address of the taker token (what to sell).
     * @param makerToken Address of the maker token (what to buy).
     * @param takerTokenAmounts Taker token sell amount for each sample.
     * @returns makerTokenAmountsBySource Maker amounts bought for each source at         each taker token amount. First indexed by source index, then sample         index.
     */
    public sampleSells(
        sources: string[],
        takerToken: string,
        makerToken: string,
        takerTokenAmounts: BigNumber[],
    ): ContractFunctionObj<BigNumber[][]> {
        const self = (this as any) as IERC20BridgeSamplerContract;
        assert.isArray('sources', sources);
        assert.isString('takerToken', takerToken);
        assert.isString('makerToken', makerToken);
        assert.isArray('takerTokenAmounts', takerTokenAmounts);
        const functionSignature = 'sampleSells(address[],address,address,uint256[])';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber[][]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<BigNumber[][]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [
                    sources,
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
