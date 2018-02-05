/**
 * This file is auto-generated using abi-gen. Don't edit directly.
 * Templates can be found at https://github.com/0xProject/0x.js/tree/development/packages/abi-gen-templates.
 */
// tslint:disable-next-line:no-unused-variable
import { TxData, TxDataPayable } from '@0xproject/types';
import { BigNumber, classUtils, promisify } from '@0xproject/utils';
import * as Web3 from 'web3';

import {BaseContract} from './base_contract';

export class DummyTokenContract extends BaseContract {
    public name = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as DummyTokenContract;
            const result = await promisify<string
    >(
                self._web3ContractInstance.name.call,
                self._web3ContractInstance,
            )(
            );
            return result;
        },
    };
    public approve = {
        async sendTransactionAsync(
            _spender: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as DummyTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.approve.estimateGasAsync.bind(
                    self,
                    _spender,
                    _value,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.approve, self._web3ContractInstance,
            )(
                _spender,
                _value,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            _spender: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as DummyTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.approve.estimateGas, self._web3ContractInstance,
            )(
                _spender,
                _value,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            _spender: string,
            _value: BigNumber,
            txData: TxData = {},
        ): string {
            const self = this as DummyTokenContract;
            const abiEncodedTransactionData = self._web3ContractInstance.approve.getData();
            return abiEncodedTransactionData;
        },
    };
    public totalSupply = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<BigNumber
    > {
            const self = this as DummyTokenContract;
            const result = await promisify<BigNumber
    >(
                self._web3ContractInstance.totalSupply.call,
                self._web3ContractInstance,
            )(
            );
            return result;
        },
    };
    public transferFrom = {
        async sendTransactionAsync(
            _from: string,
            _to: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as DummyTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.transferFrom.estimateGasAsync.bind(
                    self,
                    _from,
                    _to,
                    _value,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.transferFrom, self._web3ContractInstance,
            )(
                _from,
                _to,
                _value,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            _from: string,
            _to: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as DummyTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.transferFrom.estimateGas, self._web3ContractInstance,
            )(
                _from,
                _to,
                _value,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            _from: string,
            _to: string,
            _value: BigNumber,
            txData: TxData = {},
        ): string {
            const self = this as DummyTokenContract;
            const abiEncodedTransactionData = self._web3ContractInstance.transferFrom.getData();
            return abiEncodedTransactionData;
        },
    };
    public decimals = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<BigNumber
    > {
            const self = this as DummyTokenContract;
            const result = await promisify<BigNumber
    >(
                self._web3ContractInstance.decimals.call,
                self._web3ContractInstance,
            )(
            );
            return result;
        },
    };
    public balanceOf = {
        async callAsync(
            _owner: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<BigNumber
    > {
            const self = this as DummyTokenContract;
            const result = await promisify<BigNumber
    >(
                self._web3ContractInstance.balanceOf.call,
                self._web3ContractInstance,
            )(
                _owner,
            );
            return result;
        },
    };
    public owner = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as DummyTokenContract;
            const result = await promisify<string
    >(
                self._web3ContractInstance.owner.call,
                self._web3ContractInstance,
            )(
            );
            return result;
        },
    };
    public symbol = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as DummyTokenContract;
            const result = await promisify<string
    >(
                self._web3ContractInstance.symbol.call,
                self._web3ContractInstance,
            )(
            );
            return result;
        },
    };
    public mint = {
        async sendTransactionAsync(
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as DummyTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.mint.estimateGasAsync.bind(
                    self,
                    _value,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.mint, self._web3ContractInstance,
            )(
                _value,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as DummyTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.mint.estimateGas, self._web3ContractInstance,
            )(
                _value,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            _value: BigNumber,
            txData: TxData = {},
        ): string {
            const self = this as DummyTokenContract;
            const abiEncodedTransactionData = self._web3ContractInstance.mint.getData();
            return abiEncodedTransactionData;
        },
    };
    public transfer = {
        async sendTransactionAsync(
            _to: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as DummyTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.transfer.estimateGasAsync.bind(
                    self,
                    _to,
                    _value,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.transfer, self._web3ContractInstance,
            )(
                _to,
                _value,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            _to: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as DummyTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.transfer.estimateGas, self._web3ContractInstance,
            )(
                _to,
                _value,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            _to: string,
            _value: BigNumber,
            txData: TxData = {},
        ): string {
            const self = this as DummyTokenContract;
            const abiEncodedTransactionData = self._web3ContractInstance.transfer.getData();
            return abiEncodedTransactionData;
        },
    };
    public allowance = {
        async callAsync(
            _owner: string,
            _spender: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<BigNumber
    > {
            const self = this as DummyTokenContract;
            const result = await promisify<BigNumber
    >(
                self._web3ContractInstance.allowance.call,
                self._web3ContractInstance,
            )(
                _owner,
                _spender,
            );
            return result;
        },
    };
    public setBalance = {
        async sendTransactionAsync(
            _target: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as DummyTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.setBalance.estimateGasAsync.bind(
                    self,
                    _target,
                    _value,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.setBalance, self._web3ContractInstance,
            )(
                _target,
                _value,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            _target: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as DummyTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.setBalance.estimateGas, self._web3ContractInstance,
            )(
                _target,
                _value,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            _target: string,
            _value: BigNumber,
            txData: TxData = {},
        ): string {
            const self = this as DummyTokenContract;
            const abiEncodedTransactionData = self._web3ContractInstance.setBalance.getData();
            return abiEncodedTransactionData;
        },
    };
    public transferOwnership = {
        async sendTransactionAsync(
            newOwner: string,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as DummyTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.transferOwnership.estimateGasAsync.bind(
                    self,
                    newOwner,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.transferOwnership, self._web3ContractInstance,
            )(
                newOwner,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            newOwner: string,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as DummyTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.transferOwnership.estimateGas, self._web3ContractInstance,
            )(
                newOwner,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            newOwner: string,
            txData: TxData = {},
        ): string {
            const self = this as DummyTokenContract;
            const abiEncodedTransactionData = self._web3ContractInstance.transferOwnership.getData();
            return abiEncodedTransactionData;
        },
    };
    constructor(web3ContractInstance: Web3.ContractInstance, defaults: Partial<TxData>) {
        super(web3ContractInstance, defaults);
        classUtils.bindAll(this, ['_web3ContractInstance', '_defaults']);
    }
} // tslint:disable:max-file-line-count
