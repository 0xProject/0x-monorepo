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
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'name()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.name;
            const encodedData = ethersFunction.encode([]);
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'name'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public getApproved = {
        async callAsync(
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'getApproved(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_tokenId
        ] = BaseContract._formatABIDataItemList(inputAbi, [_tokenId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_tokenId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getApproved;
            const encodedData = ethersFunction.encode([_tokenId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'getApproved'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public approve = {
        async sendTransactionAsync(
            _approved: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('approve(address,uint256)').inputs;
            [_approved,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_approved,
    _tokenId
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_approved,
    _tokenId
    ]);
            const encodedData = self._lookupEthersInterface('approve(address,uint256)').functions.approve.encode([_approved,
    _tokenId
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.approve.estimateGasAsync.bind(
                    self,
                    _approved,
                    _tokenId
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            _approved: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('approve(address,uint256)').inputs;
            [_approved,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_approved,
    _tokenId
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('approve(address,uint256)').functions.approve.encode([_approved,
    _tokenId
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
            _approved: string,
            _tokenId: BigNumber,
        ): string {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('approve(address,uint256)').inputs;
            [_approved,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_approved,
    _tokenId
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('approve(address,uint256)').functions.approve.encode([_approved,
    _tokenId
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            _approved: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'approve(address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_approved,
        _tokenId
        ] = BaseContract._formatABIDataItemList(inputAbi, [_approved,
        _tokenId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_approved,
        _tokenId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.approve;
            const encodedData = ethersFunction.encode([_approved,
        _tokenId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'approve'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
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
            const inputAbi = self._lookupAbi('transferFrom(address,address,uint256)').inputs;
            [_from,
    _to,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_from,
    _to,
    _tokenId
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_from,
    _to,
    _tokenId
    ]);
            const encodedData = self._lookupEthersInterface('transferFrom(address,address,uint256)').functions.transferFrom.encode([_from,
    _to,
    _tokenId
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.transferFrom.estimateGasAsync.bind(
                    self,
                    _from,
                    _to,
                    _tokenId
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('transferFrom(address,address,uint256)').inputs;
            [_from,
    _to,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_from,
    _to,
    _tokenId
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('transferFrom(address,address,uint256)').functions.transferFrom.encode([_from,
    _to,
    _tokenId
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
            _from: string,
            _to: string,
            _tokenId: BigNumber,
        ): string {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('transferFrom(address,address,uint256)').inputs;
            [_from,
    _to,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_from,
    _to,
    _tokenId
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('transferFrom(address,address,uint256)').functions.transferFrom.encode([_from,
    _to,
    _tokenId
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'transferFrom(address,address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_from,
        _to,
        _tokenId
        ] = BaseContract._formatABIDataItemList(inputAbi, [_from,
        _to,
        _tokenId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_from,
        _to,
        _tokenId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.transferFrom;
            const encodedData = ethersFunction.encode([_from,
        _to,
        _tokenId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'transferFrom'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public mint = {
        async sendTransactionAsync(
            _to: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('mint(address,uint256)').inputs;
            [_to,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_to,
    _tokenId
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_to,
    _tokenId
    ]);
            const encodedData = self._lookupEthersInterface('mint(address,uint256)').functions.mint.encode([_to,
    _tokenId
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.mint.estimateGasAsync.bind(
                    self,
                    _to,
                    _tokenId
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            _to: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('mint(address,uint256)').inputs;
            [_to,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_to,
    _tokenId
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('mint(address,uint256)').functions.mint.encode([_to,
    _tokenId
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
            _to: string,
            _tokenId: BigNumber,
        ): string {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('mint(address,uint256)').inputs;
            [_to,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_to,
    _tokenId
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('mint(address,uint256)').functions.mint.encode([_to,
    _tokenId
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            _to: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'mint(address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_to,
        _tokenId
        ] = BaseContract._formatABIDataItemList(inputAbi, [_to,
        _tokenId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_to,
        _tokenId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.mint;
            const encodedData = ethersFunction.encode([_to,
        _tokenId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'mint'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
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
            const inputAbi = self._lookupAbi('safeTransferFrom(address,address,uint256)').inputs;
            [_from,
    _to,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_from,
    _to,
    _tokenId
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_from,
    _to,
    _tokenId
    ]);
            const encodedData = self._lookupEthersInterface('safeTransferFrom(address,address,uint256)').functions.safeTransferFrom.encode([_from,
    _to,
    _tokenId
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.safeTransferFrom1.estimateGasAsync.bind(
                    self,
                    _from,
                    _to,
                    _tokenId
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('safeTransferFrom(address,address,uint256)').inputs;
            [_from,
    _to,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_from,
    _to,
    _tokenId
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('safeTransferFrom(address,address,uint256)').functions.safeTransferFrom.encode([_from,
    _to,
    _tokenId
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
            _from: string,
            _to: string,
            _tokenId: BigNumber,
        ): string {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('safeTransferFrom(address,address,uint256)').inputs;
            [_from,
    _to,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_from,
    _to,
    _tokenId
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('safeTransferFrom(address,address,uint256)').functions.safeTransferFrom.encode([_from,
    _to,
    _tokenId
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'safeTransferFrom(address,address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_from,
        _to,
        _tokenId
        ] = BaseContract._formatABIDataItemList(inputAbi, [_from,
        _to,
        _tokenId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_from,
        _to,
        _tokenId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.safeTransferFrom;
            const encodedData = ethersFunction.encode([_from,
        _to,
        _tokenId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'safeTransferFrom'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public ownerOf = {
        async callAsync(
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'ownerOf(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_tokenId
        ] = BaseContract._formatABIDataItemList(inputAbi, [_tokenId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_tokenId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.ownerOf;
            const encodedData = ethersFunction.encode([_tokenId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'ownerOf'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public balanceOf = {
        async callAsync(
            _owner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'balanceOf(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_owner
        ] = BaseContract._formatABIDataItemList(inputAbi, [_owner
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_owner
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.balanceOf;
            const encodedData = ethersFunction.encode([_owner
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'balanceOf'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public owner = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'owner()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.owner;
            const encodedData = ethersFunction.encode([]);
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'owner'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public symbol = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'symbol()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.symbol;
            const encodedData = ethersFunction.encode([]);
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'symbol'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public burn = {
        async sendTransactionAsync(
            _owner: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('burn(address,uint256)').inputs;
            [_owner,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_owner,
    _tokenId
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_owner,
    _tokenId
    ]);
            const encodedData = self._lookupEthersInterface('burn(address,uint256)').functions.burn.encode([_owner,
    _tokenId
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.burn.estimateGasAsync.bind(
                    self,
                    _owner,
                    _tokenId
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            _owner: string,
            _tokenId: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('burn(address,uint256)').inputs;
            [_owner,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_owner,
    _tokenId
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('burn(address,uint256)').functions.burn.encode([_owner,
    _tokenId
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
            _owner: string,
            _tokenId: BigNumber,
        ): string {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('burn(address,uint256)').inputs;
            [_owner,
    _tokenId
    ] = BaseContract._formatABIDataItemList(inputAbi, [_owner,
    _tokenId
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('burn(address,uint256)').functions.burn.encode([_owner,
    _tokenId
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            _owner: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'burn(address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_owner,
        _tokenId
        ] = BaseContract._formatABIDataItemList(inputAbi, [_owner,
        _tokenId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_owner,
        _tokenId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.burn;
            const encodedData = ethersFunction.encode([_owner,
        _tokenId
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'burn'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public setApprovalForAll = {
        async sendTransactionAsync(
            _operator: string,
            _approved: boolean,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('setApprovalForAll(address,bool)').inputs;
            [_operator,
    _approved
    ] = BaseContract._formatABIDataItemList(inputAbi, [_operator,
    _approved
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_operator,
    _approved
    ]);
            const encodedData = self._lookupEthersInterface('setApprovalForAll(address,bool)').functions.setApprovalForAll.encode([_operator,
    _approved
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.setApprovalForAll.estimateGasAsync.bind(
                    self,
                    _operator,
                    _approved
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            _operator: string,
            _approved: boolean,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('setApprovalForAll(address,bool)').inputs;
            [_operator,
    _approved
    ] = BaseContract._formatABIDataItemList(inputAbi, [_operator,
    _approved
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('setApprovalForAll(address,bool)').functions.setApprovalForAll.encode([_operator,
    _approved
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
            _operator: string,
            _approved: boolean,
        ): string {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('setApprovalForAll(address,bool)').inputs;
            [_operator,
    _approved
    ] = BaseContract._formatABIDataItemList(inputAbi, [_operator,
    _approved
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('setApprovalForAll(address,bool)').functions.setApprovalForAll.encode([_operator,
    _approved
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            _operator: string,
            _approved: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'setApprovalForAll(address,bool)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_operator,
        _approved
        ] = BaseContract._formatABIDataItemList(inputAbi, [_operator,
        _approved
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_operator,
        _approved
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.setApprovalForAll;
            const encodedData = ethersFunction.encode([_operator,
        _approved
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'setApprovalForAll'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
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
            const inputAbi = self._lookupAbi('safeTransferFrom(address,address,uint256,bytes)').inputs;
            [_from,
    _to,
    _tokenId,
    _data
    ] = BaseContract._formatABIDataItemList(inputAbi, [_from,
    _to,
    _tokenId,
    _data
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_from,
    _to,
    _tokenId,
    _data
    ]);
            const encodedData = self._lookupEthersInterface('safeTransferFrom(address,address,uint256,bytes)').functions.safeTransferFrom.encode([_from,
    _to,
    _tokenId,
    _data
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.safeTransferFrom2.estimateGasAsync.bind(
                    self,
                    _from,
                    _to,
                    _tokenId,
                    _data
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
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
            const inputAbi = self._lookupAbi('safeTransferFrom(address,address,uint256,bytes)').inputs;
            [_from,
    _to,
    _tokenId,
    _data
    ] = BaseContract._formatABIDataItemList(inputAbi, [_from,
    _to,
    _tokenId,
    _data
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('safeTransferFrom(address,address,uint256,bytes)').functions.safeTransferFrom.encode([_from,
    _to,
    _tokenId,
    _data
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
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            _data: string,
        ): string {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('safeTransferFrom(address,address,uint256,bytes)').inputs;
            [_from,
    _to,
    _tokenId,
    _data
    ] = BaseContract._formatABIDataItemList(inputAbi, [_from,
    _to,
    _tokenId,
    _data
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('safeTransferFrom(address,address,uint256,bytes)').functions.safeTransferFrom.encode([_from,
    _to,
    _tokenId,
    _data
    ]);
            return abiEncodedTransactionData;
        },
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
            const functionSignature = 'safeTransferFrom(address,address,uint256,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_from,
        _to,
        _tokenId,
        _data
        ] = BaseContract._formatABIDataItemList(inputAbi, [_from,
        _to,
        _tokenId,
        _data
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_from,
        _to,
        _tokenId,
        _data
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.safeTransferFrom;
            const encodedData = ethersFunction.encode([_from,
        _to,
        _tokenId,
        _data
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'safeTransferFrom'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public isApprovedForAll = {
        async callAsync(
            _owner: string,
            _operator: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'isApprovedForAll(address,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_owner,
        _operator
        ] = BaseContract._formatABIDataItemList(inputAbi, [_owner,
        _operator
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_owner,
        _operator
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.isApprovedForAll;
            const encodedData = ethersFunction.encode([_owner,
        _operator
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'isApprovedForAll'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public transferOwnership = {
        async sendTransactionAsync(
            newOwner: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner
    ] = BaseContract._formatABIDataItemList(inputAbi, [newOwner
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [newOwner
    ]);
            const encodedData = self._lookupEthersInterface('transferOwnership(address)').functions.transferOwnership.encode([newOwner
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.transferOwnership.estimateGasAsync.bind(
                    self,
                    newOwner
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            newOwner: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner
    ] = BaseContract._formatABIDataItemList(inputAbi, [newOwner
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('transferOwnership(address)').functions.transferOwnership.encode([newOwner
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
            newOwner: string,
        ): string {
            const self = this as any as DummyERC721TokenContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner
    ] = BaseContract._formatABIDataItemList(inputAbi, [newOwner
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('transferOwnership(address)').functions.transferOwnership.encode([newOwner
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            newOwner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as DummyERC721TokenContract;
            const functionSignature = 'transferOwnership(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [newOwner
        ] = BaseContract._formatABIDataItemList(inputAbi, [newOwner
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [newOwner
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.transferOwnership;
            const encodedData = ethersFunction.encode([newOwner
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'transferOwnership'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
            _name: string,
            _symbol: string,
    ): Promise<DummyERC721TokenContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return DummyERC721TokenContract.deployAsync(bytecode, abi, provider, txDefaults, _name,
_symbol
);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
            _name: string,
            _symbol: string,
    ): Promise<DummyERC721TokenContract> {
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
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_name,
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
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('DummyERC721Token', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
