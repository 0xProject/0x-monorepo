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

export type DummyERC721TokenEventArgs =
    | DummyERC721TokenTransferEventArgs
    | DummyERC721TokenApprovalEventArgs
    | DummyERC721TokenApprovalForAllEventArgs;

export enum DummyERC721TokenEvents {
    Transfer = 'Transfer',
    Approval = 'Approval',
    ApprovalForAll = 'ApprovalForAll',
}

export interface DummyERC721TokenTransferEventArgs extends DecodedLogArgs {
    _from: string;
    _to: string;
    _tokenId: BigNumber;
}

export interface DummyERC721TokenApprovalEventArgs extends DecodedLogArgs {
    _owner: string;
    _approved: string;
    _tokenId: BigNumber;
}

export interface DummyERC721TokenApprovalForAllEventArgs extends DecodedLogArgs {
    _owner: string;
    _operator: string;
    _approved: boolean;
}


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class DummyERC721TokenContract extends BaseContract {
    public name = {
        functionSignature: 'name()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as DummyERC721TokenContract;
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
    public getApproved = {
        functionSignature: 'getApproved(uint256)',
        async callAsync(
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
    public mint = {
        async sendTransactionAsync(
            _to: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as DummyERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.mint.functionSignature, [_to,
    _tokenId
    ]);
            const gasEstimateFunction = self.mint.estimateGasAsync.bind(self, _to,
    _tokenId
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            _to: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as DummyERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.mint.functionSignature, [_to,
    _tokenId
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            _to: string,
            _tokenId: BigNumber,
        ): string {
            const self = this as any as DummyERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.mint.functionSignature, [_to,
    _tokenId
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'mint(address,uint256)',
        async callAsync(
            _to: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as DummyERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.mint.functionSignature, [_to,
        _tokenId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.mint.functionSignature);
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
    public owner = {
        functionSignature: 'owner()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as DummyERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.owner.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.owner.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
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
            const self = this as any as DummyERC721TokenContract;
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
    public burn = {
        async sendTransactionAsync(
            _owner: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as DummyERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.burn.functionSignature, [_owner,
    _tokenId
    ]);
            const gasEstimateFunction = self.burn.estimateGasAsync.bind(self, _owner,
    _tokenId
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            _owner: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as DummyERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.burn.functionSignature, [_owner,
    _tokenId
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            _owner: string,
            _tokenId: BigNumber,
        ): string {
            const self = this as any as DummyERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.burn.functionSignature, [_owner,
    _tokenId
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'burn(address,uint256)',
        async callAsync(
            _owner: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as DummyERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.burn.functionSignature, [_owner,
        _tokenId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.burn.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
    public transferOwnership = {
        async sendTransactionAsync(
            newOwner: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
            const encodedData = self._strictEncodeArguments(self.transferOwnership.functionSignature, [newOwner
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            newOwner: string,
        ): string {
            const self = this as any as DummyERC721TokenContract;
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
            const self = this as any as DummyERC721TokenContract;
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
            _name: string,
            _symbol: string,
    ): Promise<DummyERC721TokenContract> {
        if (isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return DummyERC721TokenContract.deployAsync(bytecode, abi, provider, txDefaults, _name,
_symbol
);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
            _name: string,
            _symbol: string,
    ): Promise<DummyERC721TokenContract> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_name,
_symbol
] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_name,
_symbol
],
            BaseContract._bigNumberToString,
        );
        const encoder = new AbiEncoder.Constructor(constructorAbi);
        const txData = encoder.encode(bytecode, [_name,
_symbol
]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            {data: txData},
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`DummyERC721Token successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new DummyERC721TokenContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [_name,
_symbol
];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('DummyERC721Token', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
