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

export type ExchangeContractEventArgs =
    | LogFillContractEventArgs
    | LogCancelContractEventArgs
    | LogErrorContractEventArgs;

export enum ExchangeEvents {
    LogFill = 'LogFill',
    LogCancel = 'LogCancel',
    LogError = 'LogError',
}

export interface LogFillContractEventArgs {
    maker: string;
    taker: string;
    feeRecipient: string;
    makerToken: string;
    takerToken: string;
    filledMakerTokenAmount: BigNumber;
    filledTakerTokenAmount: BigNumber;
    paidMakerFee: BigNumber;
    paidTakerFee: BigNumber;
    tokens: string;
    orderHash: string;
}

export interface LogCancelContractEventArgs {
    maker: string;
    feeRecipient: string;
    makerToken: string;
    takerToken: string;
    cancelledMakerTokenAmount: BigNumber;
    cancelledTakerTokenAmount: BigNumber;
    tokens: string;
    orderHash: string;
}

export interface LogErrorContractEventArgs {
    errorId: number;
    orderHash: string;
}

// tslint:disable:no-parameter-reassignment
export class ExchangeContract extends BaseContract {
    public isRoundingError = {
        async callAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'isRoundingError(uint256,uint256,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [numerator, denominator, target] = BaseContract._formatABIDataItemList(
                inputAbi,
                [numerator, denominator, target],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.isRoundingError(numerator, denominator, target) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'isRoundingError' }) as MethodAbi).outputs;
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
    public filled = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'filled(bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.filled(index_0) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'filled' }) as MethodAbi).outputs;
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
    public cancelled = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'cancelled(bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.cancelled(index_0) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'cancelled' }) as MethodAbi).outputs;
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
    public fillOrdersUpTo = {
        async sendTransactionAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi(
                'fillOrdersUpTo(address[5][],uint256[6][],uint256,bool,uint8[],bytes32[],bytes32[])',
            ).inputs;
            [
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface(
                    'fillOrdersUpTo(address[5][],uint256[6][],uint256,bool,uint8[],bytes32[],bytes32[])',
                )
                .functions.fillOrdersUpTo(
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
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
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi(
                'fillOrdersUpTo(address[5][],uint256[6][],uint256,bool,uint8[],bytes32[],bytes32[])',
            ).inputs;
            [
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface(
                    'fillOrdersUpTo(address[5][],uint256[6][],uint256,bool,uint8[],bytes32[],bytes32[])',
                )
                .functions.fillOrdersUpTo(
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
        ): string {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi(
                'fillOrdersUpTo(address[5][],uint256[6][],uint256,bool,uint8[],bytes32[],bytes32[])',
            ).inputs;
            [
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface(
                    'fillOrdersUpTo(address[5][],uint256[6][],uint256,bool,uint8[],bytes32[],bytes32[])',
                )
                .functions.fillOrdersUpTo(
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ).data;
            return abiEncodedTransactionData;
        },
        async callAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as ExchangeContract;
            const functionSignature =
                'fillOrdersUpTo(address[5][],uint256[6][],uint256,bool,uint8[],bytes32[],bytes32[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.fillOrdersUpTo(
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'fillOrdersUpTo' }) as MethodAbi).outputs;
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
    public cancelOrder = {
        async sendTransactionAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            cancelTakerTokenAmount: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi('cancelOrder(address[5],uint256[6],uint256)').inputs;
            [orderAddresses, orderValues, cancelTakerTokenAmount] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, cancelTakerTokenAmount],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('cancelOrder(address[5],uint256[6],uint256)')
                .functions.cancelOrder(orderAddresses, orderValues, cancelTakerTokenAmount).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.cancelOrder.estimateGasAsync.bind(self, orderAddresses, orderValues, cancelTakerTokenAmount),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            cancelTakerTokenAmount: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi('cancelOrder(address[5],uint256[6],uint256)').inputs;
            [orderAddresses, orderValues, cancelTakerTokenAmount] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, cancelTakerTokenAmount],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('cancelOrder(address[5],uint256[6],uint256)')
                .functions.cancelOrder(orderAddresses, orderValues, cancelTakerTokenAmount).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[],
            orderValues: BigNumber[],
            cancelTakerTokenAmount: BigNumber,
        ): string {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi('cancelOrder(address[5],uint256[6],uint256)').inputs;
            [orderAddresses, orderValues, cancelTakerTokenAmount] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, cancelTakerTokenAmount],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('cancelOrder(address[5],uint256[6],uint256)')
                .functions.cancelOrder(orderAddresses, orderValues, cancelTakerTokenAmount).data;
            return abiEncodedTransactionData;
        },
        async callAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            cancelTakerTokenAmount: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'cancelOrder(address[5],uint256[6],uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orderAddresses, orderValues, cancelTakerTokenAmount] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, cancelTakerTokenAmount],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.cancelOrder(orderAddresses, orderValues, cancelTakerTokenAmount) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'cancelOrder' }) as MethodAbi).outputs;
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
    public ZRX_TOKEN_CONTRACT = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'ZRX_TOKEN_CONTRACT()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.ZRX_TOKEN_CONTRACT() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'ZRX_TOKEN_CONTRACT' }) as MethodAbi).outputs;
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
    public batchFillOrKillOrders = {
        async sendTransactionAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmounts: BigNumber[],
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi(
                'batchFillOrKillOrders(address[5][],uint256[6][],uint256[],uint8[],bytes32[],bytes32[])',
            ).inputs;
            [orderAddresses, orderValues, fillTakerTokenAmounts, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, fillTakerTokenAmounts, v, r, s],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface(
                    'batchFillOrKillOrders(address[5][],uint256[6][],uint256[],uint8[],bytes32[],bytes32[])',
                )
                .functions.batchFillOrKillOrders(orderAddresses, orderValues, fillTakerTokenAmounts, v, r, s).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
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
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmounts: BigNumber[],
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi(
                'batchFillOrKillOrders(address[5][],uint256[6][],uint256[],uint8[],bytes32[],bytes32[])',
            ).inputs;
            [orderAddresses, orderValues, fillTakerTokenAmounts, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, fillTakerTokenAmounts, v, r, s],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface(
                    'batchFillOrKillOrders(address[5][],uint256[6][],uint256[],uint8[],bytes32[],bytes32[])',
                )
                .functions.batchFillOrKillOrders(orderAddresses, orderValues, fillTakerTokenAmounts, v, r, s).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmounts: BigNumber[],
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
        ): string {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi(
                'batchFillOrKillOrders(address[5][],uint256[6][],uint256[],uint8[],bytes32[],bytes32[])',
            ).inputs;
            [orderAddresses, orderValues, fillTakerTokenAmounts, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, fillTakerTokenAmounts, v, r, s],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface(
                    'batchFillOrKillOrders(address[5][],uint256[6][],uint256[],uint8[],bytes32[],bytes32[])',
                )
                .functions.batchFillOrKillOrders(orderAddresses, orderValues, fillTakerTokenAmounts, v, r, s).data;
            return abiEncodedTransactionData;
        },
    };
    public fillOrKillOrder = {
        async sendTransactionAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            fillTakerTokenAmount: BigNumber,
            v: number | BigNumber,
            r: string,
            s: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrKillOrder(address[5],uint256[6],uint256,uint8,bytes32,bytes32)')
                .inputs;
            [orderAddresses, orderValues, fillTakerTokenAmount, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, fillTakerTokenAmount, v, r, s],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('fillOrKillOrder(address[5],uint256[6],uint256,uint8,bytes32,bytes32)')
                .functions.fillOrKillOrder(orderAddresses, orderValues, fillTakerTokenAmount, v, r, s).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
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
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            fillTakerTokenAmount: BigNumber,
            v: number | BigNumber,
            r: string,
            s: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrKillOrder(address[5],uint256[6],uint256,uint8,bytes32,bytes32)')
                .inputs;
            [orderAddresses, orderValues, fillTakerTokenAmount, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, fillTakerTokenAmount, v, r, s],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('fillOrKillOrder(address[5],uint256[6],uint256,uint8,bytes32,bytes32)')
                .functions.fillOrKillOrder(orderAddresses, orderValues, fillTakerTokenAmount, v, r, s).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[],
            orderValues: BigNumber[],
            fillTakerTokenAmount: BigNumber,
            v: number | BigNumber,
            r: string,
            s: string,
        ): string {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrKillOrder(address[5],uint256[6],uint256,uint8,bytes32,bytes32)')
                .inputs;
            [orderAddresses, orderValues, fillTakerTokenAmount, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, fillTakerTokenAmount, v, r, s],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('fillOrKillOrder(address[5],uint256[6],uint256,uint8,bytes32,bytes32)')
                .functions.fillOrKillOrder(orderAddresses, orderValues, fillTakerTokenAmount, v, r, s).data;
            return abiEncodedTransactionData;
        },
    };
    public getUnavailableTakerTokenAmount = {
        async callAsync(
            orderHash: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'getUnavailableTakerTokenAmount(bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orderHash] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderHash],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getUnavailableTakerTokenAmount(orderHash) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getUnavailableTakerTokenAmount' }) as MethodAbi).outputs;
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
    public isValidSignature = {
        async callAsync(
            signer: string,
            hash: string,
            v: number | BigNumber,
            r: string,
            s: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'isValidSignature(address,bytes32,uint8,bytes32,bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [signer, hash, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [signer, hash, v, r, s],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.isValidSignature(signer, hash, v, r, s) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'isValidSignature' }) as MethodAbi).outputs;
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
    public getPartialAmount = {
        async callAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'getPartialAmount(uint256,uint256,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [numerator, denominator, target] = BaseContract._formatABIDataItemList(
                inputAbi,
                [numerator, denominator, target],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getPartialAmount(numerator, denominator, target) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getPartialAmount' }) as MethodAbi).outputs;
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
    public TOKEN_TRANSFER_PROXY_CONTRACT = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'TOKEN_TRANSFER_PROXY_CONTRACT()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.TOKEN_TRANSFER_PROXY_CONTRACT() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'TOKEN_TRANSFER_PROXY_CONTRACT' }) as MethodAbi).outputs;
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
    public batchFillOrders = {
        async sendTransactionAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmounts: BigNumber[],
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi(
                'batchFillOrders(address[5][],uint256[6][],uint256[],bool,uint8[],bytes32[],bytes32[])',
            ).inputs;
            [
                orderAddresses,
                orderValues,
                fillTakerTokenAmounts,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmounts,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface(
                    'batchFillOrders(address[5][],uint256[6][],uint256[],bool,uint8[],bytes32[],bytes32[])',
                )
                .functions.batchFillOrders(
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmounts,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
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
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmounts: BigNumber[],
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi(
                'batchFillOrders(address[5][],uint256[6][],uint256[],bool,uint8[],bytes32[],bytes32[])',
            ).inputs;
            [
                orderAddresses,
                orderValues,
                fillTakerTokenAmounts,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmounts,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface(
                    'batchFillOrders(address[5][],uint256[6][],uint256[],bool,uint8[],bytes32[],bytes32[])',
                )
                .functions.batchFillOrders(
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmounts,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            fillTakerTokenAmounts: BigNumber[],
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
        ): string {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi(
                'batchFillOrders(address[5][],uint256[6][],uint256[],bool,uint8[],bytes32[],bytes32[])',
            ).inputs;
            [
                orderAddresses,
                orderValues,
                fillTakerTokenAmounts,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmounts,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface(
                    'batchFillOrders(address[5][],uint256[6][],uint256[],bool,uint8[],bytes32[],bytes32[])',
                )
                .functions.batchFillOrders(
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmounts,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ).data;
            return abiEncodedTransactionData;
        },
    };
    public batchCancelOrders = {
        async sendTransactionAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            cancelTakerTokenAmounts: BigNumber[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi('batchCancelOrders(address[5][],uint256[6][],uint256[])').inputs;
            [orderAddresses, orderValues, cancelTakerTokenAmounts] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, cancelTakerTokenAmounts],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('batchCancelOrders(address[5][],uint256[6][],uint256[])')
                .functions.batchCancelOrders(orderAddresses, orderValues, cancelTakerTokenAmounts).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.batchCancelOrders.estimateGasAsync.bind(
                    self,
                    orderAddresses,
                    orderValues,
                    cancelTakerTokenAmounts,
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            cancelTakerTokenAmounts: BigNumber[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi('batchCancelOrders(address[5][],uint256[6][],uint256[])').inputs;
            [orderAddresses, orderValues, cancelTakerTokenAmounts] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, cancelTakerTokenAmounts],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('batchCancelOrders(address[5][],uint256[6][],uint256[])')
                .functions.batchCancelOrders(orderAddresses, orderValues, cancelTakerTokenAmounts).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[][],
            orderValues: BigNumber[][],
            cancelTakerTokenAmounts: BigNumber[],
        ): string {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi('batchCancelOrders(address[5][],uint256[6][],uint256[])').inputs;
            [orderAddresses, orderValues, cancelTakerTokenAmounts] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues, cancelTakerTokenAmounts],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('batchCancelOrders(address[5][],uint256[6][],uint256[])')
                .functions.batchCancelOrders(orderAddresses, orderValues, cancelTakerTokenAmounts).data;
            return abiEncodedTransactionData;
        },
    };
    public fillOrder = {
        async sendTransactionAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number | BigNumber,
            r: string,
            s: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrder(address[5],uint256[6],uint256,bool,uint8,bytes32,bytes32)')
                .inputs;
            [
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('fillOrder(address[5],uint256[6],uint256,bool,uint8,bytes32,bytes32)')
                .functions.fillOrder(
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
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
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number | BigNumber,
            r: string,
            s: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrder(address[5],uint256[6],uint256,bool,uint8,bytes32,bytes32)')
                .inputs;
            [
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('fillOrder(address[5],uint256[6],uint256,bool,uint8,bytes32,bytes32)')
                .functions.fillOrder(
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orderAddresses: string[],
            orderValues: BigNumber[],
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number | BigNumber,
            r: string,
            s: string,
        ): string {
            const self = (this as any) as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrder(address[5],uint256[6],uint256,bool,uint8,bytes32,bytes32)')
                .inputs;
            [
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('fillOrder(address[5],uint256[6],uint256,bool,uint8,bytes32,bytes32)')
                .functions.fillOrder(
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ).data;
            return abiEncodedTransactionData;
        },
        async callAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            fillTakerTokenAmount: BigNumber,
            shouldThrowOnInsufficientBalanceOrAllowance: boolean,
            v: number | BigNumber,
            r: string,
            s: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'fillOrder(address[5],uint256[6],uint256,bool,uint8,bytes32,bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [
                orderAddresses,
                orderValues,
                fillTakerTokenAmount,
                shouldThrowOnInsufficientBalanceOrAllowance,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.fillOrder(
                    orderAddresses,
                    orderValues,
                    fillTakerTokenAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    v,
                    r,
                    s,
                ) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'fillOrder' }) as MethodAbi).outputs;
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
    public getOrderHash = {
        async callAsync(
            orderAddresses: string[],
            orderValues: BigNumber[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'getOrderHash(address[5],uint256[6])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orderAddresses, orderValues] = BaseContract._formatABIDataItemList(
                inputAbi,
                [orderAddresses, orderValues],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getOrderHash(orderAddresses, orderValues) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getOrderHash' }) as MethodAbi).outputs;
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
    public EXTERNAL_QUERY_GAS_LIMIT = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<number> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'EXTERNAL_QUERY_GAS_LIMIT()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.EXTERNAL_QUERY_GAS_LIMIT() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'EXTERNAL_QUERY_GAS_LIMIT' }) as MethodAbi).outputs;
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
    public VERSION = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            const self = (this as any) as ExchangeContract;
            const functionSignature = 'VERSION()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.VERSION() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'VERSION' }) as MethodAbi).outputs;
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
