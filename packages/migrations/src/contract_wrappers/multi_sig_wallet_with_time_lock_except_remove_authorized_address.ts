/**
 * This file is auto-generated using abi-gen. Don't edit directly.
 * Templates can be found at https://github.com/0xProject/0x-monorepo/tree/development/packages/contract_templates.
 */
// tslint:disable:no-consecutive-blank-lines
// tslint:disable-next-line:no-unused-variable
import { BaseContract } from '@0xproject/base-contract';
import { ContractArtifact } from '@0xproject/sol-compiler';
import {
    BlockParam,
    BlockParamLiteral,
    CallData,
    ContractAbi,
    DataItem,
    MethodAbi,
    Provider,
    TxData,
    TxDataPayable,
} from '@0xproject/types';
import { BigNumber, classUtils, logUtils, promisify } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethers from 'ethers';
import * as _ from 'lodash';

export type MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContractEventArgs =
    | ConfirmationTimeSetContractEventArgs
    | TimeLockChangeContractEventArgs
    | ConfirmationContractEventArgs
    | RevocationContractEventArgs
    | SubmissionContractEventArgs
    | ExecutionContractEventArgs
    | ExecutionFailureContractEventArgs
    | DepositContractEventArgs
    | OwnerAdditionContractEventArgs
    | OwnerRemovalContractEventArgs
    | RequirementChangeContractEventArgs;

export enum MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressEvents {
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

export interface ConfirmationTimeSetContractEventArgs {
    transactionId: BigNumber;
    confirmationTime: BigNumber;
}

export interface TimeLockChangeContractEventArgs {
    secondsTimeLocked: BigNumber;
}

export interface ConfirmationContractEventArgs {
    sender: string;
    transactionId: BigNumber;
}

export interface RevocationContractEventArgs {
    sender: string;
    transactionId: BigNumber;
}

export interface SubmissionContractEventArgs {
    transactionId: BigNumber;
}

export interface ExecutionContractEventArgs {
    transactionId: BigNumber;
}

export interface ExecutionFailureContractEventArgs {
    transactionId: BigNumber;
}

export interface DepositContractEventArgs {
    sender: string;
    value: BigNumber;
}

export interface OwnerAdditionContractEventArgs {
    owner: string;
}

export interface OwnerRemovalContractEventArgs {
    owner: string;
}

export interface RequirementChangeContractEventArgs {
    required: BigNumber;
}

// tslint:disable:no-parameter-reassignment
export class MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract extends BaseContract {
    public owners = {
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'owners(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.owners(index_0) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'owners' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public removeOwner = {
        async sendTransactionAsync(owner: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('removeOwner(address)').inputs;
            [owner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [owner],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self._lookupEthersInterface('removeOwner(address)').functions.removeOwner(owner).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.removeOwner.estimateGasAsync.bind(self, owner),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(owner: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('removeOwner(address)').inputs;
            [owner] = BaseContract._formatABIDataItemList(inputAbi, [owner], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('removeOwner(address)').functions.removeOwner(owner).data;
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
        getABIEncodedTransactionData(owner: string): string {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('removeOwner(address)').inputs;
            [owner] = BaseContract._formatABIDataItemList(inputAbi, [owner], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('removeOwner(address)')
                .functions.removeOwner(owner).data;
            return abiEncodedTransactionData;
        },
    };
    public revokeConfirmation = {
        async sendTransactionAsync(transactionId: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('revokeConfirmation(uint256)').inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('revokeConfirmation(uint256)')
                .functions.revokeConfirmation(transactionId).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.revokeConfirmation.estimateGasAsync.bind(self, transactionId),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(transactionId: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('revokeConfirmation(uint256)').inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('revokeConfirmation(uint256)')
                .functions.revokeConfirmation(transactionId).data;
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
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('revokeConfirmation(uint256)').inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('revokeConfirmation(uint256)')
                .functions.revokeConfirmation(transactionId).data;
            return abiEncodedTransactionData;
        },
    };
    public isOwner = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'isOwner(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.isOwner(index_0) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'isOwner' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public confirmations = {
        async callAsync(
            index_0: BigNumber,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'confirmations(uint256,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0, index_1] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0, index_1],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.confirmations(index_0, index_1) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'confirmations' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public secondsTimeLocked = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'secondsTimeLocked()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.secondsTimeLocked() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'secondsTimeLocked' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public getTransactionCount = {
        async callAsync(
            pending: boolean,
            executed: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'getTransactionCount(bool,bool)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [pending, executed] = BaseContract._formatABIDataItemList(
                inputAbi,
                [pending, executed],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getTransactionCount(pending, executed) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getTransactionCount' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public isFunctionRemoveAuthorizedAddress = {
        async callAsync(data: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<boolean> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'isFunctionRemoveAuthorizedAddress(bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [data] = BaseContract._formatABIDataItemList(inputAbi, [data], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.isFunctionRemoveAuthorizedAddress(data) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'isFunctionRemoveAuthorizedAddress' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public executeRemoveAuthorizedAddress = {
        async sendTransactionAsync(transactionId: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('executeRemoveAuthorizedAddress(uint256)').inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('executeRemoveAuthorizedAddress(uint256)')
                .functions.executeRemoveAuthorizedAddress(transactionId).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.executeRemoveAuthorizedAddress.estimateGasAsync.bind(self, transactionId),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(transactionId: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('executeRemoveAuthorizedAddress(uint256)').inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('executeRemoveAuthorizedAddress(uint256)')
                .functions.executeRemoveAuthorizedAddress(transactionId).data;
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
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('executeRemoveAuthorizedAddress(uint256)').inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('executeRemoveAuthorizedAddress(uint256)')
                .functions.executeRemoveAuthorizedAddress(transactionId).data;
            return abiEncodedTransactionData;
        },
    };
    public addOwner = {
        async sendTransactionAsync(owner: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('addOwner(address)').inputs;
            [owner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [owner],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self._lookupEthersInterface('addOwner(address)').functions.addOwner(owner).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.addOwner.estimateGasAsync.bind(self, owner),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(owner: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('addOwner(address)').inputs;
            [owner] = BaseContract._formatABIDataItemList(inputAbi, [owner], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('addOwner(address)').functions.addOwner(owner).data;
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
        getABIEncodedTransactionData(owner: string): string {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('addOwner(address)').inputs;
            [owner] = BaseContract._formatABIDataItemList(inputAbi, [owner], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('addOwner(address)').functions.addOwner(owner)
                .data;
            return abiEncodedTransactionData;
        },
    };
    public isConfirmed = {
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'isConfirmed(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.isConfirmed(transactionId) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'isConfirmed' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public changeTimeLock = {
        async sendTransactionAsync(_secondsTimeLocked: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('changeTimeLock(uint256)').inputs;
            [_secondsTimeLocked] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_secondsTimeLocked],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('changeTimeLock(uint256)')
                .functions.changeTimeLock(_secondsTimeLocked).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.changeTimeLock.estimateGasAsync.bind(self, _secondsTimeLocked),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(_secondsTimeLocked: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('changeTimeLock(uint256)').inputs;
            [_secondsTimeLocked] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_secondsTimeLocked],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('changeTimeLock(uint256)')
                .functions.changeTimeLock(_secondsTimeLocked).data;
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
        getABIEncodedTransactionData(_secondsTimeLocked: BigNumber): string {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('changeTimeLock(uint256)').inputs;
            [_secondsTimeLocked] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_secondsTimeLocked],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('changeTimeLock(uint256)')
                .functions.changeTimeLock(_secondsTimeLocked).data;
            return abiEncodedTransactionData;
        },
    };
    public getConfirmationCount = {
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'getConfirmationCount(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getConfirmationCount(transactionId) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getConfirmationCount' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public transactions = {
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, BigNumber, string, boolean]> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'transactions(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.transactions(index_0) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'transactions' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray;
        },
    };
    public getOwners = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string[]> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'getOwners()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getOwners() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getOwners' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
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
        ): Promise<BigNumber[]> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'getTransactionIds(uint256,uint256,bool,bool)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [from, to, pending, executed] = BaseContract._formatABIDataItemList(
                inputAbi,
                [from, to, pending, executed],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getTransactionIds(from, to, pending, executed) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getTransactionIds' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public TOKEN_TRANSFER_PROXY_CONTRACT = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'TOKEN_TRANSFER_PROXY_CONTRACT()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.TOKEN_TRANSFER_PROXY_CONTRACT() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'TOKEN_TRANSFER_PROXY_CONTRACT' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public getConfirmations = {
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string[]> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'getConfirmations(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getConfirmations(transactionId) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getConfirmations' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public transactionCount = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'transactionCount()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.transactionCount() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'transactionCount' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public changeRequirement = {
        async sendTransactionAsync(_required: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('changeRequirement(uint256)').inputs;
            [_required] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_required],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('changeRequirement(uint256)')
                .functions.changeRequirement(_required).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.changeRequirement.estimateGasAsync.bind(self, _required),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(_required: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('changeRequirement(uint256)').inputs;
            [_required] = BaseContract._formatABIDataItemList(inputAbi, [_required], BaseContract._bigNumberToString);
            const encodedData = self
                ._lookupEthersInterface('changeRequirement(uint256)')
                .functions.changeRequirement(_required).data;
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
        getABIEncodedTransactionData(_required: BigNumber): string {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('changeRequirement(uint256)').inputs;
            [_required] = BaseContract._formatABIDataItemList(inputAbi, [_required], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('changeRequirement(uint256)')
                .functions.changeRequirement(_required).data;
            return abiEncodedTransactionData;
        },
    };
    public confirmTransaction = {
        async sendTransactionAsync(transactionId: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('confirmTransaction(uint256)').inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('confirmTransaction(uint256)')
                .functions.confirmTransaction(transactionId).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.confirmTransaction.estimateGasAsync.bind(self, transactionId),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(transactionId: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('confirmTransaction(uint256)').inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('confirmTransaction(uint256)')
                .functions.confirmTransaction(transactionId).data;
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
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('confirmTransaction(uint256)').inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('confirmTransaction(uint256)')
                .functions.confirmTransaction(transactionId).data;
            return abiEncodedTransactionData;
        },
    };
    public submitTransaction = {
        async sendTransactionAsync(
            destination: string,
            value: BigNumber,
            data: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('submitTransaction(address,uint256,bytes)').inputs;
            [destination, value, data] = BaseContract._formatABIDataItemList(
                inputAbi,
                [destination, value, data],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('submitTransaction(address,uint256,bytes)')
                .functions.submitTransaction(destination, value, data).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.submitTransaction.estimateGasAsync.bind(self, destination, value, data),
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
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('submitTransaction(address,uint256,bytes)').inputs;
            [destination, value, data] = BaseContract._formatABIDataItemList(
                inputAbi,
                [destination, value, data],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('submitTransaction(address,uint256,bytes)')
                .functions.submitTransaction(destination, value, data).data;
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
        getABIEncodedTransactionData(destination: string, value: BigNumber, data: string): string {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('submitTransaction(address,uint256,bytes)').inputs;
            [destination, value, data] = BaseContract._formatABIDataItemList(
                inputAbi,
                [destination, value, data],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('submitTransaction(address,uint256,bytes)')
                .functions.submitTransaction(destination, value, data).data;
            return abiEncodedTransactionData;
        },
        async callAsync(
            destination: string,
            value: BigNumber,
            data: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'submitTransaction(address,uint256,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [destination, value, data] = BaseContract._formatABIDataItemList(
                inputAbi,
                [destination, value, data],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.submitTransaction(destination, value, data) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'submitTransaction' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public confirmationTimes = {
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'confirmationTimes(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.confirmationTimes(index_0) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'confirmationTimes' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public MAX_OWNER_COUNT = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'MAX_OWNER_COUNT()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.MAX_OWNER_COUNT() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'MAX_OWNER_COUNT' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public required = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const functionSignature = 'required()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.required() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'required' }) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            resultArray = BaseContract._formatABIDataItemList(
                outputAbi,
                resultArray,
                BaseContract._bnToBigNumber.bind(this),
            );
            return resultArray[0];
        },
    };
    public replaceOwner = {
        async sendTransactionAsync(owner: string, newOwner: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('replaceOwner(address,address)').inputs;
            [owner, newOwner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [owner, newOwner],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('replaceOwner(address,address)')
                .functions.replaceOwner(owner, newOwner).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.replaceOwner.estimateGasAsync.bind(self, owner, newOwner),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(owner: string, newOwner: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('replaceOwner(address,address)').inputs;
            [owner, newOwner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [owner, newOwner],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('replaceOwner(address,address)')
                .functions.replaceOwner(owner, newOwner).data;
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
        getABIEncodedTransactionData(owner: string, newOwner: string): string {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('replaceOwner(address,address)').inputs;
            [owner, newOwner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [owner, newOwner],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('replaceOwner(address,address)')
                .functions.replaceOwner(owner, newOwner).data;
            return abiEncodedTransactionData;
        },
    };
    public executeTransaction = {
        async sendTransactionAsync(transactionId: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('executeTransaction(uint256)').inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('executeTransaction(uint256)')
                .functions.executeTransaction(transactionId).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.executeTransaction.estimateGasAsync.bind(self, transactionId),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(transactionId: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('executeTransaction(uint256)').inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('executeTransaction(uint256)')
                .functions.executeTransaction(transactionId).data;
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
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            const self = (this as any) as MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract;
            const inputAbi = self._lookupAbi('executeTransaction(uint256)').inputs;
            [transactionId] = BaseContract._formatABIDataItemList(
                inputAbi,
                [transactionId],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('executeTransaction(uint256)')
                .functions.executeTransaction(transactionId).data;
            return abiEncodedTransactionData;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
        _owners: string[],
        _required: BigNumber,
        _secondsTimeLocked: BigNumber,
        _tokenTransferProxy: string,
    ): Promise<MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            _owners,
            _required,
            _secondsTimeLocked,
            _tokenTransferProxy,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
        _owners: string[],
        _required: BigNumber,
        _secondsTimeLocked: BigNumber,
        _tokenTransferProxy: string,
    ): Promise<MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract> {
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_owners, _required, _secondsTimeLocked, _tokenTransferProxy] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_owners, _required, _secondsTimeLocked, _tokenTransferProxy],
            BaseContract._bigNumberToString,
        );
        const txData = ethers.Contract.getDeployTransaction(
            bytecode,
            abi,
            _owners,
            _required,
            _secondsTimeLocked,
            _tokenTransferProxy,
        );
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            txData,
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionMinedAsync(txHash);
        logUtils.log(
            `MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress successfully deployed at ${
                txReceipt.contractAddress
            }`,
        );
        const contractInstance = new MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract(
            abi,
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
        );
        contractInstance.constructorArgs = [_owners, _required, _secondsTimeLocked, _tokenTransferProxy];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
