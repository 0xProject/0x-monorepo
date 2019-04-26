// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract, PromiseWithTransactionHash } from '@0x/base-contract';
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
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('removeOwner(address)', [owner
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
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
        async awaitTransactionSuccessAsync(
            owner: string,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` is optional, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            const self = this as any as AssetProxyOwnerContract;
            const txHash = await self.removeOwner.sendTransactionAsync(owner
    , txData);
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const receiptPromise = self._web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                pollingIntervalMs,
                timeoutMs,
            ) as any as PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
            receiptPromise.txHash = txHash;
            return receiptPromise;
        },
        async estimateGasAsync(
            owner: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('removeOwner(address)', [owner
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
            owner: string,
        ): string {
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
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('revokeConfirmation(uint256)', [transactionId
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
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
        async awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` is optional, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            const self = this as any as AssetProxyOwnerContract;
            const txHash = await self.revokeConfirmation.sendTransactionAsync(transactionId
    , txData);
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const receiptPromise = self._web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                pollingIntervalMs,
                timeoutMs,
            ) as any as PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
            receiptPromise.txHash = txHash;
            return receiptPromise;
        },
        async estimateGasAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('revokeConfirmation(uint256)', [transactionId
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
            transactionId: BigNumber,
        ): string {
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
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeRemoveAuthorizedAddressAtIndex(uint256)', [transactionId
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
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
        async awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` is optional, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            const self = this as any as AssetProxyOwnerContract;
            const txHash = await self.executeRemoveAuthorizedAddressAtIndex.sendTransactionAsync(transactionId
    , txData);
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const receiptPromise = self._web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                pollingIntervalMs,
                timeoutMs,
            ) as any as PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
            receiptPromise.txHash = txHash;
            return receiptPromise;
        },
        async estimateGasAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeRemoveAuthorizedAddressAtIndex(uint256)', [transactionId
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
            transactionId: BigNumber,
        ): string {
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
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('registerAssetProxy(address,bool)', [assetProxyContract,
    isRegistered
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
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
        async awaitTransactionSuccessAsync(
            assetProxyContract: string,
            isRegistered: boolean,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` is optional, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            const self = this as any as AssetProxyOwnerContract;
            const txHash = await self.registerAssetProxy.sendTransactionAsync(assetProxyContract,
    isRegistered
    , txData);
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const receiptPromise = self._web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                pollingIntervalMs,
                timeoutMs,
            ) as any as PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
            receiptPromise.txHash = txHash;
            return receiptPromise;
        },
        async estimateGasAsync(
            assetProxyContract: string,
            isRegistered: boolean,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('registerAssetProxy(address,bool)', [assetProxyContract,
    isRegistered
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
            assetProxyContract: string,
            isRegistered: boolean,
        ): string {
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
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('addOwner(address)', [owner
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
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
        async awaitTransactionSuccessAsync(
            owner: string,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` is optional, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            const self = this as any as AssetProxyOwnerContract;
            const txHash = await self.addOwner.sendTransactionAsync(owner
    , txData);
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const receiptPromise = self._web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                pollingIntervalMs,
                timeoutMs,
            ) as any as PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
            receiptPromise.txHash = txHash;
            return receiptPromise;
        },
        async estimateGasAsync(
            owner: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('addOwner(address)', [owner
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
            owner: string,
        ): string {
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
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeTimeLock(uint256)', [_secondsTimeLocked
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
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
        async awaitTransactionSuccessAsync(
            _secondsTimeLocked: BigNumber,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` is optional, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            const self = this as any as AssetProxyOwnerContract;
            const txHash = await self.changeTimeLock.sendTransactionAsync(_secondsTimeLocked
    , txData);
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const receiptPromise = self._web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                pollingIntervalMs,
                timeoutMs,
            ) as any as PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
            receiptPromise.txHash = txHash;
            return receiptPromise;
        },
        async estimateGasAsync(
            _secondsTimeLocked: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeTimeLock(uint256)', [_secondsTimeLocked
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
            _secondsTimeLocked: BigNumber,
        ): string {
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
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeRequirement(uint256)', [_required
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
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
        async awaitTransactionSuccessAsync(
            _required: BigNumber,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` is optional, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            const self = this as any as AssetProxyOwnerContract;
            const txHash = await self.changeRequirement.sendTransactionAsync(_required
    , txData);
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const receiptPromise = self._web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                pollingIntervalMs,
                timeoutMs,
            ) as any as PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
            receiptPromise.txHash = txHash;
            return receiptPromise;
        },
        async estimateGasAsync(
            _required: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeRequirement(uint256)', [_required
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
            _required: BigNumber,
        ): string {
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
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmTransaction(uint256)', [transactionId
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
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
        async awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` is optional, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            const self = this as any as AssetProxyOwnerContract;
            const txHash = await self.confirmTransaction.sendTransactionAsync(transactionId
    , txData);
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const receiptPromise = self._web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                pollingIntervalMs,
                timeoutMs,
            ) as any as PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
            receiptPromise.txHash = txHash;
            return receiptPromise;
        },
        async estimateGasAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmTransaction(uint256)', [transactionId
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
            transactionId: BigNumber,
        ): string {
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
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [destination,
    value,
    data
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
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
        async awaitTransactionSuccessAsync(
            destination: string,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` is optional, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            const self = this as any as AssetProxyOwnerContract;
            const txHash = await self.submitTransaction.sendTransactionAsync(destination,
    value,
    data
    , txData);
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const receiptPromise = self._web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                pollingIntervalMs,
                timeoutMs,
            ) as any as PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
            receiptPromise.txHash = txHash;
            return receiptPromise;
        },
        async estimateGasAsync(
            destination: string,
            value: BigNumber,
            data: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [destination,
    value,
    data
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
            destination: string,
            value: BigNumber,
            data: string,
        ): string {
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
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('replaceOwner(address,address)', [owner,
    newOwner
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
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
        async awaitTransactionSuccessAsync(
            owner: string,
            newOwner: string,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` is optional, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            const self = this as any as AssetProxyOwnerContract;
            const txHash = await self.replaceOwner.sendTransactionAsync(owner,
    newOwner
    , txData);
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const receiptPromise = self._web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                pollingIntervalMs,
                timeoutMs,
            ) as any as PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
            receiptPromise.txHash = txHash;
            return receiptPromise;
        },
        async estimateGasAsync(
            owner: string,
            newOwner: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('replaceOwner(address,address)', [owner,
    newOwner
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
            owner: string,
            newOwner: string,
        ): string {
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
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256)', [transactionId
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
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
        async awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData> | number,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            // `txData` is optional, so it might be set to `pollingIntervalMs`.
            if (typeof(txData) === 'number') {
                pollingIntervalMs = txData;
                timeoutMs = pollingIntervalMs;
                txData = {};
            }
            const self = this as any as AssetProxyOwnerContract;
            const txHash = await self.executeTransaction.sendTransactionAsync(transactionId
    , txData);
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const receiptPromise = self._web3Wrapper.awaitTransactionSuccessAsync(
                txHash,
                pollingIntervalMs,
                timeoutMs,
            ) as any as PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>;
            receiptPromise.txHash = txHash;
            return receiptPromise;
        },
        async estimateGasAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256)', [transactionId
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
            transactionId: BigNumber,
        ): string {
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
