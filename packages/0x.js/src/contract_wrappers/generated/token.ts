/**
 * This file is auto-generated using @0xproject/abi-gen. Don't edit directly.
 * Templates can be found at https://github.com/0xProject/0x.js/tree/development/packages/abi-gen-templates.
 */
import {BigNumber} from 'bignumber.js';
import * as Web3 from 'web3';

import {TxData, TxDataPayable} from '../../types';
import {classUtils} from '../../utils/class_utils';
import {promisify} from '../../utils/promisify';

import {BaseContract} from './base_contract';

export class TokenContract extends BaseContract {
    public approve = {
        async sendTransactionAsync(
            _spender: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.approve.estimateGasAsync.bind(
                    self,
                    _spender,
                    _value,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.approve, self.web3ContractInstance,
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
            const self = this as TokenContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.approve.estimateGas, self.web3ContractInstance,
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
            const self = this as TokenContract;
            const abiEncodedTransactionData = self.web3ContractInstance.approve.getData();
            return abiEncodedTransactionData;
        },
    };
    public totalSupply = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<BigNumber
    > {
            const self = this as TokenContract;
            const result = await promisify<BigNumber
    >(
                self.web3ContractInstance.totalSupply.call,
                self.web3ContractInstance,
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
            const self = this as TokenContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.transferFrom.estimateGasAsync.bind(
                    self,
                    _from,
                    _to,
                    _value,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.transferFrom, self.web3ContractInstance,
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
            const self = this as TokenContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.transferFrom.estimateGas, self.web3ContractInstance,
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
            const self = this as TokenContract;
            const abiEncodedTransactionData = self.web3ContractInstance.transferFrom.getData();
            return abiEncodedTransactionData;
        },
    };
    public balanceOf = {
        async callAsync(
            _owner: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<BigNumber
    > {
            const self = this as TokenContract;
            const result = await promisify<BigNumber
    >(
                self.web3ContractInstance.balanceOf.call,
                self.web3ContractInstance,
            )(
                _owner,
            );
            return result;
        },
    };
    public transfer = {
        async sendTransactionAsync(
            _to: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.transfer.estimateGasAsync.bind(
                    self,
                    _to,
                    _value,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.transfer, self.web3ContractInstance,
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
            const self = this as TokenContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.transfer.estimateGas, self.web3ContractInstance,
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
            const self = this as TokenContract;
            const abiEncodedTransactionData = self.web3ContractInstance.transfer.getData();
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
            const self = this as TokenContract;
            const result = await promisify<BigNumber
    >(
                self.web3ContractInstance.allowance.call,
                self.web3ContractInstance,
            )(
                _owner,
                _spender,
            );
            return result;
        },
    };
    constructor(web3ContractInstance: Web3.ContractInstance, defaults: Partial<TxData>) {
        super(web3ContractInstance, defaults);
        classUtils.bindAll(this, ['web3ContractInstance', 'defaults']);
    }
} // tslint:disable:max-file-line-count
