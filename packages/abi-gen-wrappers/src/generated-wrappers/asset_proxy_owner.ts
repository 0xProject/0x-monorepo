// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract } from '@0x/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, ContractArtifact, DecodedLogArgs, MethodAbi, Provider, TxData, TxDataPayable } from 'ethereum-types';
import { BigNumber, classUtils, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as ethers from 'ethers';
import * as _ from 'lodash';
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
            const functionSignature = 'owners(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.owners;
            const encodedData = ethersFunction.encode([index_0
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'owners'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public removeOwner = {
        async sendTransactionAsync(
            owner: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('removeOwner(address)').inputs;
            [owner
    ] = BaseContract._formatABIDataItemList(inputAbi, [owner
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [owner
    ]);
            const encodedData = self._lookupEthersInterface('removeOwner(address)').functions.removeOwner.encode([owner
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
        async estimateGasAsync(
            owner: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('removeOwner(address)').inputs;
            [owner
    ] = BaseContract._formatABIDataItemList(inputAbi, [owner
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('removeOwner(address)').functions.removeOwner.encode([owner
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
            const inputAbi = self._lookupAbi('removeOwner(address)').inputs;
            [owner
    ] = BaseContract._formatABIDataItemList(inputAbi, [owner
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('removeOwner(address)').functions.removeOwner.encode([owner
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
            const functionSignature = 'removeOwner(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [owner
        ] = BaseContract._formatABIDataItemList(inputAbi, [owner
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [owner
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.removeOwner;
            const encodedData = ethersFunction.encode([owner
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'removeOwner'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public revokeConfirmation = {
        async sendTransactionAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('revokeConfirmation(uint256)').inputs;
            [transactionId
    ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [transactionId
    ]);
            const encodedData = self._lookupEthersInterface('revokeConfirmation(uint256)').functions.revokeConfirmation.encode([transactionId
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
        async estimateGasAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('revokeConfirmation(uint256)').inputs;
            [transactionId
    ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('revokeConfirmation(uint256)').functions.revokeConfirmation.encode([transactionId
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
            const inputAbi = self._lookupAbi('revokeConfirmation(uint256)').inputs;
            [transactionId
    ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('revokeConfirmation(uint256)').functions.revokeConfirmation.encode([transactionId
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
            const functionSignature = 'revokeConfirmation(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [transactionId
        ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [transactionId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.revokeConfirmation;
            const encodedData = ethersFunction.encode([transactionId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'revokeConfirmation'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
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
            const functionSignature = 'isOwner(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.isOwner;
            const encodedData = ethersFunction.encode([index_0
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'isOwner'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
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
            const functionSignature = 'confirmations(uint256,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0,
        index_1
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0,
        index_1
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0,
        index_1
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.confirmations;
            const encodedData = ethersFunction.encode([index_0,
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'confirmations'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public executeRemoveAuthorizedAddressAtIndex = {
        async sendTransactionAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('executeRemoveAuthorizedAddressAtIndex(uint256)').inputs;
            [transactionId
    ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [transactionId
    ]);
            const encodedData = self._lookupEthersInterface('executeRemoveAuthorizedAddressAtIndex(uint256)').functions.executeRemoveAuthorizedAddressAtIndex.encode([transactionId
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
        async estimateGasAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('executeRemoveAuthorizedAddressAtIndex(uint256)').inputs;
            [transactionId
    ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('executeRemoveAuthorizedAddressAtIndex(uint256)').functions.executeRemoveAuthorizedAddressAtIndex.encode([transactionId
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
            const inputAbi = self._lookupAbi('executeRemoveAuthorizedAddressAtIndex(uint256)').inputs;
            [transactionId
    ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('executeRemoveAuthorizedAddressAtIndex(uint256)').functions.executeRemoveAuthorizedAddressAtIndex.encode([transactionId
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
            const functionSignature = 'executeRemoveAuthorizedAddressAtIndex(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [transactionId
        ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [transactionId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.executeRemoveAuthorizedAddressAtIndex;
            const encodedData = ethersFunction.encode([transactionId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'executeRemoveAuthorizedAddressAtIndex'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public secondsTimeLocked = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as AssetProxyOwnerContract;
            const functionSignature = 'secondsTimeLocked()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.secondsTimeLocked;
            const encodedData = ethersFunction.encode([]);
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'secondsTimeLocked'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
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
            const functionSignature = 'getTransactionCount(bool,bool)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [pending,
        executed
        ] = BaseContract._formatABIDataItemList(inputAbi, [pending,
        executed
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [pending,
        executed
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getTransactionCount;
            const encodedData = ethersFunction.encode([pending,
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'getTransactionCount'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public registerAssetProxy = {
        async sendTransactionAsync(
            assetProxyContract: string,
            isRegistered: boolean,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('registerAssetProxy(address,bool)').inputs;
            [assetProxyContract,
    isRegistered
    ] = BaseContract._formatABIDataItemList(inputAbi, [assetProxyContract,
    isRegistered
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [assetProxyContract,
    isRegistered
    ]);
            const encodedData = self._lookupEthersInterface('registerAssetProxy(address,bool)').functions.registerAssetProxy.encode([assetProxyContract,
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
        async estimateGasAsync(
            assetProxyContract: string,
            isRegistered: boolean,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('registerAssetProxy(address,bool)').inputs;
            [assetProxyContract,
    isRegistered
    ] = BaseContract._formatABIDataItemList(inputAbi, [assetProxyContract,
    isRegistered
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('registerAssetProxy(address,bool)').functions.registerAssetProxy.encode([assetProxyContract,
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
            const inputAbi = self._lookupAbi('registerAssetProxy(address,bool)').inputs;
            [assetProxyContract,
    isRegistered
    ] = BaseContract._formatABIDataItemList(inputAbi, [assetProxyContract,
    isRegistered
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('registerAssetProxy(address,bool)').functions.registerAssetProxy.encode([assetProxyContract,
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
            const functionSignature = 'registerAssetProxy(address,bool)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [assetProxyContract,
        isRegistered
        ] = BaseContract._formatABIDataItemList(inputAbi, [assetProxyContract,
        isRegistered
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [assetProxyContract,
        isRegistered
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.registerAssetProxy;
            const encodedData = ethersFunction.encode([assetProxyContract,
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'registerAssetProxy'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public addOwner = {
        async sendTransactionAsync(
            owner: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('addOwner(address)').inputs;
            [owner
    ] = BaseContract._formatABIDataItemList(inputAbi, [owner
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [owner
    ]);
            const encodedData = self._lookupEthersInterface('addOwner(address)').functions.addOwner.encode([owner
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
        async estimateGasAsync(
            owner: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('addOwner(address)').inputs;
            [owner
    ] = BaseContract._formatABIDataItemList(inputAbi, [owner
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('addOwner(address)').functions.addOwner.encode([owner
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
            const inputAbi = self._lookupAbi('addOwner(address)').inputs;
            [owner
    ] = BaseContract._formatABIDataItemList(inputAbi, [owner
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('addOwner(address)').functions.addOwner.encode([owner
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
            const functionSignature = 'addOwner(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [owner
        ] = BaseContract._formatABIDataItemList(inputAbi, [owner
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [owner
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.addOwner;
            const encodedData = ethersFunction.encode([owner
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'addOwner'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
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
            const functionSignature = 'isConfirmed(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [transactionId
        ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [transactionId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.isConfirmed;
            const encodedData = ethersFunction.encode([transactionId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'isConfirmed'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public changeTimeLock = {
        async sendTransactionAsync(
            _secondsTimeLocked: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('changeTimeLock(uint256)').inputs;
            [_secondsTimeLocked
    ] = BaseContract._formatABIDataItemList(inputAbi, [_secondsTimeLocked
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_secondsTimeLocked
    ]);
            const encodedData = self._lookupEthersInterface('changeTimeLock(uint256)').functions.changeTimeLock.encode([_secondsTimeLocked
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
        async estimateGasAsync(
            _secondsTimeLocked: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('changeTimeLock(uint256)').inputs;
            [_secondsTimeLocked
    ] = BaseContract._formatABIDataItemList(inputAbi, [_secondsTimeLocked
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('changeTimeLock(uint256)').functions.changeTimeLock.encode([_secondsTimeLocked
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
            const inputAbi = self._lookupAbi('changeTimeLock(uint256)').inputs;
            [_secondsTimeLocked
    ] = BaseContract._formatABIDataItemList(inputAbi, [_secondsTimeLocked
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('changeTimeLock(uint256)').functions.changeTimeLock.encode([_secondsTimeLocked
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
            const functionSignature = 'changeTimeLock(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_secondsTimeLocked
        ] = BaseContract._formatABIDataItemList(inputAbi, [_secondsTimeLocked
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_secondsTimeLocked
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.changeTimeLock;
            const encodedData = ethersFunction.encode([_secondsTimeLocked
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'changeTimeLock'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
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
            const functionSignature = 'isAssetProxyRegistered(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.isAssetProxyRegistered;
            const encodedData = ethersFunction.encode([index_0
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'isAssetProxyRegistered'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
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
            const functionSignature = 'getConfirmationCount(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [transactionId
        ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [transactionId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getConfirmationCount;
            const encodedData = ethersFunction.encode([transactionId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'getConfirmationCount'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
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
            const functionSignature = 'transactions(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.transactions;
            const encodedData = ethersFunction.encode([index_0
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'transactions'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public getOwners = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string[]
        > {
            const self = this as any as AssetProxyOwnerContract;
            const functionSignature = 'getOwners()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getOwners;
            const encodedData = ethersFunction.encode([]);
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'getOwners'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
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
            const functionSignature = 'getTransactionIds(uint256,uint256,bool,bool)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [from,
        to,
        pending,
        executed
        ] = BaseContract._formatABIDataItemList(inputAbi, [from,
        to,
        pending,
        executed
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [from,
        to,
        pending,
        executed
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getTransactionIds;
            const encodedData = ethersFunction.encode([from,
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'getTransactionIds'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
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
            const functionSignature = 'getConfirmations(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [transactionId
        ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [transactionId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getConfirmations;
            const encodedData = ethersFunction.encode([transactionId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'getConfirmations'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public transactionCount = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as AssetProxyOwnerContract;
            const functionSignature = 'transactionCount()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.transactionCount;
            const encodedData = ethersFunction.encode([]);
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'transactionCount'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public changeRequirement = {
        async sendTransactionAsync(
            _required: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('changeRequirement(uint256)').inputs;
            [_required
    ] = BaseContract._formatABIDataItemList(inputAbi, [_required
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_required
    ]);
            const encodedData = self._lookupEthersInterface('changeRequirement(uint256)').functions.changeRequirement.encode([_required
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
        async estimateGasAsync(
            _required: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('changeRequirement(uint256)').inputs;
            [_required
    ] = BaseContract._formatABIDataItemList(inputAbi, [_required
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('changeRequirement(uint256)').functions.changeRequirement.encode([_required
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
            const inputAbi = self._lookupAbi('changeRequirement(uint256)').inputs;
            [_required
    ] = BaseContract._formatABIDataItemList(inputAbi, [_required
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('changeRequirement(uint256)').functions.changeRequirement.encode([_required
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
            const functionSignature = 'changeRequirement(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_required
        ] = BaseContract._formatABIDataItemList(inputAbi, [_required
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_required
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.changeRequirement;
            const encodedData = ethersFunction.encode([_required
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'changeRequirement'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public confirmTransaction = {
        async sendTransactionAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('confirmTransaction(uint256)').inputs;
            [transactionId
    ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [transactionId
    ]);
            const encodedData = self._lookupEthersInterface('confirmTransaction(uint256)').functions.confirmTransaction.encode([transactionId
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
        async estimateGasAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('confirmTransaction(uint256)').inputs;
            [transactionId
    ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('confirmTransaction(uint256)').functions.confirmTransaction.encode([transactionId
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
            const inputAbi = self._lookupAbi('confirmTransaction(uint256)').inputs;
            [transactionId
    ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('confirmTransaction(uint256)').functions.confirmTransaction.encode([transactionId
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
            const functionSignature = 'confirmTransaction(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [transactionId
        ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [transactionId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.confirmTransaction;
            const encodedData = ethersFunction.encode([transactionId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'confirmTransaction'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
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
            const inputAbi = self._lookupAbi('submitTransaction(address,uint256,bytes)').inputs;
            [destination,
    value,
    data
    ] = BaseContract._formatABIDataItemList(inputAbi, [destination,
    value,
    data
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [destination,
    value,
    data
    ]);
            const encodedData = self._lookupEthersInterface('submitTransaction(address,uint256,bytes)').functions.submitTransaction.encode([destination,
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
        async estimateGasAsync(
            destination: string,
            value: BigNumber,
            data: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('submitTransaction(address,uint256,bytes)').inputs;
            [destination,
    value,
    data
    ] = BaseContract._formatABIDataItemList(inputAbi, [destination,
    value,
    data
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('submitTransaction(address,uint256,bytes)').functions.submitTransaction.encode([destination,
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
            const inputAbi = self._lookupAbi('submitTransaction(address,uint256,bytes)').inputs;
            [destination,
    value,
    data
    ] = BaseContract._formatABIDataItemList(inputAbi, [destination,
    value,
    data
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('submitTransaction(address,uint256,bytes)').functions.submitTransaction.encode([destination,
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
            const functionSignature = 'submitTransaction(address,uint256,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [destination,
        value,
        data
        ] = BaseContract._formatABIDataItemList(inputAbi, [destination,
        value,
        data
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [destination,
        value,
        data
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.submitTransaction;
            const encodedData = ethersFunction.encode([destination,
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'submitTransaction'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
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
            const functionSignature = 'confirmationTimes(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.confirmationTimes;
            const encodedData = ethersFunction.encode([index_0
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'confirmationTimes'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public MAX_OWNER_COUNT = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as AssetProxyOwnerContract;
            const functionSignature = 'MAX_OWNER_COUNT()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.MAX_OWNER_COUNT;
            const encodedData = ethersFunction.encode([]);
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'MAX_OWNER_COUNT'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public required = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as AssetProxyOwnerContract;
            const functionSignature = 'required()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.required;
            const encodedData = ethersFunction.encode([]);
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'required'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public replaceOwner = {
        async sendTransactionAsync(
            owner: string,
            newOwner: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('replaceOwner(address,address)').inputs;
            [owner,
    newOwner
    ] = BaseContract._formatABIDataItemList(inputAbi, [owner,
    newOwner
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [owner,
    newOwner
    ]);
            const encodedData = self._lookupEthersInterface('replaceOwner(address,address)').functions.replaceOwner.encode([owner,
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
        async estimateGasAsync(
            owner: string,
            newOwner: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('replaceOwner(address,address)').inputs;
            [owner,
    newOwner
    ] = BaseContract._formatABIDataItemList(inputAbi, [owner,
    newOwner
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('replaceOwner(address,address)').functions.replaceOwner.encode([owner,
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
            const inputAbi = self._lookupAbi('replaceOwner(address,address)').inputs;
            [owner,
    newOwner
    ] = BaseContract._formatABIDataItemList(inputAbi, [owner,
    newOwner
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('replaceOwner(address,address)').functions.replaceOwner.encode([owner,
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
            const functionSignature = 'replaceOwner(address,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [owner,
        newOwner
        ] = BaseContract._formatABIDataItemList(inputAbi, [owner,
        newOwner
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [owner,
        newOwner
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.replaceOwner;
            const encodedData = ethersFunction.encode([owner,
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'replaceOwner'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public executeTransaction = {
        async sendTransactionAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('executeTransaction(uint256)').inputs;
            [transactionId
    ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [transactionId
    ]);
            const encodedData = self._lookupEthersInterface('executeTransaction(uint256)').functions.executeTransaction.encode([transactionId
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
        async estimateGasAsync(
            transactionId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as AssetProxyOwnerContract;
            const inputAbi = self._lookupAbi('executeTransaction(uint256)').inputs;
            [transactionId
    ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('executeTransaction(uint256)').functions.executeTransaction.encode([transactionId
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
            const inputAbi = self._lookupAbi('executeTransaction(uint256)').inputs;
            [transactionId
    ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('executeTransaction(uint256)').functions.executeTransaction.encode([transactionId
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
            const functionSignature = 'executeTransaction(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [transactionId
        ] = BaseContract._formatABIDataItemList(inputAbi, [transactionId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [transactionId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.executeTransaction;
            const encodedData = ethersFunction.encode([transactionId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'executeTransaction'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
            _owners: string[],
            _assetProxyContracts: string[],
            _required: BigNumber,
            _secondsTimeLocked: BigNumber,
    ): Promise<AssetProxyOwnerContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
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
        provider: Provider,
        txDefaults: Partial<TxData>,
            _owners: string[],
            _assetProxyContracts: string[],
            _required: BigNumber,
            _secondsTimeLocked: BigNumber,
    ): Promise<AssetProxyOwnerContract> {
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
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('AssetProxyOwner', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
