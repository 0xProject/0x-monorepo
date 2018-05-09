/**
 * This file is auto-generated using abi-gen. Don't edit directly.
 * Templates can be found at https://github.com/0xProject/0x-monorepo/tree/development/packages/contract_templates.
 */
// tslint:disable:no-consecutive-blank-lines
// tslint:disable-next-line:no-unused-variable
import { BaseContract } from '@0xproject/base-contract';
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
import { BigNumber, classUtils, promisify } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethers from 'ethers';
import * as _ from 'lodash';

export type TokenTransferProxyContractEventArgs =
    | LogAuthorizedAddressAddedContractEventArgs
    | LogAuthorizedAddressRemovedContractEventArgs;

export enum TokenTransferProxyEvents {
    LogAuthorizedAddressAdded = 'LogAuthorizedAddressAdded',
    LogAuthorizedAddressRemoved = 'LogAuthorizedAddressRemoved',
}

export interface LogAuthorizedAddressAddedContractEventArgs {
    target: string;
    caller: string;
}

export interface LogAuthorizedAddressRemovedContractEventArgs {
    target: string;
    caller: string;
}

// tslint:disable:no-parameter-reassignment
export class TokenTransferProxyContract extends BaseContract {
    public transferFrom = {
        async sendTransactionAsync(
            token: string,
            from: string,
            to: string,
            value: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as TokenTransferProxyContract;
            const inputAbi = self._lookupAbi('transferFrom(address,address,address,uint256)').inputs;
            [token, from, to, value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [token, from, to, value],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('transferFrom(address,address,address,uint256)')
                .functions.transferFrom(token, from, to, value).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.transferFrom.estimateGasAsync.bind(self, token, from, to, value),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            token: string,
            from: string,
            to: string,
            value: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as TokenTransferProxyContract;
            const inputAbi = self._lookupAbi('transferFrom(address,address,address,uint256)').inputs;
            [token, from, to, value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [token, from, to, value],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('transferFrom(address,address,address,uint256)')
                .functions.transferFrom(token, from, to, value).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(token: string, from: string, to: string, value: BigNumber): string {
            const self = (this as any) as TokenTransferProxyContract;
            const inputAbi = self._lookupAbi('transferFrom(address,address,address,uint256)').inputs;
            [token, from, to, value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [token, from, to, value],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('transferFrom(address,address,address,uint256)')
                .functions.transferFrom(token, from, to, value).data;
            return abiEncodedTransactionData;
        },
        async callAsync(
            token: string,
            from: string,
            to: string,
            value: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            const self = (this as any) as TokenTransferProxyContract;
            const functionSignature = 'transferFrom(address,address,address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [token, from, to, value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [token, from, to, value],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.transferFrom(token, from, to, value) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'transferFrom' }) as MethodAbi).outputs;
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
    public addAuthorizedAddress = {
        async sendTransactionAsync(target: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as TokenTransferProxyContract;
            const inputAbi = self._lookupAbi('addAuthorizedAddress(address)').inputs;
            [target] = BaseContract._formatABIDataItemList(
                inputAbi,
                [target],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('addAuthorizedAddress(address)')
                .functions.addAuthorizedAddress(target).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.addAuthorizedAddress.estimateGasAsync.bind(self, target),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(target: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as TokenTransferProxyContract;
            const inputAbi = self._lookupAbi('addAuthorizedAddress(address)').inputs;
            [target] = BaseContract._formatABIDataItemList(
                inputAbi,
                [target],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('addAuthorizedAddress(address)')
                .functions.addAuthorizedAddress(target).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(target: string): string {
            const self = (this as any) as TokenTransferProxyContract;
            const inputAbi = self._lookupAbi('addAuthorizedAddress(address)').inputs;
            [target] = BaseContract._formatABIDataItemList(
                inputAbi,
                [target],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('addAuthorizedAddress(address)')
                .functions.addAuthorizedAddress(target).data;
            return abiEncodedTransactionData;
        },
    };
    public authorities = {
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            const self = (this as any) as TokenTransferProxyContract;
            const functionSignature = 'authorities(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.authorities(index_0) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'authorities' }) as MethodAbi).outputs;
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
    public removeAuthorizedAddress = {
        async sendTransactionAsync(target: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as TokenTransferProxyContract;
            const inputAbi = self._lookupAbi('removeAuthorizedAddress(address)').inputs;
            [target] = BaseContract._formatABIDataItemList(
                inputAbi,
                [target],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('removeAuthorizedAddress(address)')
                .functions.removeAuthorizedAddress(target).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.removeAuthorizedAddress.estimateGasAsync.bind(self, target),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(target: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as TokenTransferProxyContract;
            const inputAbi = self._lookupAbi('removeAuthorizedAddress(address)').inputs;
            [target] = BaseContract._formatABIDataItemList(
                inputAbi,
                [target],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('removeAuthorizedAddress(address)')
                .functions.removeAuthorizedAddress(target).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(target: string): string {
            const self = (this as any) as TokenTransferProxyContract;
            const inputAbi = self._lookupAbi('removeAuthorizedAddress(address)').inputs;
            [target] = BaseContract._formatABIDataItemList(
                inputAbi,
                [target],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('removeAuthorizedAddress(address)')
                .functions.removeAuthorizedAddress(target).data;
            return abiEncodedTransactionData;
        },
    };
    public owner = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            const self = (this as any) as TokenTransferProxyContract;
            const functionSignature = 'owner()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.owner() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'owner' }) as MethodAbi).outputs;
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
    public authorized = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            const self = (this as any) as TokenTransferProxyContract;
            const functionSignature = 'authorized(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.authorized(index_0) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'authorized' }) as MethodAbi).outputs;
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
    public getAuthorizedAddresses = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string[]> {
            const self = (this as any) as TokenTransferProxyContract;
            const functionSignature = 'getAuthorizedAddresses()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getAuthorizedAddresses() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getAuthorizedAddresses' }) as MethodAbi).outputs;
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
    public transferOwnership = {
        async sendTransactionAsync(newOwner: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as TokenTransferProxyContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [newOwner],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('transferOwnership(address)')
                .functions.transferOwnership(newOwner).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.transferOwnership.estimateGasAsync.bind(self, newOwner),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(newOwner: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as TokenTransferProxyContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [newOwner],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('transferOwnership(address)')
                .functions.transferOwnership(newOwner).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(newOwner: string): string {
            const self = (this as any) as TokenTransferProxyContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [newOwner],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('transferOwnership(address)')
                .functions.transferOwnership(newOwner).data;
            return abiEncodedTransactionData;
        },
    };
    constructor(abi: ContractAbi, address: string, provider: Provider, defaults?: Partial<TxData>) {
        super(abi, address, provider, defaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
