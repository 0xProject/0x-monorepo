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

export type AssetProxyOwnerEventArgs =
    | AssetProxyOwnerAssetProxyRegistrationEventArgs
    | AssetProxyOwnerConfirmationTimeSetEventArgs
    | AssetProxyOwnerTimeLockChangeEventArgs
    | AssetProxyOwnerConfirmationEventArgs
    | AssetProxyOwnerRevocationEventArgs
    | AssetProxyOwnerSubmissionEventArgs
    | AssetProxyOwnerExecutionEventArgs
    | AssetProxyOwnerExecutionFailureEventArgs
    | AssetProxyOwnerDepositEventArgs
    | AssetProxyOwnerOwnerAdditionEventArgs
    | AssetProxyOwnerOwnerRemovalEventArgs
    | AssetProxyOwnerRequirementChangeEventArgs;

export enum AssetProxyOwnerEvents {
    AssetProxyRegistration = 'AssetProxyRegistration',
    ConfirmationTimeSet = 'ConfirmationTimeSet',
    TimeLockChange = 'TimeLockChange',
    Confirmation = 'Confirmation',
    Revocation = 'Revocation',
    Submission = 'Submission',
    Execution = 'Execution',
    ExecutionFailure = 'ExecutionFailure',
    Deposit = 'Deposit',
    OwnerAddition = 'OwnerAddition',
    OwnerRemoval = 'OwnerRemoval',
    RequirementChange = 'RequirementChange',
}

export interface AssetProxyOwnerAssetProxyRegistrationEventArgs extends DecodedLogArgs {
    assetProxyContract: string;
    isRegistered: boolean;
}

export interface AssetProxyOwnerConfirmationTimeSetEventArgs extends DecodedLogArgs {
    transactionId: BigNumber;
    confirmationTime: BigNumber;
}

export interface AssetProxyOwnerTimeLockChangeEventArgs extends DecodedLogArgs {
    secondsTimeLocked: BigNumber;
}

export interface AssetProxyOwnerConfirmationEventArgs extends DecodedLogArgs {
    sender: string;
    transactionId: BigNumber;
}

export interface AssetProxyOwnerRevocationEventArgs extends DecodedLogArgs {
    sender: string;
    transactionId: BigNumber;
}

export interface AssetProxyOwnerSubmissionEventArgs extends DecodedLogArgs {
    transactionId: BigNumber;
}

export interface AssetProxyOwnerExecutionEventArgs extends DecodedLogArgs {
    transactionId: BigNumber;
}

export interface AssetProxyOwnerExecutionFailureEventArgs extends DecodedLogArgs {
    transactionId: BigNumber;
}

export interface AssetProxyOwnerDepositEventArgs extends DecodedLogArgs {
    sender: string;
    value: BigNumber;
}

export interface AssetProxyOwnerOwnerAdditionEventArgs extends DecodedLogArgs {
    owner: string;
}

export interface AssetProxyOwnerOwnerRemovalEventArgs extends DecodedLogArgs {
    owner: string;
}

export interface AssetProxyOwnerRequirementChangeEventArgs extends DecodedLogArgs {
    required: BigNumber;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class AssetProxyOwnerContract extends BaseContract {
    public owners = {
        /**
         * Calls the method
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
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('owners(uint256)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('owners(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(index_0: BigNumber): string {
            assert.isBigNumber('index_0', index_0);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('owners(uint256)', [index_0]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows to remove an owner. Transaction has to be sent by wallet.
     */
    public removeOwner = {
        /**
         * Sends the transaction
         * @param owner         Address of owner.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(owner: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('removeOwner(address)', [owner.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.removeOwner.estimateGasAsync.bind(self, owner.toLowerCase()),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param owner         Address of owner.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            owner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.removeOwner.sendTransactionAsync(owner.toLowerCase(), txData);
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
         * @param owner         Address of owner.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(owner: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('removeOwner(address)', [owner.toLowerCase()]);
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
         * @param owner         Address of owner.
         */
        async callAsync(owner: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('owner', owner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('removeOwner(address)', [owner.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('removeOwner(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param owner         Address of owner.
         */
        getABIEncodedTransactionData(owner: string): string {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('removeOwner(address)', [
                owner.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows an owner to revoke a confirmation for a transaction.
     */
    public revokeConfirmation = {
        /**
         * Sends the transaction
         * @param transactionId         Transaction ID.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('revokeConfirmation(uint256)', [transactionId]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.revokeConfirmation.estimateGasAsync.bind(self, transactionId),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param transactionId         Transaction ID.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.revokeConfirmation.sendTransactionAsync(transactionId, txData);
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
         * @param transactionId         Transaction ID.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('revokeConfirmation(uint256)', [transactionId]);
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
         * @param transactionId         Transaction ID.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('revokeConfirmation(uint256)', [transactionId]);
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
            const abiEncoder = self._lookupAbiEncoder('revokeConfirmation(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param transactionId         Transaction ID.
         */
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('revokeConfirmation(uint256)', [
                transactionId,
            ]);
            return abiEncodedTransactionData;
        },
    };
    public isOwner = {
        /**
         * Calls the method
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
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('isOwner(address)', [index_0.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('isOwner(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(index_0: string): string {
            assert.isString('index_0', index_0);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('isOwner(address)', [index_0.toLowerCase()]);
            return abiEncodedTransactionData;
        },
    };
    public confirmations = {
        /**
         * Calls the method
         */
        async callAsync(
            index_0: BigNumber,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isBigNumber('index_0', index_0);
            assert.isString('index_1', index_1);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmations(uint256,address)', [
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
            const abiEncoder = self._lookupAbiEncoder('confirmations(uint256,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(index_0: BigNumber, index_1: string): string {
            assert.isBigNumber('index_0', index_0);
            assert.isString('index_1', index_1);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('confirmations(uint256,address)', [
                index_0,
                index_1.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows execution of `removeAuthorizedAddressAtIndex` without time lock.
     */
    public executeRemoveAuthorizedAddressAtIndex = {
        /**
         * Sends the transaction
         * @param transactionId         Transaction ID.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeRemoveAuthorizedAddressAtIndex(uint256)', [
                transactionId,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.executeRemoveAuthorizedAddressAtIndex.estimateGasAsync.bind(self, transactionId),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param transactionId         Transaction ID.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.executeRemoveAuthorizedAddressAtIndex.sendTransactionAsync(
                transactionId,
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
         * @param transactionId         Transaction ID.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeRemoveAuthorizedAddressAtIndex(uint256)', [
                transactionId,
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
         * @param transactionId         Transaction ID.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeRemoveAuthorizedAddressAtIndex(uint256)', [
                transactionId,
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
            const abiEncoder = self._lookupAbiEncoder('executeRemoveAuthorizedAddressAtIndex(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param transactionId         Transaction ID.
         */
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'executeRemoveAuthorizedAddressAtIndex(uint256)',
                [transactionId],
            );
            return abiEncodedTransactionData;
        },
    };
    public secondsTimeLocked = {
        /**
         * Calls the method
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('secondsTimeLocked()', []);
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
            const abiEncoder = self._lookupAbiEncoder('secondsTimeLocked()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('secondsTimeLocked()', []);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Returns total number of transactions after filers are applied.
     */
    public getTransactionCount = {
        /**
         * Calls the method
         * @param pending         Include pending transactions.
         * @param executed         Include executed transactions.
         * @returns Total number of transactions after filters are applied.
         */
        async callAsync(
            pending: boolean,
            executed: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isBoolean('pending', pending);
            assert.isBoolean('executed', executed);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getTransactionCount(bool,bool)', [pending, executed]);
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
            const abiEncoder = self._lookupAbiEncoder('getTransactionCount(bool,bool)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param pending         Include pending transactions.
         * @param executed         Include executed transactions.
         */
        getABIEncodedTransactionData(pending: boolean, executed: boolean): string {
            assert.isBoolean('pending', pending);
            assert.isBoolean('executed', executed);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getTransactionCount(bool,bool)', [
                pending,
                executed,
            ]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Registers or deregisters an AssetProxy to be able to execute
     * `removeAuthorizedAddressAtIndex` without a timelock.
     */
    public registerAssetProxy = {
        /**
         * Sends the transaction
         * @param assetProxyContract         Address of AssetProxy contract.
         * @param isRegistered         Status of approval for AssetProxy contract.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(
            assetProxyContract: string,
            isRegistered: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('assetProxyContract', assetProxyContract);
            assert.isBoolean('isRegistered', isRegistered);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('registerAssetProxy(address,bool)', [
                assetProxyContract.toLowerCase(),
                isRegistered,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.registerAssetProxy.estimateGasAsync.bind(self, assetProxyContract.toLowerCase(), isRegistered),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param assetProxyContract         Address of AssetProxy contract.
         * @param isRegistered         Status of approval for AssetProxy contract.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            assetProxyContract: string,
            isRegistered: boolean,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('assetProxyContract', assetProxyContract);
            assert.isBoolean('isRegistered', isRegistered);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.registerAssetProxy.sendTransactionAsync(
                assetProxyContract.toLowerCase(),
                isRegistered,
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
         * @param assetProxyContract         Address of AssetProxy contract.
         * @param isRegistered         Status of approval for AssetProxy contract.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(
            assetProxyContract: string,
            isRegistered: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('assetProxyContract', assetProxyContract);
            assert.isBoolean('isRegistered', isRegistered);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('registerAssetProxy(address,bool)', [
                assetProxyContract.toLowerCase(),
                isRegistered,
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
         * @param assetProxyContract         Address of AssetProxy contract.
         * @param isRegistered         Status of approval for AssetProxy contract.
         */
        async callAsync(
            assetProxyContract: string,
            isRegistered: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('assetProxyContract', assetProxyContract);
            assert.isBoolean('isRegistered', isRegistered);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('registerAssetProxy(address,bool)', [
                assetProxyContract.toLowerCase(),
                isRegistered,
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
            const abiEncoder = self._lookupAbiEncoder('registerAssetProxy(address,bool)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param assetProxyContract         Address of AssetProxy contract.
         * @param isRegistered         Status of approval for AssetProxy contract.
         */
        getABIEncodedTransactionData(assetProxyContract: string, isRegistered: boolean): string {
            assert.isString('assetProxyContract', assetProxyContract);
            assert.isBoolean('isRegistered', isRegistered);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('registerAssetProxy(address,bool)', [
                assetProxyContract.toLowerCase(),
                isRegistered,
            ]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows to add a new owner. Transaction has to be sent by wallet.
     */
    public addOwner = {
        /**
         * Sends the transaction
         * @param owner         Address of new owner.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(owner: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('addOwner(address)', [owner.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.addOwner.estimateGasAsync.bind(self, owner.toLowerCase()),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param owner         Address of new owner.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            owner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.addOwner.sendTransactionAsync(owner.toLowerCase(), txData);
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
         * @param owner         Address of new owner.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(owner: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('addOwner(address)', [owner.toLowerCase()]);
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
         * @param owner         Address of new owner.
         */
        async callAsync(owner: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('owner', owner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('addOwner(address)', [owner.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('addOwner(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param owner         Address of new owner.
         */
        getABIEncodedTransactionData(owner: string): string {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('addOwner(address)', [owner.toLowerCase()]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Returns the confirmation status of a transaction.
     */
    public isConfirmed = {
        /**
         * Calls the method
         * @param transactionId         Transaction ID.
         * @returns Confirmation status.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('isConfirmed(uint256)', [transactionId]);
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
            const abiEncoder = self._lookupAbiEncoder('isConfirmed(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param transactionId         Transaction ID.
         */
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('isConfirmed(uint256)', [transactionId]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Changes the duration of the time lock for transactions.
     */
    public changeTimeLock = {
        /**
         * Sends the transaction
         * @param _secondsTimeLocked         Duration needed after a transaction is confirmed and before it becomes executable, in seconds.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(
            _secondsTimeLocked: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeTimeLock(uint256)', [_secondsTimeLocked]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.changeTimeLock.estimateGasAsync.bind(self, _secondsTimeLocked),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param _secondsTimeLocked         Duration needed after a transaction is confirmed and before it becomes executable, in seconds.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            _secondsTimeLocked: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.changeTimeLock.sendTransactionAsync(_secondsTimeLocked, txData);
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
         * @param _secondsTimeLocked         Duration needed after a transaction is confirmed and before it becomes executable, in seconds.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(_secondsTimeLocked: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeTimeLock(uint256)', [_secondsTimeLocked]);
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
         * @param _secondsTimeLocked         Duration needed after a transaction is confirmed and before it becomes executable, in seconds.
         */
        async callAsync(
            _secondsTimeLocked: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeTimeLock(uint256)', [_secondsTimeLocked]);
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
            const abiEncoder = self._lookupAbiEncoder('changeTimeLock(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param _secondsTimeLocked         Duration needed after a transaction is confirmed and before it becomes executable, in seconds.
         */
        getABIEncodedTransactionData(_secondsTimeLocked: BigNumber): string {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('changeTimeLock(uint256)', [
                _secondsTimeLocked,
            ]);
            return abiEncodedTransactionData;
        },
    };
    public isAssetProxyRegistered = {
        /**
         * Calls the method
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
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('isAssetProxyRegistered(address)', [index_0.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('isAssetProxyRegistered(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(index_0: string): string {
            assert.isString('index_0', index_0);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('isAssetProxyRegistered(address)', [
                index_0.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Returns number of confirmations of a transaction.
     */
    public getConfirmationCount = {
        /**
         * Calls the method
         * @param transactionId         Transaction ID.
         * @returns Number of confirmations.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getConfirmationCount(uint256)', [transactionId]);
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
            const abiEncoder = self._lookupAbiEncoder('getConfirmationCount(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param transactionId         Transaction ID.
         */
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getConfirmationCount(uint256)', [
                transactionId,
            ]);
            return abiEncodedTransactionData;
        },
    };
    public transactions = {
        /**
         * Calls the method
         */
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, BigNumber, string, boolean]> {
            assert.isBigNumber('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('transactions(uint256)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('transactions(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, BigNumber, string, boolean]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(index_0: BigNumber): string {
            assert.isBigNumber('index_0', index_0);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('transactions(uint256)', [index_0]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Returns list of owners.
     */
    public getOwners = {
        /**
         * Calls the method
         * @returns List of owner addresses.
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
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getOwners()', []);
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
            const abiEncoder = self._lookupAbiEncoder('getOwners()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getOwners()', []);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Returns list of transaction IDs in defined range.
     */
    public getTransactionIds = {
        /**
         * Calls the method
         * @param from         Index start position of transaction array.
         * @param to         Index end position of transaction array.
         * @param pending         Include pending transactions.
         * @param executed         Include executed transactions.
         * @returns Returns array of transaction IDs.
         */
        async callAsync(
            from: BigNumber,
            to: BigNumber,
            pending: boolean,
            executed: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber[]> {
            assert.isBigNumber('from', from);
            assert.isBigNumber('to', to);
            assert.isBoolean('pending', pending);
            assert.isBoolean('executed', executed);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getTransactionIds(uint256,uint256,bool,bool)', [
                from,
                to,
                pending,
                executed,
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
            const abiEncoder = self._lookupAbiEncoder('getTransactionIds(uint256,uint256,bool,bool)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param from         Index start position of transaction array.
         * @param to         Index end position of transaction array.
         * @param pending         Include pending transactions.
         * @param executed         Include executed transactions.
         */
        getABIEncodedTransactionData(from: BigNumber, to: BigNumber, pending: boolean, executed: boolean): string {
            assert.isBigNumber('from', from);
            assert.isBigNumber('to', to);
            assert.isBoolean('pending', pending);
            assert.isBoolean('executed', executed);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getTransactionIds(uint256,uint256,bool,bool)',
                [from, to, pending, executed],
            );
            return abiEncodedTransactionData;
        },
    };
    /**
     * Returns array with owner addresses, which confirmed transaction.
     */
    public getConfirmations = {
        /**
         * Calls the method
         * @param transactionId         Transaction ID.
         * @returns Returns array of owner addresses.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string[]> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getConfirmations(uint256)', [transactionId]);
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
            const abiEncoder = self._lookupAbiEncoder('getConfirmations(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param transactionId         Transaction ID.
         */
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getConfirmations(uint256)', [transactionId]);
            return abiEncodedTransactionData;
        },
    };
    public transactionCount = {
        /**
         * Calls the method
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('transactionCount()', []);
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
            const abiEncoder = self._lookupAbiEncoder('transactionCount()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('transactionCount()', []);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows to change the number of required confirmations. Transaction has to be sent by wallet.
     */
    public changeRequirement = {
        /**
         * Sends the transaction
         * @param _required         Number of required confirmations.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(_required: BigNumber, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isBigNumber('_required', _required);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeRequirement(uint256)', [_required]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.changeRequirement.estimateGasAsync.bind(self, _required),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param _required         Number of required confirmations.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            _required: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('_required', _required);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.changeRequirement.sendTransactionAsync(_required, txData);
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
         * @param _required         Number of required confirmations.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(_required: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('_required', _required);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeRequirement(uint256)', [_required]);
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
         * @param _required         Number of required confirmations.
         */
        async callAsync(
            _required: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('_required', _required);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeRequirement(uint256)', [_required]);
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
            const abiEncoder = self._lookupAbiEncoder('changeRequirement(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param _required         Number of required confirmations.
         */
        getABIEncodedTransactionData(_required: BigNumber): string {
            assert.isBigNumber('_required', _required);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('changeRequirement(uint256)', [_required]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows an owner to confirm a transaction.
     */
    public confirmTransaction = {
        /**
         * Sends the transaction
         * @param transactionId         Transaction ID.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmTransaction(uint256)', [transactionId]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.confirmTransaction.estimateGasAsync.bind(self, transactionId),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param transactionId         Transaction ID.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.confirmTransaction.sendTransactionAsync(transactionId, txData);
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
         * @param transactionId         Transaction ID.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmTransaction(uint256)', [transactionId]);
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
         * @param transactionId         Transaction ID.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmTransaction(uint256)', [transactionId]);
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
            const abiEncoder = self._lookupAbiEncoder('confirmTransaction(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param transactionId         Transaction ID.
         */
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('confirmTransaction(uint256)', [
                transactionId,
            ]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows an owner to submit and confirm a transaction.
     */
    public submitTransaction = {
        /**
         * Sends the transaction
         * @param destination         Transaction target address.
         * @param value         Transaction ether value.
         * @param data         Transaction data payload.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(
            destination: string,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('destination', destination);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [
                destination.toLowerCase(),
                value,
                data,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.submitTransaction.estimateGasAsync.bind(self, destination.toLowerCase(), value, data),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param destination         Transaction target address.
         * @param value         Transaction ether value.
         * @param data         Transaction data payload.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            destination: string,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('destination', destination);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.submitTransaction.sendTransactionAsync(
                destination.toLowerCase(),
                value,
                data,
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
         * @param destination         Transaction target address.
         * @param value         Transaction ether value.
         * @param data         Transaction data payload.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(
            destination: string,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('destination', destination);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [
                destination.toLowerCase(),
                value,
                data,
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
         * @param destination         Transaction target address.
         * @param value         Transaction ether value.
         * @param data         Transaction data payload.
         * @returns Returns transaction ID.
         */
        async callAsync(
            destination: string,
            value: BigNumber,
            data: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isString('destination', destination);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [
                destination.toLowerCase(),
                value,
                data,
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
            const abiEncoder = self._lookupAbiEncoder('submitTransaction(address,uint256,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param destination         Transaction target address.
         * @param value         Transaction ether value.
         * @param data         Transaction data payload.
         */
        getABIEncodedTransactionData(destination: string, value: BigNumber, data: string): string {
            assert.isString('destination', destination);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [
                destination.toLowerCase(),
                value,
                data,
            ]);
            return abiEncodedTransactionData;
        },
    };
    public confirmationTimes = {
        /**
         * Calls the method
         */
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isBigNumber('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmationTimes(uint256)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('confirmationTimes(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(index_0: BigNumber): string {
            assert.isBigNumber('index_0', index_0);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('confirmationTimes(uint256)', [index_0]);
            return abiEncodedTransactionData;
        },
    };
    public MAX_OWNER_COUNT = {
        /**
         * Calls the method
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('MAX_OWNER_COUNT()', []);
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
            const abiEncoder = self._lookupAbiEncoder('MAX_OWNER_COUNT()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('MAX_OWNER_COUNT()', []);
            return abiEncodedTransactionData;
        },
    };
    public required = {
        /**
         * Calls the method
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('required()', []);
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
            const abiEncoder = self._lookupAbiEncoder('required()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('required()', []);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows to replace an owner with a new owner. Transaction has to be sent by wallet.
     */
    public replaceOwner = {
        /**
         * Sends the transaction
         * @param owner         Address of owner to be replaced.
         * @param newOwner         Address of new owner.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(
            owner: string,
            newOwner: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('replaceOwner(address,address)', [
                owner.toLowerCase(),
                newOwner.toLowerCase(),
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.replaceOwner.estimateGasAsync.bind(self, owner.toLowerCase(), newOwner.toLowerCase()),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param owner         Address of owner to be replaced.
         * @param newOwner         Address of new owner.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            owner: string,
            newOwner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.replaceOwner.sendTransactionAsync(
                owner.toLowerCase(),
                newOwner.toLowerCase(),
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
         * @param owner         Address of owner to be replaced.
         * @param newOwner         Address of new owner.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(owner: string, newOwner: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('replaceOwner(address,address)', [
                owner.toLowerCase(),
                newOwner.toLowerCase(),
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
         * @param owner         Address of owner to be replaced.
         * @param newOwner         Address of new owner.
         */
        async callAsync(
            owner: string,
            newOwner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('replaceOwner(address,address)', [
                owner.toLowerCase(),
                newOwner.toLowerCase(),
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
            const abiEncoder = self._lookupAbiEncoder('replaceOwner(address,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param owner         Address of owner to be replaced.
         * @param newOwner         Address of new owner.
         */
        getABIEncodedTransactionData(owner: string, newOwner: string): string {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('replaceOwner(address,address)', [
                owner.toLowerCase(),
                newOwner.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows anyone to execute a confirmed transaction.
     */
    public executeTransaction = {
        /**
         * Sends the transaction
         * @param transactionId         Transaction ID.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async sendTransactionAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256)', [transactionId]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.executeTransaction.estimateGasAsync.bind(self, transactionId),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends the transaction and wait for it to succeed
         * @param transactionId         Transaction ID.
         * @param txData                Additional data for transaction
         * @param pollingIntervalMs     Interval at which to poll for success
         * @returns                     A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.executeTransaction.sendTransactionAsync(transactionId, txData);
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
         * @param transactionId         Transaction ID.
         * @param txData    Additional data for transaction
         * @returns         The hash of the transaction
         */
        async estimateGasAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256)', [transactionId]);
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
         * @param transactionId         Transaction ID.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256)', [transactionId]);
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
            const abiEncoder = self._lookupAbiEncoder('executeTransaction(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },

        /**
         * Returns the ABI encoded transaction data
         * @param transactionId         Transaction ID.
         */
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('executeTransaction(uint256)', [
                transactionId,
            ]);
            return abiEncodedTransactionData;
        },
    };
    private readonly _subscriptionManager: SubscriptionManager<AssetProxyOwnerEventArgs, AssetProxyOwnerEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        _owners: string[],
        _assetProxyContracts: string[],
        _required: BigNumber,
        _secondsTimeLocked: BigNumber,
    ): Promise<AssetProxyOwnerContract> {
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
        return AssetProxyOwnerContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            _owners,
            _assetProxyContracts,
            _required,
            _secondsTimeLocked,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        _owners: string[],
        _assetProxyContracts: string[],
        _required: BigNumber,
        _secondsTimeLocked: BigNumber,
    ): Promise<AssetProxyOwnerContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_owners, _assetProxyContracts, _required, _secondsTimeLocked] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_owners, _assetProxyContracts, _required, _secondsTimeLocked],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_owners, _assetProxyContracts, _required, _secondsTimeLocked]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`AssetProxyOwner successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new AssetProxyOwnerContract(txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [_owners, _assetProxyContracts, _required, _secondsTimeLocked];
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
                        type: 'uint256',
                    },
                ],
                name: 'owners',
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
                        name: 'owner',
                        type: 'address',
                    },
                ],
                name: 'removeOwner',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'revokeConfirmation',
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
                ],
                name: 'isOwner',
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
                inputs: [
                    {
                        name: 'index_0',
                        type: 'uint256',
                    },
                    {
                        name: 'index_1',
                        type: 'address',
                    },
                ],
                name: 'confirmations',
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
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'executeRemoveAuthorizedAddressAtIndex',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'secondsTimeLocked',
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
                inputs: [
                    {
                        name: 'pending',
                        type: 'bool',
                    },
                    {
                        name: 'executed',
                        type: 'bool',
                    },
                ],
                name: 'getTransactionCount',
                outputs: [
                    {
                        name: 'count',
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
                        name: 'assetProxyContract',
                        type: 'address',
                    },
                    {
                        name: 'isRegistered',
                        type: 'bool',
                    },
                ],
                name: 'registerAssetProxy',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'owner',
                        type: 'address',
                    },
                ],
                name: 'addOwner',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'isConfirmed',
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
                        name: '_secondsTimeLocked',
                        type: 'uint256',
                    },
                ],
                name: 'changeTimeLock',
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
                ],
                name: 'isAssetProxyRegistered',
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
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'getConfirmationCount',
                outputs: [
                    {
                        name: 'count',
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
                        name: 'index_0',
                        type: 'uint256',
                    },
                ],
                name: 'transactions',
                outputs: [
                    {
                        name: 'destination',
                        type: 'address',
                    },
                    {
                        name: 'value',
                        type: 'uint256',
                    },
                    {
                        name: 'data',
                        type: 'bytes',
                    },
                    {
                        name: 'executed',
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
                name: 'getOwners',
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
                constant: true,
                inputs: [
                    {
                        name: 'from',
                        type: 'uint256',
                    },
                    {
                        name: 'to',
                        type: 'uint256',
                    },
                    {
                        name: 'pending',
                        type: 'bool',
                    },
                    {
                        name: 'executed',
                        type: 'bool',
                    },
                ],
                name: 'getTransactionIds',
                outputs: [
                    {
                        name: '_transactionIds',
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
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'getConfirmations',
                outputs: [
                    {
                        name: '_confirmations',
                        type: 'address[]',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'transactionCount',
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
                        name: '_required',
                        type: 'uint256',
                    },
                ],
                name: 'changeRequirement',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'confirmTransaction',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'destination',
                        type: 'address',
                    },
                    {
                        name: 'value',
                        type: 'uint256',
                    },
                    {
                        name: 'data',
                        type: 'bytes',
                    },
                ],
                name: 'submitTransaction',
                outputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
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
                        type: 'uint256',
                    },
                ],
                name: 'confirmationTimes',
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
                name: 'MAX_OWNER_COUNT',
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
                name: 'required',
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
                        name: 'owner',
                        type: 'address',
                    },
                    {
                        name: 'newOwner',
                        type: 'address',
                    },
                ],
                name: 'replaceOwner',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'executeTransaction',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                inputs: [
                    {
                        name: '_owners',
                        type: 'address[]',
                    },
                    {
                        name: '_assetProxyContracts',
                        type: 'address[]',
                    },
                    {
                        name: '_required',
                        type: 'uint256',
                    },
                    {
                        name: '_secondsTimeLocked',
                        type: 'uint256',
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
                anonymous: false,
                inputs: [
                    {
                        name: 'assetProxyContract',
                        type: 'address',
                        indexed: false,
                    },
                    {
                        name: 'isRegistered',
                        type: 'bool',
                        indexed: false,
                    },
                ],
                name: 'AssetProxyRegistration',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                        indexed: true,
                    },
                    {
                        name: 'confirmationTime',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'ConfirmationTimeSet',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'secondsTimeLocked',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'TimeLockChange',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'sender',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'transactionId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'Confirmation',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'sender',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'transactionId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'Revocation',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'Submission',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'Execution',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'ExecutionFailure',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'sender',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'value',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'Deposit',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'owner',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'OwnerAddition',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'owner',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'OwnerRemoval',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'required',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'RequirementChange',
                outputs: [],
                type: 'event',
            },
        ] as ContractAbi;
        return abi;
    }
    /**
     * Subscribe to an event type emitted by the AssetProxyOwner contract.
     * @param   eventName           The AssetProxyOwner contract event you would like to subscribe to.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param   callback            Callback that gets called when a log is added/removed
     * @param   isVerbose           Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends AssetProxyOwnerEventArgs>(
        eventName: AssetProxyOwnerEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, AssetProxyOwnerEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            AssetProxyOwnerContract.ABI(),
            callback,
            isVerbose,
            blockPollingIntervalMs,
        );
        return subscriptionToken;
    }
    /**
     * Cancel a subscription
     * @param   subscriptionToken Subscription token returned by `subscribe()`
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
     * @param   eventName           The AssetProxyOwner contract event you would like to subscribe to.
     * @param   blockRange          Block range to get logs from.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return  Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends AssetProxyOwnerEventArgs>(
        eventName: AssetProxyOwnerEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, AssetProxyOwnerEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            AssetProxyOwnerContract.ABI(),
        );
        return logs;
    }
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('AssetProxyOwner', AssetProxyOwnerContract.ABI(), address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<AssetProxyOwnerEventArgs, AssetProxyOwnerEvents>(
            AssetProxyOwnerContract.ABI(),
            this._web3Wrapper,
        );
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
