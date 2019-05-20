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
export class ForwarderContract extends BaseContract {
    public marketBuyOrdersWithEth = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);assert.isArray('signatures', signatures);assert.isArray('feeOrders', feeOrders);assert.isArray('feeSignatures', feeSignatures);assert.isBigNumber('feePercentage', feePercentage);assert.isString('feeRecipient', feeRecipient);
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)', [orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.marketBuyOrdersWithEth.estimateGasAsync.bind(
                    self,
                    orders,
                    makerAssetFillAmount,
                    signatures,
                    feeOrders,
                    feeSignatures,
                    feePercentage,
                    feeRecipient
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);assert.isArray('signatures', signatures);assert.isArray('feeOrders', feeOrders);assert.isArray('feeSignatures', feeSignatures);assert.isBigNumber('feePercentage', feePercentage);assert.isString('feeRecipient', feeRecipient);
            const self = this as any as ForwarderContract;
            const txHashPromise = self.marketBuyOrdersWithEth.sendTransactionAsync(orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    , txData);
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
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);assert.isArray('signatures', signatures);assert.isArray('feeOrders', feeOrders);assert.isArray('feeSignatures', feeSignatures);assert.isBigNumber('feePercentage', feePercentage);assert.isString('feeRecipient', feeRecipient);
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)', [orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
        ): string {
            assert.isArray('orders', orders);assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);assert.isArray('signatures', signatures);assert.isArray('feeOrders', feeOrders);assert.isArray('feeSignatures', feeSignatures);assert.isBigNumber('feePercentage', feePercentage);assert.isString('feeRecipient', feeRecipient);
            const self = this as any as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)', [orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}, {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}]
        > {
            assert.isArray('orders', orders);assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);assert.isArray('signatures', signatures);assert.isArray('feeOrders', feeOrders);assert.isArray('feeSignatures', feeSignatures);assert.isBigNumber('feePercentage', feePercentage);assert.isString('feeRecipient', feeRecipient);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)', [orders,
        makerAssetFillAmount,
        signatures,
        feeOrders,
        feeSignatures,
        feePercentage,
        feeRecipient
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}, {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public withdrawAsset = {
        async sendTransactionAsync(
            assetData: string,
            amount: BigNumber,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('assetData', assetData);assert.isBigNumber('amount', amount);
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('withdrawAsset(bytes,uint256)', [assetData,
    amount
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.withdrawAsset.estimateGasAsync.bind(
                    self,
                    assetData,
                    amount
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            assetData: string,
            amount: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('assetData', assetData);assert.isBigNumber('amount', amount);
            const self = this as any as ForwarderContract;
            const txHashPromise = self.withdrawAsset.sendTransactionAsync(assetData,
    amount
    , txData);
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
            assetData: string,
            amount: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('assetData', assetData);assert.isBigNumber('amount', amount);
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('withdrawAsset(bytes,uint256)', [assetData,
    amount
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            assetData: string,
            amount: BigNumber,
        ): string {
            assert.isString('assetData', assetData);assert.isBigNumber('amount', amount);
            const self = this as any as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('withdrawAsset(bytes,uint256)', [assetData,
    amount
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            assetData: string,
            amount: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            assert.isString('assetData', assetData);assert.isBigNumber('amount', amount);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('withdrawAsset(bytes,uint256)', [assetData,
        amount
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('withdrawAsset(bytes,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public owner = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {

            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('owner()', []);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('owner()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public marketSellOrdersWithEth = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);assert.isArray('signatures', signatures);assert.isArray('feeOrders', feeOrders);assert.isArray('feeSignatures', feeSignatures);assert.isBigNumber('feePercentage', feePercentage);assert.isString('feeRecipient', feeRecipient);
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)', [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.marketSellOrdersWithEth.estimateGasAsync.bind(
                    self,
                    orders,
                    signatures,
                    feeOrders,
                    feeSignatures,
                    feePercentage,
                    feeRecipient
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);assert.isArray('signatures', signatures);assert.isArray('feeOrders', feeOrders);assert.isArray('feeSignatures', feeSignatures);assert.isBigNumber('feePercentage', feePercentage);assert.isString('feeRecipient', feeRecipient);
            const self = this as any as ForwarderContract;
            const txHashPromise = self.marketSellOrdersWithEth.sendTransactionAsync(orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    , txData);
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
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);assert.isArray('signatures', signatures);assert.isArray('feeOrders', feeOrders);assert.isArray('feeSignatures', feeSignatures);assert.isBigNumber('feePercentage', feePercentage);assert.isString('feeRecipient', feeRecipient);
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)', [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
        ): string {
            assert.isArray('orders', orders);assert.isArray('signatures', signatures);assert.isArray('feeOrders', feeOrders);assert.isArray('feeSignatures', feeSignatures);assert.isBigNumber('feePercentage', feePercentage);assert.isString('feeRecipient', feeRecipient);
            const self = this as any as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)', [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}, {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}]
        > {
            assert.isArray('orders', orders);assert.isArray('signatures', signatures);assert.isArray('feeOrders', feeOrders);assert.isArray('feeSignatures', feeSignatures);assert.isBigNumber('feePercentage', feePercentage);assert.isString('feeRecipient', feeRecipient);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)', [orders,
        signatures,
        feeOrders,
        feeSignatures,
        feePercentage,
        feeRecipient
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}, {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public transferOwnership = {
        async sendTransactionAsync(
            newOwner: string,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('newOwner', newOwner);
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.transferOwnership.estimateGasAsync.bind(
                    self,
                    newOwner
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            newOwner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('newOwner', newOwner);
            const self = this as any as ForwarderContract;
            const txHashPromise = self.transferOwnership.sendTransactionAsync(newOwner
    , txData);
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
            newOwner: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('newOwner', newOwner);
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            newOwner: string,
        ): string {
            assert.isString('newOwner', newOwner);
            const self = this as any as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('transferOwnership(address)', [newOwner
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            newOwner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            assert.isString('newOwner', newOwner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as ForwarderContract;
            const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
            _exchange: string,
            _zrxAssetData: string,
            _wethAssetData: string,
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
        return ForwarderContract.deployAsync(bytecode, abi, provider, txDefaults, _exchange,
_zrxAssetData,
_wethAssetData
);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
            _exchange: string,
            _zrxAssetData: string,
            _wethAssetData: string,
    ): Promise<ForwarderContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_exchange,
_zrxAssetData,
_wethAssetData
] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange,
_zrxAssetData,
_wethAssetData
],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_exchange,
_zrxAssetData,
_wethAssetData
]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            {data: txData},
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`Forwarder successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ForwarderContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [_exchange,
_zrxAssetData,
_wethAssetData
];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('Forwarder', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
