/**
 * This file is auto-generated using abi-gen. Don't edit directly.
 * Templates can be found at https://github.com/0xProject/0x.js/tree/development/packages/abi-gen-templates.
 */
// tslint:disable:async-suffix member-ordering no-consecutive-blank-lines
// tslint:disable-next-line:no-unused-variable
import { TxData, TxDataPayable } from '@0xproject/types';
import { BigNumber, classUtils, promisify } from '@0xproject/utils';
import * as Web3 from 'web3';

import {BaseContract} from './base_contract';

export type ZRXTokenContractEventArgs =
    | TransferContractEventArgs
    | ApprovalContractEventArgs;

export enum ZRXTokenEvents {
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


export class ZRXTokenContract extends BaseContract {
    public async name(
        defaultBlock?: Web3.BlockParam,
    ): Promise<string
    > {
        const self = this as ZRXTokenContract;
        const result = await self._web3ContractInstance.name.call(
        );
        return result;
    }
    public approve = {
        async sendTransactionAsync(
            _spender: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as ZRXTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(txData);
            const txHash = await self._web3ContractInstance.approve(
                _spender,
                _value,
                txDataWithDefaults,
            );
            return txHash;
        },
        async callAsync(
            _spender: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<boolean
    > {
            const self = this as ZRXTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(txData);
            const returnValue = await self._web3ContractInstance.approve.call(
                _spender,
                _value,
                txDataWithDefaults,
            );
            return returnValue;
        },
    };
    public async totalSupply(
        defaultBlock?: Web3.BlockParam,
    ): Promise<BigNumber
    > {
        const self = this as ZRXTokenContract;
        const result = await self._web3ContractInstance.totalSupply.call(
        );
        return result;
    }
    public transferFrom = {
        async sendTransactionAsync(
            _from: string,
            _to: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as ZRXTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(txData);
            const txHash = await self._web3ContractInstance.transferFrom(
                _from,
                _to,
                _value,
                txDataWithDefaults,
            );
            return txHash;
        },
        async callAsync(
            _from: string,
            _to: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<boolean
    > {
            const self = this as ZRXTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(txData);
            const returnValue = await self._web3ContractInstance.transferFrom.call(
                _from,
                _to,
                _value,
                txDataWithDefaults,
            );
            return returnValue;
        },
    };
    public async decimals(
        defaultBlock?: Web3.BlockParam,
    ): Promise<BigNumber
    > {
        const self = this as ZRXTokenContract;
        const result = await self._web3ContractInstance.decimals.call(
        );
        return result;
    }
    public async balanceOf(
        _owner: string,
        defaultBlock?: Web3.BlockParam,
    ): Promise<BigNumber
    > {
        const self = this as ZRXTokenContract;
        const result = await self._web3ContractInstance.balanceOf.call(
            _owner,
        );
        return result;
    }
    public async symbol(
        defaultBlock?: Web3.BlockParam,
    ): Promise<string
    > {
        const self = this as ZRXTokenContract;
        const result = await self._web3ContractInstance.symbol.call(
        );
        return result;
    }
    public transfer = {
        async sendTransactionAsync(
            _to: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as ZRXTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(txData);
            const txHash = await self._web3ContractInstance.transfer(
                _to,
                _value,
                txDataWithDefaults,
            );
            return txHash;
        },
        async callAsync(
            _to: string,
            _value: BigNumber,
            txData: TxData = {},
        ): Promise<boolean
    > {
            const self = this as ZRXTokenContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(txData);
            const returnValue = await self._web3ContractInstance.transfer.call(
                _to,
                _value,
                txDataWithDefaults,
            );
            return returnValue;
        },
    };
    public async allowance(
        _owner: string,
        _spender: string,
        defaultBlock?: Web3.BlockParam,
    ): Promise<BigNumber
    > {
        const self = this as ZRXTokenContract;
        const result = await self._web3ContractInstance.allowance.call(
            _owner,
            _spender,
        );
        return result;
    }
    constructor(web3ContractInstance: Web3.ContractInstance, defaults?: Partial<TxData>) {
        super(web3ContractInstance, defaults);
        classUtils.bindAll(this, ['_web3ContractInstance', '_defaults']);
    }
} // tslint:disable:max-file-line-count
