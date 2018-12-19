// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract } from '@0x/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, ContractArtifact, DecodedLogArgs, MethodAbi, Provider, TxData, TxDataPayable } from 'ethereum-types';
import { BigNumber, classUtils, logUtils } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as ethers from 'ethers';
import * as _ from 'lodash';
// tslint:enable:no-unused-variable

export type WETH9EventArgs =
    | WETH9ApprovalEventArgs
    | WETH9TransferEventArgs
    | WETH9DepositEventArgs
    | WETH9WithdrawalEventArgs;

export enum WETH9Events {
    Approval = 'Approval',
    Transfer = 'Transfer',
    Deposit = 'Deposit',
    Withdrawal = 'Withdrawal',
}

export interface WETH9ApprovalEventArgs extends DecodedLogArgs {
    _owner: string;
    _spender: string;
    _value: BigNumber;
}

export interface WETH9TransferEventArgs extends DecodedLogArgs {
    _from: string;
    _to: string;
    _value: BigNumber;
}

export interface WETH9DepositEventArgs extends DecodedLogArgs {
    _owner: string;
    _value: BigNumber;
}

export interface WETH9WithdrawalEventArgs extends DecodedLogArgs {
    _owner: string;
    _value: BigNumber;
}


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class WETH9Contract extends BaseContract {
    public name = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as WETH9Contract;
            const functionSignature = 'name()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const abiEncoder = self._lookupAbiEncoder(functionSignature);
            const encodedData = abiEncoder.encode([]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
                let resultArray = abiEncoder.decodeReturnValuesAsArray(rawCallResult, {structsAsObjects: true});
                return resultArray[0];
        },
    };
    public approve = {
        async sendTransactionAsync(
            guy: string,
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('approve(address,uint256)');
            const encodedData = abiEncoder.encode([guy,
    wad
    ], {optimize: false});
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.approve.estimateGasAsync.bind(
                    self,
                    guy,
                    wad
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            guy: string,
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('approve(address,uint256)');
            const encodedData = abiEncoder.encode([guy,
    wad
    ]);
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
            guy: string,
            wad: BigNumber,
        ): string {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('approve(address,uint256)');
            const abiEncodedTransactionData = abiEncoder.encode([guy,
    wad
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            guy: string,
            wad: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as WETH9Contract;
            const functionSignature = 'approve(address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [guy,
        wad
        ] = BaseContract._formatABIDataItemList(inputAbi, [guy,
        wad
        ], BaseContract._bigNumberToString.bind(self));
            const abiEncoder = self._lookupAbiEncoder(functionSignature);
            const encodedData = abiEncoder.encode([guy,
        wad
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
                let resultArray = abiEncoder.decodeReturnValuesAsArray(rawCallResult, {structsAsObjects: true});
                return resultArray[0];
        },
    };
    public totalSupply = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as WETH9Contract;
            const functionSignature = 'totalSupply()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const abiEncoder = self._lookupAbiEncoder(functionSignature);
            const encodedData = abiEncoder.encode([]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
                let resultArray = abiEncoder.decodeReturnValuesAsArray(rawCallResult, {structsAsObjects: true});
                return resultArray[0];
        },
    };
    public transferFrom = {
        async sendTransactionAsync(
            src: string,
            dst: string,
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('transferFrom(address,address,uint256)');
            const encodedData = abiEncoder.encode([src,
    dst,
    wad
    ], {optimize: false});
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.transferFrom.estimateGasAsync.bind(
                    self,
                    src,
                    dst,
                    wad
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            src: string,
            dst: string,
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('transferFrom(address,address,uint256)');
            const encodedData = abiEncoder.encode([src,
    dst,
    wad
    ]);
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
            src: string,
            dst: string,
            wad: BigNumber,
        ): string {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('transferFrom(address,address,uint256)');
            const abiEncodedTransactionData = abiEncoder.encode([src,
    dst,
    wad
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            src: string,
            dst: string,
            wad: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as WETH9Contract;
            const functionSignature = 'transferFrom(address,address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [src,
        dst,
        wad
        ] = BaseContract._formatABIDataItemList(inputAbi, [src,
        dst,
        wad
        ], BaseContract._bigNumberToString.bind(self));
            const abiEncoder = self._lookupAbiEncoder(functionSignature);
            const encodedData = abiEncoder.encode([src,
        dst,
        wad
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
                let resultArray = abiEncoder.decodeReturnValuesAsArray(rawCallResult, {structsAsObjects: true});
                return resultArray[0];
        },
    };
    public withdraw = {
        async sendTransactionAsync(
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('withdraw(uint256)');
            const encodedData = abiEncoder.encode([wad
    ], {optimize: false});
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.withdraw.estimateGasAsync.bind(
                    self,
                    wad
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('withdraw(uint256)');
            const encodedData = abiEncoder.encode([wad
    ]);
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
            wad: BigNumber,
        ): string {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('withdraw(uint256)');
            const abiEncodedTransactionData = abiEncoder.encode([wad
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            wad: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as WETH9Contract;
            const functionSignature = 'withdraw(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [wad
        ] = BaseContract._formatABIDataItemList(inputAbi, [wad
        ], BaseContract._bigNumberToString.bind(self));
            const abiEncoder = self._lookupAbiEncoder(functionSignature);
            const encodedData = abiEncoder.encode([wad
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
                return;
        },
    };
    public decimals = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<number
        > {
            const self = this as any as WETH9Contract;
            const functionSignature = 'decimals()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const abiEncoder = self._lookupAbiEncoder(functionSignature);
            const encodedData = abiEncoder.encode([]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
                let resultArray = abiEncoder.decodeReturnValuesAsArray(rawCallResult, {structsAsObjects: true});
                return resultArray[0];
        },
    };
    public balanceOf = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as WETH9Contract;
            const functionSignature = 'balanceOf(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0
        ], BaseContract._bigNumberToString.bind(self));
            const abiEncoder = self._lookupAbiEncoder(functionSignature);
            const encodedData = abiEncoder.encode([index_0
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
                let resultArray = abiEncoder.decodeReturnValuesAsArray(rawCallResult, {structsAsObjects: true});
                return resultArray[0];
        },
    };
    public symbol = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as WETH9Contract;
            const functionSignature = 'symbol()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const abiEncoder = self._lookupAbiEncoder(functionSignature);
            const encodedData = abiEncoder.encode([]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
                let resultArray = abiEncoder.decodeReturnValuesAsArray(rawCallResult, {structsAsObjects: true});
                return resultArray[0];
        },
    };
    public transfer = {
        async sendTransactionAsync(
            dst: string,
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('transfer(address,uint256)');
            const encodedData = abiEncoder.encode([dst,
    wad
    ], {optimize: false});
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.transfer.estimateGasAsync.bind(
                    self,
                    dst,
                    wad
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            dst: string,
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('transfer(address,uint256)');
            const encodedData = abiEncoder.encode([dst,
    wad
    ]);
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
            dst: string,
            wad: BigNumber,
        ): string {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('transfer(address,uint256)');
            const abiEncodedTransactionData = abiEncoder.encode([dst,
    wad
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            dst: string,
            wad: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as WETH9Contract;
            const functionSignature = 'transfer(address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [dst,
        wad
        ] = BaseContract._formatABIDataItemList(inputAbi, [dst,
        wad
        ], BaseContract._bigNumberToString.bind(self));
            const abiEncoder = self._lookupAbiEncoder(functionSignature);
            const encodedData = abiEncoder.encode([dst,
        wad
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
                let resultArray = abiEncoder.decodeReturnValuesAsArray(rawCallResult, {structsAsObjects: true});
                return resultArray[0];
        },
    };
    public deposit = {
        async sendTransactionAsync(
            txData: Partial<TxDataPayable> = {},
        ): Promise<string> {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('deposit()');
            const encodedData = abiEncoder.encode([], {optimize: false});
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.deposit.estimateGasAsync.bind(
                    self,
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('deposit()');
            const encodedData = abiEncoder.encode([]);
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
        ): string {
            const self = this as any as WETH9Contract;
            const abiEncoder = self._lookupAbiEncoder('deposit()');
            const abiEncodedTransactionData = abiEncoder.encode([]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as WETH9Contract;
            const functionSignature = 'deposit()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const abiEncoder = self._lookupAbiEncoder(functionSignature);
            const encodedData = abiEncoder.encode([]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
                return;
        },
    };
    public allowance = {
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as WETH9Contract;
            const functionSignature = 'allowance(address,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0,
        index_1
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0,
        index_1
        ], BaseContract._bigNumberToString.bind(self));
            const abiEncoder = self._lookupAbiEncoder(functionSignature);
            const encodedData = abiEncoder.encode([index_0,
        index_1
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
                let resultArray = abiEncoder.decodeReturnValuesAsArray(rawCallResult, {structsAsObjects: true});
                return resultArray[0];
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
    ): Promise<WETH9Contract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return WETH9Contract.deployAsync(bytecode, abi, provider, txDefaults, );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
    ): Promise<WETH9Contract> {
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, []);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            {data: txData},
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`WETH9 successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new WETH9Contract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('WETH9', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
