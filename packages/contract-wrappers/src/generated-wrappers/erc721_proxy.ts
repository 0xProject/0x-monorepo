// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import {
    BaseContract,
    BlockRange,
    EventCallback,
    IndexedFilterValues,
    SubscriptionManager,
    PromiseWithTransactionHash,
} from '@0x/base-contract';
import { schemas } from '@0x/json-schemas';
import {
    BlockParam,
    BlockParamLiteral,
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

export type ERC721ProxyEventArgs =
    | ERC721ProxyAuthorizedAddressAddedEventArgs
    | ERC721ProxyAuthorizedAddressRemovedEventArgs;

export enum ERC721ProxyEvents {
    AuthorizedAddressAdded = 'AuthorizedAddressAdded',
    AuthorizedAddressRemoved = 'AuthorizedAddressRemoved',
}

export interface ERC721ProxyAuthorizedAddressAddedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}

export interface ERC721ProxyAuthorizedAddressRemovedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ERC721ProxyContract extends BaseContract {
    /**
     * Authorizes an address.
     */
    public addAuthorizedAddress = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param target Address to authorize.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(target: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('target', target);
            const self = (this as any) as ERC721ProxyContract;
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
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param target Address to authorize.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            target: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('target', target);
            const self = (this as any) as ERC721ProxyContract;
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
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param target Address to authorize.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(target: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('target', target);
            const self = (this as any) as ERC721ProxyContract;
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
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param target Address to authorize.
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
            const self = (this as any) as ERC721ProxyContract;
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
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param target Address to authorize.
         */
        getABIEncodedTransactionData(target: string): string {
            assert.isString('target', target);
            const self = (this as any) as ERC721ProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('addAuthorizedAddress(address)', [
                target.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('addAuthorizedAddress(address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('addAuthorizedAddress(address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(target: string, txData?: Partial<TxData> | undefined): Promise<string> {
            await (this as any).addAuthorizedAddress.callAsync(target, txData);
            const txHash = await (this as any).addAuthorizedAddress.sendTransactionAsync(target, txData);
            return txHash;
        },
    };
    public authorities = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            assert.isBigNumber('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC721ProxyContract;
            const encodedData = self._strictEncodeArguments('authorities(uint256)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('authorities(uint256)');
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
        getABIEncodedTransactionData(index_0: BigNumber): string {
            assert.isBigNumber('index_0', index_0);
            const self = (this as any) as ERC721ProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('authorities(uint256)', [index_0]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('authorities(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('authorities(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Removes authorizion of an address.
     */
    public removeAuthorizedAddress = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param target Address to remove authorization from.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(target: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('target', target);
            const self = (this as any) as ERC721ProxyContract;
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
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param target Address to remove authorization from.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            target: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('target', target);
            const self = (this as any) as ERC721ProxyContract;
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
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param target Address to remove authorization from.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(target: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('target', target);
            const self = (this as any) as ERC721ProxyContract;
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
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param target Address to remove authorization from.
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
            const self = (this as any) as ERC721ProxyContract;
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
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param target Address to remove authorization from.
         */
        getABIEncodedTransactionData(target: string): string {
            assert.isString('target', target);
            const self = (this as any) as ERC721ProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [
                target.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('removeAuthorizedAddress(address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('removeAuthorizedAddress(address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(target: string, txData?: Partial<TxData> | undefined): Promise<string> {
            await (this as any).removeAuthorizedAddress.callAsync(target, txData);
            const txHash = await (this as any).removeAuthorizedAddress.sendTransactionAsync(target, txData);
            return txHash;
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
            const self = (this as any) as ERC721ProxyContract;
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
            const self = (this as any) as ERC721ProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('owner()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('owner()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('owner()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Removes authorizion of an address.
     */
    public removeAuthorizedAddressAtIndex = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param target Address to remove authorization from.
         * @param index Index of target in authorities array.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            target: string,
            index: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            const self = (this as any) as ERC721ProxyContract;
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
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param target Address to remove authorization from.
         * @param index Index of target in authorities array.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
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
            const self = (this as any) as ERC721ProxyContract;
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
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param target Address to remove authorization from.
         * @param index Index of target in authorities array.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            target: string,
            index: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            const self = (this as any) as ERC721ProxyContract;
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
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param target Address to remove authorization from.
         * @param index Index of target in authorities array.
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
            const self = (this as any) as ERC721ProxyContract;
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
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param target Address to remove authorization from.
         * @param index Index of target in authorities array.
         */
        getABIEncodedTransactionData(target: string, index: BigNumber): string {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            const self = (this as any) as ERC721ProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'removeAuthorizedAddressAtIndex(address,uint256)',
                [target.toLowerCase(), index],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('removeAuthorizedAddressAtIndex(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('removeAuthorizedAddressAtIndex(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
            target: string,
            index: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).removeAuthorizedAddressAtIndex.callAsync(target, index, txData);
            const txHash = await (this as any).removeAuthorizedAddressAtIndex.sendTransactionAsync(
                target,
                index,
                txData,
            );
            return txHash;
        },
    };
    /**
     * Gets the proxy id associated with the proxy address.
     */
    public getProxyId = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
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
            const self = (this as any) as ERC721ProxyContract;
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
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getProxyId()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('getProxyId()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('getProxyId()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public authorized = {
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
            const self = (this as any) as ERC721ProxyContract;
            const encodedData = self._strictEncodeArguments('authorized(address)', [index_0.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('authorized(address)');
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
            const self = (this as any) as ERC721ProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('authorized(address)', [
                index_0.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): boolean {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('authorized(address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<boolean>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): boolean {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('authorized(address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<boolean>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Gets all authorized addresses.
     */
    public getAuthorizedAddresses = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
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
            const self = (this as any) as ERC721ProxyContract;
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
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getAuthorizedAddresses()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string[] {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('getAuthorizedAddresses()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string[]>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string[] {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('getAuthorizedAddresses()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string[]>(returnData);
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
            const self = (this as any) as ERC721ProxyContract;
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
            const self = (this as any) as ERC721ProxyContract;
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
            const self = (this as any) as ERC721ProxyContract;
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
            const self = (this as any) as ERC721ProxyContract;
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
            const self = (this as any) as ERC721ProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('transferOwnership(address)', [
                newOwner.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ERC721ProxyContract;
            const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721ProxyContract;
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
    private readonly _subscriptionManager: SubscriptionManager<ERC721ProxyEventArgs, ERC721ProxyEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<ERC721ProxyContract> {
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
        return ERC721ProxyContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
    ): Promise<ERC721ProxyContract> {
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
        logUtils.log(`ERC721Proxy successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ERC721ProxyContract(
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
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'uint256',
                    },
                ],
                name: 'authorities',
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
                inputs: [
                    {
                        name: 'index_0',
                        type: 'address',
                    },
                ],
                name: 'authorized',
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
            {
                inputs: [],
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'fallback',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'caller',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'AuthorizedAddressAdded',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'caller',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'AuthorizedAddressRemoved',
                outputs: [],
                type: 'event',
            },
        ] as ContractAbi;
        return abi;
    }
    /**
     * Subscribe to an event type emitted by the ERC721Proxy contract.
     * @param eventName The ERC721Proxy contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends ERC721ProxyEventArgs>(
        eventName: ERC721ProxyEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, ERC721ProxyEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            ERC721ProxyContract.ABI(),
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
     * @param eventName The ERC721Proxy contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends ERC721ProxyEventArgs>(
        eventName: ERC721ProxyEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, ERC721ProxyEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            ERC721ProxyContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
    ) {
        super('ERC721Proxy', ERC721ProxyContract.ABI(), address, supportedProvider, txDefaults, logDecodeDependencies);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<ERC721ProxyEventArgs, ERC721ProxyEvents>(
            ERC721ProxyContract.ABI(),
            this._web3Wrapper,
        );
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
