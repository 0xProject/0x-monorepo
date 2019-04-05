// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract } from '@0x/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, ContractArtifact, DecodedLogArgs, MethodAbi, TxData, TxDataPayable, SupportedProvider } from 'ethereum-types';
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { isUndefined } from 'lodash';
// tslint:enable:no-unused-variable


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class IAssetProxyContract extends BaseContract {
    public addAuthorizedAddress = {
        async sendTransactionAsync(
            target: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.addAuthorizedAddress.functionSignature, [target
    ]);
            const gasEstimateFunction = self.addAuthorizedAddress.estimateGasAsync.bind(self, target
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            target: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.addAuthorizedAddress.functionSignature, [target
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            target: string,
        ): string {
            const self = this as any as IAssetProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.addAuthorizedAddress.functionSignature, [target
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'addAuthorizedAddress(address)',
        async callAsync(
            target: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.addAuthorizedAddress.functionSignature, [target
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.addAuthorizedAddress.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public removeAuthorizedAddress = {
        async sendTransactionAsync(
            target: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.removeAuthorizedAddress.functionSignature, [target
    ]);
            const gasEstimateFunction = self.removeAuthorizedAddress.estimateGasAsync.bind(self, target
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            target: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.removeAuthorizedAddress.functionSignature, [target
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            target: string,
        ): string {
            const self = this as any as IAssetProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.removeAuthorizedAddress.functionSignature, [target
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'removeAuthorizedAddress(address)',
        async callAsync(
            target: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.removeAuthorizedAddress.functionSignature, [target
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.removeAuthorizedAddress.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public removeAuthorizedAddressAtIndex = {
        async sendTransactionAsync(
            target: string,
            index: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.removeAuthorizedAddressAtIndex.functionSignature, [target,
    index
    ]);
            const gasEstimateFunction = self.removeAuthorizedAddressAtIndex.estimateGasAsync.bind(self, target,
    index
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            target: string,
            index: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.removeAuthorizedAddressAtIndex.functionSignature, [target,
    index
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            target: string,
            index: BigNumber,
        ): string {
            const self = this as any as IAssetProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.removeAuthorizedAddressAtIndex.functionSignature, [target,
    index
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'removeAuthorizedAddressAtIndex(address,uint256)',
        async callAsync(
            target: string,
            index: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.removeAuthorizedAddressAtIndex.functionSignature, [target,
        index
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.removeAuthorizedAddressAtIndex.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public transferFrom = {
        async sendTransactionAsync(
            assetData: string,
            from: string,
            to: string,
            amount: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.transferFrom.functionSignature, [assetData,
    from,
    to,
    amount
    ]);
            const gasEstimateFunction = self.transferFrom.estimateGasAsync.bind(self, assetData,
    from,
    to,
    amount
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            assetData: string,
            from: string,
            to: string,
            amount: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.transferFrom.functionSignature, [assetData,
    from,
    to,
    amount
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            assetData: string,
            from: string,
            to: string,
            amount: BigNumber,
        ): string {
            const self = this as any as IAssetProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.transferFrom.functionSignature, [assetData,
    from,
    to,
    amount
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'transferFrom(bytes,address,address,uint256)',
        async callAsync(
            assetData: string,
            from: string,
            to: string,
            amount: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.transferFrom.functionSignature, [assetData,
        from,
        to,
        amount
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.transferFrom.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getProxyId = {
        functionSignature: 'getProxyId()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.getProxyId.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getProxyId.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getAuthorizedAddresses = {
        functionSignature: 'getAuthorizedAddresses()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string[]
        > {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.getAuthorizedAddresses.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getAuthorizedAddresses.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string[]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public transferOwnership = {
        async sendTransactionAsync(
            newOwner: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.transferOwnership.functionSignature, [newOwner
    ]);
            const gasEstimateFunction = self.transferOwnership.estimateGasAsync.bind(self, newOwner
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            newOwner: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.transferOwnership.functionSignature, [newOwner
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            newOwner: string,
        ): string {
            const self = this as any as IAssetProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.transferOwnership.functionSignature, [newOwner
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'transferOwnership(address)',
        async callAsync(
            newOwner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as IAssetProxyContract;
            const encodedData = self._strictEncodeArguments(self.transferOwnership.functionSignature, [newOwner
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.transferOwnership.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
    ): Promise<IAssetProxyContract> {
        if (isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return IAssetProxyContract.deployAsync(bytecode, abi, provider, txDefaults, );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
    ): Promise<IAssetProxyContract> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [],
            BaseContract._bigNumberToString,
        );
        return {} as any;
    }
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('IAssetProxy', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
