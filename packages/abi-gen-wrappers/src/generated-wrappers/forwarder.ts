// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma enum-naming
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import { BaseContract, PromiseWithTransactionHash } from '@0x/base-contract';
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
import {
    AwaitTransactionSuccessOpts,
    EventCallback,
    IndexedFilterValues,
    SendTransactionOpts,
    SimpleContractArtifact,
} from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ForwarderContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode: string | undefined;
    /**
     * Approves the respective proxy for a given asset to transfer tokens on the Forwarder contract's behalf.
     * This is necessary because an order fee denominated in the maker asset (i.e. a percentage fee) is sent by the
     * Forwarder contract to the fee recipient.
     * This method needs to be called before forwarding orders of a maker asset that hasn't
     * previously been approved.
     */
    public approveMakerAssetProxy = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            assetData: string,
            txData?: Partial<TxData> | undefined,
            opts: SendTransactionOpts = { shouldValidate: true },
        ): Promise<string> {
            assert.isString('assetData', assetData);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('approveMakerAssetProxy(bytes)', [assetData]);
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
                await self.approveMakerAssetProxy.callAsync(assetData, txDataWithDefaults);
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            assetData: string,
            txData?: Partial<TxData>,
            opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('assetData', assetData);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.approveMakerAssetProxy.sendTransactionAsync(assetData, txData, opts);
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(assetData: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('assetData', assetData);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('approveMakerAssetProxy(bytes)', [assetData]);
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
         * @param assetData Byte array encoded for the respective asset proxy.
         */
        async callAsync(assetData: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('approveMakerAssetProxy(bytes)', [assetData]);
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
            const abiEncoder = self._lookupAbiEncoder('approveMakerAssetProxy(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param assetData Byte array encoded for the respective asset proxy.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(assetData: string): string {
            assert.isString('assetData', assetData);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('approveMakerAssetProxy(bytes)', [assetData]);
            return abiEncodedTransactionData;
        },
        /**
         * Returns the 4 byte function selector as a hex string.
         */
        getSelector(): string {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder('approveMakerAssetProxy(bytes)');
            return abiEncoder.getSelector();
        },
    };
    /**
     * Attempt to buy makerAssetBuyAmount of makerAsset by selling ETH provided with transaction.
     * The Forwarder may *fill* more than makerAssetBuyAmount of the makerAsset so that it can
     * pay takerFees where takerFeeAssetData == makerAssetData (i.e. percentage fees).
     * Any ETH not spent will be refunded to sender.
     */
    public marketBuyOrdersWithEth = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
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
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            makerAssetBuyAmount: BigNumber,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
            opts: SendTransactionOpts = { shouldValidate: true },
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
                [orders, makerAssetBuyAmount, signatures, feePercentage, feeRecipient.toLowerCase()],
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
                await self.marketBuyOrdersWithEth.callAsync(
                    orders,
                    makerAssetBuyAmount,
                    signatures,
                    feePercentage,
                    feeRecipient,
                    txDataWithDefaults,
                );
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
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
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            makerAssetBuyAmount: BigNumber,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData>,
            opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.marketBuyOrdersWithEth.sendTransactionAsync(
                orders,
                makerAssetBuyAmount,
                signatures,
                feePercentage,
                feeRecipient.toLowerCase(),
                txData,
                opts,
            );
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
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
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            makerAssetBuyAmount: BigNumber,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
                [orders, makerAssetBuyAmount, signatures, feePercentage, feeRecipient.toLowerCase()],
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
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @returns wethSpentAmount Amount of WETH spent on the given set of orders.makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.ethFeePaid Amount of ETH spent on the given forwarder fee.
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
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            makerAssetBuyAmount: BigNumber,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[BigNumber, BigNumber, BigNumber]> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
            assert.isArray('signatures', signatures);
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
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
                [orders, makerAssetBuyAmount, signatures, feePercentage, feeRecipient.toLowerCase()],
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
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber, BigNumber]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @returns The ABI encoded transaction data as a string
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
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            makerAssetBuyAmount: BigNumber,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
        ): string {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
                [orders, makerAssetBuyAmount, signatures, feePercentage, feeRecipient.toLowerCase()],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Returns the 4 byte function selector as a hex string.
         */
        getSelector(): string {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
            );
            return abiEncoder.getSelector();
        },
    };
    /**
     * Purchases as much of orders' makerAssets as possible by selling as much of the ETH value sent
     * as possible, accounting for order and forwarder fees.
     */
    public marketSellOrdersWithEth = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
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
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
            opts: SendTransactionOpts = { shouldValidate: true },
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
                [orders, signatures, feePercentage, feeRecipient.toLowerCase()],
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
                await self.marketSellOrdersWithEth.callAsync(
                    orders,
                    signatures,
                    feePercentage,
                    feeRecipient,
                    txDataWithDefaults,
                );
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
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
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData>,
            opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.marketSellOrdersWithEth.sendTransactionAsync(
                orders,
                signatures,
                feePercentage,
                feeRecipient.toLowerCase(),
                txData,
                opts,
            );
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
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
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
                [orders, signatures, feePercentage, feeRecipient.toLowerCase()],
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
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @returns wethSpentAmount Amount of WETH spent on the given set of orders.makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.ethFeePaid Amount of ETH spent on the given forwarder fee.
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
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[BigNumber, BigNumber, BigNumber]> {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
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
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
                [orders, signatures, feePercentage, feeRecipient.toLowerCase()],
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
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber, BigNumber]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @returns The ABI encoded transaction data as a string
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
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
        ): string {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
                [orders, signatures, feePercentage, feeRecipient.toLowerCase()],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Returns the 4 byte function selector as a hex string.
         */
        getSelector(): string {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
            );
            return abiEncoder.getSelector();
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
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('owner()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public transferOwnership = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            newOwner: string,
            txData?: Partial<TxData> | undefined,
            opts: SendTransactionOpts = { shouldValidate: true },
        ): Promise<string> {
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

            if (opts.shouldValidate !== false) {
                await self.transferOwnership.callAsync(newOwner, txDataWithDefaults);
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
            opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.transferOwnership.sendTransactionAsync(newOwner.toLowerCase(), txData, opts);
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
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
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
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
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(newOwner: string): string {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('transferOwnership(address)', [
                newOwner.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Returns the 4 byte function selector as a hex string.
         */
        getSelector(): string {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
            return abiEncoder.getSelector();
        },
    };
    /**
     * Withdraws assets from this contract. The contract formerly required a ZRX balance in order
     * to function optimally, and this function allows the ZRX to be withdrawn by owner.
     * It may also be used to withdraw assets that were accidentally sent to this contract.
     */
    public withdrawAsset = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param amount Amount of ERC20 token to withdraw.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            assetData: string,
            amount: BigNumber,
            txData?: Partial<TxData> | undefined,
            opts: SendTransactionOpts = { shouldValidate: true },
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
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            if (opts.shouldValidate !== false) {
                await self.withdrawAsset.callAsync(assetData, amount, txDataWithDefaults);
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param amount Amount of ERC20 token to withdraw.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            assetData: string,
            amount: BigNumber,
            txData?: Partial<TxData>,
            opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('assetData', assetData);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.withdrawAsset.sendTransactionAsync(assetData, amount, txData, opts);
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
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param amount Amount of ERC20 token to withdraw.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
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
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param amount Amount of ERC20 token to withdraw.
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
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('withdrawAsset(bytes,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param amount Amount of ERC20 token to withdraw.
         * @returns The ABI encoded transaction data as a string
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
        /**
         * Returns the 4 byte function selector as a hex string.
         */
        getSelector(): string {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder('withdrawAsset(bytes,uint256)');
            return abiEncoder.getSelector();
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
        _exchange: string,
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
            _wethAssetData,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
        _exchange: string,
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
        [_exchange, _wethAssetData] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange, _wethAssetData],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_exchange, _wethAssetData]);
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
        const contractInstance = new ForwarderContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [_exchange, _wethAssetData];
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
                        name: 'wethSpentAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'makerAssetAcquiredAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'ethFeePaid',
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
                        name: 'wethSpentAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'makerAssetAcquiredAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'ethFeePaid',
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
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
