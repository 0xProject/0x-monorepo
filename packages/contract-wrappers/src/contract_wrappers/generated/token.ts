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

export type TokenContractEventArgs = TransferContractEventArgs | ApprovalContractEventArgs;

export enum TokenEvents {
    Transfer = 'Transfer',
    Approval = 'Approval',
}

export interface TransferContractEventArgs {
    _from: string;
    _to: string;
    _value: BigNumber;
}

export interface ApprovalContractEventArgs {
    _owner: string;
    _spender: string;
    _value: BigNumber;
}

// tslint:disable:no-parameter-reassignment
export class TokenContract extends BaseContract {
    public approve = {
        async sendTransactionAsync(_spender: string, _value: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as TokenContract;
            const inputAbi = self._lookupAbi('approve(address,uint256)').inputs;
            [_spender, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_spender, _value],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('approve(address,uint256)')
                .functions.approve(_spender, _value).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.approve.estimateGasAsync.bind(self, _spender, _value),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(_spender: string, _value: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as TokenContract;
            const inputAbi = self._lookupAbi('approve(address,uint256)').inputs;
            [_spender, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_spender, _value],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('approve(address,uint256)')
                .functions.approve(_spender, _value).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(_spender: string, _value: BigNumber): string {
            const self = (this as any) as TokenContract;
            const inputAbi = self._lookupAbi('approve(address,uint256)').inputs;
            [_spender, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_spender, _value],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('approve(address,uint256)')
                .functions.approve(_spender, _value).data;
            return abiEncodedTransactionData;
        },
        async callAsync(
            _spender: string,
            _value: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            const self = (this as any) as TokenContract;
            const functionSignature = 'approve(address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_spender, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_spender, _value],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.approve(_spender, _value) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'approve' }) as MethodAbi).outputs;
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
    public totalSupply = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            const self = (this as any) as TokenContract;
            const functionSignature = 'totalSupply()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.totalSupply() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'totalSupply' }) as MethodAbi).outputs;
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
    public transferFrom = {
        async sendTransactionAsync(
            _from: string,
            _to: string,
            _value: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as TokenContract;
            const inputAbi = self._lookupAbi('transferFrom(address,address,uint256)').inputs;
            [_from, _to, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_from, _to, _value],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('transferFrom(address,address,uint256)')
                .functions.transferFrom(_from, _to, _value).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.transferFrom.estimateGasAsync.bind(self, _from, _to, _value),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            _from: string,
            _to: string,
            _value: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as TokenContract;
            const inputAbi = self._lookupAbi('transferFrom(address,address,uint256)').inputs;
            [_from, _to, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_from, _to, _value],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('transferFrom(address,address,uint256)')
                .functions.transferFrom(_from, _to, _value).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(_from: string, _to: string, _value: BigNumber): string {
            const self = (this as any) as TokenContract;
            const inputAbi = self._lookupAbi('transferFrom(address,address,uint256)').inputs;
            [_from, _to, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_from, _to, _value],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('transferFrom(address,address,uint256)')
                .functions.transferFrom(_from, _to, _value).data;
            return abiEncodedTransactionData;
        },
        async callAsync(
            _from: string,
            _to: string,
            _value: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            const self = (this as any) as TokenContract;
            const functionSignature = 'transferFrom(address,address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_from, _to, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_from, _to, _value],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.transferFrom(_from, _to, _value) as ethers.CallDescription;
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
    public balanceOf = {
        async callAsync(
            _owner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as TokenContract;
            const functionSignature = 'balanceOf(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_owner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_owner],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.balanceOf(_owner) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'balanceOf' }) as MethodAbi).outputs;
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
    public transfer = {
        async sendTransactionAsync(_to: string, _value: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as TokenContract;
            const inputAbi = self._lookupAbi('transfer(address,uint256)').inputs;
            [_to, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_to, _value],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self._lookupEthersInterface('transfer(address,uint256)').functions.transfer(_to, _value)
                .data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.transfer.estimateGasAsync.bind(self, _to, _value),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(_to: string, _value: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as TokenContract;
            const inputAbi = self._lookupAbi('transfer(address,uint256)').inputs;
            [_to, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_to, _value],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self._lookupEthersInterface('transfer(address,uint256)').functions.transfer(_to, _value)
                .data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(_to: string, _value: BigNumber): string {
            const self = (this as any) as TokenContract;
            const inputAbi = self._lookupAbi('transfer(address,uint256)').inputs;
            [_to, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_to, _value],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('transfer(address,uint256)')
                .functions.transfer(_to, _value).data;
            return abiEncodedTransactionData;
        },
        async callAsync(
            _to: string,
            _value: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            const self = (this as any) as TokenContract;
            const functionSignature = 'transfer(address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_to, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_to, _value],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.transfer(_to, _value) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'transfer' }) as MethodAbi).outputs;
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
    public allowance = {
        async callAsync(
            _owner: string,
            _spender: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as TokenContract;
            const functionSignature = 'allowance(address,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_owner, _spender] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_owner, _spender],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.allowance(_owner, _spender) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'allowance' }) as MethodAbi).outputs;
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
    constructor(abi: ContractAbi, address: string, provider: Provider, defaults?: Partial<TxData>) {
        super(abi, address, provider, defaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
