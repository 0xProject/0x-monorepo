/**
 * This file is auto-generated using abi-gen. Don't edit directly.
 * Templates can be found at https://github.com/0xProject/0x-monorepo/tree/development/packages/contract_templates.
 */
// tslint:disable:no-consecutive-blank-lines
// tslint:disable-next-line:no-unused-variable
import { BaseContract } from '@0xproject/base-contract';
import { TxData, TxDataPayable } from '@0xproject/types';
import { BigNumber, classUtils, promisify } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethersContracts from 'ethers-contracts';
import * as _ from 'lodash';
import * as Web3 from 'web3';

export type ForwarderContractEventArgs = LogForwarderErrorContractEventArgs;

export enum ForwarderEvents {
    LogForwarderError = 'LogForwarderError',
}

export interface LogForwarderErrorContractEventArgs {
    errorId: BigNumber;
}

// tslint:disable:no-parameter-reassignment
export class ForwarderContract extends BaseContract {
    public initialize = {
        async sendTransactionAsync(txData: TxData = {}): Promise<string> {
            const self = this as ForwarderContract;
            const inputAbi = _.find(this.abi, { name: 'initialize' }).inputs;
            [] = BaseContract._transformABIData(inputAbi, [], BaseContract._bigNumberToString.bind(this));
            const encodedData = this._ethersInterface.functions.initialize().data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.initialize.estimateGasAsync.bind(self),
            );
            const txHash = await this._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(txData: TxData = {}): Promise<number> {
            const self = this as ForwarderContract;
            const inputAbi = _.find(this.abi, { name: 'initialize' }).inputs;
            [] = BaseContract._transformABIData(inputAbi, [], BaseContract._bigNumberToString.bind(this));
            const encodedData = this._ethersInterface.functions.initialize().data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await this._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(txData: TxData = {}): string {
            const self = this as ForwarderContract;
            const inputAbi = _.find(this.abi, { name: 'initialize' }).inputs;
            [] = BaseContract._transformABIData(inputAbi, [], BaseContract._bigNumberToString.bind(this));
            const abiEncodedTransactionData = this._ethersInterface.functions.initialize().data;
            return abiEncodedTransactionData;
        },
    };
    public fillOrder = {
        async sendTransactionAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            v: number | BigNumber,
            r: string,
            s: string,
            txData: TxDataPayable = {},
        ): Promise<string> {
            const self = this as ForwarderContract;
            const inputAbi = _.find(this.abi, { name: 'fillOrder' }).inputs;
            [orderAddresses, orderValues, v, r, s] = BaseContract._transformABIData(
                inputAbi,
                [orderAddresses, orderValues, v, r, s],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = this._ethersInterface.functions.fillOrder(orderAddresses, orderValues, v, r, s).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.fillOrder.estimateGasAsync.bind(self, orderAddresses, orderValues, v, r, s),
            );
            const txHash = await this._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            v: number | BigNumber,
            r: string,
            s: string,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as ForwarderContract;
            const inputAbi = _.find(this.abi, { name: 'fillOrder' }).inputs;
            [orderAddresses, orderValues, v, r, s] = BaseContract._transformABIData(
                inputAbi,
                [orderAddresses, orderValues, v, r, s],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = this._ethersInterface.functions.fillOrder(orderAddresses, orderValues, v, r, s).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await this._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[],
            orderValues: BigNumber[],
            v: number | BigNumber,
            r: string,
            s: string,
            txData: TxData = {},
        ): string {
            const self = this as ForwarderContract;
            const inputAbi = _.find(this.abi, { name: 'fillOrder' }).inputs;
            [orderAddresses, orderValues, v, r, s] = BaseContract._transformABIData(
                inputAbi,
                [orderAddresses, orderValues, v, r, s],
                BaseContract._bigNumberToString.bind(this),
            );
            const abiEncodedTransactionData = this._ethersInterface.functions.fillOrder(
                orderAddresses,
                orderValues,
                v,
                r,
                s,
            ).data;
            return abiEncodedTransactionData;
        },
        async callAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            v: number | BigNumber,
            r: string,
            s: string,
            txData: TxDataPayable = {},
            defaultBlock?: Web3.BlockParam,
        ): Promise<BigNumber> {
            const self = this as ForwarderContract;
            const inputAbi = _.find(this.abi, { name: 'fillOrder' }).inputs;
            [orderAddresses, orderValues, v, r, s] = BaseContract._transformABIData(
                inputAbi,
                [orderAddresses, orderValues, v, r, s],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self._ethersInterface.functions.fillOrder(orderAddresses, orderValues, v, r, s).data;
            const callData = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callData, defaultBlock);
            const outputAbi = _.find(this.abi, { name: 'fillOrder' }).outputs as Web3.DataItem[];
            const outputParamsTypes = _.map(outputAbi, 'type');
            let resultArray = ethersContracts.Interface.decodeParams(outputParamsTypes, rawCallResult);
            resultArray = BaseContract._transformABIData(
                outputAbi,
                resultArray,
                BaseContract._lowercaseAddress.bind(this),
            );
            return resultArray[0];
        },
    };
    constructor(web3Wrapper: Web3Wrapper, abi: Web3.ContractAbi, address: string) {
        super(web3Wrapper, abi, address);
        classUtils.bindAll(this, ['_ethersInterface', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
