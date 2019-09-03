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

export type ExchangeEventArgs =
    | ExchangeSignatureValidatorApprovalEventArgs
    | ExchangeFillEventArgs
    | ExchangeCancelEventArgs
    | ExchangeCancelUpToEventArgs
    | ExchangeAssetProxyRegisteredEventArgs;

export enum ExchangeEvents {
    SignatureValidatorApproval = 'SignatureValidatorApproval',
    Fill = 'Fill',
    Cancel = 'Cancel',
    CancelUpTo = 'CancelUpTo',
    AssetProxyRegistered = 'AssetProxyRegistered',
}

export interface ExchangeSignatureValidatorApprovalEventArgs extends DecodedLogArgs {
    signerAddress: string;
    validatorAddress: string;
    approved: boolean;
}

export interface ExchangeFillEventArgs extends DecodedLogArgs {
    makerAddress: string;
    feeRecipientAddress: string;
    takerAddress: string;
    senderAddress: string;
    makerAssetFilledAmount: BigNumber;
    takerAssetFilledAmount: BigNumber;
    makerFeePaid: BigNumber;
    takerFeePaid: BigNumber;
    orderHash: string;
    makerAssetData: string;
    takerAssetData: string;
}

export interface ExchangeCancelEventArgs extends DecodedLogArgs {
    makerAddress: string;
    feeRecipientAddress: string;
    senderAddress: string;
    orderHash: string;
    makerAssetData: string;
    takerAssetData: string;
}

export interface ExchangeCancelUpToEventArgs extends DecodedLogArgs {
    makerAddress: string;
    senderAddress: string;
    orderEpoch: BigNumber;
}

export interface ExchangeAssetProxyRegisteredEventArgs extends DecodedLogArgs {
    id: string;
    assetProxy: string;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ExchangeContract extends BaseContract {
    public filled = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isString('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('filled(bytes32)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('filled(bytes32)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(index_0: string): string {
            assert.isString('index_0', index_0);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('filled(bytes32)', [index_0]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('filled(bytes32)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('filled(bytes32)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Synchronously executes multiple calls of fillOrder.
     */
    public batchFillOrders = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
                [orders, takerAssetFillAmounts, signatures],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.batchFillOrders.estimateGasAsync.bind(self, orders, takerAssetFillAmounts, signatures),
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
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.batchFillOrders.sendTransactionAsync(
                orders,
                takerAssetFillAmounts,
                signatures,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
                [orders, takerAssetFillAmounts, signatures],
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         * @returns Amounts filled and fees paid by makers and taker.         NOTE: makerAssetFilledAmount and takerAssetFilledAmount may include amounts filled of different assets.
         */
        async callAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        }> {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
                [orders, takerAssetFillAmounts, signatures],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         */
        getABIEncodedTransactionData(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
        ): string {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
                [orders, takerAssetFillAmounts, signatures],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).batchFillOrders.callAsync(orders, takerAssetFillAmounts, signatures, txData);
            const txHash = await (this as any).batchFillOrders.sendTransactionAsync(
                orders,
                takerAssetFillAmounts,
                signatures,
                txData,
            );
            return txHash;
        },
    };
    public cancelled = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isString('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('cancelled(bytes32)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('cancelled(bytes32)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(index_0: string): string {
            assert.isString('index_0', index_0);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('cancelled(bytes32)', [index_0]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): boolean {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('cancelled(bytes32)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<boolean>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): boolean {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('cancelled(bytes32)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<boolean>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Approves a hash on-chain using any valid signature type.
     * After presigning a hash, the preSign signature type will become valid for that hash and signer.
     */
    public preSign = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param signerAddress Address that should have signed the given hash.
         * @param signature Proof that the hash has been signed by signer.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('hash', hash);
            assert.isString('signerAddress', signerAddress);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('preSign(bytes32,address,bytes)', [
                hash,
                signerAddress.toLowerCase(),
                signature,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.preSign.estimateGasAsync.bind(self, hash, signerAddress.toLowerCase(), signature),
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
         * @param signerAddress Address that should have signed the given hash.
         * @param signature Proof that the hash has been signed by signer.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('hash', hash);
            assert.isString('signerAddress', signerAddress);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.preSign.sendTransactionAsync(
                hash,
                signerAddress.toLowerCase(),
                signature,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param signerAddress Address that should have signed the given hash.
         * @param signature Proof that the hash has been signed by signer.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('hash', hash);
            assert.isString('signerAddress', signerAddress);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('preSign(bytes32,address,bytes)', [
                hash,
                signerAddress.toLowerCase(),
                signature,
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param signerAddress Address that should have signed the given hash.
         * @param signature Proof that the hash has been signed by signer.
         */
        async callAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('hash', hash);
            assert.isString('signerAddress', signerAddress);
            assert.isString('signature', signature);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('preSign(bytes32,address,bytes)', [
                hash,
                signerAddress.toLowerCase(),
                signature,
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
            const abiEncoder = self._lookupAbiEncoder('preSign(bytes32,address,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param signerAddress Address that should have signed the given hash.
         * @param signature Proof that the hash has been signed by signer.
         */
        getABIEncodedTransactionData(hash: string, signerAddress: string, signature: string): string {
            assert.isString('hash', hash);
            assert.isString('signerAddress', signerAddress);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('preSign(bytes32,address,bytes)', [
                hash,
                signerAddress.toLowerCase(),
                signature,
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('preSign(bytes32,address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('preSign(bytes32,address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).preSign.callAsync(hash, signerAddress, signature, txData);
            const txHash = await (this as any).preSign.sendTransactionAsync(hash, signerAddress, signature, txData);
            return txHash;
        },
    };
    /**
     * Match two complementary orders that have a profitable spread.
     * Each order is filled at their respective price point. However, the calculations are
     * carried out as though the orders are both being filled at the right order's price point.
     * The profit made by the left order goes to the taker (who matched the two orders).
     */
    public matchOrders = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param leftOrder First order to match.
         * @param rightOrder Second order to match.
         * @param leftSignature Proof that order was created by the left maker.
         * @param rightSignature Proof that order was created by the right maker.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            leftOrder: {
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
            rightOrder: {
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
            leftSignature: string,
            rightSignature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('leftSignature', leftSignature);
            assert.isString('rightSignature', rightSignature);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
                [leftOrder, rightOrder, leftSignature, rightSignature],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.matchOrders.estimateGasAsync.bind(self, leftOrder, rightOrder, leftSignature, rightSignature),
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
         * @param leftOrder First order to match.
         * @param rightOrder Second order to match.
         * @param leftSignature Proof that order was created by the left maker.
         * @param rightSignature Proof that order was created by the right maker.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            leftOrder: {
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
            rightOrder: {
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
            leftSignature: string,
            rightSignature: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('leftSignature', leftSignature);
            assert.isString('rightSignature', rightSignature);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.matchOrders.sendTransactionAsync(
                leftOrder,
                rightOrder,
                leftSignature,
                rightSignature,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param leftOrder First order to match.
         * @param rightOrder Second order to match.
         * @param leftSignature Proof that order was created by the left maker.
         * @param rightSignature Proof that order was created by the right maker.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            leftOrder: {
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
            rightOrder: {
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
            leftSignature: string,
            rightSignature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('leftSignature', leftSignature);
            assert.isString('rightSignature', rightSignature);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
                [leftOrder, rightOrder, leftSignature, rightSignature],
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param leftOrder First order to match.
         * @param rightOrder Second order to match.
         * @param leftSignature Proof that order was created by the left maker.
         * @param rightSignature Proof that order was created by the right maker.
         * @returns matchedFillResults Amounts filled and fees paid by maker and taker of matched orders.
         */
        async callAsync(
            leftOrder: {
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
            rightOrder: {
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
            leftSignature: string,
            rightSignature: string,
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
            assert.isString('leftSignature', leftSignature);
            assert.isString('rightSignature', rightSignature);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
                [leftOrder, rightOrder, leftSignature, rightSignature],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param leftOrder First order to match.
         * @param rightOrder Second order to match.
         * @param leftSignature Proof that order was created by the left maker.
         * @param rightSignature Proof that order was created by the right maker.
         */
        getABIEncodedTransactionData(
            leftOrder: {
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
            rightOrder: {
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
            leftSignature: string,
            rightSignature: string,
        ): string {
            assert.isString('leftSignature', leftSignature);
            assert.isString('rightSignature', rightSignature);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
                [leftOrder, rightOrder, leftSignature, rightSignature],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): {
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
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
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
            }>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): {
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
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
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
            }>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
            leftOrder: {
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
            rightOrder: {
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
            leftSignature: string,
            rightSignature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).matchOrders.callAsync(leftOrder, rightOrder, leftSignature, rightSignature, txData);
            const txHash = await (this as any).matchOrders.sendTransactionAsync(
                leftOrder,
                rightOrder,
                leftSignature,
                rightSignature,
                txData,
            );
            return txHash;
        },
    };
    /**
     * Fills the input order.
     * Returns false if the transaction would otherwise revert.
     */
    public fillOrderNoThrow = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'fillOrderNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
                [order, takerAssetFillAmount, signature],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.fillOrderNoThrow.estimateGasAsync.bind(self, order, takerAssetFillAmount, signature),
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
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.fillOrderNoThrow.sendTransactionAsync(
                order,
                takerAssetFillAmount,
                signature,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'fillOrderNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
                [order, takerAssetFillAmount, signature],
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         * @returns Amounts filled and fees paid by maker and taker.
         */
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        }> {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'fillOrderNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
                [order, takerAssetFillAmount, signature],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'fillOrderNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         */
        getABIEncodedTransactionData(
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
            takerAssetFillAmount: BigNumber,
            signature: string,
        ): string {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'fillOrderNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
                [order, takerAssetFillAmount, signature],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'fillOrderNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'fillOrderNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).fillOrderNoThrow.callAsync(order, takerAssetFillAmount, signature, txData);
            const txHash = await (this as any).fillOrderNoThrow.sendTransactionAsync(
                order,
                takerAssetFillAmount,
                signature,
                txData,
            );
            return txHash;
        },
    };
    public assetProxies = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(index_0: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.isString('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('assetProxies(bytes4)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('assetProxies(bytes4)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(index_0: string): string {
            assert.isString('index_0', index_0);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('assetProxies(bytes4)', [index_0]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('assetProxies(bytes4)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('assetProxies(bytes4)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Synchronously cancels multiple orders in a single transaction.
     */
    public batchCancelOrders = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of order specifications.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
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
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
                [orders],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.batchCancelOrders.estimateGasAsync.bind(self, orders),
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
         * @param orders Array of order specifications.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
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
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.batchCancelOrders.sendTransactionAsync(orders, txData);
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
         * @param orders Array of order specifications.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
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
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
                [orders],
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of order specifications.
         */
        async callAsync(
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
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isArray('orders', orders);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
                [orders],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications.
         */
        getABIEncodedTransactionData(
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
        ): string {
            assert.isArray('orders', orders);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
                [orders],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
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
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).batchCancelOrders.callAsync(orders, txData);
            const txHash = await (this as any).batchCancelOrders.sendTransactionAsync(orders, txData);
            return txHash;
        },
    };
    /**
     * Synchronously executes multiple calls of fillOrKill.
     */
    public batchFillOrKillOrders = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
                [orders, takerAssetFillAmounts, signatures],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.batchFillOrKillOrders.estimateGasAsync.bind(self, orders, takerAssetFillAmounts, signatures),
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
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.batchFillOrKillOrders.sendTransactionAsync(
                orders,
                takerAssetFillAmounts,
                signatures,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
                [orders, takerAssetFillAmounts, signatures],
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         * @returns Amounts filled and fees paid by makers and taker.         NOTE: makerAssetFilledAmount and takerAssetFilledAmount may include amounts filled of different assets.
         */
        async callAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        }> {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
                [orders, takerAssetFillAmounts, signatures],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         */
        getABIEncodedTransactionData(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
        ): string {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
                [orders, takerAssetFillAmounts, signatures],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).batchFillOrKillOrders.callAsync(orders, takerAssetFillAmounts, signatures, txData);
            const txHash = await (this as any).batchFillOrKillOrders.sendTransactionAsync(
                orders,
                takerAssetFillAmounts,
                signatures,
                txData,
            );
            return txHash;
        },
    };
    /**
     * Cancels all orders created by makerAddress with a salt less than or equal to the targetOrderEpoch
     * and senderAddress equal to msg.sender (or null address if msg.sender == makerAddress).
     */
    public cancelOrdersUpTo = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param targetOrderEpoch Orders created with a salt less or equal to this
         *     value will be cancelled.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(targetOrderEpoch: BigNumber, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isBigNumber('targetOrderEpoch', targetOrderEpoch);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('cancelOrdersUpTo(uint256)', [targetOrderEpoch]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.cancelOrdersUpTo.estimateGasAsync.bind(self, targetOrderEpoch),
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
         * @param targetOrderEpoch Orders created with a salt less or equal to this
         *     value will be cancelled.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            targetOrderEpoch: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('targetOrderEpoch', targetOrderEpoch);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.cancelOrdersUpTo.sendTransactionAsync(targetOrderEpoch, txData);
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
         * @param targetOrderEpoch Orders created with a salt less or equal to this
         *     value will be cancelled.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(targetOrderEpoch: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('targetOrderEpoch', targetOrderEpoch);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('cancelOrdersUpTo(uint256)', [targetOrderEpoch]);
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
         * @param targetOrderEpoch Orders created with a salt less or equal to this
         *     value will be cancelled.
         */
        async callAsync(
            targetOrderEpoch: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('targetOrderEpoch', targetOrderEpoch);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('cancelOrdersUpTo(uint256)', [targetOrderEpoch]);
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
            const abiEncoder = self._lookupAbiEncoder('cancelOrdersUpTo(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param targetOrderEpoch Orders created with a salt less or equal to this
         *     value will be cancelled.
         */
        getABIEncodedTransactionData(targetOrderEpoch: BigNumber): string {
            assert.isBigNumber('targetOrderEpoch', targetOrderEpoch);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('cancelOrdersUpTo(uint256)', [
                targetOrderEpoch,
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('cancelOrdersUpTo(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('cancelOrdersUpTo(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
            targetOrderEpoch: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).cancelOrdersUpTo.callAsync(targetOrderEpoch, txData);
            const txHash = await (this as any).cancelOrdersUpTo.sendTransactionAsync(targetOrderEpoch, txData);
            return txHash;
        },
    };
    /**
     * Fills an order with specified parameters and ECDSA signature.
     * Returns false if the transaction would otherwise revert.
     */
    public batchFillOrdersNoThrow = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
                [orders, takerAssetFillAmounts, signatures],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.batchFillOrdersNoThrow.estimateGasAsync.bind(self, orders, takerAssetFillAmounts, signatures),
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
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.batchFillOrdersNoThrow.sendTransactionAsync(
                orders,
                takerAssetFillAmounts,
                signatures,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
                [orders, takerAssetFillAmounts, signatures],
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         * @returns Amounts filled and fees paid by makers and taker.         NOTE: makerAssetFilledAmount and takerAssetFilledAmount may include amounts filled of different assets.
         */
        async callAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        }> {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
                [orders, takerAssetFillAmounts, signatures],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications.
         * @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell
         *     in orders.
         * @param signatures Proofs that orders have been created by makers.
         */
        getABIEncodedTransactionData(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
        ): string {
            assert.isArray('orders', orders);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
                [orders, takerAssetFillAmounts, signatures],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
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
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).batchFillOrdersNoThrow.callAsync(orders, takerAssetFillAmounts, signatures, txData);
            const txHash = await (this as any).batchFillOrdersNoThrow.sendTransactionAsync(
                orders,
                takerAssetFillAmounts,
                signatures,
                txData,
            );
            return txHash;
        },
    };
    /**
     * Gets an asset proxy.
     */
    public getAssetProxy = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param assetProxyId Id of the asset proxy.
         * @returns The asset proxy registered to assetProxyId. Returns 0x0 if no proxy is registered.
         */
        async callAsync(
            assetProxyId: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            assert.isString('assetProxyId', assetProxyId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('getAssetProxy(bytes4)', [assetProxyId]);
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
            const abiEncoder = self._lookupAbiEncoder('getAssetProxy(bytes4)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param assetProxyId Id of the asset proxy.
         */
        getABIEncodedTransactionData(assetProxyId: string): string {
            assert.isString('assetProxyId', assetProxyId);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getAssetProxy(bytes4)', [assetProxyId]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('getAssetProxy(bytes4)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('getAssetProxy(bytes4)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public transactions = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isString('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('transactions(bytes32)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('transactions(bytes32)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(index_0: string): string {
            assert.isString('index_0', index_0);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('transactions(bytes32)', [index_0]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): boolean {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('transactions(bytes32)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<boolean>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): boolean {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('transactions(bytes32)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<boolean>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Fills the input order. Reverts if exact takerAssetFillAmount not filled.
     */
    public fillOrKillOrder = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
                [order, takerAssetFillAmount, signature],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.fillOrKillOrder.estimateGasAsync.bind(self, order, takerAssetFillAmount, signature),
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
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.fillOrKillOrder.sendTransactionAsync(
                order,
                takerAssetFillAmount,
                signature,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
                [order, takerAssetFillAmount, signature],
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         */
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        }> {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
                [order, takerAssetFillAmount, signature],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         */
        getABIEncodedTransactionData(
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
            takerAssetFillAmount: BigNumber,
            signature: string,
        ): string {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
                [order, takerAssetFillAmount, signature],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).fillOrKillOrder.callAsync(order, takerAssetFillAmount, signature, txData);
            const txHash = await (this as any).fillOrKillOrder.sendTransactionAsync(
                order,
                takerAssetFillAmount,
                signature,
                txData,
            );
            return txHash;
        },
    };
    /**
     * Approves/unnapproves a Validator contract to verify signatures on signer's behalf.
     */
    public setSignatureValidatorApproval = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param validatorAddress Address of Validator contract.
         * @param approval Approval or disapproval of  Validator contract.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            validatorAddress: string,
            approval: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('validatorAddress', validatorAddress);
            assert.isBoolean('approval', approval);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('setSignatureValidatorApproval(address,bool)', [
                validatorAddress.toLowerCase(),
                approval,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.setSignatureValidatorApproval.estimateGasAsync.bind(
                    self,
                    validatorAddress.toLowerCase(),
                    approval,
                ),
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
         * @param validatorAddress Address of Validator contract.
         * @param approval Approval or disapproval of  Validator contract.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            validatorAddress: string,
            approval: boolean,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('validatorAddress', validatorAddress);
            assert.isBoolean('approval', approval);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.setSignatureValidatorApproval.sendTransactionAsync(
                validatorAddress.toLowerCase(),
                approval,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param validatorAddress Address of Validator contract.
         * @param approval Approval or disapproval of  Validator contract.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            validatorAddress: string,
            approval: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('validatorAddress', validatorAddress);
            assert.isBoolean('approval', approval);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('setSignatureValidatorApproval(address,bool)', [
                validatorAddress.toLowerCase(),
                approval,
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param validatorAddress Address of Validator contract.
         * @param approval Approval or disapproval of  Validator contract.
         */
        async callAsync(
            validatorAddress: string,
            approval: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('validatorAddress', validatorAddress);
            assert.isBoolean('approval', approval);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('setSignatureValidatorApproval(address,bool)', [
                validatorAddress.toLowerCase(),
                approval,
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
            const abiEncoder = self._lookupAbiEncoder('setSignatureValidatorApproval(address,bool)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param validatorAddress Address of Validator contract.
         * @param approval Approval or disapproval of  Validator contract.
         */
        getABIEncodedTransactionData(validatorAddress: string, approval: boolean): string {
            assert.isString('validatorAddress', validatorAddress);
            assert.isBoolean('approval', approval);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'setSignatureValidatorApproval(address,bool)',
                [validatorAddress.toLowerCase(), approval],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('setSignatureValidatorApproval(address,bool)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('setSignatureValidatorApproval(address,bool)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
            validatorAddress: string,
            approval: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).setSignatureValidatorApproval.callAsync(validatorAddress, approval, txData);
            const txHash = await (this as any).setSignatureValidatorApproval.sendTransactionAsync(
                validatorAddress,
                approval,
                txData,
            );
            return txHash;
        },
    };
    public allowedValidators = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isString('index_0', index_0);
            assert.isString('index_1', index_1);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('allowedValidators(address,address)', [
                index_0.toLowerCase(),
                index_1.toLowerCase(),
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
            const abiEncoder = self._lookupAbiEncoder('allowedValidators(address,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(index_0: string, index_1: string): string {
            assert.isString('index_0', index_0);
            assert.isString('index_1', index_1);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('allowedValidators(address,address)', [
                index_0.toLowerCase(),
                index_1.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): boolean {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('allowedValidators(address,address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<boolean>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): boolean {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('allowedValidators(address,address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<boolean>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Synchronously executes multiple calls of fillOrder until total amount of takerAsset is sold by taker.
     */
    public marketSellOrders = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signatures Proofs that orders have been created by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
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
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, takerAssetFillAmount, signatures],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.marketSellOrders.estimateGasAsync.bind(self, orders, takerAssetFillAmount, signatures),
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
         * @param orders Array of order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signatures Proofs that orders have been created by makers.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
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
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.marketSellOrders.sendTransactionAsync(
                orders,
                takerAssetFillAmount,
                signatures,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signatures Proofs that orders have been created by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
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
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, takerAssetFillAmount, signatures],
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signatures Proofs that orders have been created by makers.
         * @returns Amounts filled and fees paid by makers and taker.
         */
        async callAsync(
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
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        }> {
            assert.isArray('orders', orders);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isArray('signatures', signatures);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, takerAssetFillAmount, signatures],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'marketSellOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signatures Proofs that orders have been created by makers.
         */
        getABIEncodedTransactionData(
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
            takerAssetFillAmount: BigNumber,
            signatures: string[],
        ): string {
            assert.isArray('orders', orders);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'marketSellOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, takerAssetFillAmount, signatures],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketSellOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketSellOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
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
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).marketSellOrders.callAsync(orders, takerAssetFillAmount, signatures, txData);
            const txHash = await (this as any).marketSellOrders.sendTransactionAsync(
                orders,
                takerAssetFillAmount,
                signatures,
                txData,
            );
            return txHash;
        },
    };
    /**
     * Fetches information for all passed in orders.
     */
    public getOrdersInfo = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of order specifications.
         * @returns Array of OrderInfo instances that correspond to each order.
         */
        async callAsync(
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
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>> {
            assert.isArray('orders', orders);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'getOrdersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
                [orders],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'getOrdersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<
                Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>
            >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications.
         */
        getABIEncodedTransactionData(
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
        ): string {
            assert.isArray('orders', orders);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getOrdersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
                [orders],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }> {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getOrdersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<
                Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>
            >(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }> {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getOrdersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<
                Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>
            >(returnData);
            return abiDecodedReturnData;
        },
    };
    public preSigned = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isString('index_0', index_0);
            assert.isString('index_1', index_1);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('preSigned(bytes32,address)', [
                index_0,
                index_1.toLowerCase(),
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
            const abiEncoder = self._lookupAbiEncoder('preSigned(bytes32,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(index_0: string, index_1: string): string {
            assert.isString('index_0', index_0);
            assert.isString('index_1', index_1);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('preSigned(bytes32,address)', [
                index_0,
                index_1.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): boolean {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('preSigned(bytes32,address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<boolean>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): boolean {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('preSigned(bytes32,address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<boolean>(returnData);
            return abiDecodedReturnData;
        },
    };
    public owner = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('owner()', []);
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
            const abiEncoder = self._lookupAbiEncoder('owner()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('owner()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('owner()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('owner()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Verifies that a hash has been signed by the given signer.
     */
    public isValidSignature = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param hash Any 32 byte hash.
         * @param signerAddress Address that should have signed the given hash.
         * @param signature Proof that the hash has been signed by signer.
         * @returns True if the address recovered from the provided signature matches the input signer address.
         */
        async callAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isString('hash', hash);
            assert.isString('signerAddress', signerAddress);
            assert.isString('signature', signature);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('isValidSignature(bytes32,address,bytes)', [
                hash,
                signerAddress.toLowerCase(),
                signature,
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
            const abiEncoder = self._lookupAbiEncoder('isValidSignature(bytes32,address,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param hash Any 32 byte hash.
         * @param signerAddress Address that should have signed the given hash.
         * @param signature Proof that the hash has been signed by signer.
         */
        getABIEncodedTransactionData(hash: string, signerAddress: string, signature: string): string {
            assert.isString('hash', hash);
            assert.isString('signerAddress', signerAddress);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('isValidSignature(bytes32,address,bytes)', [
                hash,
                signerAddress.toLowerCase(),
                signature,
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): boolean {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('isValidSignature(bytes32,address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<boolean>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): boolean {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('isValidSignature(bytes32,address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<boolean>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Synchronously executes multiple fill orders in a single transaction until total amount is bought by taker.
     * Returns false if the transaction would otherwise revert.
     */
    public marketBuyOrdersNoThrow = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of order specifications.
         * @param makerAssetFillAmount Desired amount of makerAsset to buy.
         * @param signatures Proofs that orders have been signed by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
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
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, makerAssetFillAmount, signatures],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.marketBuyOrdersNoThrow.estimateGasAsync.bind(self, orders, makerAssetFillAmount, signatures),
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
         * @param orders Array of order specifications.
         * @param makerAssetFillAmount Desired amount of makerAsset to buy.
         * @param signatures Proofs that orders have been signed by makers.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
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
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.marketBuyOrdersNoThrow.sendTransactionAsync(
                orders,
                makerAssetFillAmount,
                signatures,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param orders Array of order specifications.
         * @param makerAssetFillAmount Desired amount of makerAsset to buy.
         * @param signatures Proofs that orders have been signed by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
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
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, makerAssetFillAmount, signatures],
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of order specifications.
         * @param makerAssetFillAmount Desired amount of makerAsset to buy.
         * @param signatures Proofs that orders have been signed by makers.
         * @returns Amounts filled and fees paid by makers and taker.
         */
        async callAsync(
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
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        }> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, makerAssetFillAmount, signatures],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications.
         * @param makerAssetFillAmount Desired amount of makerAsset to buy.
         * @param signatures Proofs that orders have been signed by makers.
         */
        getABIEncodedTransactionData(
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
            makerAssetFillAmount: BigNumber,
            signatures: string[],
        ): string {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, makerAssetFillAmount, signatures],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
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
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).marketBuyOrdersNoThrow.callAsync(orders, makerAssetFillAmount, signatures, txData);
            const txHash = await (this as any).marketBuyOrdersNoThrow.sendTransactionAsync(
                orders,
                makerAssetFillAmount,
                signatures,
                txData,
            );
            return txHash;
        },
    };
    /**
     * Fills the input order.
     */
    public fillOrder = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
                [order, takerAssetFillAmount, signature],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.fillOrder.estimateGasAsync.bind(self, order, takerAssetFillAmount, signature),
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
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.fillOrder.sendTransactionAsync(order, takerAssetFillAmount, signature, txData);
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
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
                [order, takerAssetFillAmount, signature],
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         * @returns Amounts filled and fees paid by maker and taker.
         */
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        }> {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
                [order, takerAssetFillAmount, signature],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param order Order struct containing order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signature Proof that order has been created by maker.
         */
        getABIEncodedTransactionData(
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
            takerAssetFillAmount: BigNumber,
            signature: string,
        ): string {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
                [order, takerAssetFillAmount, signature],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
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
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).fillOrder.callAsync(order, takerAssetFillAmount, signature, txData);
            const txHash = await (this as any).fillOrder.sendTransactionAsync(
                order,
                takerAssetFillAmount,
                signature,
                txData,
            );
            return txHash;
        },
    };
    /**
     * Executes an exchange method call in the context of signer.
     */
    public executeTransaction = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param salt Arbitrary number to ensure uniqueness of transaction hash.
         * @param signerAddress Address of transaction signer.
         * @param data AbiV2 encoded calldata.
         * @param signature Proof of signer transaction by signer.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('salt', salt);
            assert.isString('signerAddress', signerAddress);
            assert.isString('data', data);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256,address,bytes,bytes)', [
                salt,
                signerAddress.toLowerCase(),
                data,
                signature,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.executeTransaction.estimateGasAsync.bind(self, salt, signerAddress.toLowerCase(), data, signature),
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
         * @param salt Arbitrary number to ensure uniqueness of transaction hash.
         * @param signerAddress Address of transaction signer.
         * @param data AbiV2 encoded calldata.
         * @param signature Proof of signer transaction by signer.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('salt', salt);
            assert.isString('signerAddress', signerAddress);
            assert.isString('data', data);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.executeTransaction.sendTransactionAsync(
                salt,
                signerAddress.toLowerCase(),
                data,
                signature,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param salt Arbitrary number to ensure uniqueness of transaction hash.
         * @param signerAddress Address of transaction signer.
         * @param data AbiV2 encoded calldata.
         * @param signature Proof of signer transaction by signer.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBigNumber('salt', salt);
            assert.isString('signerAddress', signerAddress);
            assert.isString('data', data);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256,address,bytes,bytes)', [
                salt,
                signerAddress.toLowerCase(),
                data,
                signature,
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param salt Arbitrary number to ensure uniqueness of transaction hash.
         * @param signerAddress Address of transaction signer.
         * @param data AbiV2 encoded calldata.
         * @param signature Proof of signer transaction by signer.
         */
        async callAsync(
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('salt', salt);
            assert.isString('signerAddress', signerAddress);
            assert.isString('data', data);
            assert.isString('signature', signature);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256,address,bytes,bytes)', [
                salt,
                signerAddress.toLowerCase(),
                data,
                signature,
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
            const abiEncoder = self._lookupAbiEncoder('executeTransaction(uint256,address,bytes,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param salt Arbitrary number to ensure uniqueness of transaction hash.
         * @param signerAddress Address of transaction signer.
         * @param data AbiV2 encoded calldata.
         * @param signature Proof of signer transaction by signer.
         */
        getABIEncodedTransactionData(salt: BigNumber, signerAddress: string, data: string, signature: string): string {
            assert.isBigNumber('salt', salt);
            assert.isString('signerAddress', signerAddress);
            assert.isString('data', data);
            assert.isString('signature', signature);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'executeTransaction(uint256,address,bytes,bytes)',
                [salt, signerAddress.toLowerCase(), data, signature],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('executeTransaction(uint256,address,bytes,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('executeTransaction(uint256,address,bytes,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).executeTransaction.callAsync(salt, signerAddress, data, signature, txData);
            const txHash = await (this as any).executeTransaction.sendTransactionAsync(
                salt,
                signerAddress,
                data,
                signature,
                txData,
            );
            return txHash;
        },
    };
    /**
     * Registers an asset proxy to its asset proxy id.
     * Once an asset proxy is registered, it cannot be unregistered.
     */
    public registerAssetProxy = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param assetProxy Address of new asset proxy to register.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(assetProxy: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('assetProxy', assetProxy);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('registerAssetProxy(address)', [assetProxy.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.registerAssetProxy.estimateGasAsync.bind(self, assetProxy.toLowerCase()),
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
         * @param assetProxy Address of new asset proxy to register.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            assetProxy: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('assetProxy', assetProxy);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.registerAssetProxy.sendTransactionAsync(assetProxy.toLowerCase(), txData);
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
         * @param assetProxy Address of new asset proxy to register.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(assetProxy: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('assetProxy', assetProxy);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('registerAssetProxy(address)', [assetProxy.toLowerCase()]);
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
         * @param assetProxy Address of new asset proxy to register.
         */
        async callAsync(
            assetProxy: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('assetProxy', assetProxy);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('registerAssetProxy(address)', [assetProxy.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('registerAssetProxy(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param assetProxy Address of new asset proxy to register.
         */
        getABIEncodedTransactionData(assetProxy: string): string {
            assert.isString('assetProxy', assetProxy);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('registerAssetProxy(address)', [
                assetProxy.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('registerAssetProxy(address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('registerAssetProxy(address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
            assetProxy: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).registerAssetProxy.callAsync(assetProxy, txData);
            const txHash = await (this as any).registerAssetProxy.sendTransactionAsync(assetProxy, txData);
            return txHash;
        },
    };
    /**
     * Gets information about an order: status, hash, and amount filled.
     */
    public getOrderInfo = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param order Order to gather information on.
         * @returns OrderInfo Information about the order and its state.         See LibOrder.OrderInfo for a complete description.
         */
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
        ): Promise<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'getOrderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                orderStatus: number;
                orderHash: string;
                orderTakerAssetFilledAmount: BigNumber;
            }>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param order Order to gather information on.
         */
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
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getOrderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
                [order],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): { orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
                orderStatus: number;
                orderHash: string;
                orderTakerAssetFilledAmount: BigNumber;
            }>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): { orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                orderStatus: number;
                orderHash: string;
                orderTakerAssetFilledAmount: BigNumber;
            }>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * After calling, the order can not be filled anymore.
     * Throws if order is invalid or sender does not have permission to cancel.
     */
    public cancelOrder = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param order Order to cancel. Order must be OrderStatus.FILLABLE.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
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
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
                [order],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.cancelOrder.estimateGasAsync.bind(self, order),
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
         * @param order Order to cancel. Order must be OrderStatus.FILLABLE.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
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
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.cancelOrder.sendTransactionAsync(order, txData);
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
         * @param order Order to cancel. Order must be OrderStatus.FILLABLE.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
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
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param order Order to cancel. Order must be OrderStatus.FILLABLE.
         */
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
        ): Promise<void> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param order Order to cancel. Order must be OrderStatus.FILLABLE.
         */
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
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
                [order],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
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
            await (this as any).cancelOrder.callAsync(order, txData);
            const txHash = await (this as any).cancelOrder.sendTransactionAsync(order, txData);
            return txHash;
        },
    };
    public orderEpoch = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isString('index_0', index_0);
            assert.isString('index_1', index_1);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('orderEpoch(address,address)', [
                index_0.toLowerCase(),
                index_1.toLowerCase(),
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
            const abiEncoder = self._lookupAbiEncoder('orderEpoch(address,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(index_0: string, index_1: string): string {
            assert.isString('index_0', index_0);
            assert.isString('index_1', index_1);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('orderEpoch(address,address)', [
                index_0.toLowerCase(),
                index_1.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('orderEpoch(address,address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('orderEpoch(address,address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    public ZRX_ASSET_DATA = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('ZRX_ASSET_DATA()', []);
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
            const abiEncoder = self._lookupAbiEncoder('ZRX_ASSET_DATA()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('ZRX_ASSET_DATA()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('ZRX_ASSET_DATA()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('ZRX_ASSET_DATA()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Synchronously executes multiple calls of fillOrder until total amount of takerAsset is sold by taker.
     * Returns false if the transaction would otherwise revert.
     */
    public marketSellOrdersNoThrow = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signatures Proofs that orders have been signed by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
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
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, takerAssetFillAmount, signatures],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.marketSellOrdersNoThrow.estimateGasAsync.bind(self, orders, takerAssetFillAmount, signatures),
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
         * @param orders Array of order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signatures Proofs that orders have been signed by makers.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
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
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.marketSellOrdersNoThrow.sendTransactionAsync(
                orders,
                takerAssetFillAmount,
                signatures,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signatures Proofs that orders have been signed by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
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
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, takerAssetFillAmount, signatures],
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signatures Proofs that orders have been signed by makers.
         * @returns Amounts filled and fees paid by makers and taker.
         */
        async callAsync(
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
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        }> {
            assert.isArray('orders', orders);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isArray('signatures', signatures);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, takerAssetFillAmount, signatures],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications.
         * @param takerAssetFillAmount Desired amount of takerAsset to sell.
         * @param signatures Proofs that orders have been signed by makers.
         */
        getABIEncodedTransactionData(
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
            takerAssetFillAmount: BigNumber,
            signatures: string[],
        ): string {
            assert.isArray('orders', orders);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, takerAssetFillAmount, signatures],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
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
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).marketSellOrdersNoThrow.callAsync(orders, takerAssetFillAmount, signatures, txData);
            const txHash = await (this as any).marketSellOrdersNoThrow.sendTransactionAsync(
                orders,
                takerAssetFillAmount,
                signatures,
                txData,
            );
            return txHash;
        },
    };
    public EIP712_DOMAIN_HASH = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('EIP712_DOMAIN_HASH()', []);
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
            const abiEncoder = self._lookupAbiEncoder('EIP712_DOMAIN_HASH()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('EIP712_DOMAIN_HASH()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('EIP712_DOMAIN_HASH()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('EIP712_DOMAIN_HASH()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Synchronously executes multiple calls of fillOrder until total amount of makerAsset is bought by taker.
     */
    public marketBuyOrders = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of order specifications.
         * @param makerAssetFillAmount Desired amount of makerAsset to buy.
         * @param signatures Proofs that orders have been signed by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
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
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, makerAssetFillAmount, signatures],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.marketBuyOrders.estimateGasAsync.bind(self, orders, makerAssetFillAmount, signatures),
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
         * @param orders Array of order specifications.
         * @param makerAssetFillAmount Desired amount of makerAsset to buy.
         * @param signatures Proofs that orders have been signed by makers.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
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
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.marketBuyOrders.sendTransactionAsync(
                orders,
                makerAssetFillAmount,
                signatures,
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param orders Array of order specifications.
         * @param makerAssetFillAmount Desired amount of makerAsset to buy.
         * @param signatures Proofs that orders have been signed by makers.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
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
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, makerAssetFillAmount, signatures],
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of order specifications.
         * @param makerAssetFillAmount Desired amount of makerAsset to buy.
         * @param signatures Proofs that orders have been signed by makers.
         * @returns Amounts filled and fees paid by makers and taker.
         */
        async callAsync(
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
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        }> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, makerAssetFillAmount, signatures],
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'marketBuyOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications.
         * @param makerAssetFillAmount Desired amount of makerAsset to buy.
         * @param signatures Proofs that orders have been signed by makers.
         */
        getABIEncodedTransactionData(
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
            makerAssetFillAmount: BigNumber,
            signatures: string[],
        ): string {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'marketBuyOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
                [orders, makerAssetFillAmount, signatures],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketBuyOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): {
            makerAssetFilledAmount: BigNumber;
            takerAssetFilledAmount: BigNumber;
            makerFeePaid: BigNumber;
            takerFeePaid: BigNumber;
        } {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketBuyOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                makerAssetFilledAmount: BigNumber;
                takerAssetFilledAmount: BigNumber;
                makerFeePaid: BigNumber;
                takerFeePaid: BigNumber;
            }>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
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
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).marketBuyOrders.callAsync(orders, makerAssetFillAmount, signatures, txData);
            const txHash = await (this as any).marketBuyOrders.sendTransactionAsync(
                orders,
                makerAssetFillAmount,
                signatures,
                txData,
            );
            return txHash;
        },
    };
    public currentContextAddress = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('currentContextAddress()', []);
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
            const abiEncoder = self._lookupAbiEncoder('currentContextAddress()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('currentContextAddress()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('currentContextAddress()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('currentContextAddress()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public transferOwnership = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(newOwner: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.transferOwnership.estimateGasAsync.bind(self, newOwner.toLowerCase()),
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
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            newOwner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ExchangeContract;
            const txHashPromise = self.transferOwnership.sendTransactionAsync(newOwner.toLowerCase(), txData);
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
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(newOwner: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ExchangeContract;
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(newOwner: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('newOwner', newOwner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(newOwner: string): string {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('transferOwnership(address)', [
                newOwner.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(newOwner: string, txData?: Partial<TxData> | undefined): Promise<string> {
            await (this as any).transferOwnership.callAsync(newOwner, txData);
            const txHash = await (this as any).transferOwnership.sendTransactionAsync(newOwner, txData);
            return txHash;
        },
    };
    public VERSION = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ExchangeContract;
            const encodedData = self._strictEncodeArguments('VERSION()', []);
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
            const abiEncoder = self._lookupAbiEncoder('VERSION()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('VERSION()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('VERSION()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ExchangeContract;
            const abiEncoder = self._lookupAbiEncoder('VERSION()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    private readonly _subscriptionManager: SubscriptionManager<ExchangeEventArgs, ExchangeEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
        _zrxAssetData: string,
    ): Promise<ExchangeContract> {
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
        return ExchangeContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
            _zrxAssetData,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
        _zrxAssetData: string,
    ): Promise<ExchangeContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_zrxAssetData] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_zrxAssetData],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_zrxAssetData]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`Exchange successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ExchangeContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [_zrxAssetData];
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
                        name: 'index_0',
                        type: 'bytes32',
                    },
                ],
                name: 'filled',
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
                        name: 'takerAssetFillAmounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'batchFillOrders',
                outputs: [
                    {
                        name: 'totalFillResults',
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
                ],
                payable: false,
                stateMutability: 'nonpayable',
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
                name: 'cancelled',
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
                        name: 'hash',
                        type: 'bytes32',
                    },
                    {
                        name: 'signerAddress',
                        type: 'address',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'preSign',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'leftOrder',
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
                        name: 'rightOrder',
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
                        name: 'leftSignature',
                        type: 'bytes',
                    },
                    {
                        name: 'rightSignature',
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
                    {
                        name: 'takerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'fillOrderNoThrow',
                outputs: [
                    {
                        name: 'fillResults',
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
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'bytes4',
                    },
                ],
                name: 'assetProxies',
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
                ],
                name: 'batchCancelOrders',
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
                        ],
                    },
                    {
                        name: 'takerAssetFillAmounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'batchFillOrKillOrders',
                outputs: [
                    {
                        name: 'totalFillResults',
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
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'targetOrderEpoch',
                        type: 'uint256',
                    },
                ],
                name: 'cancelOrdersUpTo',
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
                        ],
                    },
                    {
                        name: 'takerAssetFillAmounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'batchFillOrdersNoThrow',
                outputs: [
                    {
                        name: 'totalFillResults',
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
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'assetProxyId',
                        type: 'bytes4',
                    },
                ],
                name: 'getAssetProxy',
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
                        type: 'bytes32',
                    },
                ],
                name: 'transactions',
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
                        name: 'takerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'fillOrKillOrder',
                outputs: [
                    {
                        name: 'fillResults',
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
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'validatorAddress',
                        type: 'address',
                    },
                    {
                        name: 'approval',
                        type: 'bool',
                    },
                ],
                name: 'setSignatureValidatorApproval',
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
                    {
                        name: 'index_1',
                        type: 'address',
                    },
                ],
                name: 'allowedValidators',
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
                        name: 'takerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'marketSellOrders',
                outputs: [
                    {
                        name: 'totalFillResults',
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
                ],
                payable: false,
                stateMutability: 'nonpayable',
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
                ],
                name: 'getOrdersInfo',
                outputs: [
                    {
                        name: '',
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
                        type: 'address',
                    },
                ],
                name: 'preSigned',
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
                        name: 'hash',
                        type: 'bytes32',
                    },
                    {
                        name: 'signerAddress',
                        type: 'address',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'isValidSignature',
                outputs: [
                    {
                        name: 'isValid',
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
                        name: 'makerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'marketBuyOrdersNoThrow',
                outputs: [
                    {
                        name: 'totalFillResults',
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
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
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
                    {
                        name: 'takerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'fillOrder',
                outputs: [
                    {
                        name: 'fillResults',
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
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'salt',
                        type: 'uint256',
                    },
                    {
                        name: 'signerAddress',
                        type: 'address',
                    },
                    {
                        name: 'data',
                        type: 'bytes',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'executeTransaction',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'assetProxy',
                        type: 'address',
                    },
                ],
                name: 'registerAssetProxy',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
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
                ],
                name: 'getOrderInfo',
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
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
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
                name: 'cancelOrder',
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
                    {
                        name: 'index_1',
                        type: 'address',
                    },
                ],
                name: 'orderEpoch',
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
                name: 'ZRX_ASSET_DATA',
                outputs: [
                    {
                        name: '',
                        type: 'bytes',
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
                        name: 'takerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'marketSellOrdersNoThrow',
                outputs: [
                    {
                        name: 'totalFillResults',
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
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'EIP712_DOMAIN_HASH',
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
                        ],
                    },
                    {
                        name: 'makerAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'marketBuyOrders',
                outputs: [
                    {
                        name: 'totalFillResults',
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
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'currentContextAddress',
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
                inputs: [],
                name: 'VERSION',
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
                inputs: [
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
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'signerAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'validatorAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'approved',
                        type: 'bool',
                        indexed: false,
                    },
                ],
                name: 'SignatureValidatorApproval',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'makerAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'feeRecipientAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'takerAddress',
                        type: 'address',
                        indexed: false,
                    },
                    {
                        name: 'senderAddress',
                        type: 'address',
                        indexed: false,
                    },
                    {
                        name: 'makerAssetFilledAmount',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'takerAssetFilledAmount',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'makerFeePaid',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'takerFeePaid',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'orderHash',
                        type: 'bytes32',
                        indexed: true,
                    },
                    {
                        name: 'makerAssetData',
                        type: 'bytes',
                        indexed: false,
                    },
                    {
                        name: 'takerAssetData',
                        type: 'bytes',
                        indexed: false,
                    },
                ],
                name: 'Fill',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'makerAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'feeRecipientAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'senderAddress',
                        type: 'address',
                        indexed: false,
                    },
                    {
                        name: 'orderHash',
                        type: 'bytes32',
                        indexed: true,
                    },
                    {
                        name: 'makerAssetData',
                        type: 'bytes',
                        indexed: false,
                    },
                    {
                        name: 'takerAssetData',
                        type: 'bytes',
                        indexed: false,
                    },
                ],
                name: 'Cancel',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'makerAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'senderAddress',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'orderEpoch',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'CancelUpTo',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'id',
                        type: 'bytes4',
                        indexed: false,
                    },
                    {
                        name: 'assetProxy',
                        type: 'address',
                        indexed: false,
                    },
                ],
                name: 'AssetProxyRegistered',
                outputs: [],
                type: 'event',
            },
        ] as ContractAbi;
        return abi;
    }
    /**
     * Subscribe to an event type emitted by the Exchange contract.
     * @param eventName The Exchange contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends ExchangeEventArgs>(
        eventName: ExchangeEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, ExchangeEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            ExchangeContract.ABI(),
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
     * @param eventName The Exchange contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends ExchangeEventArgs>(
        eventName: ExchangeEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, ExchangeEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            ExchangeContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
    ) {
        super('Exchange', ExchangeContract.ABI(), address, supportedProvider, txDefaults, logDecodeDependencies);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<ExchangeEventArgs, ExchangeEvents>(
            ExchangeContract.ABI(),
            this._web3Wrapper,
        );
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
