/**
 * This file is auto-generated using abi-gen. Don't edit directly.
 * Templates can be found at https://github.com/0xProject/0x-monorepo/tree/development/packages/contract_templates.
 */
// tslint:disable:no-consecutive-blank-lines
// tslint:disable-next-line:no-unused-variable
import { BaseContract } from '@0xproject/base-contract';
import { ContractArtifact } from '@0xproject/sol-compiler';
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
import { BigNumber, classUtils, logUtils, promisify } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethers from 'ethers';
import * as _ from 'lodash';

export type EtherDeltaContractEventArgs =
    | OrderContractEventArgs
    | CancelContractEventArgs
    | TradeContractEventArgs
    | DepositContractEventArgs
    | WithdrawContractEventArgs;

export enum EtherDeltaEvents {
    Order = 'Order',
    Cancel = 'Cancel',
    Trade = 'Trade',
    Deposit = 'Deposit',
    Withdraw = 'Withdraw',
}

export interface OrderContractEventArgs {
    tokenGet: string;
    amountGet: BigNumber;
    tokenGive: string;
    amountGive: BigNumber;
    expires: BigNumber;
    nonce: BigNumber;
    user: string;
}

export interface CancelContractEventArgs {
    tokenGet: string;
    amountGet: BigNumber;
    tokenGive: string;
    amountGive: BigNumber;
    expires: BigNumber;
    nonce: BigNumber;
    user: string;
    v: number;
    r: string;
    s: string;
}

export interface TradeContractEventArgs {
    tokenGet: string;
    amountGet: BigNumber;
    tokenGive: string;
    amountGive: BigNumber;
    get: string;
    give: string;
}

export interface DepositContractEventArgs {
    token: string;
    user: string;
    amount: BigNumber;
    balance: BigNumber;
}

export interface WithdrawContractEventArgs {
    token: string;
    user: string;
    amount: BigNumber;
    balance: BigNumber;
}

// tslint:disable:no-parameter-reassignment
export class EtherDeltaContract extends BaseContract {
    public trade = {
        async sendTransactionAsync(
            tokenGet: string,
            amountGet: BigNumber,
            tokenGive: string,
            amountGive: BigNumber,
            expires: BigNumber,
            nonce: BigNumber,
            user: string,
            v: number | BigNumber,
            r: string,
            s: string,
            amount: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi(
                'trade(address,uint256,address,uint256,uint256,uint256,address,uint8,bytes32,bytes32,uint256)',
            ).inputs;
            [
                tokenGet,
                amountGet,
                tokenGive,
                amountGive,
                expires,
                nonce,
                user,
                v,
                r,
                s,
                amount,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenGet, amountGet, tokenGive, amountGive, expires, nonce, user, v, r, s, amount],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface(
                    'trade(address,uint256,address,uint256,uint256,uint256,address,uint8,bytes32,bytes32,uint256)',
                )
                .functions.trade(tokenGet, amountGet, tokenGive, amountGive, expires, nonce, user, v, r, s, amount)
                .data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.trade.estimateGasAsync.bind(
                    self,
                    tokenGet,
                    amountGet,
                    tokenGive,
                    amountGive,
                    expires,
                    nonce,
                    user,
                    v,
                    r,
                    s,
                    amount,
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            tokenGet: string,
            amountGet: BigNumber,
            tokenGive: string,
            amountGive: BigNumber,
            expires: BigNumber,
            nonce: BigNumber,
            user: string,
            v: number | BigNumber,
            r: string,
            s: string,
            amount: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi(
                'trade(address,uint256,address,uint256,uint256,uint256,address,uint8,bytes32,bytes32,uint256)',
            ).inputs;
            [
                tokenGet,
                amountGet,
                tokenGive,
                amountGive,
                expires,
                nonce,
                user,
                v,
                r,
                s,
                amount,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenGet, amountGet, tokenGive, amountGive, expires, nonce, user, v, r, s, amount],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface(
                    'trade(address,uint256,address,uint256,uint256,uint256,address,uint8,bytes32,bytes32,uint256)',
                )
                .functions.trade(tokenGet, amountGet, tokenGive, amountGive, expires, nonce, user, v, r, s, amount)
                .data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            tokenGet: string,
            amountGet: BigNumber,
            tokenGive: string,
            amountGive: BigNumber,
            expires: BigNumber,
            nonce: BigNumber,
            user: string,
            v: number | BigNumber,
            r: string,
            s: string,
            amount: BigNumber,
        ): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi(
                'trade(address,uint256,address,uint256,uint256,uint256,address,uint8,bytes32,bytes32,uint256)',
            ).inputs;
            [
                tokenGet,
                amountGet,
                tokenGive,
                amountGive,
                expires,
                nonce,
                user,
                v,
                r,
                s,
                amount,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenGet, amountGet, tokenGive, amountGive, expires, nonce, user, v, r, s, amount],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface(
                    'trade(address,uint256,address,uint256,uint256,uint256,address,uint8,bytes32,bytes32,uint256)',
                )
                .functions.trade(tokenGet, amountGet, tokenGive, amountGive, expires, nonce, user, v, r, s, amount)
                .data;
            return abiEncodedTransactionData;
        },
    };
    public order = {
        async sendTransactionAsync(
            tokenGet: string,
            amountGet: BigNumber,
            tokenGive: string,
            amountGive: BigNumber,
            expires: BigNumber,
            nonce: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('order(address,uint256,address,uint256,uint256,uint256)').inputs;
            [tokenGet, amountGet, tokenGive, amountGive, expires, nonce] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenGet, amountGet, tokenGive, amountGive, expires, nonce],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('order(address,uint256,address,uint256,uint256,uint256)')
                .functions.order(tokenGet, amountGet, tokenGive, amountGive, expires, nonce).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.order.estimateGasAsync.bind(self, tokenGet, amountGet, tokenGive, amountGive, expires, nonce),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            tokenGet: string,
            amountGet: BigNumber,
            tokenGive: string,
            amountGive: BigNumber,
            expires: BigNumber,
            nonce: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('order(address,uint256,address,uint256,uint256,uint256)').inputs;
            [tokenGet, amountGet, tokenGive, amountGive, expires, nonce] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenGet, amountGet, tokenGive, amountGive, expires, nonce],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('order(address,uint256,address,uint256,uint256,uint256)')
                .functions.order(tokenGet, amountGet, tokenGive, amountGive, expires, nonce).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            tokenGet: string,
            amountGet: BigNumber,
            tokenGive: string,
            amountGive: BigNumber,
            expires: BigNumber,
            nonce: BigNumber,
        ): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('order(address,uint256,address,uint256,uint256,uint256)').inputs;
            [tokenGet, amountGet, tokenGive, amountGive, expires, nonce] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenGet, amountGet, tokenGive, amountGive, expires, nonce],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('order(address,uint256,address,uint256,uint256,uint256)')
                .functions.order(tokenGet, amountGet, tokenGive, amountGive, expires, nonce).data;
            return abiEncodedTransactionData;
        },
    };
    public orderFills = {
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature = 'orderFills(address,bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0, index_1] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0, index_1],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.orderFills(index_0, index_1) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'orderFills' }) as MethodAbi).outputs;
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
            tokenGet: string,
            amountGet: BigNumber,
            tokenGive: string,
            amountGive: BigNumber,
            expires: BigNumber,
            nonce: BigNumber,
            v: number | BigNumber,
            r: string,
            s: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi(
                'cancelOrder(address,uint256,address,uint256,uint256,uint256,uint8,bytes32,bytes32)',
            ).inputs;
            [tokenGet, amountGet, tokenGive, amountGive, expires, nonce, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenGet, amountGet, tokenGive, amountGive, expires, nonce, v, r, s],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface(
                    'cancelOrder(address,uint256,address,uint256,uint256,uint256,uint8,bytes32,bytes32)',
                )
                .functions.cancelOrder(tokenGet, amountGet, tokenGive, amountGive, expires, nonce, v, r, s).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.cancelOrder.estimateGasAsync.bind(
                    self,
                    tokenGet,
                    amountGet,
                    tokenGive,
                    amountGive,
                    expires,
                    nonce,
                    v,
                    r,
                    s,
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            tokenGet: string,
            amountGet: BigNumber,
            tokenGive: string,
            amountGive: BigNumber,
            expires: BigNumber,
            nonce: BigNumber,
            v: number | BigNumber,
            r: string,
            s: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi(
                'cancelOrder(address,uint256,address,uint256,uint256,uint256,uint8,bytes32,bytes32)',
            ).inputs;
            [tokenGet, amountGet, tokenGive, amountGive, expires, nonce, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenGet, amountGet, tokenGive, amountGive, expires, nonce, v, r, s],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface(
                    'cancelOrder(address,uint256,address,uint256,uint256,uint256,uint8,bytes32,bytes32)',
                )
                .functions.cancelOrder(tokenGet, amountGet, tokenGive, amountGive, expires, nonce, v, r, s).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            tokenGet: string,
            amountGet: BigNumber,
            tokenGive: string,
            amountGive: BigNumber,
            expires: BigNumber,
            nonce: BigNumber,
            v: number | BigNumber,
            r: string,
            s: string,
        ): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi(
                'cancelOrder(address,uint256,address,uint256,uint256,uint256,uint8,bytes32,bytes32)',
            ).inputs;
            [tokenGet, amountGet, tokenGive, amountGive, expires, nonce, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenGet, amountGet, tokenGive, amountGive, expires, nonce, v, r, s],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface(
                    'cancelOrder(address,uint256,address,uint256,uint256,uint256,uint8,bytes32,bytes32)',
                )
                .functions.cancelOrder(tokenGet, amountGet, tokenGive, amountGive, expires, nonce, v, r, s).data;
            return abiEncodedTransactionData;
        },
    };
    public withdraw = {
        async sendTransactionAsync(amount: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('withdraw(uint256)').inputs;
            [amount] = BaseContract._formatABIDataItemList(
                inputAbi,
                [amount],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self._lookupEthersInterface('withdraw(uint256)').functions.withdraw(amount).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.withdraw.estimateGasAsync.bind(self, amount),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(amount: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('withdraw(uint256)').inputs;
            [amount] = BaseContract._formatABIDataItemList(inputAbi, [amount], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('withdraw(uint256)').functions.withdraw(amount).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(amount: BigNumber): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('withdraw(uint256)').inputs;
            [amount] = BaseContract._formatABIDataItemList(inputAbi, [amount], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('withdraw(uint256)')
                .functions.withdraw(amount).data;
            return abiEncodedTransactionData;
        },
    };
    public depositToken = {
        async sendTransactionAsync(token: string, amount: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('depositToken(address,uint256)').inputs;
            [token, amount] = BaseContract._formatABIDataItemList(
                inputAbi,
                [token, amount],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('depositToken(address,uint256)')
                .functions.depositToken(token, amount).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.depositToken.estimateGasAsync.bind(self, token, amount),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(token: string, amount: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('depositToken(address,uint256)').inputs;
            [token, amount] = BaseContract._formatABIDataItemList(
                inputAbi,
                [token, amount],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('depositToken(address,uint256)')
                .functions.depositToken(token, amount).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(token: string, amount: BigNumber): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('depositToken(address,uint256)').inputs;
            [token, amount] = BaseContract._formatABIDataItemList(
                inputAbi,
                [token, amount],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('depositToken(address,uint256)')
                .functions.depositToken(token, amount).data;
            return abiEncodedTransactionData;
        },
    };
    public amountFilled = {
        async callAsync(
            tokenGet: string,
            amountGet: BigNumber,
            tokenGive: string,
            amountGive: BigNumber,
            expires: BigNumber,
            nonce: BigNumber,
            user: string,
            v: number | BigNumber,
            r: string,
            s: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature =
                'amountFilled(address,uint256,address,uint256,uint256,uint256,address,uint8,bytes32,bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [
                tokenGet,
                amountGet,
                tokenGive,
                amountGive,
                expires,
                nonce,
                user,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenGet, amountGet, tokenGive, amountGive, expires, nonce, user, v, r, s],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.amountFilled(
                    tokenGet,
                    amountGet,
                    tokenGive,
                    amountGive,
                    expires,
                    nonce,
                    user,
                    v,
                    r,
                    s,
                ) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'amountFilled' }) as MethodAbi).outputs;
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
    public tokens = {
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature = 'tokens(address,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0, index_1] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0, index_1],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.tokens(index_0, index_1) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'tokens' }) as MethodAbi).outputs;
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
    public changeFeeMake = {
        async sendTransactionAsync(feeMake_: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeFeeMake(uint256)').inputs;
            [feeMake_] = BaseContract._formatABIDataItemList(
                inputAbi,
                [feeMake_],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self._lookupEthersInterface('changeFeeMake(uint256)').functions.changeFeeMake(feeMake_)
                .data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.changeFeeMake.estimateGasAsync.bind(self, feeMake_),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(feeMake_: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeFeeMake(uint256)').inputs;
            [feeMake_] = BaseContract._formatABIDataItemList(inputAbi, [feeMake_], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('changeFeeMake(uint256)').functions.changeFeeMake(feeMake_)
                .data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(feeMake_: BigNumber): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeFeeMake(uint256)').inputs;
            [feeMake_] = BaseContract._formatABIDataItemList(inputAbi, [feeMake_], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('changeFeeMake(uint256)')
                .functions.changeFeeMake(feeMake_).data;
            return abiEncodedTransactionData;
        },
    };
    public feeMake = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature = 'feeMake()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.feeMake() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'feeMake' }) as MethodAbi).outputs;
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
    public changeFeeRebate = {
        async sendTransactionAsync(feeRebate_: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeFeeRebate(uint256)').inputs;
            [feeRebate_] = BaseContract._formatABIDataItemList(
                inputAbi,
                [feeRebate_],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('changeFeeRebate(uint256)')
                .functions.changeFeeRebate(feeRebate_).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.changeFeeRebate.estimateGasAsync.bind(self, feeRebate_),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(feeRebate_: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeFeeRebate(uint256)').inputs;
            [feeRebate_] = BaseContract._formatABIDataItemList(inputAbi, [feeRebate_], BaseContract._bigNumberToString);
            const encodedData = self
                ._lookupEthersInterface('changeFeeRebate(uint256)')
                .functions.changeFeeRebate(feeRebate_).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(feeRebate_: BigNumber): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeFeeRebate(uint256)').inputs;
            [feeRebate_] = BaseContract._formatABIDataItemList(inputAbi, [feeRebate_], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('changeFeeRebate(uint256)')
                .functions.changeFeeRebate(feeRebate_).data;
            return abiEncodedTransactionData;
        },
    };
    public feeAccount = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature = 'feeAccount()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.feeAccount() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'feeAccount' }) as MethodAbi).outputs;
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
    public testTrade = {
        async callAsync(
            tokenGet: string,
            amountGet: BigNumber,
            tokenGive: string,
            amountGive: BigNumber,
            expires: BigNumber,
            nonce: BigNumber,
            user: string,
            v: number | BigNumber,
            r: string,
            s: string,
            amount: BigNumber,
            sender: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature =
                'testTrade(address,uint256,address,uint256,uint256,uint256,address,uint8,bytes32,bytes32,uint256,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [
                tokenGet,
                amountGet,
                tokenGive,
                amountGive,
                expires,
                nonce,
                user,
                v,
                r,
                s,
                amount,
                sender,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenGet, amountGet, tokenGive, amountGive, expires, nonce, user, v, r, s, amount, sender],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.testTrade(
                    tokenGet,
                    amountGet,
                    tokenGive,
                    amountGive,
                    expires,
                    nonce,
                    user,
                    v,
                    r,
                    s,
                    amount,
                    sender,
                ) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'testTrade' }) as MethodAbi).outputs;
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
    public changeFeeAccount = {
        async sendTransactionAsync(feeAccount_: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeFeeAccount(address)').inputs;
            [feeAccount_] = BaseContract._formatABIDataItemList(
                inputAbi,
                [feeAccount_],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('changeFeeAccount(address)')
                .functions.changeFeeAccount(feeAccount_).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.changeFeeAccount.estimateGasAsync.bind(self, feeAccount_),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(feeAccount_: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeFeeAccount(address)').inputs;
            [feeAccount_] = BaseContract._formatABIDataItemList(
                inputAbi,
                [feeAccount_],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('changeFeeAccount(address)')
                .functions.changeFeeAccount(feeAccount_).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(feeAccount_: string): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeFeeAccount(address)').inputs;
            [feeAccount_] = BaseContract._formatABIDataItemList(
                inputAbi,
                [feeAccount_],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('changeFeeAccount(address)')
                .functions.changeFeeAccount(feeAccount_).data;
            return abiEncodedTransactionData;
        },
    };
    public feeRebate = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature = 'feeRebate()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.feeRebate() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'feeRebate' }) as MethodAbi).outputs;
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
    public changeFeeTake = {
        async sendTransactionAsync(feeTake_: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeFeeTake(uint256)').inputs;
            [feeTake_] = BaseContract._formatABIDataItemList(
                inputAbi,
                [feeTake_],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self._lookupEthersInterface('changeFeeTake(uint256)').functions.changeFeeTake(feeTake_)
                .data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.changeFeeTake.estimateGasAsync.bind(self, feeTake_),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(feeTake_: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeFeeTake(uint256)').inputs;
            [feeTake_] = BaseContract._formatABIDataItemList(inputAbi, [feeTake_], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('changeFeeTake(uint256)').functions.changeFeeTake(feeTake_)
                .data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(feeTake_: BigNumber): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeFeeTake(uint256)').inputs;
            [feeTake_] = BaseContract._formatABIDataItemList(inputAbi, [feeTake_], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('changeFeeTake(uint256)')
                .functions.changeFeeTake(feeTake_).data;
            return abiEncodedTransactionData;
        },
    };
    public changeAdmin = {
        async sendTransactionAsync(admin_: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeAdmin(address)').inputs;
            [admin_] = BaseContract._formatABIDataItemList(
                inputAbi,
                [admin_],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self._lookupEthersInterface('changeAdmin(address)').functions.changeAdmin(admin_).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.changeAdmin.estimateGasAsync.bind(self, admin_),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(admin_: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeAdmin(address)').inputs;
            [admin_] = BaseContract._formatABIDataItemList(inputAbi, [admin_], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('changeAdmin(address)').functions.changeAdmin(admin_).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(admin_: string): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeAdmin(address)').inputs;
            [admin_] = BaseContract._formatABIDataItemList(inputAbi, [admin_], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('changeAdmin(address)')
                .functions.changeAdmin(admin_).data;
            return abiEncodedTransactionData;
        },
    };
    public withdrawToken = {
        async sendTransactionAsync(token: string, amount: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('withdrawToken(address,uint256)').inputs;
            [token, amount] = BaseContract._formatABIDataItemList(
                inputAbi,
                [token, amount],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('withdrawToken(address,uint256)')
                .functions.withdrawToken(token, amount).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.withdrawToken.estimateGasAsync.bind(self, token, amount),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(token: string, amount: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('withdrawToken(address,uint256)').inputs;
            [token, amount] = BaseContract._formatABIDataItemList(
                inputAbi,
                [token, amount],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('withdrawToken(address,uint256)')
                .functions.withdrawToken(token, amount).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(token: string, amount: BigNumber): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('withdrawToken(address,uint256)').inputs;
            [token, amount] = BaseContract._formatABIDataItemList(
                inputAbi,
                [token, amount],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('withdrawToken(address,uint256)')
                .functions.withdrawToken(token, amount).data;
            return abiEncodedTransactionData;
        },
    };
    public orders = {
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature = 'orders(address,bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0, index_1] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0, index_1],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.orders(index_0, index_1) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'orders' }) as MethodAbi).outputs;
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
    public feeTake = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature = 'feeTake()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.feeTake() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'feeTake' }) as MethodAbi).outputs;
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
    public deposit = {
        async sendTransactionAsync(txData: Partial<TxDataPayable> = {}): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('deposit()').inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._lookupEthersInterface('deposit()').functions.deposit().data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.deposit.estimateGasAsync.bind(self),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('deposit()').inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('deposit()').functions.deposit().data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('deposit()').inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('deposit()').functions.deposit().data;
            return abiEncodedTransactionData;
        },
    };
    public changeAccountLevelsAddr = {
        async sendTransactionAsync(accountLevelsAddr_: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeAccountLevelsAddr(address)').inputs;
            [accountLevelsAddr_] = BaseContract._formatABIDataItemList(
                inputAbi,
                [accountLevelsAddr_],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('changeAccountLevelsAddr(address)')
                .functions.changeAccountLevelsAddr(accountLevelsAddr_).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.changeAccountLevelsAddr.estimateGasAsync.bind(self, accountLevelsAddr_),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(accountLevelsAddr_: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeAccountLevelsAddr(address)').inputs;
            [accountLevelsAddr_] = BaseContract._formatABIDataItemList(
                inputAbi,
                [accountLevelsAddr_],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('changeAccountLevelsAddr(address)')
                .functions.changeAccountLevelsAddr(accountLevelsAddr_).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(accountLevelsAddr_: string): string {
            const self = (this as any) as EtherDeltaContract;
            const inputAbi = self._lookupAbi('changeAccountLevelsAddr(address)').inputs;
            [accountLevelsAddr_] = BaseContract._formatABIDataItemList(
                inputAbi,
                [accountLevelsAddr_],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('changeAccountLevelsAddr(address)')
                .functions.changeAccountLevelsAddr(accountLevelsAddr_).data;
            return abiEncodedTransactionData;
        },
    };
    public accountLevelsAddr = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature = 'accountLevelsAddr()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.accountLevelsAddr() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'accountLevelsAddr' }) as MethodAbi).outputs;
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
            token: string,
            user: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature = 'balanceOf(address,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [token, user] = BaseContract._formatABIDataItemList(
                inputAbi,
                [token, user],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.balanceOf(token, user) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
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
    public admin = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature = 'admin()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.admin() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'admin' }) as MethodAbi).outputs;
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
    public availableVolume = {
        async callAsync(
            tokenGet: string,
            amountGet: BigNumber,
            tokenGive: string,
            amountGive: BigNumber,
            expires: BigNumber,
            nonce: BigNumber,
            user: string,
            v: number | BigNumber,
            r: string,
            s: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            const self = (this as any) as EtherDeltaContract;
            const functionSignature =
                'availableVolume(address,uint256,address,uint256,uint256,uint256,address,uint8,bytes32,bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [
                tokenGet,
                amountGet,
                tokenGive,
                amountGive,
                expires,
                nonce,
                user,
                v,
                r,
                s,
            ] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenGet, amountGet, tokenGive, amountGive, expires, nonce, user, v, r, s],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.availableVolume(
                    tokenGet,
                    amountGet,
                    tokenGive,
                    amountGive,
                    expires,
                    nonce,
                    user,
                    v,
                    r,
                    s,
                ) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'availableVolume' }) as MethodAbi).outputs;
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
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
        admin_: string,
        feeAccount_: string,
        accountLevelsAddr_: string,
        feeMake_: BigNumber,
        feeTake_: BigNumber,
        feeRebate_: BigNumber,
    ): Promise<EtherDeltaContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return EtherDeltaContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            admin_,
            feeAccount_,
            accountLevelsAddr_,
            feeMake_,
            feeTake_,
            feeRebate_,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
        admin_: string,
        feeAccount_: string,
        accountLevelsAddr_: string,
        feeMake_: BigNumber,
        feeTake_: BigNumber,
        feeRebate_: BigNumber,
    ): Promise<EtherDeltaContract> {
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [admin_, feeAccount_, accountLevelsAddr_, feeMake_, feeTake_, feeRebate_] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [admin_, feeAccount_, accountLevelsAddr_, feeMake_, feeTake_, feeRebate_],
            BaseContract._bigNumberToString,
        );
        const txData = ethers.Contract.getDeployTransaction(
            bytecode,
            abi,
            admin_,
            feeAccount_,
            accountLevelsAddr_,
            feeMake_,
            feeTake_,
            feeRebate_,
        );
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            txData,
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionMinedAsync(txHash);
        logUtils.log(`EtherDelta successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new EtherDeltaContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [admin_, feeAccount_, accountLevelsAddr_, feeMake_, feeTake_, feeRebate_];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('EtherDelta', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
