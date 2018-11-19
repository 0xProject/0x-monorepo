// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract } from '@0x/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, ContractArtifact, DecodedLogArgs, MethodAbi, Provider, TxData, TxDataPayable } from 'ethereum-types';
import { BigNumber, classUtils, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as ethers from 'ethers';
import * as _ from 'lodash';
// tslint:enable:no-unused-variable

export type ExchangeEventArgs =
    | ExchangeSignatureValidatorApprovalEventArgs
    | ExchangeFillEventArgs
    | ExchangeCancelEventArgs
    | ExchangeCancelUpToEventArgs
    | ExchangeAssetProxyRegisteredEventArgs;

export enum ExchangeEvents {
    SignatureValidatorApproval = 'SignatureValidatorApproval',
    Fill = 'Fill',
    Cancel = 'Cancel',
    CancelUpTo = 'CancelUpTo',
    AssetProxyRegistered = 'AssetProxyRegistered',
}

export interface ExchangeSignatureValidatorApprovalEventArgs extends DecodedLogArgs {
    signerAddress: string;
    validatorAddress: string;
    approved: boolean;
}

export interface ExchangeFillEventArgs extends DecodedLogArgs {
    makerAddress: string;
    feeRecipientAddress: string;
    takerAddress: string;
    senderAddress: string;
    makerAssetFilledAmount: BigNumber;
    takerAssetFilledAmount: BigNumber;
    makerFeePaid: BigNumber;
    takerFeePaid: BigNumber;
    orderHash: string;
    makerAssetData: string;
    takerAssetData: string;
}

export interface ExchangeCancelEventArgs extends DecodedLogArgs {
    makerAddress: string;
    feeRecipientAddress: string;
    senderAddress: string;
    orderHash: string;
    makerAssetData: string;
    takerAssetData: string;
}

export interface ExchangeCancelUpToEventArgs extends DecodedLogArgs {
    makerAddress: string;
    senderAddress: string;
    orderEpoch: BigNumber;
}

export interface ExchangeAssetProxyRegisteredEventArgs extends DecodedLogArgs {
    id: string;
    assetProxy: string;
}


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ExchangeContract extends BaseContract {
    public filled = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'filled(bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.filled;
            const encodedData = ethersFunction.encode([index_0
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
            const outputAbi = (_.find(self.abi, {name: 'filled'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public batchFillOrders = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('batchFillOrders(tuple[],uint256[],bytes[])').inputs;
            [orders,
    takerAssetFillAmounts,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmounts,
    signatures
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
    takerAssetFillAmounts,
    signatures
    ]);
            const encodedData = self._lookupEthersInterface('batchFillOrders(tuple[],uint256[],bytes[])').functions.batchFillOrders.encode([orders,
    takerAssetFillAmounts,
    signatures
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.batchFillOrders.estimateGasAsync.bind(
                    self,
                    orders,
                    takerAssetFillAmounts,
                    signatures
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('batchFillOrders(tuple[],uint256[],bytes[])').inputs;
            [orders,
    takerAssetFillAmounts,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmounts,
    signatures
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('batchFillOrders(tuple[],uint256[],bytes[])').functions.batchFillOrders.encode([orders,
    takerAssetFillAmounts,
    signatures
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
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('batchFillOrders(tuple[],uint256[],bytes[])').inputs;
            [orders,
    takerAssetFillAmounts,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmounts,
    signatures
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('batchFillOrders(tuple[],uint256[],bytes[])').functions.batchFillOrders.encode([orders,
    takerAssetFillAmounts,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'batchFillOrders(tuple[],uint256[],bytes[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders,
        takerAssetFillAmounts,
        signatures
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        takerAssetFillAmounts,
        signatures
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
        takerAssetFillAmounts,
        signatures
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.batchFillOrders;
            const encodedData = ethersFunction.encode([orders,
        takerAssetFillAmounts,
        signatures
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
            const outputAbi = (_.find(self.abi, {name: 'batchFillOrders'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public cancelled = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'cancelled(bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.cancelled;
            const encodedData = ethersFunction.encode([index_0
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
            const outputAbi = (_.find(self.abi, {name: 'cancelled'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public preSign = {
        async sendTransactionAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('preSign(bytes32,address,bytes)').inputs;
            [hash,
    signerAddress,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
    signerAddress,
    signature
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [hash,
    signerAddress,
    signature
    ]);
            const encodedData = self._lookupEthersInterface('preSign(bytes32,address,bytes)').functions.preSign.encode([hash,
    signerAddress,
    signature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.preSign.estimateGasAsync.bind(
                    self,
                    hash,
                    signerAddress,
                    signature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('preSign(bytes32,address,bytes)').inputs;
            [hash,
    signerAddress,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
    signerAddress,
    signature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('preSign(bytes32,address,bytes)').functions.preSign.encode([hash,
    signerAddress,
    signature
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
            hash: string,
            signerAddress: string,
            signature: string,
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('preSign(bytes32,address,bytes)').inputs;
            [hash,
    signerAddress,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
    signerAddress,
    signature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('preSign(bytes32,address,bytes)').functions.preSign.encode([hash,
    signerAddress,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'preSign(bytes32,address,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [hash,
        signerAddress,
        signature
        ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
        signerAddress,
        signature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [hash,
        signerAddress,
        signature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.preSign;
            const encodedData = ethersFunction.encode([hash,
        signerAddress,
        signature
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
            const outputAbi = (_.find(self.abi, {name: 'preSign'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public matchOrders = {
        async sendTransactionAsync(
            leftOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            rightOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            leftSignature: string,
            rightSignature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)').inputs;
            [leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    ]);
            const encodedData = self._lookupEthersInterface('matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)').functions.matchOrders.encode([leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.matchOrders.estimateGasAsync.bind(
                    self,
                    leftOrder,
                    rightOrder,
                    leftSignature,
                    rightSignature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            leftOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            rightOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            leftSignature: string,
            rightSignature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)').inputs;
            [leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)').functions.matchOrders.encode([leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
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
            leftOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            rightOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            leftSignature: string,
            rightSignature: string,
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)').inputs;
            [leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)').functions.matchOrders.encode([leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            leftOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            rightOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            leftSignature: string,
            rightSignature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{left: {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber};right: {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber};leftMakerAssetSpreadAmount: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [leftOrder,
        rightOrder,
        leftSignature,
        rightSignature
        ] = BaseContract._formatABIDataItemList(inputAbi, [leftOrder,
        rightOrder,
        leftSignature,
        rightSignature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [leftOrder,
        rightOrder,
        leftSignature,
        rightSignature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.matchOrders;
            const encodedData = ethersFunction.encode([leftOrder,
        rightOrder,
        leftSignature,
        rightSignature
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
            const outputAbi = (_.find(self.abi, {name: 'matchOrders'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public fillOrderNoThrow = {
        async sendTransactionAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrderNoThrow({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    signature
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order,
    takerAssetFillAmount,
    signature
    ]);
            const encodedData = self._lookupEthersInterface('fillOrderNoThrow({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').functions.fillOrderNoThrow.encode([order,
    takerAssetFillAmount,
    signature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.fillOrderNoThrow.estimateGasAsync.bind(
                    self,
                    order,
                    takerAssetFillAmount,
                    signature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrderNoThrow({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    signature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('fillOrderNoThrow({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').functions.fillOrderNoThrow.encode([order,
    takerAssetFillAmount,
    signature
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
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrderNoThrow({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    signature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('fillOrderNoThrow({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').functions.fillOrderNoThrow.encode([order,
    takerAssetFillAmount,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'fillOrderNoThrow({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [order,
        takerAssetFillAmount,
        signature
        ] = BaseContract._formatABIDataItemList(inputAbi, [order,
        takerAssetFillAmount,
        signature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order,
        takerAssetFillAmount,
        signature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.fillOrderNoThrow;
            const encodedData = ethersFunction.encode([order,
        takerAssetFillAmount,
        signature
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
            const outputAbi = (_.find(self.abi, {name: 'fillOrderNoThrow'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public assetProxies = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'assetProxies(bytes4)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.assetProxies;
            const encodedData = ethersFunction.encode([index_0
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
            const outputAbi = (_.find(self.abi, {name: 'assetProxies'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public batchCancelOrders = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('batchCancelOrders(tuple[])').inputs;
            [orders
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders
    ]);
            const encodedData = self._lookupEthersInterface('batchCancelOrders(tuple[])').functions.batchCancelOrders.encode([orders
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.batchCancelOrders.estimateGasAsync.bind(
                    self,
                    orders
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('batchCancelOrders(tuple[])').inputs;
            [orders
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('batchCancelOrders(tuple[])').functions.batchCancelOrders.encode([orders
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
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('batchCancelOrders(tuple[])').inputs;
            [orders
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('batchCancelOrders(tuple[])').functions.batchCancelOrders.encode([orders
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'batchCancelOrders(tuple[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.batchCancelOrders;
            const encodedData = ethersFunction.encode([orders
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
            const outputAbi = (_.find(self.abi, {name: 'batchCancelOrders'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public batchFillOrKillOrders = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('batchFillOrKillOrders(tuple[],uint256[],bytes[])').inputs;
            [orders,
    takerAssetFillAmounts,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmounts,
    signatures
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
    takerAssetFillAmounts,
    signatures
    ]);
            const encodedData = self._lookupEthersInterface('batchFillOrKillOrders(tuple[],uint256[],bytes[])').functions.batchFillOrKillOrders.encode([orders,
    takerAssetFillAmounts,
    signatures
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.batchFillOrKillOrders.estimateGasAsync.bind(
                    self,
                    orders,
                    takerAssetFillAmounts,
                    signatures
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('batchFillOrKillOrders(tuple[],uint256[],bytes[])').inputs;
            [orders,
    takerAssetFillAmounts,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmounts,
    signatures
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('batchFillOrKillOrders(tuple[],uint256[],bytes[])').functions.batchFillOrKillOrders.encode([orders,
    takerAssetFillAmounts,
    signatures
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
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('batchFillOrKillOrders(tuple[],uint256[],bytes[])').inputs;
            [orders,
    takerAssetFillAmounts,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmounts,
    signatures
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('batchFillOrKillOrders(tuple[],uint256[],bytes[])').functions.batchFillOrKillOrders.encode([orders,
    takerAssetFillAmounts,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'batchFillOrKillOrders(tuple[],uint256[],bytes[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders,
        takerAssetFillAmounts,
        signatures
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        takerAssetFillAmounts,
        signatures
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
        takerAssetFillAmounts,
        signatures
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.batchFillOrKillOrders;
            const encodedData = ethersFunction.encode([orders,
        takerAssetFillAmounts,
        signatures
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
            const outputAbi = (_.find(self.abi, {name: 'batchFillOrKillOrders'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public cancelOrdersUpTo = {
        async sendTransactionAsync(
            targetOrderEpoch: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('cancelOrdersUpTo(uint256)').inputs;
            [targetOrderEpoch
    ] = BaseContract._formatABIDataItemList(inputAbi, [targetOrderEpoch
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [targetOrderEpoch
    ]);
            const encodedData = self._lookupEthersInterface('cancelOrdersUpTo(uint256)').functions.cancelOrdersUpTo.encode([targetOrderEpoch
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.cancelOrdersUpTo.estimateGasAsync.bind(
                    self,
                    targetOrderEpoch
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            targetOrderEpoch: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('cancelOrdersUpTo(uint256)').inputs;
            [targetOrderEpoch
    ] = BaseContract._formatABIDataItemList(inputAbi, [targetOrderEpoch
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('cancelOrdersUpTo(uint256)').functions.cancelOrdersUpTo.encode([targetOrderEpoch
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
            targetOrderEpoch: BigNumber,
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('cancelOrdersUpTo(uint256)').inputs;
            [targetOrderEpoch
    ] = BaseContract._formatABIDataItemList(inputAbi, [targetOrderEpoch
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('cancelOrdersUpTo(uint256)').functions.cancelOrdersUpTo.encode([targetOrderEpoch
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            targetOrderEpoch: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'cancelOrdersUpTo(uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [targetOrderEpoch
        ] = BaseContract._formatABIDataItemList(inputAbi, [targetOrderEpoch
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [targetOrderEpoch
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.cancelOrdersUpTo;
            const encodedData = ethersFunction.encode([targetOrderEpoch
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
            const outputAbi = (_.find(self.abi, {name: 'cancelOrdersUpTo'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public batchFillOrdersNoThrow = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('batchFillOrdersNoThrow(tuple[],uint256[],bytes[])').inputs;
            [orders,
    takerAssetFillAmounts,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmounts,
    signatures
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
    takerAssetFillAmounts,
    signatures
    ]);
            const encodedData = self._lookupEthersInterface('batchFillOrdersNoThrow(tuple[],uint256[],bytes[])').functions.batchFillOrdersNoThrow.encode([orders,
    takerAssetFillAmounts,
    signatures
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.batchFillOrdersNoThrow.estimateGasAsync.bind(
                    self,
                    orders,
                    takerAssetFillAmounts,
                    signatures
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('batchFillOrdersNoThrow(tuple[],uint256[],bytes[])').inputs;
            [orders,
    takerAssetFillAmounts,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmounts,
    signatures
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('batchFillOrdersNoThrow(tuple[],uint256[],bytes[])').functions.batchFillOrdersNoThrow.encode([orders,
    takerAssetFillAmounts,
    signatures
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
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('batchFillOrdersNoThrow(tuple[],uint256[],bytes[])').inputs;
            [orders,
    takerAssetFillAmounts,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmounts,
    signatures
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('batchFillOrdersNoThrow(tuple[],uint256[],bytes[])').functions.batchFillOrdersNoThrow.encode([orders,
    takerAssetFillAmounts,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'batchFillOrdersNoThrow(tuple[],uint256[],bytes[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders,
        takerAssetFillAmounts,
        signatures
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        takerAssetFillAmounts,
        signatures
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
        takerAssetFillAmounts,
        signatures
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.batchFillOrdersNoThrow;
            const encodedData = ethersFunction.encode([orders,
        takerAssetFillAmounts,
        signatures
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
            const outputAbi = (_.find(self.abi, {name: 'batchFillOrdersNoThrow'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public getAssetProxy = {
        async callAsync(
            assetProxyId: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'getAssetProxy(bytes4)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [assetProxyId
        ] = BaseContract._formatABIDataItemList(inputAbi, [assetProxyId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [assetProxyId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getAssetProxy;
            const encodedData = ethersFunction.encode([assetProxyId
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
            const outputAbi = (_.find(self.abi, {name: 'getAssetProxy'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public transactions = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'transactions(bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.transactions;
            const encodedData = ethersFunction.encode([index_0
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
            const outputAbi = (_.find(self.abi, {name: 'transactions'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public fillOrKillOrder = {
        async sendTransactionAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrKillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    signature
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order,
    takerAssetFillAmount,
    signature
    ]);
            const encodedData = self._lookupEthersInterface('fillOrKillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').functions.fillOrKillOrder.encode([order,
    takerAssetFillAmount,
    signature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.fillOrKillOrder.estimateGasAsync.bind(
                    self,
                    order,
                    takerAssetFillAmount,
                    signature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrKillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    signature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('fillOrKillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').functions.fillOrKillOrder.encode([order,
    takerAssetFillAmount,
    signature
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
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrKillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    signature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('fillOrKillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').functions.fillOrKillOrder.encode([order,
    takerAssetFillAmount,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'fillOrKillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [order,
        takerAssetFillAmount,
        signature
        ] = BaseContract._formatABIDataItemList(inputAbi, [order,
        takerAssetFillAmount,
        signature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order,
        takerAssetFillAmount,
        signature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.fillOrKillOrder;
            const encodedData = ethersFunction.encode([order,
        takerAssetFillAmount,
        signature
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
            const outputAbi = (_.find(self.abi, {name: 'fillOrKillOrder'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public setSignatureValidatorApproval = {
        async sendTransactionAsync(
            validatorAddress: string,
            approval: boolean,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('setSignatureValidatorApproval(address,bool)').inputs;
            [validatorAddress,
    approval
    ] = BaseContract._formatABIDataItemList(inputAbi, [validatorAddress,
    approval
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [validatorAddress,
    approval
    ]);
            const encodedData = self._lookupEthersInterface('setSignatureValidatorApproval(address,bool)').functions.setSignatureValidatorApproval.encode([validatorAddress,
    approval
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.setSignatureValidatorApproval.estimateGasAsync.bind(
                    self,
                    validatorAddress,
                    approval
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            validatorAddress: string,
            approval: boolean,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('setSignatureValidatorApproval(address,bool)').inputs;
            [validatorAddress,
    approval
    ] = BaseContract._formatABIDataItemList(inputAbi, [validatorAddress,
    approval
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('setSignatureValidatorApproval(address,bool)').functions.setSignatureValidatorApproval.encode([validatorAddress,
    approval
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
            validatorAddress: string,
            approval: boolean,
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('setSignatureValidatorApproval(address,bool)').inputs;
            [validatorAddress,
    approval
    ] = BaseContract._formatABIDataItemList(inputAbi, [validatorAddress,
    approval
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('setSignatureValidatorApproval(address,bool)').functions.setSignatureValidatorApproval.encode([validatorAddress,
    approval
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            validatorAddress: string,
            approval: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'setSignatureValidatorApproval(address,bool)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [validatorAddress,
        approval
        ] = BaseContract._formatABIDataItemList(inputAbi, [validatorAddress,
        approval
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [validatorAddress,
        approval
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.setSignatureValidatorApproval;
            const encodedData = ethersFunction.encode([validatorAddress,
        approval
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
            const outputAbi = (_.find(self.abi, {name: 'setSignatureValidatorApproval'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public allowedValidators = {
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'allowedValidators(address,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0,
        index_1
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0,
        index_1
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0,
        index_1
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.allowedValidators;
            const encodedData = ethersFunction.encode([index_0,
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'allowedValidators'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public marketSellOrders = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('marketSellOrders(tuple[],uint256,bytes[])').inputs;
            [orders,
    takerAssetFillAmount,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmount,
    signatures
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
    takerAssetFillAmount,
    signatures
    ]);
            const encodedData = self._lookupEthersInterface('marketSellOrders(tuple[],uint256,bytes[])').functions.marketSellOrders.encode([orders,
    takerAssetFillAmount,
    signatures
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.marketSellOrders.estimateGasAsync.bind(
                    self,
                    orders,
                    takerAssetFillAmount,
                    signatures
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('marketSellOrders(tuple[],uint256,bytes[])').inputs;
            [orders,
    takerAssetFillAmount,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmount,
    signatures
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('marketSellOrders(tuple[],uint256,bytes[])').functions.marketSellOrders.encode([orders,
    takerAssetFillAmount,
    signatures
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
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('marketSellOrders(tuple[],uint256,bytes[])').inputs;
            [orders,
    takerAssetFillAmount,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmount,
    signatures
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('marketSellOrders(tuple[],uint256,bytes[])').functions.marketSellOrders.encode([orders,
    takerAssetFillAmount,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'marketSellOrders(tuple[],uint256,bytes[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders,
        takerAssetFillAmount,
        signatures
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        takerAssetFillAmount,
        signatures
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
        takerAssetFillAmount,
        signatures
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.marketSellOrders;
            const encodedData = ethersFunction.encode([orders,
        takerAssetFillAmount,
        signatures
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
            const outputAbi = (_.find(self.abi, {name: 'marketSellOrders'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public getOrdersInfo = {
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<Array<{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}>
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'getOrdersInfo(tuple[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getOrdersInfo;
            const encodedData = ethersFunction.encode([orders
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
            const outputAbi = (_.find(self.abi, {name: 'getOrdersInfo'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public preSigned = {
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'preSigned(bytes32,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0,
        index_1
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0,
        index_1
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0,
        index_1
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.preSigned;
            const encodedData = ethersFunction.encode([index_0,
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'preSigned'}) as MethodAbi).outputs;
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
            const self = this as any as ExchangeContract;
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
    public isValidSignature = {
        async callAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'isValidSignature(bytes32,address,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [hash,
        signerAddress,
        signature
        ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
        signerAddress,
        signature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [hash,
        signerAddress,
        signature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.isValidSignature;
            const encodedData = ethersFunction.encode([hash,
        signerAddress,
        signature
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
            const outputAbi = (_.find(self.abi, {name: 'isValidSignature'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public marketBuyOrdersNoThrow = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('marketBuyOrdersNoThrow(tuple[],uint256,bytes[])').inputs;
            [orders,
    makerAssetFillAmount,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    makerAssetFillAmount,
    signatures
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
    makerAssetFillAmount,
    signatures
    ]);
            const encodedData = self._lookupEthersInterface('marketBuyOrdersNoThrow(tuple[],uint256,bytes[])').functions.marketBuyOrdersNoThrow.encode([orders,
    makerAssetFillAmount,
    signatures
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.marketBuyOrdersNoThrow.estimateGasAsync.bind(
                    self,
                    orders,
                    makerAssetFillAmount,
                    signatures
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('marketBuyOrdersNoThrow(tuple[],uint256,bytes[])').inputs;
            [orders,
    makerAssetFillAmount,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    makerAssetFillAmount,
    signatures
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('marketBuyOrdersNoThrow(tuple[],uint256,bytes[])').functions.marketBuyOrdersNoThrow.encode([orders,
    makerAssetFillAmount,
    signatures
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
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('marketBuyOrdersNoThrow(tuple[],uint256,bytes[])').inputs;
            [orders,
    makerAssetFillAmount,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    makerAssetFillAmount,
    signatures
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('marketBuyOrdersNoThrow(tuple[],uint256,bytes[])').functions.marketBuyOrdersNoThrow.encode([orders,
    makerAssetFillAmount,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'marketBuyOrdersNoThrow(tuple[],uint256,bytes[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders,
        makerAssetFillAmount,
        signatures
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        makerAssetFillAmount,
        signatures
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
        makerAssetFillAmount,
        signatures
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.marketBuyOrdersNoThrow;
            const encodedData = ethersFunction.encode([orders,
        makerAssetFillAmount,
        signatures
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
            const outputAbi = (_.find(self.abi, {name: 'marketBuyOrdersNoThrow'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public fillOrder = {
        async sendTransactionAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    signature
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order,
    takerAssetFillAmount,
    signature
    ]);
            const encodedData = self._lookupEthersInterface('fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').functions.fillOrder.encode([order,
    takerAssetFillAmount,
    signature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.fillOrder.estimateGasAsync.bind(
                    self,
                    order,
                    takerAssetFillAmount,
                    signature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    signature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').functions.fillOrder.encode([order,
    takerAssetFillAmount,
    signature
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
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    signature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)').functions.fillOrder.encode([order,
    takerAssetFillAmount,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [order,
        takerAssetFillAmount,
        signature
        ] = BaseContract._formatABIDataItemList(inputAbi, [order,
        takerAssetFillAmount,
        signature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order,
        takerAssetFillAmount,
        signature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.fillOrder;
            const encodedData = ethersFunction.encode([order,
        takerAssetFillAmount,
        signature
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
            const outputAbi = (_.find(self.abi, {name: 'fillOrder'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public executeTransaction = {
        async sendTransactionAsync(
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('executeTransaction(uint256,address,bytes,bytes)').inputs;
            [salt,
    signerAddress,
    data,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [salt,
    signerAddress,
    data,
    signature
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [salt,
    signerAddress,
    data,
    signature
    ]);
            const encodedData = self._lookupEthersInterface('executeTransaction(uint256,address,bytes,bytes)').functions.executeTransaction.encode([salt,
    signerAddress,
    data,
    signature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.executeTransaction.estimateGasAsync.bind(
                    self,
                    salt,
                    signerAddress,
                    data,
                    signature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('executeTransaction(uint256,address,bytes,bytes)').inputs;
            [salt,
    signerAddress,
    data,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [salt,
    signerAddress,
    data,
    signature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('executeTransaction(uint256,address,bytes,bytes)').functions.executeTransaction.encode([salt,
    signerAddress,
    data,
    signature
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
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('executeTransaction(uint256,address,bytes,bytes)').inputs;
            [salt,
    signerAddress,
    data,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [salt,
    signerAddress,
    data,
    signature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('executeTransaction(uint256,address,bytes,bytes)').functions.executeTransaction.encode([salt,
    signerAddress,
    data,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'executeTransaction(uint256,address,bytes,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [salt,
        signerAddress,
        data,
        signature
        ] = BaseContract._formatABIDataItemList(inputAbi, [salt,
        signerAddress,
        data,
        signature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [salt,
        signerAddress,
        data,
        signature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.executeTransaction;
            const encodedData = ethersFunction.encode([salt,
        signerAddress,
        data,
        signature
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
            const outputAbi = (_.find(self.abi, {name: 'executeTransaction'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public registerAssetProxy = {
        async sendTransactionAsync(
            assetProxy: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('registerAssetProxy(address)').inputs;
            [assetProxy
    ] = BaseContract._formatABIDataItemList(inputAbi, [assetProxy
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [assetProxy
    ]);
            const encodedData = self._lookupEthersInterface('registerAssetProxy(address)').functions.registerAssetProxy.encode([assetProxy
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.registerAssetProxy.estimateGasAsync.bind(
                    self,
                    assetProxy
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            assetProxy: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('registerAssetProxy(address)').inputs;
            [assetProxy
    ] = BaseContract._formatABIDataItemList(inputAbi, [assetProxy
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('registerAssetProxy(address)').functions.registerAssetProxy.encode([assetProxy
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
            assetProxy: string,
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('registerAssetProxy(address)').inputs;
            [assetProxy
    ] = BaseContract._formatABIDataItemList(inputAbi, [assetProxy
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('registerAssetProxy(address)').functions.registerAssetProxy.encode([assetProxy
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            assetProxy: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'registerAssetProxy(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [assetProxy
        ] = BaseContract._formatABIDataItemList(inputAbi, [assetProxy
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [assetProxy
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.registerAssetProxy;
            const encodedData = ethersFunction.encode([assetProxy
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
            const outputAbi = (_.find(self.abi, {name: 'registerAssetProxy'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public getOrderInfo = {
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'getOrderInfo({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [order
        ] = BaseContract._formatABIDataItemList(inputAbi, [order
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getOrderInfo;
            const encodedData = ethersFunction.encode([order
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
            const outputAbi = (_.find(self.abi, {name: 'getOrderInfo'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public cancelOrder = {
        async sendTransactionAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('cancelOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})').inputs;
            [order
    ] = BaseContract._formatABIDataItemList(inputAbi, [order
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order
    ]);
            const encodedData = self._lookupEthersInterface('cancelOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})').functions.cancelOrder.encode([order
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.cancelOrder.estimateGasAsync.bind(
                    self,
                    order
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('cancelOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})').inputs;
            [order
    ] = BaseContract._formatABIDataItemList(inputAbi, [order
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('cancelOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})').functions.cancelOrder.encode([order
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
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('cancelOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})').inputs;
            [order
    ] = BaseContract._formatABIDataItemList(inputAbi, [order
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('cancelOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})').functions.cancelOrder.encode([order
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'cancelOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [order
        ] = BaseContract._formatABIDataItemList(inputAbi, [order
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.cancelOrder;
            const encodedData = ethersFunction.encode([order
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
            const outputAbi = (_.find(self.abi, {name: 'cancelOrder'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public orderEpoch = {
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'orderEpoch(address,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0,
        index_1
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0,
        index_1
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0,
        index_1
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.orderEpoch;
            const encodedData = ethersFunction.encode([index_0,
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
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'orderEpoch'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public ZRX_ASSET_DATA = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'ZRX_ASSET_DATA()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.ZRX_ASSET_DATA;
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
            const outputAbi = (_.find(self.abi, {name: 'ZRX_ASSET_DATA'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public marketSellOrdersNoThrow = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('marketSellOrdersNoThrow(tuple[],uint256,bytes[])').inputs;
            [orders,
    takerAssetFillAmount,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmount,
    signatures
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
    takerAssetFillAmount,
    signatures
    ]);
            const encodedData = self._lookupEthersInterface('marketSellOrdersNoThrow(tuple[],uint256,bytes[])').functions.marketSellOrdersNoThrow.encode([orders,
    takerAssetFillAmount,
    signatures
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.marketSellOrdersNoThrow.estimateGasAsync.bind(
                    self,
                    orders,
                    takerAssetFillAmount,
                    signatures
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('marketSellOrdersNoThrow(tuple[],uint256,bytes[])').inputs;
            [orders,
    takerAssetFillAmount,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmount,
    signatures
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('marketSellOrdersNoThrow(tuple[],uint256,bytes[])').functions.marketSellOrdersNoThrow.encode([orders,
    takerAssetFillAmount,
    signatures
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
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('marketSellOrdersNoThrow(tuple[],uint256,bytes[])').inputs;
            [orders,
    takerAssetFillAmount,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerAssetFillAmount,
    signatures
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('marketSellOrdersNoThrow(tuple[],uint256,bytes[])').functions.marketSellOrdersNoThrow.encode([orders,
    takerAssetFillAmount,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'marketSellOrdersNoThrow(tuple[],uint256,bytes[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders,
        takerAssetFillAmount,
        signatures
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        takerAssetFillAmount,
        signatures
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
        takerAssetFillAmount,
        signatures
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.marketSellOrdersNoThrow;
            const encodedData = ethersFunction.encode([orders,
        takerAssetFillAmount,
        signatures
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
            const outputAbi = (_.find(self.abi, {name: 'marketSellOrdersNoThrow'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public EIP712_DOMAIN_HASH = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'EIP712_DOMAIN_HASH()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.EIP712_DOMAIN_HASH;
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
            const outputAbi = (_.find(self.abi, {name: 'EIP712_DOMAIN_HASH'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public marketBuyOrders = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('marketBuyOrders(tuple[],uint256,bytes[])').inputs;
            [orders,
    makerAssetFillAmount,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    makerAssetFillAmount,
    signatures
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
    makerAssetFillAmount,
    signatures
    ]);
            const encodedData = self._lookupEthersInterface('marketBuyOrders(tuple[],uint256,bytes[])').functions.marketBuyOrders.encode([orders,
    makerAssetFillAmount,
    signatures
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.marketBuyOrders.estimateGasAsync.bind(
                    self,
                    orders,
                    makerAssetFillAmount,
                    signatures
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('marketBuyOrders(tuple[],uint256,bytes[])').inputs;
            [orders,
    makerAssetFillAmount,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    makerAssetFillAmount,
    signatures
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('marketBuyOrders(tuple[],uint256,bytes[])').functions.marketBuyOrders.encode([orders,
    makerAssetFillAmount,
    signatures
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
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const inputAbi = self._lookupAbi('marketBuyOrders(tuple[],uint256,bytes[])').inputs;
            [orders,
    makerAssetFillAmount,
    signatures
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    makerAssetFillAmount,
    signatures
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('marketBuyOrders(tuple[],uint256,bytes[])').functions.marketBuyOrders.encode([orders,
    makerAssetFillAmount,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'marketBuyOrders(tuple[],uint256,bytes[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders,
        makerAssetFillAmount,
        signatures
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        makerAssetFillAmount,
        signatures
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
        makerAssetFillAmount,
        signatures
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.marketBuyOrders;
            const encodedData = ethersFunction.encode([orders,
        makerAssetFillAmount,
        signatures
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
            const outputAbi = (_.find(self.abi, {name: 'marketBuyOrders'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public currentContextAddress = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'currentContextAddress()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.currentContextAddress;
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
            const outputAbi = (_.find(self.abi, {name: 'currentContextAddress'}) as MethodAbi).outputs;
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
            const self = this as any as ExchangeContract;
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
            const self = this as any as ExchangeContract;
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
            const self = this as any as ExchangeContract;
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
            const self = this as any as ExchangeContract;
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
    public VERSION = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ExchangeContract;
            const functionSignature = 'VERSION()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.VERSION;
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
            const outputAbi = (_.find(self.abi, {name: 'VERSION'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
    ): Promise<ExchangeContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return ExchangeContract.deployAsync(bytecode, abi, provider, txDefaults, );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
    ): Promise<ExchangeContract> {
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
        logUtils.log(`Exchange successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ExchangeContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('Exchange', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
