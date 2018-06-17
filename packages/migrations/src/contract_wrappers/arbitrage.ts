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

// tslint:disable:no-parameter-reassignment
export class ArbitrageContract extends BaseContract {
    public setAllowances = {
        async sendTransactionAsync(tokenAddress: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as ArbitrageContract;
            const inputAbi = self._lookupAbi('setAllowances(address)').inputs;
            [tokenAddress] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenAddress],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('setAllowances(address)')
                .functions.setAllowances(tokenAddress).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.setAllowances.estimateGasAsync.bind(self, tokenAddress),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(tokenAddress: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as ArbitrageContract;
            const inputAbi = self._lookupAbi('setAllowances(address)').inputs;
            [tokenAddress] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenAddress],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('setAllowances(address)')
                .functions.setAllowances(tokenAddress).data;
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
        getABIEncodedTransactionData(tokenAddress: string): string {
            const self = (this as any) as ArbitrageContract;
            const inputAbi = self._lookupAbi('setAllowances(address)').inputs;
            [tokenAddress] = BaseContract._formatABIDataItemList(
                inputAbi,
                [tokenAddress],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('setAllowances(address)')
                .functions.setAllowances(tokenAddress).data;
            return abiEncodedTransactionData;
        },
    };
    public owner = {
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            const self = (this as any) as ArbitrageContract;
            const functionSignature = 'owner()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const ethersFunction = self
                ._lookupEthersInterface(functionSignature)
                .functions.owner() as ethers.CallDescription;
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
    public transferOwnership = {
        async sendTransactionAsync(newOwner: string, txData: Partial<TxData> = {}): Promise<string> {
            const self = (this as any) as ArbitrageContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner] = BaseContract._formatABIDataItemList(
                inputAbi,
                [newOwner],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('transferOwnership(address)')
                .functions.transferOwnership(newOwner).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.transferOwnership.estimateGasAsync.bind(self, newOwner),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(newOwner: string, txData: Partial<TxData> = {}): Promise<number> {
            const self = (this as any) as ArbitrageContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner] = BaseContract._formatABIDataItemList(inputAbi, [newOwner], BaseContract._bigNumberToString);
            const encodedData = self
                ._lookupEthersInterface('transferOwnership(address)')
                .functions.transferOwnership(newOwner).data;
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
        getABIEncodedTransactionData(newOwner: string): string {
            const self = (this as any) as ArbitrageContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner] = BaseContract._formatABIDataItemList(inputAbi, [newOwner], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('transferOwnership(address)')
                .functions.transferOwnership(newOwner).data;
            return abiEncodedTransactionData;
        },
    };
    public makeAtomicTrade = {
        async sendTransactionAsync(
            addresses: string[],
            values: BigNumber[],
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = (this as any) as ArbitrageContract;
            const inputAbi = self._lookupAbi('makeAtomicTrade(address[6],uint256[12],uint8[2],bytes32[2],bytes32[2])')
                .inputs;
            [addresses, values, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [addresses, values, v, r, s],
                BaseContract._bigNumberToString.bind(self),
            );
            const encodedData = self
                ._lookupEthersInterface('makeAtomicTrade(address[6],uint256[12],uint8[2],bytes32[2],bytes32[2])')
                .functions.makeAtomicTrade(addresses, values, v, r, s).data;
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.makeAtomicTrade.estimateGasAsync.bind(self, addresses, values, v, r, s),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            addresses: string[],
            values: BigNumber[],
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = (this as any) as ArbitrageContract;
            const inputAbi = self._lookupAbi('makeAtomicTrade(address[6],uint256[12],uint8[2],bytes32[2],bytes32[2])')
                .inputs;
            [addresses, values, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [addresses, values, v, r, s],
                BaseContract._bigNumberToString,
            );
            const encodedData = self
                ._lookupEthersInterface('makeAtomicTrade(address[6],uint256[12],uint8[2],bytes32[2],bytes32[2])')
                .functions.makeAtomicTrade(addresses, values, v, r, s).data;
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
            addresses: string[],
            values: BigNumber[],
            v: Array<number | BigNumber>,
            r: string[],
            s: string[],
        ): string {
            const self = (this as any) as ArbitrageContract;
            const inputAbi = self._lookupAbi('makeAtomicTrade(address[6],uint256[12],uint8[2],bytes32[2],bytes32[2])')
                .inputs;
            [addresses, values, v, r, s] = BaseContract._formatABIDataItemList(
                inputAbi,
                [addresses, values, v, r, s],
                BaseContract._bigNumberToString,
            );
            const abiEncodedTransactionData = self
                ._lookupEthersInterface('makeAtomicTrade(address[6],uint256[12],uint8[2],bytes32[2],bytes32[2])')
                .functions.makeAtomicTrade(addresses, values, v, r, s).data;
            return abiEncodedTransactionData;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
        _exchangeAddress: string,
        _etherDeltaAddress: string,
        _proxyAddress: string,
    ): Promise<ArbitrageContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return ArbitrageContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            _exchangeAddress,
            _etherDeltaAddress,
            _proxyAddress,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
        _exchangeAddress: string,
        _etherDeltaAddress: string,
        _proxyAddress: string,
    ): Promise<ArbitrageContract> {
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_exchangeAddress, _etherDeltaAddress, _proxyAddress] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchangeAddress, _etherDeltaAddress, _proxyAddress],
            BaseContract._bigNumberToString,
        );
        const txData = ethers.Contract.getDeployTransaction(
            bytecode,
            abi,
            _exchangeAddress,
            _etherDeltaAddress,
            _proxyAddress,
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
        logUtils.log(`Arbitrage successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ArbitrageContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [_exchangeAddress, _etherDeltaAddress, _proxyAddress];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('Arbitrage', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
