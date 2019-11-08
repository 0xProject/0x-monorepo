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
export class DutchAuctionContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode: string | undefined;
    private _methodABIIndex: { [name: string]: number } = {};
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
        _exchange: string,
    ): Promise<DutchAuctionContract> {
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
        return DutchAuctionContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
            _exchange,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
        _exchange: string,
    ): Promise<DutchAuctionContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_exchange] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_exchange]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`DutchAuction successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new DutchAuctionContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [_exchange];
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
                ],
                name: 'getAuctionDetails',
                outputs: [
                    {
                        name: 'auctionDetails',
                        type: 'tuple',
                        components: [
                            {
                                name: 'beginTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'endTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'beginAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'endAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'currentAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'currentTimeSeconds',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'buyOrder',
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
                        name: 'sellOrder',
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
                        name: 'buySignature',
                        type: 'bytes',
                    },
                    {
                        name: 'sellSignature',
                        type: 'bytes',
                    },
                ],
                name: 'matchOrders',
                outputs: [
                    {
                        name: 'matchedFillResults',
                        type: 'tuple',
                        components: [
                            {
                                name: 'left',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'makerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'makerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerFeePaid',
                                        type: 'uint256',
                                    },
                                ],
                            },
                            {
                                name: 'right',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'makerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerAssetFilledAmount',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'makerFeePaid',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'takerFeePaid',
                                        type: 'uint256',
                                    },
                                ],
                            },
                            {
                                name: 'leftMakerAssetSpreadAmount',
                                type: 'uint256',
                            },
                        ],
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                inputs: [
                    {
                        name: '_exchange',
                        type: 'address',
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
        const methodAbi = DutchAuctionContract.ABI()[index] as MethodAbi;
        const functionSignature = methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }
    public getABIDecodedTransactionData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as DutchAuctionContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode<T>(callData);
        return abiDecodedCallData;
    }
    public getABIDecodedReturnData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as DutchAuctionContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue<T>(callData);
        return abiDecodedCallData;
    }
    public getSelector(methodName: string): string {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as DutchAuctionContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }

    /**
     * Calculates the Auction Details for the given order
     * @param order The sell order
     * @returns AuctionDetails
     */
    public getAuctionDetails(order: {
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
    }): ContractTxFunctionObj<{
        beginTimeSeconds: BigNumber;
        endTimeSeconds: BigNumber;
        beginAmount: BigNumber;
        endAmount: BigNumber;
        currentAmount: BigNumber;
        currentTimeSeconds: BigNumber;
    }> {
        const self = (this as any) as DutchAuctionContract;

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments(
                    'getAuctionDetails((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
                    [order],
                );
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
                const encodedData = self._strictEncodeArguments(
                    'getAuctionDetails((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
                    [order],
                );
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
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<{
                beginTimeSeconds: BigNumber;
                endTimeSeconds: BigNumber;
                beginAmount: BigNumber;
                endAmount: BigNumber;
                currentAmount: BigNumber;
                currentTimeSeconds: BigNumber;
            }> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments(
                    'getAuctionDetails((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
                    [order],
                );
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
                const abiEncoder = self._lookupAbiEncoder(
                    'getAuctionDetails((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
                );
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<{
                    beginTimeSeconds: BigNumber;
                    endTimeSeconds: BigNumber;
                    beginAmount: BigNumber;
                    endAmount: BigNumber;
                    currentAmount: BigNumber;
                    currentTimeSeconds: BigNumber;
                }>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments(
                    'getAuctionDetails((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
                    [order],
                );
                return abiEncodedTransactionData;
            },
        };
    }
    /**
     * Matches the buy and sell orders at an amount given the following: the current block time, the auction
     * start time and the auction begin amount. The sell order is a an order at the lowest amount
     * at the end of the auction. Excess from the match is transferred to the seller.
     * Over time the price moves from beginAmount to endAmount given the current block.timestamp.
     * sellOrder.expiryTimeSeconds is the end time of the auction.
     * sellOrder.takerAssetAmount is the end amount of the auction (lowest possible amount).
     * sellOrder.makerAssetData is the ABI encoded Asset Proxy data with the following data appended
     * buyOrder.makerAssetData is the buyers bid on the auction, must meet the amount for the current block timestamp
     * (uint256 beginTimeSeconds, uint256 beginAmount).
     * This function reverts in the following scenarios:
     * * Auction has not started (auctionDetails.currentTimeSeconds < auctionDetails.beginTimeSeconds)
     * * Auction has expired (auctionDetails.endTimeSeconds < auctionDetails.currentTimeSeconds)
     * * Amount is invalid: Buy order amount is too low (buyOrder.makerAssetAmount < auctionDetails.currentAmount)
     * * Amount is invalid: Invalid begin amount (auctionDetails.beginAmount > auctionDetails.endAmount)
     * * Any failure in the 0x Match Orders
     * @param buyOrder The Buyer's order. This order is for the current expected
     *     price of the auction.
     * @param sellOrder The Seller's order. This order is for the lowest amount (at
     *     the end of the auction).
     * @param buySignature Proof that order was created by the buyer.
     * @param sellSignature Proof that order was created by the seller.
     * @returns matchedFillResults amounts filled and fees paid by maker and taker of matched orders.
     */
    public matchOrders(
        buyOrder: {
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
        sellOrder: {
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
        buySignature: string,
        sellSignature: string,
    ): ContractTxFunctionObj<{
        left: {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        };
        right: {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        };
        leftMakerAssetSpreadAmount: BigNumber;
    }> {
        const self = (this as any) as DutchAuctionContract;

        assert.isString('buySignature', buySignature);
        assert.isString('sellSignature', sellSignature);

        return {
            async sendTransactionAsync(
                txData?: Partial<TxData> | undefined,
                opts: SendTransactionOpts = { shouldValidate: true },
            ): Promise<string> {
                const encodedData = self._strictEncodeArguments(
                    'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
                    [buyOrder, sellOrder, buySignature, sellSignature],
                );
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
                const encodedData = self._strictEncodeArguments(
                    'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
                    [buyOrder, sellOrder, buySignature, sellSignature],
                );
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
            async callAsync(
                callData: Partial<CallData> = {},
                defaultBlock?: BlockParam,
            ): Promise<{
                left: {
                    makerAssetFilledAmount: BigNumber;
                    takerAssetFilledAmount: BigNumber;
                    makerFeePaid: BigNumber;
                    takerFeePaid: BigNumber;
                };
                right: {
                    makerAssetFilledAmount: BigNumber;
                    takerAssetFilledAmount: BigNumber;
                    makerFeePaid: BigNumber;
                    takerFeePaid: BigNumber;
                };
                leftMakerAssetSpreadAmount: BigNumber;
            }> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments(
                    'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
                    [buyOrder, sellOrder, buySignature, sellSignature],
                );
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
                const abiEncoder = self._lookupAbiEncoder(
                    'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
                );
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<{
                    left: {
                        makerAssetFilledAmount: BigNumber;
                        takerAssetFilledAmount: BigNumber;
                        makerFeePaid: BigNumber;
                        takerFeePaid: BigNumber;
                    };
                    right: {
                        makerAssetFilledAmount: BigNumber;
                        takerAssetFilledAmount: BigNumber;
                        makerFeePaid: BigNumber;
                        takerFeePaid: BigNumber;
                    };
                    leftMakerAssetSpreadAmount: BigNumber;
                }>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments(
                    'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
                    [buyOrder, sellOrder, buySignature, sellSignature],
                );
                return abiEncodedTransactionData;
            },
        };
    }

    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = DutchAuctionContract.deployedBytecode,
    ) {
        super(
            'DutchAuction',
            DutchAuctionContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        DutchAuctionContract.ABI().forEach((item, index) => {
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
