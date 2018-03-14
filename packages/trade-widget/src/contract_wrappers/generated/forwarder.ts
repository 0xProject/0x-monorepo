/**
 * This file is auto-generated using abi-gen. Don't edit directly.
 * Templates can be found at https://github.com/0xProject/0x.js/tree/development/packages/0x.js/contract_templates.
 */
// tslint:disable:no-consecutive-blank-lines
// tslint:disable-next-line:no-unused-variable
import { TxData, TxDataPayable } from '@0xproject/types';
import { BigNumber, classUtils, promisify } from '@0xproject/utils';
import * as Web3 from 'web3';

import {BaseContract} from './base_contract';

export type ForwarderContractEventArgs =
    | LogForwarderErrorContractEventArgs;

export enum ForwarderEvents {
    LogForwarderError = 'LogForwarderError',
}

export interface LogForwarderErrorContractEventArgs {
    errorId: BigNumber;
}


export class ForwarderContract extends BaseContract {
    public initialize = {
        async sendTransactionAsync(
            txData: TxData = {},
        ): Promise<string> {
            const self = this as ForwarderContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.initialize.estimateGasAsync.bind(
                    self,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.initialize, self._web3ContractInstance,
            )(
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            txData: TxData = {},
        ): Promise<number> {
            const self = this as ForwarderContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.initialize.estimateGas, self._web3ContractInstance,
            )(
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            txData: TxData = {},
        ): string {
            const self = this as ForwarderContract;
            const abiEncodedTransactionData = self._web3ContractInstance.initialize.getData();
            return abiEncodedTransactionData;
        },
    };
    public fillOrder = {
        async sendTransactionAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            v: number|BigNumber,
            r: string,
            s: string,
            txData: TxDataPayable = {},
        ): Promise<string> {
            const self = this as ForwarderContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.fillOrder.estimateGasAsync.bind(
                    self,
                    orderAddresses,
                    orderValues,
                    v,
                    r,
                    s,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.fillOrder, self._web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                v,
                r,
                s,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            v: number|BigNumber,
            r: string,
            s: string,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as ForwarderContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.fillOrder.estimateGas, self._web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                v,
                r,
                s,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[],
            orderValues: BigNumber[],
            v: number|BigNumber,
            r: string,
            s: string,
            txData: TxData = {},
        ): string {
            const self = this as ForwarderContract;
            const abiEncodedTransactionData = self._web3ContractInstance.fillOrder.getData();
            return abiEncodedTransactionData;
        },
    };
    constructor(web3ContractInstance: Web3.ContractInstance, defaults: Partial<TxData>) {
        super(web3ContractInstance, defaults);
        classUtils.bindAll(this, ['_web3ContractInstance', '_defaults']);
    }
} // tslint:disable:max-file-line-count
