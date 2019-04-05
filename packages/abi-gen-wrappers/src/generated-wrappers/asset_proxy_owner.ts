// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract } from '@0x/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, ContractArtifact, DecodedLogArgs, MethodAbi, TxData, TxDataPayable, SupportedProvider } from 'ethereum-types';
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { isUndefined } from 'lodash';
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
        functionSignature: 'owners(uint256)',
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.owners.functionSignature, [index_0
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.owners.functionSignature);
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
            const encodedData = self._strictEncodeArguments(self.removeOwner.functionSignature, [owner
    ]);
            const gasEstimateFunction = self.removeOwner.estimateGasAsync.bind(self, owner
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            owner: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.removeOwner.functionSignature, [owner
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            owner: string,
        ): string {
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.removeOwner.functionSignature, [owner
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'removeOwner(address)',
        async callAsync(
            owner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.removeOwner.functionSignature, [owner
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.removeOwner.functionSignature);
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
            const encodedData = self._strictEncodeArguments(self.revokeConfirmation.functionSignature, [transactionId
    ]);
            const gasEstimateFunction = self.revokeConfirmation.estimateGasAsync.bind(self, transactionId
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.revokeConfirmation.functionSignature, [transactionId
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            transactionId: BigNumber,
        ): string {
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.revokeConfirmation.functionSignature, [transactionId
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'revokeConfirmation(uint256)',
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.revokeConfirmation.functionSignature, [transactionId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.revokeConfirmation.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public isOwner = {
        functionSignature: 'isOwner(address)',
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.isOwner.functionSignature, [index_0
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.isOwner.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public confirmations = {
        functionSignature: 'confirmations(uint256,address)',
        async callAsync(
            index_0: BigNumber,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.confirmations.functionSignature, [index_0,
        index_1
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.confirmations.functionSignature);
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
            const encodedData = self._strictEncodeArguments(self.executeRemoveAuthorizedAddressAtIndex.functionSignature, [transactionId
    ]);
            const gasEstimateFunction = self.executeRemoveAuthorizedAddressAtIndex.estimateGasAsync.bind(self, transactionId
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.executeRemoveAuthorizedAddressAtIndex.functionSignature, [transactionId
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            transactionId: BigNumber,
        ): string {
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.executeRemoveAuthorizedAddressAtIndex.functionSignature, [transactionId
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'executeRemoveAuthorizedAddressAtIndex(uint256)',
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.executeRemoveAuthorizedAddressAtIndex.functionSignature, [transactionId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.executeRemoveAuthorizedAddressAtIndex.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public secondsTimeLocked = {
        functionSignature: 'secondsTimeLocked()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.secondsTimeLocked.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.secondsTimeLocked.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getTransactionCount = {
        functionSignature: 'getTransactionCount(bool,bool)',
        async callAsync(
            pending: boolean,
            executed: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.getTransactionCount.functionSignature, [pending,
        executed
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getTransactionCount.functionSignature);
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
            const encodedData = self._strictEncodeArguments(self.registerAssetProxy.functionSignature, [assetProxyContract,
    isRegistered
    ]);
            const gasEstimateFunction = self.registerAssetProxy.estimateGasAsync.bind(self, assetProxyContract,
    isRegistered
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            assetProxyContract: string,
            isRegistered: boolean,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.registerAssetProxy.functionSignature, [assetProxyContract,
    isRegistered
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            assetProxyContract: string,
            isRegistered: boolean,
        ): string {
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.registerAssetProxy.functionSignature, [assetProxyContract,
    isRegistered
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'registerAssetProxy(address,bool)',
        async callAsync(
            assetProxyContract: string,
            isRegistered: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.registerAssetProxy.functionSignature, [assetProxyContract,
        isRegistered
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.registerAssetProxy.functionSignature);
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
            const encodedData = self._strictEncodeArguments(self.addOwner.functionSignature, [owner
    ]);
            const gasEstimateFunction = self.addOwner.estimateGasAsync.bind(self, owner
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            owner: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.addOwner.functionSignature, [owner
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            owner: string,
        ): string {
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.addOwner.functionSignature, [owner
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'addOwner(address)',
        async callAsync(
            owner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.addOwner.functionSignature, [owner
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.addOwner.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public isConfirmed = {
        functionSignature: 'isConfirmed(uint256)',
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.isConfirmed.functionSignature, [transactionId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.isConfirmed.functionSignature);
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
            const encodedData = self._strictEncodeArguments(self.changeTimeLock.functionSignature, [_secondsTimeLocked
    ]);
            const gasEstimateFunction = self.changeTimeLock.estimateGasAsync.bind(self, _secondsTimeLocked
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            _secondsTimeLocked: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.changeTimeLock.functionSignature, [_secondsTimeLocked
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            _secondsTimeLocked: BigNumber,
        ): string {
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.changeTimeLock.functionSignature, [_secondsTimeLocked
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'changeTimeLock(uint256)',
        async callAsync(
            _secondsTimeLocked: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.changeTimeLock.functionSignature, [_secondsTimeLocked
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.changeTimeLock.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public isAssetProxyRegistered = {
        functionSignature: 'isAssetProxyRegistered(address)',
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.isAssetProxyRegistered.functionSignature, [index_0
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.isAssetProxyRegistered.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getConfirmationCount = {
        functionSignature: 'getConfirmationCount(uint256)',
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.getConfirmationCount.functionSignature, [transactionId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getConfirmationCount.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public transactions = {
        functionSignature: 'transactions(uint256)',
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, BigNumber, string, boolean]
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.transactions.functionSignature, [index_0
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.transactions.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, BigNumber, string, boolean]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getOwners = {
        functionSignature: 'getOwners()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string[]
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.getOwners.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getOwners.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string[]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getTransactionIds = {
        functionSignature: 'getTransactionIds(uint256,uint256,bool,bool)',
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
            const encodedData = self._strictEncodeArguments(self.getTransactionIds.functionSignature, [from,
        to,
        pending,
        executed
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getTransactionIds.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber[]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getConfirmations = {
        functionSignature: 'getConfirmations(uint256)',
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string[]
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.getConfirmations.functionSignature, [transactionId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getConfirmations.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string[]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public transactionCount = {
        functionSignature: 'transactionCount()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.transactionCount.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.transactionCount.functionSignature);
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
            const encodedData = self._strictEncodeArguments(self.changeRequirement.functionSignature, [_required
    ]);
            const gasEstimateFunction = self.changeRequirement.estimateGasAsync.bind(self, _required
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            _required: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.changeRequirement.functionSignature, [_required
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            _required: BigNumber,
        ): string {
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.changeRequirement.functionSignature, [_required
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'changeRequirement(uint256)',
        async callAsync(
            _required: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.changeRequirement.functionSignature, [_required
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.changeRequirement.functionSignature);
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
            const encodedData = self._strictEncodeArguments(self.confirmTransaction.functionSignature, [transactionId
    ]);
            const gasEstimateFunction = self.confirmTransaction.estimateGasAsync.bind(self, transactionId
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.confirmTransaction.functionSignature, [transactionId
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            transactionId: BigNumber,
        ): string {
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.confirmTransaction.functionSignature, [transactionId
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'confirmTransaction(uint256)',
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.confirmTransaction.functionSignature, [transactionId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.confirmTransaction.functionSignature);
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
            const encodedData = self._strictEncodeArguments(self.submitTransaction.functionSignature, [destination,
    value,
    data
    ]);
            const gasEstimateFunction = self.submitTransaction.estimateGasAsync.bind(self, destination,
    value,
    data
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            destination: string,
            value: BigNumber,
            data: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.submitTransaction.functionSignature, [destination,
    value,
    data
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            destination: string,
            value: BigNumber,
            data: string,
        ): string {
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.submitTransaction.functionSignature, [destination,
    value,
    data
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'submitTransaction(address,uint256,bytes)',
        async callAsync(
            destination: string,
            value: BigNumber,
            data: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.submitTransaction.functionSignature, [destination,
        value,
        data
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.submitTransaction.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public confirmationTimes = {
        functionSignature: 'confirmationTimes(uint256)',
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.confirmationTimes.functionSignature, [index_0
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.confirmationTimes.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public MAX_OWNER_COUNT = {
        functionSignature: 'MAX_OWNER_COUNT()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.MAX_OWNER_COUNT.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.MAX_OWNER_COUNT.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public required = {
        functionSignature: 'required()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.required.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.required.functionSignature);
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
            const encodedData = self._strictEncodeArguments(self.replaceOwner.functionSignature, [owner,
    newOwner
    ]);
            const gasEstimateFunction = self.replaceOwner.estimateGasAsync.bind(self, owner,
    newOwner
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            owner: string,
            newOwner: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.replaceOwner.functionSignature, [owner,
    newOwner
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            owner: string,
            newOwner: string,
        ): string {
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.replaceOwner.functionSignature, [owner,
    newOwner
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'replaceOwner(address,address)',
        async callAsync(
            owner: string,
            newOwner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.replaceOwner.functionSignature, [owner,
        newOwner
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.replaceOwner.functionSignature);
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
            const encodedData = self._strictEncodeArguments(self.executeTransaction.functionSignature, [transactionId
    ]);
            const gasEstimateFunction = self.executeTransaction.estimateGasAsync.bind(self, transactionId
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.executeTransaction.functionSignature, [transactionId
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            transactionId: BigNumber,
        ): string {
            const self = this as any as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.executeTransaction.functionSignature, [transactionId
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'executeTransaction(uint256)',
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments(self.executeTransaction.functionSignature, [transactionId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.executeTransaction.functionSignature);
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
        if (isUndefined(artifact.compilerOutput)) {
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
        return {} as any;
    }
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('AssetProxyOwner', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
