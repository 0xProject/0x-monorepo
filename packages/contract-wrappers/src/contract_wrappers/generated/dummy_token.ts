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

// tslint:disable:no-parameter-reassignment
export class DummyTokenContract extends BaseContract {
    public setBalance = {
        async sendTransactionAsync(_target: string, _value: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as DummyTokenContract;
            const inputAbi = self._lookupAbi('setBalance(address,uint256)').inputs;
            [_target, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_target, _value],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('setBalance(address,uint256)')
                .functions.setBalance(_target, _value).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.setBalance.estimateGasAsync.bind(self, _target, _value),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(_target: string, _value: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as DummyTokenContract;
            const inputAbi = self._lookupAbi('setBalance(address,uint256)').inputs;
            [_target, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_target, _value],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('setBalance(address,uint256)')
                .functions.setBalance(_target, _value).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(_target: string, _value: BigNumber): string {
            const self = (this as any) as DummyTokenContract;
            const inputAbi = self._lookupAbi('setBalance(address,uint256)').inputs;
            [_target, _value] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_target, _value],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('setBalance(address,uint256)')
                .functions.setBalance(_target, _value).data;
            return abiEncodedTransactionData;
        },
    };
    constructor(abi: ContractAbi, address: string, provider: Provider, defaults?: Partial<TxData>) {
        super(abi, address, provider, defaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
