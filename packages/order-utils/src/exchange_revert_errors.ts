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

export enum FillErrorCode {
    InvalidTakerAmount,
    TakerOverpay,
    Overfill,
    InvalidFillPrice,
}

export enum SignatureErrorCode {
    BadSignature,
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
    NoReentrancy,
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

export class SignatureValidatorError extends RevertError {
    constructor(hash?: string, signer?: string, validator?: string, signature?: string, errorData?: string) {
        super(
            'SignatureValidatorError',
            'SignatureValidatorError(bytes32 hash, address signer, address validator, bytes signature, bytes errorData)',
            {
                hash,
                signer,
                validator,
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

export class InvalidSenderError extends RevertError {
    constructor(orderHash?: string, sender?: string) {
        super('InvalidSenderError', 'InvalidSenderError(bytes32 orderHash, address sender)', { orderHash, sender });
    }
}

export class InvalidTakerError extends RevertError {
    constructor(orderHash?: string, taker?: string) {
        super('InvalidTakerError', 'InvalidTakerError(bytes32 orderHash, address taker)', { orderHash, taker });
    }
}

export class InvalidMakerError extends RevertError {
    constructor(orderHash?: string, maker?: string) {
        super('InvalidMakerError', 'InvalidMakerError(bytes32 orderHash, address maker)', { orderHash, maker });
    }
}

export class FillError extends RevertError {
    constructor(error?: FillErrorCode, orderHash?: string) {
        super('FillError', 'FillError(uint8 error, bytes32 orderHash)', { error, orderHash });
    }
}

export class OrderEpochError extends RevertError {
    constructor(maker?: string, sender?: string, currentEpoch?: BigNumber | number | string) {
        super('OrderEpochError', 'OrderEpochError(address maker, address sender, uint256 currentEpoch)', {
            maker,
            sender,
            currentEpoch,
        });
    }
}

export class AssetProxyExistsError extends RevertError {
    constructor(proxy?: string) {
        super('AssetProxyExistsError', 'AssetProxyExistsError(address proxy)', { proxy });
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

export class TransactionSignatureError extends RevertError {
    constructor(transactionHash?: string, signer?: string, signature?: string) {
        super(
            'TransactionSignatureError',
            'TransactionSignatureError(bytes32 transactionHash, address signer, bytes signature)',
            {
                transactionHash,
                signer,
                signature,
            },
        );
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

const types = [
    BatchMatchOrdersError,
    OrderStatusError,
    SignatureError,
    SignatureValidatorNotApprovedError,
    SignatureWalletError,
    SignatureValidatorError,
    InvalidSenderError,
    InvalidTakerError,
    InvalidMakerError,
    FillError,
    OrderEpochError,
    AssetProxyExistsError,
    AssetProxyDispatchError,
    AssetProxyTransferError,
    NegativeSpreadError,
    TransactionError,
    TransactionSignatureError,
    TransactionExecutionError,
    IncompleteFillError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
