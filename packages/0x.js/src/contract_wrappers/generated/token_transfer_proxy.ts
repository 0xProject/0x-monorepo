/**
 * This file is auto-generated using abi-gen. Don't edit directly.
 * Templates can be found at https://github.com/0xProject/0x.js/tree/development/packages/abi-gen-templates.
 */
import {BigNumber} from 'bignumber.js';
import * as Web3 from 'web3';

import {TxData, TxDataPayable} from '../../types';
import {classUtils} from '../../utils/class_utils';
import {promisify} from '../../utils/promisify';

import {BaseContract} from './base_contract';

export class TokenTransferProxyContract extends BaseContract {
    public transferFrom = {
        async sendTransactionAsync(
            token: string,
            from: string,
            to: string,
            value: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenTransferProxyContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.transferFrom.estimateGasAsync.bind(
                    self,
                    token,
                    from,
                    to,
                    value,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.transferFrom, self.web3ContractInstance,
            )(
                token,
                from,
                to,
                value,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            token: string,
            from: string,
            to: string,
            value: BigNumber,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as TokenTransferProxyContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.transferFrom.estimateGas, self.web3ContractInstance,
            )(
                token,
                from,
                to,
                value,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            token: string,
            from: string,
            to: string,
            value: BigNumber,
            txData: TxData = {},
        ): string {
            const self = this as TokenTransferProxyContract;
            const abiEncodedTransactionData = self.web3ContractInstance.transferFrom.getData();
            return abiEncodedTransactionData;
        },
    };
    public addAuthorizedAddress = {
        async sendTransactionAsync(
            target: string,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenTransferProxyContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.addAuthorizedAddress.estimateGasAsync.bind(
                    self,
                    target,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.addAuthorizedAddress, self.web3ContractInstance,
            )(
                target,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            target: string,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as TokenTransferProxyContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.addAuthorizedAddress.estimateGas, self.web3ContractInstance,
            )(
                target,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            target: string,
            txData: TxData = {},
        ): string {
            const self = this as TokenTransferProxyContract;
            const abiEncodedTransactionData = self.web3ContractInstance.addAuthorizedAddress.getData();
            return abiEncodedTransactionData;
        },
    };
    public authorities = {
        async callAsync(
            index: BigNumber,
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as TokenTransferProxyContract;
            const result = await promisify<string
    >(
                self.web3ContractInstance.authorities.call,
                self.web3ContractInstance,
            )(
                index,
            );
            return result;
        },
    };
    public removeAuthorizedAddress = {
        async sendTransactionAsync(
            target: string,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenTransferProxyContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.removeAuthorizedAddress.estimateGasAsync.bind(
                    self,
                    target,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.removeAuthorizedAddress, self.web3ContractInstance,
            )(
                target,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            target: string,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as TokenTransferProxyContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.removeAuthorizedAddress.estimateGas, self.web3ContractInstance,
            )(
                target,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            target: string,
            txData: TxData = {},
        ): string {
            const self = this as TokenTransferProxyContract;
            const abiEncodedTransactionData = self.web3ContractInstance.removeAuthorizedAddress.getData();
            return abiEncodedTransactionData;
        },
    };
    public owner = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as TokenTransferProxyContract;
            const result = await promisify<string
    >(
                self.web3ContractInstance.owner.call,
                self.web3ContractInstance,
            )(
            );
            return result;
        },
    };
    public authorized = {
        async callAsync(
            index: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<boolean
    > {
            const self = this as TokenTransferProxyContract;
            const result = await promisify<boolean
    >(
                self.web3ContractInstance.authorized.call,
                self.web3ContractInstance,
            )(
                index,
            );
            return result;
        },
    };
    public getAuthorizedAddresses = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<string[]
    > {
            const self = this as TokenTransferProxyContract;
            const result = await promisify<string[]
    >(
                self.web3ContractInstance.getAuthorizedAddresses.call,
                self.web3ContractInstance,
            )(
            );
            return result;
        },
    };
    public transferOwnership = {
        async sendTransactionAsync(
            newOwner: string,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenTransferProxyContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.transferOwnership.estimateGasAsync.bind(
                    self,
                    newOwner,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.transferOwnership, self.web3ContractInstance,
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
            const self = this as TokenTransferProxyContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.transferOwnership.estimateGas, self.web3ContractInstance,
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
            const self = this as TokenTransferProxyContract;
            const abiEncodedTransactionData = self.web3ContractInstance.transferOwnership.getData();
            return abiEncodedTransactionData;
        },
    };
    constructor(web3ContractInstance: Web3.ContractInstance, defaults: Partial<TxData>) {
        super(web3ContractInstance, defaults);
        classUtils.bindAll(this, ['web3ContractInstance', 'defaults']);
    }
} // tslint:disable:max-file-line-count
