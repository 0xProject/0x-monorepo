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
    /**
     * Attempt to purchase makerAssetFillAmount of makerAsset by selling ETH provided with transaction.
     * Any ZRX required to pay fees for primary orders will automatically be purchased by this contract.
     * Any ETH not spent will be refunded to sender.
     */
    public marketBuyOrdersWithEth = {
        /**
         * Sends the transaction
         * @param orders         Array of order specifications used containing desired makerAsset and WETH as takerAsset.
         * @param makerAssetFillAmount         Desired amount of makerAsset to purchase.
         * @param signatures         Proofs that orders have been created by makers.
         * @param feeOrders         Array of order specifications containing ZRX as makerAsset and WETH as takerAsset. Used to purchase ZRX for primary order fees.
         * @param feeSignatures         Proofs that feeOrders have been created by makers.
         * @param feePercentage         Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
         * @param feeRecipient         Address that will receive ETH when orders are filled.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
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
            feeOrders: Array<{
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
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            assert.isArray('feeOrders', feeOrders);
            assert.isArray('feeSignatures', feeSignatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)',
                [
                    orders,
                    makerAssetFillAmount,
                    signatures,
                    feeOrders,
                    feeSignatures,
                    feePercentage,
                    feeRecipient.toLowerCase(),
                ],
            );
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
                    feeRecipient.toLowerCase(),
                ),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param orders         Array of order specifications used containing desired makerAsset and WETH as takerAsset.
         * @param makerAssetFillAmount         Desired amount of makerAsset to purchase.
         * @param signatures         Proofs that orders have been created by makers.
         * @param feeOrders         Array of order specifications containing ZRX as makerAsset and WETH as takerAsset. Used to purchase ZRX for primary order fees.
         * @param feeSignatures         Proofs that feeOrders have been created by makers.
         * @param feePercentage         Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
         * @param feeRecipient         Address that will receive ETH when orders are filled.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
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
            feeOrders: Array<{
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
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            assert.isArray('feeOrders', feeOrders);
            assert.isArray('feeSignatures', feeSignatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.marketBuyOrdersWithEth.sendTransactionAsync(
                orders,
                makerAssetFillAmount,
                signatures,
                feeOrders,
                feeSignatures,
                feePercentage,
                feeRecipient.toLowerCase(),
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
         * Estimate gas to send the transaction
         * @param orders         Array of order specifications used containing desired makerAsset and WETH as takerAsset.
         * @param makerAssetFillAmount         Desired amount of makerAsset to purchase.
         * @param signatures         Proofs that orders have been created by makers.
         * @param feeOrders         Array of order specifications containing ZRX as makerAsset and WETH as takerAsset. Used to purchase ZRX for primary order fees.
         * @param feeSignatures         Proofs that feeOrders have been created by makers.
         * @param feePercentage         Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
         * @param feeRecipient         Address that will receive ETH when orders are filled.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
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
            feeOrders: Array<{
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
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            assert.isArray('feeOrders', feeOrders);
            assert.isArray('feeSignatures', feeSignatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)',
                [
                    orders,
                    makerAssetFillAmount,
                    signatures,
                    feeOrders,
                    feeSignatures,
                    feePercentage,
                    feeRecipient.toLowerCase(),
                ],
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
         * Calls the method
         * @param orders         Array of order specifications used containing desired makerAsset and WETH as takerAsset.
         * @param makerAssetFillAmount         Desired amount of makerAsset to purchase.
         * @param signatures         Proofs that orders have been created by makers.
         * @param feeOrders         Array of order specifications containing ZRX as makerAsset and WETH as takerAsset. Used to purchase ZRX for primary order fees.
         * @param feeSignatures         Proofs that feeOrders have been created by makers.
         * @param feePercentage         Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
         * @param feeRecipient         Address that will receive ETH when orders are filled.
         * @returns Amounts filled and fees paid by maker and taker for both sets of orders.
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
            feeOrders: Array<{
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
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<
            [
                {
                    makerAssetFilledAmount: BigNumber;
                    takerAssetFilledAmount: BigNumber;
                    makerFeePaid: BigNumber;
                    takerFeePaid: BigNumber;
                },
                {
                    makerAssetFilledAmount: BigNumber;
                    takerAssetFilledAmount: BigNumber;
                    makerFeePaid: BigNumber;
                    takerFeePaid: BigNumber;
                }
            ]
        > {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            assert.isArray('feeOrders', feeOrders);
            assert.isArray('feeSignatures', feeSignatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)',
                [
                    orders,
                    makerAssetFillAmount,
                    signatures,
                    feeOrders,
                    feeSignatures,
                    feePercentage,
                    feeRecipient.toLowerCase(),
                ],
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
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<
                [
                    {
                        makerAssetFilledAmount: BigNumber;
                        takerAssetFilledAmount: BigNumber;
                        makerFeePaid: BigNumber;
                        takerFeePaid: BigNumber;
                    },
                    {
                        makerAssetFilledAmount: BigNumber;
                        takerAssetFilledAmount: BigNumber;
                        makerFeePaid: BigNumber;
                        takerFeePaid: BigNumber;
                    }
                ]
            >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param orders         Array of order specifications used containing desired makerAsset and WETH as takerAsset.
         * @param makerAssetFillAmount         Desired amount of makerAsset to purchase.
         * @param signatures         Proofs that orders have been created by makers.
         * @param feeOrders         Array of order specifications containing ZRX as makerAsset and WETH as takerAsset. Used to purchase ZRX for primary order fees.
         * @param feeSignatures         Proofs that feeOrders have been created by makers.
         * @param feePercentage         Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
         * @param feeRecipient         Address that will receive ETH when orders are filled.
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
            feeOrders: Array<{
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
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
        ): string {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
            assert.isArray('signatures', signatures);
            assert.isArray('feeOrders', feeOrders);
            assert.isArray('feeSignatures', feeSignatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)',
                [
                    orders,
                    makerAssetFillAmount,
                    signatures,
                    feeOrders,
                    feeSignatures,
                    feePercentage,
                    feeRecipient.toLowerCase(),
                ],
            );
            return abiEncodedTransactionData;
        },
    };
    /**
     * Withdraws assets from this contract. The contract requires a ZRX balance in order to
     * function optimally, and this function allows the ZRX to be withdrawn by owner. It may also be
     * used to withdraw assets that were accidentally sent to this contract.
     */
    public withdrawAsset = {
        /**
         * Sends the transaction
         * @param assetData         Byte array encoded for the respective asset proxy.
         * @param amount         Amount of ERC20 token to withdraw.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(
            assetData: string,
            amount: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('assetData', assetData);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('withdrawAsset(bytes,uint256)', [assetData, amount]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.withdrawAsset.estimateGasAsync.bind(self, assetData, amount),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param assetData         Byte array encoded for the respective asset proxy.
         * @param amount         Amount of ERC20 token to withdraw.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            assetData: string,
            amount: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('assetData', assetData);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.withdrawAsset.sendTransactionAsync(assetData, amount, txData);
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
         * Estimate gas to send the transaction
         * @param assetData         Byte array encoded for the respective asset proxy.
         * @param amount         Amount of ERC20 token to withdraw.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(
            assetData: string,
            amount: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('assetData', assetData);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('withdrawAsset(bytes,uint256)', [assetData, amount]);
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
         * Calls the method
         * @param assetData         Byte array encoded for the respective asset proxy.
         * @param amount         Amount of ERC20 token to withdraw.
         */
        async callAsync(
            assetData: string,
            amount: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('assetData', assetData);
            assert.isBigNumber('amount', amount);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('withdrawAsset(bytes,uint256)', [assetData, amount]);
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
            const abiEncoder = self._lookupAbiEncoder('withdrawAsset(bytes,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param assetData         Byte array encoded for the respective asset proxy.
         * @param amount         Amount of ERC20 token to withdraw.
         */
        getABIEncodedTransactionData(assetData: string, amount: BigNumber): string {
            assert.isString('assetData', assetData);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('withdrawAsset(bytes,uint256)', [
                assetData,
                amount,
            ]);
            return abiEncodedTransactionData;
        },
    };
    public owner = {
        /**
         * Calls the method
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
            const self = (this as any) as ForwarderContract;
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
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('owner()', []);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Purchases as much of orders' makerAssets as possible by selling up to 95% of transaction's ETH value.
     * Any ZRX required to pay fees for primary orders will automatically be purchased by this contract.
     * 5% of ETH value is reserved for paying fees to order feeRecipients (in ZRX) and forwarding contract feeRecipient (in ETH).
     * Any ETH not spent will be refunded to sender.
     */
    public marketSellOrdersWithEth = {
        /**
         * Sends the transaction
         * @param orders         Array of order specifications used containing desired makerAsset and WETH as takerAsset.
         * @param signatures         Proofs that orders have been created by makers.
         * @param feeOrders         Array of order specifications containing ZRX as makerAsset and WETH as takerAsset. Used to purchase ZRX for primary order fees.
         * @param feeSignatures         Proofs that feeOrders have been created by makers.
         * @param feePercentage         Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
         * @param feeRecipient         Address that will receive ETH when orders are filled.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
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
            signatures: string[],
            feeOrders: Array<{
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
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isArray('feeOrders', feeOrders);
            assert.isArray('feeSignatures', feeSignatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)',
                [orders, signatures, feeOrders, feeSignatures, feePercentage, feeRecipient.toLowerCase()],
            );
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
                    feeRecipient.toLowerCase(),
                ),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param orders         Array of order specifications used containing desired makerAsset and WETH as takerAsset.
         * @param signatures         Proofs that orders have been created by makers.
         * @param feeOrders         Array of order specifications containing ZRX as makerAsset and WETH as takerAsset. Used to purchase ZRX for primary order fees.
         * @param feeSignatures         Proofs that feeOrders have been created by makers.
         * @param feePercentage         Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
         * @param feeRecipient         Address that will receive ETH when orders are filled.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
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
            signatures: string[],
            feeOrders: Array<{
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
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isArray('feeOrders', feeOrders);
            assert.isArray('feeSignatures', feeSignatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.marketSellOrdersWithEth.sendTransactionAsync(
                orders,
                signatures,
                feeOrders,
                feeSignatures,
                feePercentage,
                feeRecipient.toLowerCase(),
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
         * Estimate gas to send the transaction
         * @param orders         Array of order specifications used containing desired makerAsset and WETH as takerAsset.
         * @param signatures         Proofs that orders have been created by makers.
         * @param feeOrders         Array of order specifications containing ZRX as makerAsset and WETH as takerAsset. Used to purchase ZRX for primary order fees.
         * @param feeSignatures         Proofs that feeOrders have been created by makers.
         * @param feePercentage         Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
         * @param feeRecipient         Address that will receive ETH when orders are filled.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
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
            signatures: string[],
            feeOrders: Array<{
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
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isArray('feeOrders', feeOrders);
            assert.isArray('feeSignatures', feeSignatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)',
                [orders, signatures, feeOrders, feeSignatures, feePercentage, feeRecipient.toLowerCase()],
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
         * Calls the method
         * @param orders         Array of order specifications used containing desired makerAsset and WETH as takerAsset.
         * @param signatures         Proofs that orders have been created by makers.
         * @param feeOrders         Array of order specifications containing ZRX as makerAsset and WETH as takerAsset. Used to purchase ZRX for primary order fees.
         * @param feeSignatures         Proofs that feeOrders have been created by makers.
         * @param feePercentage         Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
         * @param feeRecipient         Address that will receive ETH when orders are filled.
         * @returns Amounts filled and fees paid by maker and taker for both sets of orders.
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
            signatures: string[],
            feeOrders: Array<{
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
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<
            [
                {
                    makerAssetFilledAmount: BigNumber;
                    takerAssetFilledAmount: BigNumber;
                    makerFeePaid: BigNumber;
                    takerFeePaid: BigNumber;
                },
                {
                    makerAssetFilledAmount: BigNumber;
                    takerAssetFilledAmount: BigNumber;
                    makerFeePaid: BigNumber;
                    takerFeePaid: BigNumber;
                }
            ]
        > {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isArray('feeOrders', feeOrders);
            assert.isArray('feeSignatures', feeSignatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)',
                [orders, signatures, feeOrders, feeSignatures, feePercentage, feeRecipient.toLowerCase()],
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
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<
                [
                    {
                        makerAssetFilledAmount: BigNumber;
                        takerAssetFilledAmount: BigNumber;
                        makerFeePaid: BigNumber;
                        takerFeePaid: BigNumber;
                    },
                    {
                        makerAssetFilledAmount: BigNumber;
                        takerAssetFilledAmount: BigNumber;
                        makerFeePaid: BigNumber;
                        takerFeePaid: BigNumber;
                    }
                ]
            >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param orders         Array of order specifications used containing desired makerAsset and WETH as takerAsset.
         * @param signatures         Proofs that orders have been created by makers.
         * @param feeOrders         Array of order specifications containing ZRX as makerAsset and WETH as takerAsset. Used to purchase ZRX for primary order fees.
         * @param feeSignatures         Proofs that feeOrders have been created by makers.
         * @param feePercentage         Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
         * @param feeRecipient         Address that will receive ETH when orders are filled.
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
            signatures: string[],
            feeOrders: Array<{
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
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
        ): string {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isArray('feeOrders', feeOrders);
            assert.isArray('feeSignatures', feeSignatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[],uint256,address)',
                [orders, signatures, feeOrders, feeSignatures, feePercentage, feeRecipient.toLowerCase()],
            );
            return abiEncodedTransactionData;
        },
    };
    public transferOwnership = {
        /**
         * Sends the transaction
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(newOwner: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ForwarderContract;
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
         * Sends the transaction and wait for it to succeed
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            newOwner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ForwarderContract;
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
         * Estimate gas to send the transaction
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(newOwner: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ForwarderContract;
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
         * Calls the method
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
            const self = (this as any) as ForwarderContract;
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
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(newOwner: string): string {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('transferOwnership(address)', [
                newOwner.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
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
        return ForwarderContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            _exchange,
            _zrxAssetData,
            _wethAssetData,
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
        [_exchange, _zrxAssetData, _wethAssetData] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange, _zrxAssetData, _wethAssetData],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_exchange, _zrxAssetData, _wethAssetData]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`Forwarder successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ForwarderContract(txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [_exchange, _zrxAssetData, _wethAssetData];
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
                    {
                        name: 'feeOrders',
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
                        name: 'feeSignatures',
                        type: 'bytes[]',
                    },
                    {
                        name: 'feePercentage',
                        type: 'uint256',
                    },
                    {
                        name: 'feeRecipient',
                        type: 'address',
                    },
                ],
                name: 'marketBuyOrdersWithEth',
                outputs: [
                    {
                        name: 'orderFillResults',
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
                        name: 'feeOrderFillResults',
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
                payable: true,
                stateMutability: 'payable',
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
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                    {
                        name: 'feeOrders',
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
                        name: 'feeSignatures',
                        type: 'bytes[]',
                    },
                    {
                        name: 'feePercentage',
                        type: 'uint256',
                    },
                    {
                        name: 'feeRecipient',
                        type: 'address',
                    },
                ],
                name: 'marketSellOrdersWithEth',
                outputs: [
                    {
                        name: 'orderFillResults',
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
                        name: 'feeOrderFillResults',
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
                payable: true,
                stateMutability: 'payable',
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
                inputs: [
                    {
                        name: '_exchange',
                        type: 'address',
                    },
                    {
                        name: '_zrxAssetData',
                        type: 'bytes',
                    },
                    {
                        name: '_wethAssetData',
                        type: 'bytes',
                    },
                ],
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor',
            },
            {
                inputs: [],
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'fallback',
            },
        ] as ContractAbi;
        return abi;
    }
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('Forwarder', ForwarderContract.ABI(), address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
