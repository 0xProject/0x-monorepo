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

export class ExchangeContract extends BaseContract {
    public isRoundingError = {
        async callAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
            defaultBlock?: Web3.BlockParam,
        ): Promise<boolean
    > {
            const self = this as ExchangeContract;
            const result = await promisify<boolean
    >(
                self.web3ContractInstance.isRoundingError.call,
                self.web3ContractInstance,
            )(
                numerator,
                denominator,
                target,
            );
            return result;
        },
    };
    public filled = {
        async callAsync(
            index: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<BigNumber
    > {
            const self = this as ExchangeContract;
            const result = await promisify<BigNumber
    >(
                self.web3ContractInstance.filled.call,
                self.web3ContractInstance,
            )(
                index,
            );
            return result;
        },
    };
    public cancelled = {
        async callAsync(
            index: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<BigNumber
    > {
            const self = this as ExchangeContract;
            const result = await promisify<BigNumber
    >(
                self.web3ContractInstance.cancelled.call,
                self.web3ContractInstance,
            )(
                index,
            );
            return result;
        },
    };
    public fillOrdersUpTo = {
        async sendTransactionAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number|BigNumber[],
            r: string[],
            s: string[],
            txData: TxData = {},
        ): Promise<string> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.fillOrdersUpTo.estimateGasAsync.bind(
                    self,
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.fillOrdersUpTo, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number|BigNumber[],
            r: string[],
            s: string[],
            txData: TxData = {},
        ): Promise<number> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.fillOrdersUpTo.estimateGas, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number|BigNumber[],
            r: string[],
            s: string[],
            txData: TxData = {},
        ): string {
            const self = this as ExchangeContract;
            const abiEncodedTransactionData = self.web3ContractInstance.fillOrdersUpTo.getData();
            return abiEncodedTransactionData;
        },
    };
    public cancelOrder = {
        async sendTransactionAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            cancelTakerTokenAmount: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.cancelOrder.estimateGasAsync.bind(
                    self,
                    orderAddresses,
                    orderValues,
                    cancelTakerTokenAmount,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.cancelOrder, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                cancelTakerTokenAmount,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            cancelTakerTokenAmount: BigNumber,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.cancelOrder.estimateGas, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                cancelTakerTokenAmount,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[],
            orderValues: BigNumber[],
            cancelTakerTokenAmount: BigNumber,
            txData: TxData = {},
        ): string {
            const self = this as ExchangeContract;
            const abiEncodedTransactionData = self.web3ContractInstance.cancelOrder.getData();
            return abiEncodedTransactionData;
        },
    };
    public ZRX_TOKEN_CONTRACT = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as ExchangeContract;
            const result = await promisify<string
    >(
                self.web3ContractInstance.ZRX_TOKEN_CONTRACT.call,
                self.web3ContractInstance,
            )(
            );
            return result;
        },
    };
    public batchFillOrKillOrders = {
        async sendTransactionAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmounts: BigNumber[],
            v: number|BigNumber[],
            r: string[],
            s: string[],
            txData: TxData = {},
        ): Promise<string> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.batchFillOrKillOrders.estimateGasAsync.bind(
                    self,
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmounts,
                    v,
                    r,
                    s,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.batchFillOrKillOrders, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                fillTakerTokenAmounts,
                v,
                r,
                s,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmounts: BigNumber[],
            v: number|BigNumber[],
            r: string[],
            s: string[],
            txData: TxData = {},
        ): Promise<number> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.batchFillOrKillOrders.estimateGas, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                fillTakerTokenAmounts,
                v,
                r,
                s,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmounts: BigNumber[],
            v: number|BigNumber[],
            r: string[],
            s: string[],
            txData: TxData = {},
        ): string {
            const self = this as ExchangeContract;
            const abiEncodedTransactionData = self.web3ContractInstance.batchFillOrKillOrders.getData();
            return abiEncodedTransactionData;
        },
    };
    public fillOrKillOrder = {
        async sendTransactionAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            fillTakerTokenAmount: BigNumber,
            v: number|BigNumber,
            r: string,
            s: string,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.fillOrKillOrder.estimateGasAsync.bind(
                    self,
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    v,
                    r,
                    s,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.fillOrKillOrder, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
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
            fillTakerTokenAmount: BigNumber,
            v: number|BigNumber,
            r: string,
            s: string,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.fillOrKillOrder.estimateGas, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
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
            fillTakerTokenAmount: BigNumber,
            v: number|BigNumber,
            r: string,
            s: string,
            txData: TxData = {},
        ): string {
            const self = this as ExchangeContract;
            const abiEncodedTransactionData = self.web3ContractInstance.fillOrKillOrder.getData();
            return abiEncodedTransactionData;
        },
    };
    public getUnavailableTakerTokenAmount = {
        async callAsync(
            orderHash: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<BigNumber
    > {
            const self = this as ExchangeContract;
            const result = await promisify<BigNumber
    >(
                self.web3ContractInstance.getUnavailableTakerTokenAmount.call,
                self.web3ContractInstance,
            )(
                orderHash,
            );
            return result;
        },
    };
    public isValidSignature = {
        async callAsync(
            signer: string,
            hash: string,
            v: number|BigNumber,
            r: string,
            s: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<boolean
    > {
            const self = this as ExchangeContract;
            const result = await promisify<boolean
    >(
                self.web3ContractInstance.isValidSignature.call,
                self.web3ContractInstance,
            )(
                signer,
                hash,
                v,
                r,
                s,
            );
            return result;
        },
    };
    public getPartialAmount = {
        async callAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
            defaultBlock?: Web3.BlockParam,
        ): Promise<BigNumber
    > {
            const self = this as ExchangeContract;
            const result = await promisify<BigNumber
    >(
                self.web3ContractInstance.getPartialAmount.call,
                self.web3ContractInstance,
            )(
                numerator,
                denominator,
                target,
            );
            return result;
        },
    };
    public TOKEN_TRANSFER_PROXY_CONTRACT = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as ExchangeContract;
            const result = await promisify<string
    >(
                self.web3ContractInstance.TOKEN_TRANSFER_PROXY_CONTRACT.call,
                self.web3ContractInstance,
            )(
            );
            return result;
        },
    };
    public batchFillOrders = {
        async sendTransactionAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmounts: BigNumber[],
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number|BigNumber[],
            r: string[],
            s: string[],
            txData: TxData = {},
        ): Promise<string> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.batchFillOrders.estimateGasAsync.bind(
                    self,
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmounts,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.batchFillOrders, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                fillTakerTokenAmounts,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmounts: BigNumber[],
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number|BigNumber[],
            r: string[],
            s: string[],
            txData: TxData = {},
        ): Promise<number> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.batchFillOrders.estimateGas, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                fillTakerTokenAmounts,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmounts: BigNumber[],
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number|BigNumber[],
            r: string[],
            s: string[],
            txData: TxData = {},
        ): string {
            const self = this as ExchangeContract;
            const abiEncodedTransactionData = self.web3ContractInstance.batchFillOrders.getData();
            return abiEncodedTransactionData;
        },
    };
    public batchCancelOrders = {
        async sendTransactionAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            cancelTakerTokenAmounts: BigNumber[],
            txData: TxData = {},
        ): Promise<string> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.batchCancelOrders.estimateGasAsync.bind(
                    self,
                    orderAddresses,
                    orderValues,
                    cancelTakerTokenAmounts,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.batchCancelOrders, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                cancelTakerTokenAmounts,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            cancelTakerTokenAmounts: BigNumber[],
            txData: TxData = {},
        ): Promise<number> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.batchCancelOrders.estimateGas, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                cancelTakerTokenAmounts,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            cancelTakerTokenAmounts: BigNumber[],
            txData: TxData = {},
        ): string {
            const self = this as ExchangeContract;
            const abiEncodedTransactionData = self.web3ContractInstance.batchCancelOrders.getData();
            return abiEncodedTransactionData;
        },
    };
    public fillOrder = {
        async sendTransactionAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number|BigNumber,
            r: string,
            s: string,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
                self.fillOrder.estimateGasAsync.bind(
                    self,
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ),
            );
            const txHash = await promisify<string>(
                self.web3ContractInstance.fillOrder, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
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
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number|BigNumber,
            r: string,
            s: string,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as ExchangeContract;
            const txDataWithDefaults = await self.applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self.web3ContractInstance.fillOrder.estimateGas, self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
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
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number|BigNumber,
            r: string,
            s: string,
            txData: TxData = {},
        ): string {
            const self = this as ExchangeContract;
            const abiEncodedTransactionData = self.web3ContractInstance.fillOrder.getData();
            return abiEncodedTransactionData;
        },
    };
    public getOrderHash = {
        async callAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as ExchangeContract;
            const result = await promisify<string
    >(
                self.web3ContractInstance.getOrderHash.call,
                self.web3ContractInstance,
            )(
                orderAddresses,
                orderValues,
            );
            return result;
        },
    };
    public EXTERNAL_QUERY_GAS_LIMIT = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<BigNumber
    > {
            const self = this as ExchangeContract;
            const result = await promisify<BigNumber
    >(
                self.web3ContractInstance.EXTERNAL_QUERY_GAS_LIMIT.call,
                self.web3ContractInstance,
            )(
            );
            return result;
        },
    };
    public VERSION = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as ExchangeContract;
            const result = await promisify<string
    >(
                self.web3ContractInstance.VERSION.call,
                self.web3ContractInstance,
            )(
            );
            return result;
        },
    };
    constructor(web3ContractInstance: Web3.ContractInstance, defaults: Partial<TxData>) {
        super(web3ContractInstance, defaults);
        classUtils.bindAll(this, ['web3ContractInstance', 'defaults']);
    }
} // tslint:disable:max-file-line-count
