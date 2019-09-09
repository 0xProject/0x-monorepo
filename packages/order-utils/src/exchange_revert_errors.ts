import { OrderStatus } from '@0x/types';
import { BigNumber, RevertError } from '@0x/utils';
import * as _ from 'lodash';

// tslint:disable:max-classes-per-file

export enum BatchMatchOrdersErrorCodes {
    ZeroLeftOrders,
    ZeroRightOrders,
    InvalidLengthLeftSignatures,
    InvalidLengthRightSignatures,
}

export enum ExchangeContextErrorCodes {
    InvalidMaker,
    InvalidTaker,
    InvalidSender,
}

export enum FillErrorCode {
    InvalidTakerAmount,
    TakerOverpay,
    Overfill,
    InvalidFillPrice,
}

export enum SignatureErrorCode {
    BadOrderSignature,
    BadTransactionSignature,
    InvalidLength,
    Unsupported,
    Illegal,
    InappropriateSignatureType,
    InvalidSigner,
}

export enum AssetProxyDispatchErrorCode {
    InvalidAssetDataLength,
    UnknownAssetProxy,
}

export enum TransactionErrorCode {
    AlreadyExecuted,
    Expired,
}

export enum IncompleteFillErrorCode {
    IncompleteMarketBuyOrders,
    IncompleteMarketSellOrders,
    IncompleteFillOrder,
}

export class BatchMatchOrdersError extends RevertError {
    constructor(error?: BatchMatchOrdersErrorCodes) {
        super('BatchMatchOrdersError', 'BatchMatchOrdersError(uint8 error)', { error });
    }
}

export class SignatureError extends RevertError {
    constructor(error?: SignatureErrorCode, hash?: string, signer?: string, signature?: string) {
        super('SignatureError', 'SignatureError(uint8 error, bytes32 hash, address signer, bytes signature)', {
            error,
            hash,
            signer,
            signature,
        });
    }
}

export class SignatureValidatorNotApprovedError extends RevertError {
    constructor(signer?: string, validator?: string) {
        super(
            'SignatureValidatorNotApprovedError',
            'SignatureValidatorNotApprovedError(address signer, address validator)',
            {
                signer,
                validator,
            },
        );
    }
}

export class SignatureWalletError extends RevertError {
    constructor(hash?: string, wallet?: string, signature?: string, errorData?: string) {
        super(
            'SignatureWalletError',
            'SignatureWalletError(bytes32 hash, address wallet, bytes signature, bytes errorData)',
            {
                hash,
                wallet,
                signature,
                errorData,
            },
        );
    }
}

export class EIP1271SignatureError extends RevertError {
    constructor(verifyingContractAddress?: string, data?: string, signature?: string, errorData?: string) {
        super(
            'EIP1271SignatureError',
            'EIP1271SignatureError(address verifyingContractAddress, bytes data, bytes signature, bytes errorData)',
            {
                verifyingContractAddress,
                data,
                signature,
                errorData,
            },
        );
    }
}

export class OrderStatusError extends RevertError {
    constructor(orderHash?: string, status?: OrderStatus) {
        super('OrderStatusError', 'OrderStatusError(bytes32 orderHash, uint8 status)', { orderHash, status });
    }
}

export class FillError extends RevertError {
    constructor(error?: FillErrorCode, orderHash?: string) {
        super('FillError', 'FillError(uint8 error, bytes32 orderHash)', { error, orderHash });
    }
}

export class OrderEpochError extends RevertError {
    constructor(maker?: string, sender?: string, currentEpoch?: BigNumber) {
        super('OrderEpochError', 'OrderEpochError(address maker, address sender, uint256 currentEpoch)', {
            maker,
            sender,
            currentEpoch,
        });
    }
}

export class AssetProxyExistsError extends RevertError {
    constructor(assetProxyId?: string, assetProxy?: string) {
        super('AssetProxyExistsError', 'AssetProxyExistsError(bytes4 assetProxyId, address assetProxy)', {
            assetProxyId,
            assetProxy,
        });
    }
}

export class AssetProxyDispatchError extends RevertError {
    constructor(error?: AssetProxyDispatchErrorCode, orderHash?: string, assetData?: string) {
        super('AssetProxyDispatchError', 'AssetProxyDispatchError(uint8 error, bytes32 orderHash, bytes assetData)', {
            error,
            orderHash,
            assetData,
        });
    }
}

export class AssetProxyTransferError extends RevertError {
    constructor(orderHash?: string, assetData?: string, errorData?: string) {
        super(
            'AssetProxyTransferError',
            'AssetProxyTransferError(bytes32 orderHash, bytes assetData, bytes errorData)',
            {
                orderHash,
                assetData,
                errorData,
            },
        );
    }
}

export class NegativeSpreadError extends RevertError {
    constructor(leftOrderHash?: string, rightOrderHash?: string) {
        super('NegativeSpreadError', 'NegativeSpreadError(bytes32 leftOrderHash, bytes32 rightOrderHash)', {
            leftOrderHash,
            rightOrderHash,
        });
    }
}

export class TransactionError extends RevertError {
    constructor(error?: TransactionErrorCode, transactionHash?: string) {
        super('TransactionError', 'TransactionError(uint8 error, bytes32 transactionHash)', { error, transactionHash });
    }
}

export class TransactionExecutionError extends RevertError {
    constructor(transactionHash?: string, errorData?: string) {
        super('TransactionExecutionError', 'TransactionExecutionError(bytes32 transactionHash, bytes errorData)', {
            transactionHash,
            errorData,
        });
    }
}

export class TransactionGasPriceError extends RevertError {
    constructor(transactionHash?: string, actualGasPrice?: BigNumber, requiredGasPrice?: BigNumber) {
        super(
            'TransactionGasPriceError',
            'TransactionGasPriceError(bytes32 transactionHash, uint256 actualGasPrice, uint256 requiredGasPrice)',
            {
                transactionHash,
                actualGasPrice,
                requiredGasPrice,
            },
        );
    }
}

export class TransactionInvalidContextError extends RevertError {
    constructor(transactionHash?: string, currentContextAddress?: string) {
        super(
            'TransactionInvalidContextError',
            'TransactionInvalidContextError(bytes32 transactionHash, address currentContextAddress)',
            {
                transactionHash,
                currentContextAddress,
            },
        );
    }
}

export class IncompleteFillError extends RevertError {
    constructor(
        error?: IncompleteFillErrorCode,
        expectedAssetFillAmount?: BigNumber,
        actualAssetFillAmount?: BigNumber,
    ) {
        super(
            'IncompleteFillError',
            'IncompleteFillError(uint8 error, uint256 expectedAssetFillAmount, uint256 actualAssetFillAmount)',
            {
                error,
                expectedAssetFillAmount,
                actualAssetFillAmount,
            },
        );
    }
}

export class ExchangeInvalidContextError extends RevertError {
    constructor(error?: ExchangeContextErrorCodes, orderHash?: string, contextAddress?: string) {
        super(
            'ExchangeInvalidContextError',
            'ExchangeInvalidContextError(uint8 error, bytes32 orderHash, address contextAddress)',
            { error, orderHash, contextAddress },
        );
    }
}
export class PayProtocolFeeError extends RevertError {
    constructor(
        orderHash?: string,
        protocolFee?: BigNumber,
        makerAddress?: string,
        takerAddress?: string,
        errorData?: string,
    ) {
        super(
            'PayProtocolFeeError',
            'PayProtocolFeeError(bytes32 orderHash, uint256 protocolFee, address makerAddress, address takerAddress, bytes errorData)',
            { orderHash, protocolFee, makerAddress, takerAddress, errorData },
        );
    }
}

const types = [
    AssetProxyExistsError,
    AssetProxyDispatchError,
    AssetProxyTransferError,
    BatchMatchOrdersError,
    EIP1271SignatureError,
    ExchangeInvalidContextError,
    FillError,
    IncompleteFillError,
    NegativeSpreadError,
    OrderEpochError,
    OrderStatusError,
    PayProtocolFeeError,
    SignatureError,
    SignatureValidatorNotApprovedError,
    SignatureWalletError,
    TransactionError,
    TransactionExecutionError,
    TransactionGasPriceError,
    TransactionInvalidContextError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
