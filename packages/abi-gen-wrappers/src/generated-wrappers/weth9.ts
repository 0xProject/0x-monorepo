// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract } from '@0x/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, ContractArtifact, DecodedLogArgs, MethodAbi, TxData, TxDataPayable, SupportedProvider } from 'ethereum-types';
import { AbiEncoder, BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { isUndefined } from 'lodash';
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
        functionSignature: 'name()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.name.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.name.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public approve = {
        async sendTransactionAsync(
            guy: string,
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.approve.functionSignature, [guy,
    wad
    ]);
            const gasEstimateFunction = self.approve.estimateGasAsync.bind(self, guy,
    wad
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            guy: string,
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.approve.functionSignature, [guy,
    wad
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            guy: string,
            wad: BigNumber,
        ): string {
            const self = this as any as WETH9Contract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.approve.functionSignature, [guy,
    wad
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'approve(address,uint256)',
        async callAsync(
            guy: string,
            wad: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.approve.functionSignature, [guy,
        wad
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.approve.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public totalSupply = {
        functionSignature: 'totalSupply()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.totalSupply.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.totalSupply.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.transferFrom.functionSignature, [src,
    dst,
    wad
    ]);
            const gasEstimateFunction = self.transferFrom.estimateGasAsync.bind(self, src,
    dst,
    wad
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            src: string,
            dst: string,
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.transferFrom.functionSignature, [src,
    dst,
    wad
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            src: string,
            dst: string,
            wad: BigNumber,
        ): string {
            const self = this as any as WETH9Contract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.transferFrom.functionSignature, [src,
    dst,
    wad
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'transferFrom(address,address,uint256)',
        async callAsync(
            src: string,
            dst: string,
            wad: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.transferFrom.functionSignature, [src,
        dst,
        wad
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.transferFrom.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public withdraw = {
        async sendTransactionAsync(
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.withdraw.functionSignature, [wad
    ]);
            const gasEstimateFunction = self.withdraw.estimateGasAsync.bind(self, wad
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.withdraw.functionSignature, [wad
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            wad: BigNumber,
        ): string {
            const self = this as any as WETH9Contract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.withdraw.functionSignature, [wad
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'withdraw(uint256)',
        async callAsync(
            wad: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.withdraw.functionSignature, [wad
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.withdraw.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public decimals = {
        functionSignature: 'decimals()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<number
        > {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.decimals.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.decimals.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<number
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public balanceOf = {
        functionSignature: 'balanceOf(address)',
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.balanceOf.functionSignature, [index_0
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.balanceOf.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public symbol = {
        functionSignature: 'symbol()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.symbol.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.symbol.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public transfer = {
        async sendTransactionAsync(
            dst: string,
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.transfer.functionSignature, [dst,
    wad
    ]);
            const gasEstimateFunction = self.transfer.estimateGasAsync.bind(self, dst,
    wad
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            dst: string,
            wad: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.transfer.functionSignature, [dst,
    wad
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            dst: string,
            wad: BigNumber,
        ): string {
            const self = this as any as WETH9Contract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.transfer.functionSignature, [dst,
    wad
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'transfer(address,uint256)',
        async callAsync(
            dst: string,
            wad: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.transfer.functionSignature, [dst,
        wad
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.transfer.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public deposit = {
        async sendTransactionAsync(
            txData: Partial<TxDataPayable> = {},
        ): Promise<string> {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.deposit.functionSignature, []);
            const gasEstimateFunction = self.deposit.estimateGasAsync.bind(self, );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.deposit.functionSignature, []);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
        ): string {
            const self = this as any as WETH9Contract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.deposit.functionSignature, []);
            return abiEncodedTransactionData;
        },
        functionSignature: 'deposit()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.deposit.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.deposit.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public allowance = {
        functionSignature: 'allowance(address,address)',
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as WETH9Contract;
            const encodedData = self._strictEncodeArguments(self.allowance.functionSignature, [index_0,
        index_1
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.allowance.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
    ): Promise<WETH9Contract> {
        if (isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return WETH9Contract.deployAsync(bytecode, abi, provider, txDefaults, );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
    ): Promise<WETH9Contract> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [],
            BaseContract._bigNumberToString,
        );
        const encoder = new AbiEncoder.Constructor(constructorAbi);
        const txData = encoder.encode(bytecode, []);
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
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('WETH9', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
