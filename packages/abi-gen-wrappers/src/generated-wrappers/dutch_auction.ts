// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import { BaseContract, PromiseWithTransactionHash } from '@0x/base-contract';
import { schemas } from '@0x/json-schemas';
import {
    BlockParam,
    BlockParamLiteral,
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
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class DutchAuctionContract extends BaseContract {
    public getAuctionDetails = {
        async sendTransactionAsync(
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
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            const self = (this as any) as DutchAuctionContract;
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
                self.getAuctionDetails.estimateGasAsync.bind(self, order),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }
            try {
                return await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            } catch (err) {
                // Try to decode ganache transaction revert Errors.
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
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
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            const self = (this as any) as DutchAuctionContract;
            const txHashPromise = self.getAuctionDetails.sendTransactionAsync(order, txData);
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
        async estimateGasAsync(
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
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            const self = (this as any) as DutchAuctionContract;
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
            try {
                return await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            } catch (err) {
                // Try to decode ganache transaction revert Errors.
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        async callAsync(
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
            const self = (this as any) as DutchAuctionContract;
            const encodedData = self._strictEncodeArguments(
                'getAuctionDetails((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
                [order],
            );
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
            let rawCallResult;
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
        getABIEncodedTransactionData(order: {
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
        }): string {
            const self = (this as any) as DutchAuctionContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getAuctionDetails((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
                [order],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedReturnData(
            returnData: string
        ): ({beginTimeSeconds: BigNumber;endTimeSeconds: BigNumber;beginAmount: BigNumber;endAmount: BigNumber;currentAmount: BigNumber;currentTimeSeconds: BigNumber}
        ) {
            const self = this as any as DutchAuctionContract;
            const abiEncoder = self._lookupAbiEncoder('getAuctionDetails((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{beginTimeSeconds: BigNumber;endTimeSeconds: BigNumber;beginAmount: BigNumber;endAmount: BigNumber;currentAmount: BigNumber;currentTimeSeconds: BigNumber}
        >(returnData);
            return abiDecodedReturnData;
        },
    };
    public matchOrders = {
        async sendTransactionAsync(
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
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            const self = (this as any) as DutchAuctionContract;
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
                self.matchOrders.estimateGasAsync.bind(self, buyOrder, sellOrder, buySignature, sellSignature),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }
            try {
                return await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            } catch (err) {
                // Try to decode ganache transaction revert Errors.
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
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
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('buySignature', buySignature);
            assert.isString('sellSignature', sellSignature);
            const self = (this as any) as DutchAuctionContract;
            const txHashPromise = self.matchOrders.sendTransactionAsync(
                buyOrder,
                sellOrder,
                buySignature,
                sellSignature,
                txData,
            );
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
        async estimateGasAsync(
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
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            const self = (this as any) as DutchAuctionContract;
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
            try {
                return await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            } catch (err) {
                // Try to decode ganache transaction revert Errors.
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        async callAsync(
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
            assert.isString('buySignature', buySignature);
            assert.isString('sellSignature', sellSignature);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DutchAuctionContract;
            const encodedData = self._strictEncodeArguments(
                'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
                [buyOrder, sellOrder, buySignature, sellSignature],
            );
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
            let rawCallResult;
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
        getABIEncodedTransactionData(
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
        ): string {
            assert.isString('buySignature', buySignature);
            assert.isString('sellSignature', sellSignature);
            const self = (this as any) as DutchAuctionContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
                [buyOrder, sellOrder, buySignature, sellSignature],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedReturnData(
            returnData: string
        ): ({left: {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber};right: {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber};leftMakerAssetSpreadAmount: BigNumber}
        ) {
            const self = this as any as DutchAuctionContract;
            const abiEncoder = self._lookupAbiEncoder('matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{left: {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber};right: {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber};leftMakerAssetSpreadAmount: BigNumber}
        >(returnData);
            return abiDecodedReturnData;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
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
        return DutchAuctionContract.deployAsync(bytecode, abi, provider, txDefaults, _exchange);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
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
        const contractInstance = new DutchAuctionContract(txReceipt.contractAddress as string, provider, txDefaults);
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
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('DutchAuction', DutchAuctionContract.ABI(), address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
