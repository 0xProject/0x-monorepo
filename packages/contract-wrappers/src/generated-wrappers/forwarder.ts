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

export type ForwarderEventArgs = ForwarderOwnershipTransferredEventArgs;

export enum ForwarderEvents {
    OwnershipTransferred = 'OwnershipTransferred',
}

export interface ForwarderOwnershipTransferredEventArgs extends DecodedLogArgs {
    previousOwner: string;
    newOwner: string;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ForwarderContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode: string | undefined;
    public static contractName = 'Forwarder';
    private readonly _methodABIIndex: { [name: string]: number } = {};
    private readonly _subscriptionManager: SubscriptionManager<ForwarderEventArgs, ForwarderEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
        _exchange: string,
        _exchangeV2: string,
        _weth: string,
    ): Promise<ForwarderContract> {
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
        return ForwarderContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
            _exchange,
            _exchangeV2,
            _weth,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
        _exchange: string,
        _exchangeV2: string,
        _weth: string,
    ): Promise<ForwarderContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_exchange, _exchangeV2, _weth] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange, _exchangeV2, _weth],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_exchange, _exchangeV2, _weth]);
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
        logUtils.log(`Forwarder successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ForwarderContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [_exchange, _exchangeV2, _weth];
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
                        name: '_exchange',
                        type: 'address',
                    },
                    {
                        name: '_exchangeV2',
                        type: 'address',
                    },
                    {
                        name: '_weth',
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
                inputs: [],
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'fallback',
            },
            {
                constant: true,
                inputs: [],
                name: 'EXCHANGE_V2_ORDER_ID',
                outputs: [
                    {
                        name: '',
                        type: 'bytes4',
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
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                name: 'approveMakerAssetProxy',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
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
                        name: 'makerAssetBuyAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                    {
                        name: 'ethFeeAmounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'feeRecipients',
                        type: 'address[]',
                    },
                ],
                name: 'marketBuyOrdersWithEth',
                outputs: [
                    {
                        name: 'wethSpentAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'makerAssetAcquiredAmount',
                        type: 'uint256',
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
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
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                    {
                        name: 'ethFeeAmounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'feeRecipients',
                        type: 'address[]',
                    },
                ],
                name: 'marketSellOrdersWithEth',
                outputs: [
                    {
                        name: 'wethSpentAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'makerAssetAcquiredAmount',
                        type: 'uint256',
                    },
                ],
                payable: true,
                stateMutability: 'payable',
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
                constant: false,
                inputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                    {
                        name: 'amount',
                        type: 'uint256',
                    },
                ],
                name: 'withdrawAsset',
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
        const methodAbi = ForwarderContract.ABI()[index] as MethodAbi; // tslint:disable-line:no-unnecessary-type-assertion
        const functionSignature = methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }
    public getABIDecodedTransactionData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as ForwarderContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode<T>(callData);
        return abiDecodedCallData;
    }
    public getABIDecodedReturnData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as ForwarderContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue<T>(callData);
        return abiDecodedCallData;
    }
    public getSelector(methodName: string): string {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as ForwarderContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }

    public EXCHANGE_V2_ORDER_ID(): ContractFunctionObj<string> {
        const self = (this as any) as ForwarderContract;
        const functionSignature = 'EXCHANGE_V2_ORDER_ID()';

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
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    /**
     * Approves the respective proxy for a given asset to transfer tokens on the Forwarder contract's behalf.
     * This is necessary because an order fee denominated in the maker asset (i.e. a percentage fee) is sent by the
     * Forwarder contract to the fee recipient.
     * This method needs to be called before forwarding orders of a maker asset that hasn't
     * previously been approved.
     * @param assetData Byte array encoded for the respective asset proxy.
     */
    public approveMakerAssetProxy(assetData: string): ContractTxFunctionObj<void> {
        const self = (this as any) as ForwarderContract;
        assert.isString('assetData', assetData);
        const functionSignature = 'approveMakerAssetProxy(bytes)';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: this.getABIEncodedTransactionData() },
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
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                    ...txData,
                    data: this.getABIEncodedTransactionData(),
                });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [assetData]);
            },
        };
    }
    /**
     * Attempt to buy makerAssetBuyAmount of makerAsset by selling ETH provided with transaction.
     * The Forwarder may *fill* more than makerAssetBuyAmount of the makerAsset so that it can
     * pay takerFees where takerFeeAssetData == makerAssetData (i.e. percentage fees).
     * Any ETH not spent will be refunded to sender.
     * @param orders Array of order specifications used containing desired
     *     makerAsset and WETH as takerAsset.
     * @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
     * @param signatures Proofs that orders have been created by makers.
     * @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to
     *     corresponding feeRecipients.
     * @param feeRecipients Addresses that will receive ETH when orders are filled.
     * @returns wethSpentAmount Amount of WETH spent on the given set of orders.makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.
     */
    public marketBuyOrdersWithEth(
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
        makerAssetBuyAmount: BigNumber,
        signatures: string[],
        ethFeeAmounts: BigNumber[],
        feeRecipients: string[],
    ): ContractTxFunctionObj<[BigNumber, BigNumber]> {
        const self = (this as any) as ForwarderContract;
        assert.isArray('orders', orders);
        assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
        assert.isArray('signatures', signatures);
        assert.isArray('ethFeeAmounts', ethFeeAmounts);
        assert.isArray('feeRecipients', feeRecipients);
        const functionSignature =
            'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256[],address[])';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: this.getABIEncodedTransactionData() },
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
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                    ...txData,
                    data: this.getABIEncodedTransactionData(),
                });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
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
                return self._strictEncodeArguments(functionSignature, [
                    orders,
                    makerAssetBuyAmount,
                    signatures,
                    ethFeeAmounts,
                    feeRecipients,
                ]);
            },
        };
    }
    /**
     * Purchases as much of orders' makerAssets as possible by selling as much of the ETH value sent
     * as possible, accounting for order and forwarder fees.
     * @param orders Array of order specifications used containing desired
     *     makerAsset and WETH as takerAsset.
     * @param signatures Proofs that orders have been created by makers.
     * @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to
     *     corresponding feeRecipients.
     * @param feeRecipients Addresses that will receive ETH when orders are filled.
     * @returns wethSpentAmount Amount of WETH spent on the given set of orders.makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.
     */
    public marketSellOrdersWithEth(
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
        signatures: string[],
        ethFeeAmounts: BigNumber[],
        feeRecipients: string[],
    ): ContractTxFunctionObj<[BigNumber, BigNumber]> {
        const self = (this as any) as ForwarderContract;
        assert.isArray('orders', orders);
        assert.isArray('signatures', signatures);
        assert.isArray('ethFeeAmounts', ethFeeAmounts);
        assert.isArray('feeRecipients', feeRecipients);
        const functionSignature =
            'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256[],address[])';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: this.getABIEncodedTransactionData() },
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
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                    ...txData,
                    data: this.getABIEncodedTransactionData(),
                });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
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
                return self._strictEncodeArguments(functionSignature, [
                    orders,
                    signatures,
                    ethFeeAmounts,
                    feeRecipients,
                ]);
            },
        };
    }
    public owner(): ContractFunctionObj<string> {
        const self = (this as any) as ForwarderContract;
        const functionSignature = 'owner()';

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
                return self._strictEncodeArguments(functionSignature, []);
            },
        };
    }
    /**
     * Change the owner of this contract.
     * @param newOwner New owner address.
     */
    public transferOwnership(newOwner: string): ContractTxFunctionObj<void> {
        const self = (this as any) as ForwarderContract;
        assert.isString('newOwner', newOwner);
        const functionSignature = 'transferOwnership(address)';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: this.getABIEncodedTransactionData() },
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
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                    ...txData,
                    data: this.getABIEncodedTransactionData(),
                });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [newOwner.toLowerCase()]);
            },
        };
    }
    /**
     * Withdraws assets from this contract. It may be used by the owner to withdraw assets
     * that were accidentally sent to this contract.
     * @param assetData Byte array encoded for the respective asset proxy.
     * @param amount Amount of the asset to withdraw.
     */
    public withdrawAsset(assetData: string, amount: BigNumber): ContractTxFunctionObj<void> {
        const self = (this as any) as ForwarderContract;
        assert.isString('assetData', assetData);
        assert.isBigNumber('amount', amount);
        const functionSignature = 'withdrawAsset(bytes,uint256)';

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                    { ...txData, data: this.getABIEncodedTransactionData() },
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
                const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                    ...txData,
                    data: this.getABIEncodedTransactionData(),
                });
                return self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            },
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
                BaseContract._assertCallParams(callData, defaultBlock);
                const rawCallResult = await self._performCallAsync(
                    { ...callData, data: this.getABIEncodedTransactionData() },
                    defaultBlock,
                );
                const abiEncoder = self._lookupAbiEncoder(functionSignature);
                return abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            },
            getABIEncodedTransactionData(): string {
                return self._strictEncodeArguments(functionSignature, [assetData, amount]);
            },
        };
    }

    /**
     * Subscribe to an event type emitted by the Forwarder contract.
     * @param eventName The Forwarder contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends ForwarderEventArgs>(
        eventName: ForwarderEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, ForwarderEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            ForwarderContract.ABI(),
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
     * @param eventName The Forwarder contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends ForwarderEventArgs>(
        eventName: ForwarderEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, ForwarderEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            ForwarderContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = ForwarderContract.deployedBytecode,
    ) {
        super(
            'Forwarder',
            ForwarderContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<ForwarderEventArgs, ForwarderEvents>(
            ForwarderContract.ABI(),
            this._web3Wrapper,
        );
        ForwarderContract.ABI().forEach((item, index) => {
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
