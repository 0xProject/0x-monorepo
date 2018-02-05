/**
 * This file is auto-generated using abi-gen. Don't edit directly.
 * Templates can be found at https://github.com/0xProject/0x.js/tree/development/packages/abi-gen-templates.
 */
// tslint:disable-next-line:no-unused-variable
import { TxData, TxDataPayable } from '@0xproject/types';
import { BigNumber, classUtils, promisify } from '@0xproject/utils';
import * as Web3 from 'web3';

import {BaseContract} from './base_contract';

export class TokenRegistryContract extends BaseContract {
    public removeToken = {
        async sendTransactionAsync(
            _token: string,
            _index: BigNumber,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenRegistryContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.removeToken.estimateGasAsync.bind(
                    self,
                    _token,
                    _index,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.removeToken, self._web3ContractInstance,
            )(
                _token,
                _index,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            _token: string,
            _index: BigNumber,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as TokenRegistryContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.removeToken.estimateGas, self._web3ContractInstance,
            )(
                _token,
                _index,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            _token: string,
            _index: BigNumber,
            txData: TxData = {},
        ): string {
            const self = this as TokenRegistryContract;
            const abiEncodedTransactionData = self._web3ContractInstance.removeToken.getData();
            return abiEncodedTransactionData;
        },
    };
    public getTokenAddressByName = {
        async callAsync(
            _name: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as TokenRegistryContract;
            const result = await promisify<string
    >(
                self._web3ContractInstance.getTokenAddressByName.call,
                self._web3ContractInstance,
            )(
                _name,
            );
            return result;
        },
    };
    public getTokenAddressBySymbol = {
        async callAsync(
            _symbol: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as TokenRegistryContract;
            const result = await promisify<string
    >(
                self._web3ContractInstance.getTokenAddressBySymbol.call,
                self._web3ContractInstance,
            )(
                _symbol,
            );
            return result;
        },
    };
    public setTokenSwarmHash = {
        async sendTransactionAsync(
            _token: string,
            _swarmHash: string,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenRegistryContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.setTokenSwarmHash.estimateGasAsync.bind(
                    self,
                    _token,
                    _swarmHash,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.setTokenSwarmHash, self._web3ContractInstance,
            )(
                _token,
                _swarmHash,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            _token: string,
            _swarmHash: string,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as TokenRegistryContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.setTokenSwarmHash.estimateGas, self._web3ContractInstance,
            )(
                _token,
                _swarmHash,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            _token: string,
            _swarmHash: string,
            txData: TxData = {},
        ): string {
            const self = this as TokenRegistryContract;
            const abiEncodedTransactionData = self._web3ContractInstance.setTokenSwarmHash.getData();
            return abiEncodedTransactionData;
        },
    };
    public getTokenMetaData = {
        async callAsync(
            _token: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<[string, string, string, BigNumber, string, string]
    > {
            const self = this as TokenRegistryContract;
            const result = await promisify<[string, string, string, BigNumber, string, string]
    >(
                self._web3ContractInstance.getTokenMetaData.call,
                self._web3ContractInstance,
            )(
                _token,
            );
            return result;
        },
    };
    public owner = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as TokenRegistryContract;
            const result = await promisify<string
    >(
                self._web3ContractInstance.owner.call,
                self._web3ContractInstance,
            )(
            );
            return result;
        },
    };
    public addToken = {
        async sendTransactionAsync(
            _token: string,
            _name: string,
            _symbol: string,
            _decimals: number|BigNumber,
            _ipfsHash: string,
            _swarmHash: string,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenRegistryContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.addToken.estimateGasAsync.bind(
                    self,
                    _token,
                    _name,
                    _symbol,
                    _decimals,
                    _ipfsHash,
                    _swarmHash,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.addToken, self._web3ContractInstance,
            )(
                _token,
                _name,
                _symbol,
                _decimals,
                _ipfsHash,
                _swarmHash,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            _token: string,
            _name: string,
            _symbol: string,
            _decimals: number|BigNumber,
            _ipfsHash: string,
            _swarmHash: string,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as TokenRegistryContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.addToken.estimateGas, self._web3ContractInstance,
            )(
                _token,
                _name,
                _symbol,
                _decimals,
                _ipfsHash,
                _swarmHash,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            _token: string,
            _name: string,
            _symbol: string,
            _decimals: number|BigNumber,
            _ipfsHash: string,
            _swarmHash: string,
            txData: TxData = {},
        ): string {
            const self = this as TokenRegistryContract;
            const abiEncodedTransactionData = self._web3ContractInstance.addToken.getData();
            return abiEncodedTransactionData;
        },
    };
    public setTokenName = {
        async sendTransactionAsync(
            _token: string,
            _name: string,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenRegistryContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.setTokenName.estimateGasAsync.bind(
                    self,
                    _token,
                    _name,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.setTokenName, self._web3ContractInstance,
            )(
                _token,
                _name,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            _token: string,
            _name: string,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as TokenRegistryContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.setTokenName.estimateGas, self._web3ContractInstance,
            )(
                _token,
                _name,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            _token: string,
            _name: string,
            txData: TxData = {},
        ): string {
            const self = this as TokenRegistryContract;
            const abiEncodedTransactionData = self._web3ContractInstance.setTokenName.getData();
            return abiEncodedTransactionData;
        },
    };
    public tokens = {
        async callAsync(
            index: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<[string, string, string, BigNumber, string, string]
    > {
            const self = this as TokenRegistryContract;
            const result = await promisify<[string, string, string, BigNumber, string, string]
    >(
                self._web3ContractInstance.tokens.call,
                self._web3ContractInstance,
            )(
                index,
            );
            return result;
        },
    };
    public tokenAddresses = {
        async callAsync(
            index: BigNumber,
            defaultBlock?: Web3.BlockParam,
        ): Promise<string
    > {
            const self = this as TokenRegistryContract;
            const result = await promisify<string
    >(
                self._web3ContractInstance.tokenAddresses.call,
                self._web3ContractInstance,
            )(
                index,
            );
            return result;
        },
    };
    public getTokenByName = {
        async callAsync(
            _name: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<[string, string, string, BigNumber, string, string]
    > {
            const self = this as TokenRegistryContract;
            const result = await promisify<[string, string, string, BigNumber, string, string]
    >(
                self._web3ContractInstance.getTokenByName.call,
                self._web3ContractInstance,
            )(
                _name,
            );
            return result;
        },
    };
    public getTokenAddresses = {
        async callAsync(
            defaultBlock?: Web3.BlockParam,
        ): Promise<string[]
    > {
            const self = this as TokenRegistryContract;
            const result = await promisify<string[]
    >(
                self._web3ContractInstance.getTokenAddresses.call,
                self._web3ContractInstance,
            )(
            );
            return result;
        },
    };
    public setTokenIpfsHash = {
        async sendTransactionAsync(
            _token: string,
            _ipfsHash: string,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenRegistryContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.setTokenIpfsHash.estimateGasAsync.bind(
                    self,
                    _token,
                    _ipfsHash,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.setTokenIpfsHash, self._web3ContractInstance,
            )(
                _token,
                _ipfsHash,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            _token: string,
            _ipfsHash: string,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as TokenRegistryContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.setTokenIpfsHash.estimateGas, self._web3ContractInstance,
            )(
                _token,
                _ipfsHash,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            _token: string,
            _ipfsHash: string,
            txData: TxData = {},
        ): string {
            const self = this as TokenRegistryContract;
            const abiEncodedTransactionData = self._web3ContractInstance.setTokenIpfsHash.getData();
            return abiEncodedTransactionData;
        },
    };
    public getTokenBySymbol = {
        async callAsync(
            _symbol: string,
            defaultBlock?: Web3.BlockParam,
        ): Promise<[string, string, string, BigNumber, string, string]
    > {
            const self = this as TokenRegistryContract;
            const result = await promisify<[string, string, string, BigNumber, string, string]
    >(
                self._web3ContractInstance.getTokenBySymbol.call,
                self._web3ContractInstance,
            )(
                _symbol,
            );
            return result;
        },
    };
    public setTokenSymbol = {
        async sendTransactionAsync(
            _token: string,
            _symbol: string,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenRegistryContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
                self.setTokenSymbol.estimateGasAsync.bind(
                    self,
                    _token,
                    _symbol,
                ),
            );
            const txHash = await promisify<string>(
                self._web3ContractInstance.setTokenSymbol, self._web3ContractInstance,
            )(
                _token,
                _symbol,
                txDataWithDefaults,
            );
            return txHash;
        },
        async estimateGasAsync(
            _token: string,
            _symbol: string,
            txData: TxData = {},
        ): Promise<number> {
            const self = this as TokenRegistryContract;
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                txData,
            );
            const gas = await promisify<number>(
                self._web3ContractInstance.setTokenSymbol.estimateGas, self._web3ContractInstance,
            )(
                _token,
                _symbol,
                txDataWithDefaults,
            );
            return gas;
        },
        getABIEncodedTransactionData(
            _token: string,
            _symbol: string,
            txData: TxData = {},
        ): string {
            const self = this as TokenRegistryContract;
            const abiEncodedTransactionData = self._web3ContractInstance.setTokenSymbol.getData();
            return abiEncodedTransactionData;
        },
    };
    public transferOwnership = {
        async sendTransactionAsync(
            newOwner: string,
            txData: TxData = {},
        ): Promise<string> {
            const self = this as TokenRegistryContract;
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
            const self = this as TokenRegistryContract;
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
            const self = this as TokenRegistryContract;
            const abiEncodedTransactionData = self._web3ContractInstance.transferOwnership.getData();
            return abiEncodedTransactionData;
        },
    };
    constructor(web3ContractInstance: Web3.ContractInstance, defaults: Partial<TxData>) {
        super(web3ContractInstance, defaults);
        classUtils.bindAll(this, ['_web3ContractInstance', '_defaults']);
    }
} // tslint:disable:max-file-line-count
