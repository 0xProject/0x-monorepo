// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
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
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            assert.isBigNumber('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('owners(uint256)', [index_0
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
            const abiEncoder = self._lookupAbiEncoder('owners(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public removeOwner = {
        async sendTransactionAsync(
            owner: string,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('owner', owner);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('removeOwner(address)', [owner
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.removeOwner.estimateGasAsync.bind(
                    self,
                    owner
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            owner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('owner', owner);
            const self = this as any as AssetProxyOwnerContract;
            const txHashPromise = self.removeOwner.sendTransactionAsync(owner
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
            owner: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('owner', owner);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('removeOwner(address)', [owner
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            owner: string,
        ): string {
            assert.isString('owner', owner);
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('removeOwner(address)', [owner
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            owner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            assert.isString('owner', owner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('removeOwner(address)', [owner
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
            const abiEncoder = self._lookupAbiEncoder('removeOwner(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public revokeConfirmation = {
        async sendTransactionAsync(
            transactionId: BigNumber,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('revokeConfirmation(uint256)', [transactionId
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.revokeConfirmation.estimateGasAsync.bind(
                    self,
                    transactionId
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const txHashPromise = self.revokeConfirmation.sendTransactionAsync(transactionId
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
            transactionId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('revokeConfirmation(uint256)', [transactionId
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            transactionId: BigNumber,
        ): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('revokeConfirmation(uint256)', [transactionId
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('revokeConfirmation(uint256)', [transactionId
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
            const abiEncoder = self._lookupAbiEncoder('revokeConfirmation(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public isOwner = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            assert.isString('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('isOwner(address)', [index_0
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
            const abiEncoder = self._lookupAbiEncoder('isOwner(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public confirmations = {
        async callAsync(
            index_0: BigNumber,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
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
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmations(uint256,address)', [index_0,
        index_1
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
            const abiEncoder = self._lookupAbiEncoder('confirmations(uint256,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public executeRemoveAuthorizedAddressAtIndex = {
        async sendTransactionAsync(
            transactionId: BigNumber,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeRemoveAuthorizedAddressAtIndex(uint256)', [transactionId
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.executeRemoveAuthorizedAddressAtIndex.estimateGasAsync.bind(
                    self,
                    transactionId
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const txHashPromise = self.executeRemoveAuthorizedAddressAtIndex.sendTransactionAsync(transactionId
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
            transactionId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeRemoveAuthorizedAddressAtIndex(uint256)', [transactionId
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            transactionId: BigNumber,
        ): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('executeRemoveAuthorizedAddressAtIndex(uint256)', [transactionId
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeRemoveAuthorizedAddressAtIndex(uint256)', [transactionId
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
            const abiEncoder = self._lookupAbiEncoder('executeRemoveAuthorizedAddressAtIndex(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public secondsTimeLocked = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('secondsTimeLocked()', []);
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
            const abiEncoder = self._lookupAbiEncoder('secondsTimeLocked()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getTransactionCount = {
        async callAsync(
            pending: boolean,
            executed: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
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
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getTransactionCount(bool,bool)', [pending,
        executed
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
            const abiEncoder = self._lookupAbiEncoder('getTransactionCount(bool,bool)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public registerAssetProxy = {
        async sendTransactionAsync(
            assetProxyContract: string,
            isRegistered: boolean,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('assetProxyContract', assetProxyContract);
            assert.isBoolean('isRegistered', isRegistered);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('registerAssetProxy(address,bool)', [assetProxyContract,
    isRegistered
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.registerAssetProxy.estimateGasAsync.bind(
                    self,
                    assetProxyContract,
                    isRegistered
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            assetProxyContract: string,
            isRegistered: boolean,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('assetProxyContract', assetProxyContract);
            assert.isBoolean('isRegistered', isRegistered);
            const self = this as any as AssetProxyOwnerContract;
            const txHashPromise = self.registerAssetProxy.sendTransactionAsync(assetProxyContract,
    isRegistered
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
            assetProxyContract: string,
            isRegistered: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('assetProxyContract', assetProxyContract);
            assert.isBoolean('isRegistered', isRegistered);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('registerAssetProxy(address,bool)', [assetProxyContract,
    isRegistered
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            assetProxyContract: string,
            isRegistered: boolean,
        ): string {
            assert.isString('assetProxyContract', assetProxyContract);
            assert.isBoolean('isRegistered', isRegistered);
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('registerAssetProxy(address,bool)', [assetProxyContract,
    isRegistered
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            assetProxyContract: string,
            isRegistered: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
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
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('registerAssetProxy(address,bool)', [assetProxyContract,
        isRegistered
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
            const abiEncoder = self._lookupAbiEncoder('registerAssetProxy(address,bool)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public addOwner = {
        async sendTransactionAsync(
            owner: string,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('owner', owner);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('addOwner(address)', [owner
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.addOwner.estimateGasAsync.bind(
                    self,
                    owner
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            owner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('owner', owner);
            const self = this as any as AssetProxyOwnerContract;
            const txHashPromise = self.addOwner.sendTransactionAsync(owner
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
            owner: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('owner', owner);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('addOwner(address)', [owner
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            owner: string,
        ): string {
            assert.isString('owner', owner);
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('addOwner(address)', [owner
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            owner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            assert.isString('owner', owner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('addOwner(address)', [owner
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
            const abiEncoder = self._lookupAbiEncoder('addOwner(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public isConfirmed = {
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('isConfirmed(uint256)', [transactionId
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
            const abiEncoder = self._lookupAbiEncoder('isConfirmed(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public changeTimeLock = {
        async sendTransactionAsync(
            _secondsTimeLocked: BigNumber,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeTimeLock(uint256)', [_secondsTimeLocked
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.changeTimeLock.estimateGasAsync.bind(
                    self,
                    _secondsTimeLocked
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            _secondsTimeLocked: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            const self = this as any as AssetProxyOwnerContract;
            const txHashPromise = self.changeTimeLock.sendTransactionAsync(_secondsTimeLocked
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
            _secondsTimeLocked: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeTimeLock(uint256)', [_secondsTimeLocked
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            _secondsTimeLocked: BigNumber,
        ): string {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('changeTimeLock(uint256)', [_secondsTimeLocked
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            _secondsTimeLocked: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeTimeLock(uint256)', [_secondsTimeLocked
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
            const abiEncoder = self._lookupAbiEncoder('changeTimeLock(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public isAssetProxyRegistered = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            assert.isString('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('isAssetProxyRegistered(address)', [index_0
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
            const abiEncoder = self._lookupAbiEncoder('isAssetProxyRegistered(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getConfirmationCount = {
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getConfirmationCount(uint256)', [transactionId
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
            const abiEncoder = self._lookupAbiEncoder('getConfirmationCount(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public transactions = {
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, BigNumber, string, boolean]
        > {
            assert.isBigNumber('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('transactions(uint256)', [index_0
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
            const abiEncoder = self._lookupAbiEncoder('transactions(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, BigNumber, string, boolean]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getOwners = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string[]
        > {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getOwners()', []);
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
            const abiEncoder = self._lookupAbiEncoder('getOwners()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string[]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getTransactionIds = {
        async callAsync(
            from: BigNumber,
            to: BigNumber,
            pending: boolean,
            executed: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber[]
        > {
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
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getTransactionIds(uint256,uint256,bool,bool)', [from,
        to,
        pending,
        executed
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
            const abiEncoder = self._lookupAbiEncoder('getTransactionIds(uint256,uint256,bool,bool)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber[]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getConfirmations = {
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string[]
        > {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getConfirmations(uint256)', [transactionId
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
            const abiEncoder = self._lookupAbiEncoder('getConfirmations(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string[]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public transactionCount = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('transactionCount()', []);
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
            const abiEncoder = self._lookupAbiEncoder('transactionCount()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public changeRequirement = {
        async sendTransactionAsync(
            _required: BigNumber,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('_required', _required);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeRequirement(uint256)', [_required
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.changeRequirement.estimateGasAsync.bind(
                    self,
                    _required
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            _required: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('_required', _required);
            const self = this as any as AssetProxyOwnerContract;
            const txHashPromise = self.changeRequirement.sendTransactionAsync(_required
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
            _required: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBigNumber('_required', _required);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeRequirement(uint256)', [_required
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            _required: BigNumber,
        ): string {
            assert.isBigNumber('_required', _required);
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('changeRequirement(uint256)', [_required
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            _required: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            assert.isBigNumber('_required', _required);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeRequirement(uint256)', [_required
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
            const abiEncoder = self._lookupAbiEncoder('changeRequirement(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public confirmTransaction = {
        async sendTransactionAsync(
            transactionId: BigNumber,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmTransaction(uint256)', [transactionId
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.confirmTransaction.estimateGasAsync.bind(
                    self,
                    transactionId
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const txHashPromise = self.confirmTransaction.sendTransactionAsync(transactionId
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
            transactionId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmTransaction(uint256)', [transactionId
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            transactionId: BigNumber,
        ): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('confirmTransaction(uint256)', [transactionId
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmTransaction(uint256)', [transactionId
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
            const abiEncoder = self._lookupAbiEncoder('confirmTransaction(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public submitTransaction = {
        async sendTransactionAsync(
            destination: string,
            value: BigNumber,
            data: string,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('destination', destination);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [destination,
    value,
    data
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.submitTransaction.estimateGasAsync.bind(
                    self,
                    destination,
                    value,
                    data
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
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
            const self = this as any as AssetProxyOwnerContract;
            const txHashPromise = self.submitTransaction.sendTransactionAsync(destination,
    value,
    data
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
            destination: string,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('destination', destination);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [destination,
    value,
    data
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            destination: string,
            value: BigNumber,
            data: string,
        ): string {
            assert.isString('destination', destination);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [destination,
    value,
    data
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            destination: string,
            value: BigNumber,
            data: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
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
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [destination,
        value,
        data
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
            const abiEncoder = self._lookupAbiEncoder('submitTransaction(address,uint256,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public confirmationTimes = {
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            assert.isBigNumber('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmationTimes(uint256)', [index_0
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
            const abiEncoder = self._lookupAbiEncoder('confirmationTimes(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public MAX_OWNER_COUNT = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('MAX_OWNER_COUNT()', []);
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
            const abiEncoder = self._lookupAbiEncoder('MAX_OWNER_COUNT()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public required = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('required()', []);
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
            const abiEncoder = self._lookupAbiEncoder('required()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public replaceOwner = {
        async sendTransactionAsync(
            owner: string,
            newOwner: string,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('replaceOwner(address,address)', [owner,
    newOwner
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.replaceOwner.estimateGasAsync.bind(
                    self,
                    owner,
                    newOwner
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            owner: string,
            newOwner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            const self = this as any as AssetProxyOwnerContract;
            const txHashPromise = self.replaceOwner.sendTransactionAsync(owner,
    newOwner
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
            owner: string,
            newOwner: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('replaceOwner(address,address)', [owner,
    newOwner
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            owner: string,
            newOwner: string,
        ): string {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('replaceOwner(address,address)', [owner,
    newOwner
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            owner: string,
            newOwner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
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
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('replaceOwner(address,address)', [owner,
        newOwner
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
            const abiEncoder = self._lookupAbiEncoder('replaceOwner(address,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public executeTransaction = {
        async sendTransactionAsync(
            transactionId: BigNumber,
        txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256)', [transactionId
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.executeTransaction.estimateGasAsync.bind(
                    self,
                    transactionId
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const txHashPromise = self.executeTransaction.sendTransactionAsync(transactionId
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
            transactionId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256)', [transactionId
    ]);
            const passedInTxData = txData === undefined ? {} : txData;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...passedInTxData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            transactionId: BigNumber,
        ): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('executeTransaction(uint256)', [transactionId
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256)', [transactionId
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
            const abiEncoder = self._lookupAbiEncoder('executeTransaction(uint256)');
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
        return AssetProxyOwnerContract.deployAsync(bytecode, abi, provider, txDefaults, _owners,
_assetProxyContracts,
_required,
_secondsTimeLocked
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
        assert.isString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_owners,
_assetProxyContracts,
_required,
_secondsTimeLocked
] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_owners,
_assetProxyContracts,
_required,
_secondsTimeLocked
],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_owners,
_assetProxyContracts,
_required,
_secondsTimeLocked
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
        logUtils.log(`AssetProxyOwner successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new AssetProxyOwnerContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [_owners,
_assetProxyContracts,
_required,
_secondsTimeLocked
];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('AssetProxyOwner', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
