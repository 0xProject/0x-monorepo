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

export type ERC721TokenEventArgs =
    | ERC721TokenTransferEventArgs
    | ERC721TokenApprovalEventArgs
    | ERC721TokenApprovalForAllEventArgs;

export enum ERC721TokenEvents {
    Transfer = 'Transfer',
    Approval = 'Approval',
    ApprovalForAll = 'ApprovalForAll',
}

export interface ERC721TokenTransferEventArgs extends DecodedLogArgs {
    _from: string;
    _to: string;
    _tokenId: BigNumber;
}

export interface ERC721TokenApprovalEventArgs extends DecodedLogArgs {
    _owner: string;
    _approved: string;
    _tokenId: BigNumber;
}

export interface ERC721TokenApprovalForAllEventArgs extends DecodedLogArgs {
    _owner: string;
    _operator: string;
    _approved: boolean;
}


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ERC721TokenContract extends BaseContract {
    public getApproved = {
        functionSignature: 'getApproved(uint256)',
        async callAsync(
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.getApproved.functionSignature, [_tokenId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getApproved.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public approve = {
        async sendTransactionAsync(
            _approved: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.approve.functionSignature, [_approved,
    _tokenId
    ]);
            const gasEstimateFunction = self.approve.estimateGasAsync.bind(self, _approved,
    _tokenId
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            _approved: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.approve.functionSignature, [_approved,
    _tokenId
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            _approved: string,
            _tokenId: BigNumber,
        ): string {
            const self = this as any as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.approve.functionSignature, [_approved,
    _tokenId
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'approve(address,uint256)',
        async callAsync(
            _approved: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.approve.functionSignature, [_approved,
        _tokenId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.approve.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public transferFrom = {
        async sendTransactionAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.transferFrom.functionSignature, [_from,
    _to,
    _tokenId
    ]);
            const gasEstimateFunction = self.transferFrom.estimateGasAsync.bind(self, _from,
    _to,
    _tokenId
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.transferFrom.functionSignature, [_from,
    _to,
    _tokenId
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
        ): string {
            const self = this as any as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.transferFrom.functionSignature, [_from,
    _to,
    _tokenId
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'transferFrom(address,address,uint256)',
        async callAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.transferFrom.functionSignature, [_from,
        _to,
        _tokenId
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
    public safeTransferFrom1 = {
        async sendTransactionAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.safeTransferFrom1.functionSignature, [_from,
    _to,
    _tokenId
    ]);
            const gasEstimateFunction = self.safeTransferFrom1.estimateGasAsync.bind(self, _from,
    _to,
    _tokenId
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.safeTransferFrom1.functionSignature, [_from,
    _to,
    _tokenId
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
        ): string {
            const self = this as any as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.safeTransferFrom1.functionSignature, [_from,
    _to,
    _tokenId
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'safeTransferFrom(address,address,uint256)',
        async callAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.safeTransferFrom1.functionSignature, [_from,
        _to,
        _tokenId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.safeTransferFrom1.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public ownerOf = {
        functionSignature: 'ownerOf(uint256)',
        async callAsync(
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.ownerOf.functionSignature, [_tokenId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.ownerOf.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public balanceOf = {
        functionSignature: 'balanceOf(address)',
        async callAsync(
            _owner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.balanceOf.functionSignature, [_owner
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
    public setApprovalForAll = {
        async sendTransactionAsync(
            _operator: string,
            _approved: boolean,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.setApprovalForAll.functionSignature, [_operator,
    _approved
    ]);
            const gasEstimateFunction = self.setApprovalForAll.estimateGasAsync.bind(self, _operator,
    _approved
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            _operator: string,
            _approved: boolean,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.setApprovalForAll.functionSignature, [_operator,
    _approved
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            _operator: string,
            _approved: boolean,
        ): string {
            const self = this as any as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.setApprovalForAll.functionSignature, [_operator,
    _approved
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'setApprovalForAll(address,bool)',
        async callAsync(
            _operator: string,
            _approved: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.setApprovalForAll.functionSignature, [_operator,
        _approved
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.setApprovalForAll.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public safeTransferFrom2 = {
        async sendTransactionAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            _data: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.safeTransferFrom2.functionSignature, [_from,
    _to,
    _tokenId,
    _data
    ]);
            const gasEstimateFunction = self.safeTransferFrom2.estimateGasAsync.bind(self, _from,
    _to,
    _tokenId,
    _data
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            _data: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.safeTransferFrom2.functionSignature, [_from,
    _to,
    _tokenId,
    _data
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            _data: string,
        ): string {
            const self = this as any as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.safeTransferFrom2.functionSignature, [_from,
    _to,
    _tokenId,
    _data
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'safeTransferFrom(address,address,uint256,bytes)',
        async callAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            _data: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.safeTransferFrom2.functionSignature, [_from,
        _to,
        _tokenId,
        _data
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.safeTransferFrom2.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public isApprovedForAll = {
        functionSignature: 'isApprovedForAll(address,address)',
        async callAsync(
            _owner: string,
            _operator: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.isApprovedForAll.functionSignature, [_owner,
        _operator
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.isApprovedForAll.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
    ): Promise<ERC721TokenContract> {
        if (isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return ERC721TokenContract.deployAsync(bytecode, abi, provider, txDefaults, );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
    ): Promise<ERC721TokenContract> {
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
        super('ERC721Token', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
