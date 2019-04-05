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
        functionSignature: 'filled(bytes32)',
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.filled.functionSignature, [index_0
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.filled.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.batchFillOrders.functionSignature, [orders,
    takerAssetFillAmounts,
    signatures
    ]);
            const gasEstimateFunction = self.batchFillOrders.estimateGasAsync.bind(self, orders,
    takerAssetFillAmounts,
    signatures
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.batchFillOrders.functionSignature, [orders,
    takerAssetFillAmounts,
    signatures
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.batchFillOrders.functionSignature, [orders,
    takerAssetFillAmounts,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.batchFillOrders.functionSignature, [orders,
        takerAssetFillAmounts,
        signatures
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.batchFillOrders.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public cancelled = {
        functionSignature: 'cancelled(bytes32)',
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.cancelled.functionSignature, [index_0
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.cancelled.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.preSign.functionSignature, [hash,
    signerAddress,
    signature
    ]);
            const gasEstimateFunction = self.preSign.estimateGasAsync.bind(self, hash,
    signerAddress,
    signature
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.preSign.functionSignature, [hash,
    signerAddress,
    signature
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            hash: string,
            signerAddress: string,
            signature: string,
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.preSign.functionSignature, [hash,
    signerAddress,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'preSign(bytes32,address,bytes)',
        async callAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.preSign.functionSignature, [hash,
        signerAddress,
        signature
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.preSign.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.matchOrders.functionSignature, [leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    ]);
            const gasEstimateFunction = self.matchOrders.estimateGasAsync.bind(self, leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
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
            const encodedData = self._strictEncodeArguments(self.matchOrders.functionSignature, [leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            leftOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            rightOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            leftSignature: string,
            rightSignature: string,
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.matchOrders.functionSignature, [leftOrder,
    rightOrder,
    leftSignature,
    rightSignature
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)',
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
            const encodedData = self._strictEncodeArguments(self.matchOrders.functionSignature, [leftOrder,
        rightOrder,
        leftSignature,
        rightSignature
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.matchOrders.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{left: {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber};right: {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber};leftMakerAssetSpreadAmount: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.fillOrderNoThrow.functionSignature, [order,
    takerAssetFillAmount,
    signature
    ]);
            const gasEstimateFunction = self.fillOrderNoThrow.estimateGasAsync.bind(self, order,
    takerAssetFillAmount,
    signature
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.fillOrderNoThrow.functionSignature, [order,
    takerAssetFillAmount,
    signature
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.fillOrderNoThrow.functionSignature, [order,
    takerAssetFillAmount,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'fillOrderNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.fillOrderNoThrow.functionSignature, [order,
        takerAssetFillAmount,
        signature
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.fillOrderNoThrow.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public assetProxies = {
        functionSignature: 'assetProxies(bytes4)',
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.assetProxies.functionSignature, [index_0
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.assetProxies.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public batchCancelOrders = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.batchCancelOrders.functionSignature, [orders
    ]);
            const gasEstimateFunction = self.batchCancelOrders.estimateGasAsync.bind(self, orders
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.batchCancelOrders.functionSignature, [orders
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.batchCancelOrders.functionSignature, [orders
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.batchCancelOrders.functionSignature, [orders
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.batchCancelOrders.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.batchFillOrKillOrders.functionSignature, [orders,
    takerAssetFillAmounts,
    signatures
    ]);
            const gasEstimateFunction = self.batchFillOrKillOrders.estimateGasAsync.bind(self, orders,
    takerAssetFillAmounts,
    signatures
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.batchFillOrKillOrders.functionSignature, [orders,
    takerAssetFillAmounts,
    signatures
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.batchFillOrKillOrders.functionSignature, [orders,
    takerAssetFillAmounts,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.batchFillOrKillOrders.functionSignature, [orders,
        takerAssetFillAmounts,
        signatures
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.batchFillOrKillOrders.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public cancelOrdersUpTo = {
        async sendTransactionAsync(
            targetOrderEpoch: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.cancelOrdersUpTo.functionSignature, [targetOrderEpoch
    ]);
            const gasEstimateFunction = self.cancelOrdersUpTo.estimateGasAsync.bind(self, targetOrderEpoch
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            targetOrderEpoch: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.cancelOrdersUpTo.functionSignature, [targetOrderEpoch
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            targetOrderEpoch: BigNumber,
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.cancelOrdersUpTo.functionSignature, [targetOrderEpoch
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'cancelOrdersUpTo(uint256)',
        async callAsync(
            targetOrderEpoch: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.cancelOrdersUpTo.functionSignature, [targetOrderEpoch
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.cancelOrdersUpTo.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.batchFillOrdersNoThrow.functionSignature, [orders,
    takerAssetFillAmounts,
    signatures
    ]);
            const gasEstimateFunction = self.batchFillOrdersNoThrow.estimateGasAsync.bind(self, orders,
    takerAssetFillAmounts,
    signatures
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.batchFillOrdersNoThrow.functionSignature, [orders,
    takerAssetFillAmounts,
    signatures
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.batchFillOrdersNoThrow.functionSignature, [orders,
    takerAssetFillAmounts,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])',
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmounts: BigNumber[],
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.batchFillOrdersNoThrow.functionSignature, [orders,
        takerAssetFillAmounts,
        signatures
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.batchFillOrdersNoThrow.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getAssetProxy = {
        functionSignature: 'getAssetProxy(bytes4)',
        async callAsync(
            assetProxyId: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.getAssetProxy.functionSignature, [assetProxyId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getAssetProxy.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public transactions = {
        functionSignature: 'transactions(bytes32)',
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.transactions.functionSignature, [index_0
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.transactions.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.fillOrKillOrder.functionSignature, [order,
    takerAssetFillAmount,
    signature
    ]);
            const gasEstimateFunction = self.fillOrKillOrder.estimateGasAsync.bind(self, order,
    takerAssetFillAmount,
    signature
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.fillOrKillOrder.functionSignature, [order,
    takerAssetFillAmount,
    signature
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.fillOrKillOrder.functionSignature, [order,
    takerAssetFillAmount,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.fillOrKillOrder.functionSignature, [order,
        takerAssetFillAmount,
        signature
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.fillOrKillOrder.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public setSignatureValidatorApproval = {
        async sendTransactionAsync(
            validatorAddress: string,
            approval: boolean,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.setSignatureValidatorApproval.functionSignature, [validatorAddress,
    approval
    ]);
            const gasEstimateFunction = self.setSignatureValidatorApproval.estimateGasAsync.bind(self, validatorAddress,
    approval
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            validatorAddress: string,
            approval: boolean,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.setSignatureValidatorApproval.functionSignature, [validatorAddress,
    approval
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            validatorAddress: string,
            approval: boolean,
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.setSignatureValidatorApproval.functionSignature, [validatorAddress,
    approval
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'setSignatureValidatorApproval(address,bool)',
        async callAsync(
            validatorAddress: string,
            approval: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.setSignatureValidatorApproval.functionSignature, [validatorAddress,
        approval
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.setSignatureValidatorApproval.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public allowedValidators = {
        functionSignature: 'allowedValidators(address,address)',
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.allowedValidators.functionSignature, [index_0,
        index_1
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.allowedValidators.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.marketSellOrders.functionSignature, [orders,
    takerAssetFillAmount,
    signatures
    ]);
            const gasEstimateFunction = self.marketSellOrders.estimateGasAsync.bind(self, orders,
    takerAssetFillAmount,
    signatures
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.marketSellOrders.functionSignature, [orders,
    takerAssetFillAmount,
    signatures
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.marketSellOrders.functionSignature, [orders,
    takerAssetFillAmount,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'marketSellOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.marketSellOrders.functionSignature, [orders,
        takerAssetFillAmount,
        signatures
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.marketSellOrders.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getOrdersInfo = {
        functionSignature: 'getOrdersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])',
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<Array<{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}>
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.getOrdersInfo.functionSignature, [orders
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getOrdersInfo.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<Array<{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}>
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public preSigned = {
        functionSignature: 'preSigned(bytes32,address)',
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.preSigned.functionSignature, [index_0,
        index_1
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.preSigned.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
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
            const self = this as any as ExchangeContract;
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
    public isValidSignature = {
        functionSignature: 'isValidSignature(bytes32,address,bytes)',
        async callAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.isValidSignature.functionSignature, [hash,
        signerAddress,
        signature
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.isValidSignature.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.marketBuyOrdersNoThrow.functionSignature, [orders,
    makerAssetFillAmount,
    signatures
    ]);
            const gasEstimateFunction = self.marketBuyOrdersNoThrow.estimateGasAsync.bind(self, orders,
    makerAssetFillAmount,
    signatures
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.marketBuyOrdersNoThrow.functionSignature, [orders,
    makerAssetFillAmount,
    signatures
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.marketBuyOrdersNoThrow.functionSignature, [orders,
    makerAssetFillAmount,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.marketBuyOrdersNoThrow.functionSignature, [orders,
        makerAssetFillAmount,
        signatures
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.marketBuyOrdersNoThrow.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.fillOrder.functionSignature, [order,
    takerAssetFillAmount,
    signature
    ]);
            const gasEstimateFunction = self.fillOrder.estimateGasAsync.bind(self, order,
    takerAssetFillAmount,
    signature
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.fillOrder.functionSignature, [order,
    takerAssetFillAmount,
    signature
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.fillOrder.functionSignature, [order,
    takerAssetFillAmount,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)',
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.fillOrder.functionSignature, [order,
        takerAssetFillAmount,
        signature
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.fillOrder.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.executeTransaction.functionSignature, [salt,
    signerAddress,
    data,
    signature
    ]);
            const gasEstimateFunction = self.executeTransaction.estimateGasAsync.bind(self, salt,
    signerAddress,
    data,
    signature
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
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
            const encodedData = self._strictEncodeArguments(self.executeTransaction.functionSignature, [salt,
    signerAddress,
    data,
    signature
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.executeTransaction.functionSignature, [salt,
    signerAddress,
    data,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'executeTransaction(uint256,address,bytes,bytes)',
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
            const encodedData = self._strictEncodeArguments(self.executeTransaction.functionSignature, [salt,
        signerAddress,
        data,
        signature
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.executeTransaction.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public registerAssetProxy = {
        async sendTransactionAsync(
            assetProxy: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.registerAssetProxy.functionSignature, [assetProxy
    ]);
            const gasEstimateFunction = self.registerAssetProxy.estimateGasAsync.bind(self, assetProxy
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            assetProxy: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.registerAssetProxy.functionSignature, [assetProxy
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            assetProxy: string,
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.registerAssetProxy.functionSignature, [assetProxy
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'registerAssetProxy(address)',
        async callAsync(
            assetProxy: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.registerAssetProxy.functionSignature, [assetProxy
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.registerAssetProxy.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getOrderInfo = {
        functionSignature: 'getOrderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.getOrderInfo.functionSignature, [order
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getOrderInfo.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public cancelOrder = {
        async sendTransactionAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.cancelOrder.functionSignature, [order
    ]);
            const gasEstimateFunction = self.cancelOrder.estimateGasAsync.bind(self, order
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.cancelOrder.functionSignature, [order
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.cancelOrder.functionSignature, [order
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))',
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.cancelOrder.functionSignature, [order
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.cancelOrder.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public orderEpoch = {
        functionSignature: 'orderEpoch(address,address)',
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.orderEpoch.functionSignature, [index_0,
        index_1
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.orderEpoch.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public ZRX_ASSET_DATA = {
        functionSignature: 'ZRX_ASSET_DATA()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.ZRX_ASSET_DATA.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.ZRX_ASSET_DATA.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.marketSellOrdersNoThrow.functionSignature, [orders,
    takerAssetFillAmount,
    signatures
    ]);
            const gasEstimateFunction = self.marketSellOrdersNoThrow.estimateGasAsync.bind(self, orders,
    takerAssetFillAmount,
    signatures
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.marketSellOrdersNoThrow.functionSignature, [orders,
    takerAssetFillAmount,
    signatures
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.marketSellOrdersNoThrow.functionSignature, [orders,
    takerAssetFillAmount,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAssetFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.marketSellOrdersNoThrow.functionSignature, [orders,
        takerAssetFillAmount,
        signatures
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.marketSellOrdersNoThrow.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public EIP712_DOMAIN_HASH = {
        functionSignature: 'EIP712_DOMAIN_HASH()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.EIP712_DOMAIN_HASH.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.EIP712_DOMAIN_HASH.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            const encodedData = self._strictEncodeArguments(self.marketBuyOrders.functionSignature, [orders,
    makerAssetFillAmount,
    signatures
    ]);
            const gasEstimateFunction = self.marketBuyOrders.estimateGasAsync.bind(self, orders,
    makerAssetFillAmount,
    signatures
    );
            const txHash = await self._sendTransactionAsync(self.address, encodedData, txData, gasEstimateFunction);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.marketBuyOrders.functionSignature, [orders,
    makerAssetFillAmount,
    signatures
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
        ): string {
            const self = this as any as ExchangeContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(self.marketBuyOrders.functionSignature, [orders,
    makerAssetFillAmount,
    signatures
    ]);
            return abiEncodedTransactionData;
        },
        functionSignature: 'marketBuyOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])',
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.marketBuyOrders.functionSignature, [orders,
        makerAssetFillAmount,
        signatures
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.marketBuyOrders.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public currentContextAddress = {
        functionSignature: 'currentContextAddress()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.currentContextAddress.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.currentContextAddress.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
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
            const self = this as any as ExchangeContract;
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
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.transferOwnership.functionSignature, [newOwner
    ]);
            const gas = await self._estimateGasAsync(self.address, encodedData, txData);
            return gas;
        },
        getABIEncodedTransactionData(
            newOwner: string,
        ): string {
            const self = this as any as ExchangeContract;
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
            const self = this as any as ExchangeContract;
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
    public VERSION = {
        functionSignature: 'VERSION()',
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ExchangeContract;
            const encodedData = self._strictEncodeArguments(self.VERSION.functionSignature, []);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.VERSION.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
            _zrxAssetData: string,
    ): Promise<ExchangeContract> {
        if (isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return ExchangeContract.deployAsync(bytecode, abi, provider, txDefaults, _zrxAssetData
);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
            _zrxAssetData: string,
    ): Promise<ExchangeContract> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_zrxAssetData
] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_zrxAssetData
],
            BaseContract._bigNumberToString,
        );
        return {} as any;
    }
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('Exchange', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
