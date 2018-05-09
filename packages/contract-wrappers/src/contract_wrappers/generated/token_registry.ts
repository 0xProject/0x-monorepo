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

export type TokenRegistryContractEventArgs =
    | LogAddTokenContractEventArgs
    | LogRemoveTokenContractEventArgs
    | LogTokenNameChangeContractEventArgs
    | LogTokenSymbolChangeContractEventArgs
    | LogTokenIpfsHashChangeContractEventArgs
    | LogTokenSwarmHashChangeContractEventArgs;

export enum TokenRegistryEvents {
    LogAddToken = 'LogAddToken',
    LogRemoveToken = 'LogRemoveToken',
    LogTokenNameChange = 'LogTokenNameChange',
    LogTokenSymbolChange = 'LogTokenSymbolChange',
    LogTokenIpfsHashChange = 'LogTokenIpfsHashChange',
    LogTokenSwarmHashChange = 'LogTokenSwarmHashChange',
}

export interface LogAddTokenContractEventArgs {
    token: string;
    name: string;
    symbol: string;
    decimals: number;
    ipfsHash: string;
    swarmHash: string;
}

export interface LogRemoveTokenContractEventArgs {
    token: string;
    name: string;
    symbol: string;
    decimals: number;
    ipfsHash: string;
    swarmHash: string;
}

export interface LogTokenNameChangeContractEventArgs {
    token: string;
    oldName: string;
    newName: string;
}

export interface LogTokenSymbolChangeContractEventArgs {
    token: string;
    oldSymbol: string;
    newSymbol: string;
}

export interface LogTokenIpfsHashChangeContractEventArgs {
    token: string;
    oldIpfsHash: string;
    newIpfsHash: string;
}

export interface LogTokenSwarmHashChangeContractEventArgs {
    token: string;
    oldSwarmHash: string;
    newSwarmHash: string;
}

// tslint:disable:no-parameter-reassignment
export class TokenRegistryContract extends BaseContract {
    public removeToken = {
        async sendTransactionAsync(_token: string, _index: BigNumber, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('removeToken(address,uint256)').inputs;
            [_token, _index] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _index],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('removeToken(address,uint256)')
                .functions.removeToken(_token, _index).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.removeToken.estimateGasAsync.bind(self, _token, _index),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(_token: string, _index: BigNumber, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('removeToken(address,uint256)').inputs;
            [_token, _index] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _index],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('removeToken(address,uint256)')
                .functions.removeToken(_token, _index).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(_token: string, _index: BigNumber): string {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('removeToken(address,uint256)').inputs;
            [_token, _index] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _index],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('removeToken(address,uint256)')
                .functions.removeToken(_token, _index).data;
            return abiEncodedTransactionData;
        },
    };
    public getTokenAddressByName = {
        async callAsync(_name: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            const self = (this as any) as TokenRegistryContract;
            const functionSignature = 'getTokenAddressByName(string)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_name] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_name],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getTokenAddressByName(_name) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getTokenAddressByName' }) as MethodAbi).outputs;
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
    public getTokenAddressBySymbol = {
        async callAsync(_symbol: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            const self = (this as any) as TokenRegistryContract;
            const functionSignature = 'getTokenAddressBySymbol(string)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_symbol] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_symbol],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getTokenAddressBySymbol(_symbol) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getTokenAddressBySymbol' }) as MethodAbi).outputs;
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
    public setTokenSwarmHash = {
        async sendTransactionAsync(_token: string, _swarmHash: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('setTokenSwarmHash(address,bytes)').inputs;
            [_token, _swarmHash] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _swarmHash],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('setTokenSwarmHash(address,bytes)')
                .functions.setTokenSwarmHash(_token, _swarmHash).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.setTokenSwarmHash.estimateGasAsync.bind(self, _token, _swarmHash),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(_token: string, _swarmHash: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('setTokenSwarmHash(address,bytes)').inputs;
            [_token, _swarmHash] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _swarmHash],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('setTokenSwarmHash(address,bytes)')
                .functions.setTokenSwarmHash(_token, _swarmHash).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(_token: string, _swarmHash: string): string {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('setTokenSwarmHash(address,bytes)').inputs;
            [_token, _swarmHash] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _swarmHash],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('setTokenSwarmHash(address,bytes)')
                .functions.setTokenSwarmHash(_token, _swarmHash).data;
            return abiEncodedTransactionData;
        },
    };
    public getTokenMetaData = {
        async callAsync(
            _token: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, string, number, string, string]> {
            const self = (this as any) as TokenRegistryContract;
            const functionSignature = 'getTokenMetaData(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_token] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getTokenMetaData(_token) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getTokenMetaData' }) as MethodAbi).outputs;
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
            return resultArray;
        },
    };
    public owner = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            const self = (this as any) as TokenRegistryContract;
            const functionSignature = 'owner()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.owner() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'owner' }) as MethodAbi).outputs;
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
    public addToken = {
        async sendTransactionAsync(
            _token: string,
            _name: string,
            _symbol: string,
            _decimals: number | BigNumber,
            _ipfsHash: string,
            _swarmHash: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('addToken(address,string,string,uint8,bytes,bytes)').inputs;
            [_token, _name, _symbol, _decimals, _ipfsHash, _swarmHash] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _name, _symbol, _decimals, _ipfsHash, _swarmHash],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('addToken(address,string,string,uint8,bytes,bytes)')
                .functions.addToken(_token, _name, _symbol, _decimals, _ipfsHash, _swarmHash).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.addToken.estimateGasAsync.bind(self, _token, _name, _symbol, _decimals, _ipfsHash, _swarmHash),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            _token: string,
            _name: string,
            _symbol: string,
            _decimals: number | BigNumber,
            _ipfsHash: string,
            _swarmHash: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('addToken(address,string,string,uint8,bytes,bytes)').inputs;
            [_token, _name, _symbol, _decimals, _ipfsHash, _swarmHash] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _name, _symbol, _decimals, _ipfsHash, _swarmHash],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('addToken(address,string,string,uint8,bytes,bytes)')
                .functions.addToken(_token, _name, _symbol, _decimals, _ipfsHash, _swarmHash).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            _token: string,
            _name: string,
            _symbol: string,
            _decimals: number | BigNumber,
            _ipfsHash: string,
            _swarmHash: string,
        ): string {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('addToken(address,string,string,uint8,bytes,bytes)').inputs;
            [_token, _name, _symbol, _decimals, _ipfsHash, _swarmHash] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _name, _symbol, _decimals, _ipfsHash, _swarmHash],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('addToken(address,string,string,uint8,bytes,bytes)')
                .functions.addToken(_token, _name, _symbol, _decimals, _ipfsHash, _swarmHash).data;
            return abiEncodedTransactionData;
        },
    };
    public setTokenName = {
        async sendTransactionAsync(_token: string, _name: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('setTokenName(address,string)').inputs;
            [_token, _name] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _name],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('setTokenName(address,string)')
                .functions.setTokenName(_token, _name).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.setTokenName.estimateGasAsync.bind(self, _token, _name),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(_token: string, _name: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('setTokenName(address,string)').inputs;
            [_token, _name] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _name],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('setTokenName(address,string)')
                .functions.setTokenName(_token, _name).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(_token: string, _name: string): string {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('setTokenName(address,string)').inputs;
            [_token, _name] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _name],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('setTokenName(address,string)')
                .functions.setTokenName(_token, _name).data;
            return abiEncodedTransactionData;
        },
    };
    public tokens = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, string, number, string, string]> {
            const self = (this as any) as TokenRegistryContract;
            const functionSignature = 'tokens(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.tokens(index_0) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
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
            return resultArray;
        },
    };
    public tokenAddresses = {
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            const self = (this as any) as TokenRegistryContract;
            const functionSignature = 'tokenAddresses(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0] = BaseContract._formatABIDataItemList(
                inputAbi,
                [index_0],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.tokenAddresses(index_0) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'tokenAddresses' }) as MethodAbi).outputs;
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
    public getTokenByName = {
        async callAsync(
            _name: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, string, number, string, string]> {
            const self = (this as any) as TokenRegistryContract;
            const functionSignature = 'getTokenByName(string)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_name] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_name],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getTokenByName(_name) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getTokenByName' }) as MethodAbi).outputs;
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
            return resultArray;
        },
    };
    public getTokenAddresses = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string[]> {
            const self = (this as any) as TokenRegistryContract;
            const functionSignature = 'getTokenAddresses()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getTokenAddresses() as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getTokenAddresses' }) as MethodAbi).outputs;
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
    public setTokenIpfsHash = {
        async sendTransactionAsync(_token: string, _ipfsHash: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('setTokenIpfsHash(address,bytes)').inputs;
            [_token, _ipfsHash] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _ipfsHash],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('setTokenIpfsHash(address,bytes)')
                .functions.setTokenIpfsHash(_token, _ipfsHash).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.setTokenIpfsHash.estimateGasAsync.bind(self, _token, _ipfsHash),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(_token: string, _ipfsHash: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('setTokenIpfsHash(address,bytes)').inputs;
            [_token, _ipfsHash] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _ipfsHash],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('setTokenIpfsHash(address,bytes)')
                .functions.setTokenIpfsHash(_token, _ipfsHash).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(_token: string, _ipfsHash: string): string {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('setTokenIpfsHash(address,bytes)').inputs;
            [_token, _ipfsHash] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _ipfsHash],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('setTokenIpfsHash(address,bytes)')
                .functions.setTokenIpfsHash(_token, _ipfsHash).data;
            return abiEncodedTransactionData;
        },
    };
    public getTokenBySymbol = {
        async callAsync(
            _symbol: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, string, number, string, string]> {
            const self = (this as any) as TokenRegistryContract;
            const functionSignature = 'getTokenBySymbol(string)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_symbol] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_symbol],
                BaseContract._bigNumberToString.bind(self),
            );
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.getTokenBySymbol(_symbol) as ethers.CallDescription;
            const encodedData = ethersFunction.data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                data: encodedData,
            });
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            let resultArray = ethersFunction.parse(rawCallResult);
            const outputAbi = (_.find(self.abi, { name: 'getTokenBySymbol' }) as MethodAbi).outputs;
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
            return resultArray;
        },
    };
    public setTokenSymbol = {
        async sendTransactionAsync(_token: string, _symbol: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('setTokenSymbol(address,string)').inputs;
            [_token, _symbol] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _symbol],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('setTokenSymbol(address,string)')
                .functions.setTokenSymbol(_token, _symbol).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.setTokenSymbol.estimateGasAsync.bind(self, _token, _symbol),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(_token: string, _symbol: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('setTokenSymbol(address,string)').inputs;
            [_token, _symbol] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _symbol],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('setTokenSymbol(address,string)')
                .functions.setTokenSymbol(_token, _symbol).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(_token: string, _symbol: string): string {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('setTokenSymbol(address,string)').inputs;
            [_token, _symbol] = BaseContract._formatABIDataItemList(
                inputAbi,
                [_token, _symbol],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('setTokenSymbol(address,string)')
                .functions.setTokenSymbol(_token, _symbol).data;
            return abiEncodedTransactionData;
        },
    };
    public transferOwnership = {
        async sendTransactionAsync(newOwner: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [newOwner],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('transferOwnership(address)')
                .functions.transferOwnership(newOwner).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.transferOwnership.estimateGasAsync.bind(self, newOwner),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(newOwner: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [newOwner],
                BaseContract._bigNumberToString.bind(this),
            );
            const encodedData = self
                ._lookupEthersInterface('transferOwnership(address)')
                .functions.transferOwnership(newOwner).data;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync({
                ...txData,
                data: encodedData,
            });
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(newOwner: string): string {
            const self = (this as any) as TokenRegistryContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [newOwner],
                BaseContract._bigNumberToString.bind(self),
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('transferOwnership(address)')
                .functions.transferOwnership(newOwner).data;
            return abiEncodedTransactionData;
        },
    };
    constructor(abi: ContractAbi, address: string, provider: Provider, defaults?: Partial<TxData>) {
        super(abi, address, provider, defaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
