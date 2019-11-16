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
export class OrderValidatorContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode: string | undefined;
    private readonly _methodABIIndex: { [name: string]: number } = {};
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
        _exchange: string,
        _zrxAssetData: string,
    ): Promise<OrderValidatorContract> {
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
        return OrderValidatorContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
            _exchange,
            _zrxAssetData,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
        _exchange: string,
        _zrxAssetData: string,
    ): Promise<OrderValidatorContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_exchange, _zrxAssetData] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange, _zrxAssetData],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_exchange, _zrxAssetData]);
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
        logUtils.log(`OrderValidator successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new OrderValidatorContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [_exchange, _zrxAssetData];
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
                        name: 'order',
                        type: 'tuple',
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
                        ],
                    },
                    {
                        name: 'takerAddress',
                        type: 'address',
                    },
                ],
                name: 'getOrderAndTraderInfo',
                outputs: [
                    {
                        name: 'orderInfo',
                        type: 'tuple',
                        components: [
                            {
                                name: 'orderStatus',
                                type: 'uint8',
                            },
                            {
                                name: 'orderHash',
                                type: 'bytes32',
                            },
                            {
                                name: 'orderTakerAssetFilledAmount',
                                type: 'uint256',
                            },
                        ],
                    },
                    {
                        name: 'traderInfo',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAllowance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAllowance',
                                type: 'uint256',
                            },
                            {
                                name: 'makerZrxBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'makerZrxAllowance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerZrxBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerZrxAllowance',
                                type: 'uint256',
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
                        name: 'target',
                        type: 'address',
                    },
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                name: 'getBalanceAndAllowance',
                outputs: [
                    {
                        name: 'balance',
                        type: 'uint256',
                    },
                    {
                        name: 'allowance',
                        type: 'uint256',
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
                        ],
                    },
                    {
                        name: 'takerAddresses',
                        type: 'address[]',
                    },
                ],
                name: 'getOrdersAndTradersInfo',
                outputs: [
                    {
                        name: 'ordersInfo',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'orderStatus',
                                type: 'uint8',
                            },
                            {
                                name: 'orderHash',
                                type: 'bytes32',
                            },
                            {
                                name: 'orderTakerAssetFilledAmount',
                                type: 'uint256',
                            },
                        ],
                    },
                    {
                        name: 'tradersInfo',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAllowance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAllowance',
                                type: 'uint256',
                            },
                            {
                                name: 'makerZrxBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'makerZrxAllowance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerZrxBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerZrxAllowance',
                                type: 'uint256',
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
                        ],
                    },
                    {
                        name: 'takerAddresses',
                        type: 'address[]',
                    },
                ],
                name: 'getTradersInfo',
                outputs: [
                    {
                        name: '',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAllowance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAllowance',
                                type: 'uint256',
                            },
                            {
                                name: 'makerZrxBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'makerZrxAllowance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerZrxBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerZrxAllowance',
                                type: 'uint256',
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
                        name: 'token',
                        type: 'address',
                    },
                    {
                        name: 'tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'getERC721TokenOwner',
                outputs: [
                    {
                        name: 'owner',
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
                        name: 'target',
                        type: 'address',
                    },
                    {
                        name: 'assetData',
                        type: 'bytes[]',
                    },
                ],
                name: 'getBalancesAndAllowances',
                outputs: [
                    {
                        name: '',
                        type: 'uint256[]',
                    },
                    {
                        name: '',
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
                        name: 'order',
                        type: 'tuple',
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
                        ],
                    },
                    {
                        name: 'takerAddress',
                        type: 'address',
                    },
                ],
                name: 'getTraderInfo',
                outputs: [
                    {
                        name: 'traderInfo',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAllowance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAllowance',
                                type: 'uint256',
                            },
                            {
                                name: 'makerZrxBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'makerZrxAllowance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerZrxBalance',
                                type: 'uint256',
                            },
                            {
                                name: 'takerZrxAllowance',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                inputs: [
                    {
                        name: '_exchange',
                        type: 'address',
                    },
                    {
                        name: '_zrxAssetData',
                        type: 'bytes',
                    },
                ],
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor',
            },
        ] as ContractAbi;
        return abi;
    }

    public getFunctionSignature(methodName: string): string {
        const index = this._methodABIIndex[methodName];
        const methodAbi = OrderValidatorContract.ABI()[index] as MethodAbi; // tslint:disable-line:no-unnecessary-type-assertion
        const functionSignature = methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }
    public getABIDecodedTransactionData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as OrderValidatorContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode<T>(callData);
        return abiDecodedCallData;
    }
    public getABIDecodedReturnData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as OrderValidatorContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue<T>(callData);
        return abiDecodedCallData;
    }
    public getSelector(methodName: string): string {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as OrderValidatorContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }

    public getOrderAndTraderInfo(
        order: {
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
        },
        takerAddress: string,
    ): ContractFunctionObj<
        [
            { orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber },
            {
                makerBalance: BigNumber;
                makerAllowance: BigNumber;
                takerBalance: BigNumber;
                takerAllowance: BigNumber;
                makerZrxBalance: BigNumber;
                makerZrxAllowance: BigNumber;
                takerZrxBalance: BigNumber;
                takerZrxAllowance: BigNumber;
            }
        ]
    > {
        const self = (this as any) as OrderValidatorContract;

        assert.isString('takerAddress', takerAddress);
        const functionSignature =
            'getOrderAndTraderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),address)';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<
                [
                    { orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber },
                    {
                        makerBalance: BigNumber;
                        makerAllowance: BigNumber;
                        takerBalance: BigNumber;
                        takerAllowance: BigNumber;
                        makerZrxBalance: BigNumber;
                        makerZrxAllowance: BigNumber;
                        takerZrxBalance: BigNumber;
                        takerZrxAllowance: BigNumber;
                    }
                ]
            > {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<
                    [
                        { orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber },
                        {
                            makerBalance: BigNumber;
                            makerAllowance: BigNumber;
                            takerBalance: BigNumber;
                            takerAllowance: BigNumber;
                            makerZrxBalance: BigNumber;
                            makerZrxAllowance: BigNumber;
                            takerZrxBalance: BigNumber;
                            takerZrxAllowance: BigNumber;
                        }
                    ]
                >(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [order, takerAddress.toLowerCase()]);
            },
        };
    }
    public getBalanceAndAllowance(target: string, assetData: string): ContractFunctionObj<[BigNumber, BigNumber]> {
        const self = (this as any) as OrderValidatorContract;
        assert.isString('target', target);
        assert.isString('assetData', assetData);
        const functionSignature = 'getBalanceAndAllowance(address,bytes)';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<[BigNumber, BigNumber]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [target.toLowerCase(), assetData]);
            },
        };
    }
    public getOrdersAndTradersInfo(
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
        }>,
        takerAddresses: string[],
    ): ContractFunctionObj<
        [
            Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>,
            Array<{
                makerBalance: BigNumber;
                makerAllowance: BigNumber;
                takerBalance: BigNumber;
                takerAllowance: BigNumber;
                makerZrxBalance: BigNumber;
                makerZrxAllowance: BigNumber;
                takerZrxBalance: BigNumber;
                takerZrxAllowance: BigNumber;
            }>
        ]
    > {
        const self = (this as any) as OrderValidatorContract;
        assert.isArray('orders', orders);
        assert.isArray('takerAddresses', takerAddresses);
        const functionSignature =
            'getOrdersAndTradersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],address[])';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<
                [
                    Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>,
                    Array<{
                        makerBalance: BigNumber;
                        makerAllowance: BigNumber;
                        takerBalance: BigNumber;
                        takerAllowance: BigNumber;
                        makerZrxBalance: BigNumber;
                        makerZrxAllowance: BigNumber;
                        takerZrxBalance: BigNumber;
                        takerZrxAllowance: BigNumber;
                    }>
                ]
            > {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<
                    [
                        Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>,
                        Array<{
                            makerBalance: BigNumber;
                            makerAllowance: BigNumber;
                            takerBalance: BigNumber;
                            takerAllowance: BigNumber;
                            makerZrxBalance: BigNumber;
                            makerZrxAllowance: BigNumber;
                            takerZrxBalance: BigNumber;
                            takerZrxAllowance: BigNumber;
                        }>
                    ]
                >(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [orders, takerAddresses]);
            },
        };
    }
    public getTradersInfo(
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
        }>,
        takerAddresses: string[],
    ): ContractFunctionObj<
        Array<{
            makerBalance: BigNumber;
            makerAllowance: BigNumber;
            takerBalance: BigNumber;
            takerAllowance: BigNumber;
            makerZrxBalance: BigNumber;
            makerZrxAllowance: BigNumber;
            takerZrxBalance: BigNumber;
            takerZrxAllowance: BigNumber;
        }>
    > {
        const self = (this as any) as OrderValidatorContract;
        assert.isArray('orders', orders);
        assert.isArray('takerAddresses', takerAddresses);
        const functionSignature =
            'getTradersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],address[])';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<
                Array<{
                    makerBalance: BigNumber;
                    makerAllowance: BigNumber;
                    takerBalance: BigNumber;
                    takerAllowance: BigNumber;
                    makerZrxBalance: BigNumber;
                    makerZrxAllowance: BigNumber;
                    takerZrxBalance: BigNumber;
                    takerZrxAllowance: BigNumber;
                }>
            > {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<
                    Array<{
                        makerBalance: BigNumber;
                        makerAllowance: BigNumber;
                        takerBalance: BigNumber;
                        takerAllowance: BigNumber;
                        makerZrxBalance: BigNumber;
                        makerZrxAllowance: BigNumber;
                        takerZrxBalance: BigNumber;
                        takerZrxAllowance: BigNumber;
                    }>
                >(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [orders, takerAddresses]);
            },
        };
    }
    public getERC721TokenOwner(token: string, tokenId: BigNumber): ContractFunctionObj<string> {
        const self = (this as any) as OrderValidatorContract;
        assert.isString('token', token);
        assert.isBigNumber('tokenId', tokenId);
        const functionSignature = 'getERC721TokenOwner(address,uint256)';

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [token.toLowerCase(), tokenId]);
            },
        };
    }
    public getBalancesAndAllowances(
        target: string,
        assetData: string[],
    ): ContractFunctionObj<[BigNumber[], BigNumber[]]> {
        const self = (this as any) as OrderValidatorContract;
        assert.isString('target', target);
        assert.isArray('assetData', assetData);
        const functionSignature = 'getBalancesAndAllowances(address,bytes[])';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<[BigNumber[], BigNumber[]]> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<[BigNumber[], BigNumber[]]>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [target.toLowerCase(), assetData]);
            },
        };
    }
    public getTraderInfo(
        order: {
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
        },
        takerAddress: string,
    ): ContractFunctionObj<{
        makerBalance: BigNumber;
        makerAllowance: BigNumber;
        takerBalance: BigNumber;
        takerAllowance: BigNumber;
        makerZrxBalance: BigNumber;
        makerZrxAllowance: BigNumber;
        takerZrxBalance: BigNumber;
        takerZrxAllowance: BigNumber;
    }> {
        const self = (this as any) as OrderValidatorContract;

        assert.isString('takerAddress', takerAddress);
        const functionSignature =
            'getTraderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),address)';

        return {
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<{
                makerBalance: BigNumber;
                makerAllowance: BigNumber;
                takerBalance: BigNumber;
                takerAllowance: BigNumber;
                makerZrxBalance: BigNumber;
                makerZrxAllowance: BigNumber;
                takerZrxBalance: BigNumber;
                takerZrxAllowance: BigNumber;
            }> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<{
                    makerBalance: BigNumber;
                    makerAllowance: BigNumber;
                    takerBalance: BigNumber;
                    takerAllowance: BigNumber;
                    makerZrxBalance: BigNumber;
                    makerZrxAllowance: BigNumber;
                    takerZrxBalance: BigNumber;
                    takerZrxAllowance: BigNumber;
                }>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [order, takerAddress.toLowerCase()]);
            },
        };
    }

    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = OrderValidatorContract.deployedBytecode,
    ) {
        super(
            'OrderValidator',
            OrderValidatorContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        OrderValidatorContract.ABI().forEach((item, index) => {
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
