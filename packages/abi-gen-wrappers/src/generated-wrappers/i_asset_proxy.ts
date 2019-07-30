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
export class IAssetProxyContract extends BaseContract {
    /**
     * Authorizes an address.
     */
    public addAuthorizedAddress = {
        /**
         * Sends the transaction
         * @param target         Address to authorize.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(target: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('target', target);
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('addAuthorizedAddress(address)', [target.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.addAuthorizedAddress.estimateGasAsync.bind(self, target.toLowerCase()),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param target         Address to authorize.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            target: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('target', target);
            const self = (this as any) as IAssetProxyContract;
            const txHashPromise = self.addAuthorizedAddress.sendTransactionAsync(target.toLowerCase(), txData);
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
         * @param target         Address to authorize.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(target: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('target', target);
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('addAuthorizedAddress(address)', [target.toLowerCase()]);
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
         * @param target         Address to authorize.
         */
        async callAsync(target: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('target', target);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('addAuthorizedAddress(address)', [target.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('addAuthorizedAddress(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param target         Address to authorize.
         */
        getABIEncodedTransactionData(target: string): string {
            assert.isString('target', target);
            const self = (this as any) as IAssetProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('addAuthorizedAddress(address)', [
                target.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Removes authorizion of an address.
     */
    public removeAuthorizedAddress = {
        /**
         * Sends the transaction
         * @param target         Address to remove authorization from.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(target: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('target', target);
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [target.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.removeAuthorizedAddress.estimateGasAsync.bind(self, target.toLowerCase()),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param target         Address to remove authorization from.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            target: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('target', target);
            const self = (this as any) as IAssetProxyContract;
            const txHashPromise = self.removeAuthorizedAddress.sendTransactionAsync(target.toLowerCase(), txData);
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
         * @param target         Address to remove authorization from.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(target: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('target', target);
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [target.toLowerCase()]);
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
         * @param target         Address to remove authorization from.
         */
        async callAsync(target: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('target', target);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [target.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('removeAuthorizedAddress(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param target         Address to remove authorization from.
         */
        getABIEncodedTransactionData(target: string): string {
            assert.isString('target', target);
            const self = (this as any) as IAssetProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [
                target.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Removes authorizion of an address.
     */
    public removeAuthorizedAddressAtIndex = {
        /**
         * Sends the transaction
         * @param target         Address to remove authorization from.
         * @param index         Index of target in authorities array.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(
            target: string,
            index: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('removeAuthorizedAddressAtIndex(address,uint256)', [
                target.toLowerCase(),
                index,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.removeAuthorizedAddressAtIndex.estimateGasAsync.bind(self, target.toLowerCase(), index),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param target         Address to remove authorization from.
         * @param index         Index of target in authorities array.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            target: string,
            index: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            const self = (this as any) as IAssetProxyContract;
            const txHashPromise = self.removeAuthorizedAddressAtIndex.sendTransactionAsync(
                target.toLowerCase(),
                index,
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
         * @param target         Address to remove authorization from.
         * @param index         Index of target in authorities array.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(
            target: string,
            index: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('removeAuthorizedAddressAtIndex(address,uint256)', [
                target.toLowerCase(),
                index,
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
         * Calls the method
         * @param target         Address to remove authorization from.
         * @param index         Index of target in authorities array.
         */
        async callAsync(
            target: string,
            index: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('removeAuthorizedAddressAtIndex(address,uint256)', [
                target.toLowerCase(),
                index,
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
            const abiEncoder = self._lookupAbiEncoder('removeAuthorizedAddressAtIndex(address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param target         Address to remove authorization from.
         * @param index         Index of target in authorities array.
         */
        getABIEncodedTransactionData(target: string, index: BigNumber): string {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            const self = (this as any) as IAssetProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'removeAuthorizedAddressAtIndex(address,uint256)',
                [target.toLowerCase(), index],
            );
            return abiEncodedTransactionData;
        },
    };
    /**
     * Transfers assets. Either succeeds or throws.
     */
    public transferFrom = {
        /**
         * Sends the transaction
         * @param assetData         Byte array encoded for the respective asset proxy.
         * @param from         Address to transfer asset from.
         * @param to         Address to transfer asset to.
         * @param amount         Amount of asset to transfer.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(
            assetData: string,
            from: string,
            to: string,
            amount: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('assetData', assetData);
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('transferFrom(bytes,address,address,uint256)', [
                assetData,
                from.toLowerCase(),
                to.toLowerCase(),
                amount,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.transferFrom.estimateGasAsync.bind(self, assetData, from.toLowerCase(), to.toLowerCase(), amount),
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
         * @param from         Address to transfer asset from.
         * @param to         Address to transfer asset to.
         * @param amount         Amount of asset to transfer.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            assetData: string,
            from: string,
            to: string,
            amount: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('assetData', assetData);
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as IAssetProxyContract;
            const txHashPromise = self.transferFrom.sendTransactionAsync(
                assetData,
                from.toLowerCase(),
                to.toLowerCase(),
                amount,
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
         * @param assetData         Byte array encoded for the respective asset proxy.
         * @param from         Address to transfer asset from.
         * @param to         Address to transfer asset to.
         * @param amount         Amount of asset to transfer.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(
            assetData: string,
            from: string,
            to: string,
            amount: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('assetData', assetData);
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('transferFrom(bytes,address,address,uint256)', [
                assetData,
                from.toLowerCase(),
                to.toLowerCase(),
                amount,
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
         * Calls the method
         * @param assetData         Byte array encoded for the respective asset proxy.
         * @param from         Address to transfer asset from.
         * @param to         Address to transfer asset to.
         * @param amount         Amount of asset to transfer.
         */
        async callAsync(
            assetData: string,
            from: string,
            to: string,
            amount: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('assetData', assetData);
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('amount', amount);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('transferFrom(bytes,address,address,uint256)', [
                assetData,
                from.toLowerCase(),
                to.toLowerCase(),
                amount,
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
            const abiEncoder = self._lookupAbiEncoder('transferFrom(bytes,address,address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param assetData         Byte array encoded for the respective asset proxy.
         * @param from         Address to transfer asset from.
         * @param to         Address to transfer asset to.
         * @param amount         Amount of asset to transfer.
         */
        getABIEncodedTransactionData(assetData: string, from: string, to: string, amount: BigNumber): string {
            assert.isString('assetData', assetData);
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as IAssetProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'transferFrom(bytes,address,address,uint256)',
                [assetData, from.toLowerCase(), to.toLowerCase(), amount],
            );
            return abiEncodedTransactionData;
        },
    };
    /**
     * Gets the proxy id associated with the proxy address.
     */
    public getProxyId = {
        /**
         * Calls the method
         * @returns Proxy id.
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
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('getProxyId()', []);
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
            const abiEncoder = self._lookupAbiEncoder('getProxyId()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as IAssetProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getProxyId()', []);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Gets all authorized addresses.
     */
    public getAuthorizedAddresses = {
        /**
         * Calls the method
         * @returns Array of authorized addresses.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string[]> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments('getAuthorizedAddresses()', []);
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
            const abiEncoder = self._lookupAbiEncoder('getAuthorizedAddresses()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as IAssetProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getAuthorizedAddresses()', []);
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
            const self = (this as any) as IAssetProxyContract;
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
            const self = (this as any) as IAssetProxyContract;
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
            const self = (this as any) as IAssetProxyContract;
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
            const self = (this as any) as IAssetProxyContract;
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
            const self = (this as any) as IAssetProxyContract;
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
    ): Promise<IAssetProxyContract> {
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
        return IAssetProxyContract.deployAsync(bytecode, abi, provider, txDefaults);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
    ): Promise<IAssetProxyContract> {
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
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`IAssetProxy successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new IAssetProxyContract(txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [];
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
                        name: 'target',
                        type: 'address',
                    },
                ],
                name: 'addAuthorizedAddress',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                    },
                ],
                name: 'removeAuthorizedAddress',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                    },
                    {
                        name: 'index',
                        type: 'uint256',
                    },
                ],
                name: 'removeAuthorizedAddressAtIndex',
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
                        name: 'from',
                        type: 'address',
                    },
                    {
                        name: 'to',
                        type: 'address',
                    },
                    {
                        name: 'amount',
                        type: 'uint256',
                    },
                ],
                name: 'transferFrom',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'getProxyId',
                outputs: [
                    {
                        name: '',
                        type: 'bytes4',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'getAuthorizedAddresses',
                outputs: [
                    {
                        name: '',
                        type: 'address[]',
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
        ] as ContractAbi;
        return abi;
    }
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('IAssetProxy', IAssetProxyContract.ABI(), address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
