import { OrderStatus } from '@0x/types';
import { BigNumber, RevertError } from '@0x/utils';
import * as _ from 'lodash';

// tslint:disable:max-classes-per-file

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
}

export enum AssetProxyDispatchErrorCode {
    InvalidAssetDataLength,
    UnknownAssetProxy,
}

export enum TransactionErrorCode {
    NoReentrancy,
    AlreadyExecuted,
}

export class SignatureError extends RevertError {
    constructor(error?: SignatureErrorCode, hash?: string, signer?: string, signature?: string) {
        super('SignatureError(uint8 error, bytes32 hash, address signer, bytes signature)', {
            error,
            hash,
            signer,
            signature,
        });
    }
}

export class SignatureValidatorError extends RevertError {
    constructor(hash?: string, signer?: string, signature?: string, errorData?: string) {
        super('SignatureValidatorError(bytes32 hash, address signer, bytes signature, bytes errorData)', {
            hash,
            signer,
            signature,
            errorData,
        });
    }
}

export class SignatureWalletError extends RevertError {
    constructor(hash?: string, wallet?: string, signature?: string, errorData?: string) {
        super('SignatureWalletError(bytes32 hash, address wallet, bytes signature, bytes errorData)', {
            hash,
            wallet,
            signature,
            errorData,
        });
    }
}

export class SignatureOrderValidatorError extends RevertError {
    constructor(hash?: string, signer?: string, signature?: string, errorData?: string) {
        super('SignatureOrderValidatorError(bytes32 hash, address signer, bytes signature, bytes errorData)', {
            hash,
            signer,
            signature,
            errorData,
        });
    }
}

export class SignatureWalletOrderValidatorError extends RevertError {
    constructor(hash?: string, wallet?: string, signature?: string, errorData?: string) {
        super('SignatureWalletOrderValidatorError(bytes32 hash, address wallet, bytes signature, bytes errorData)', {
            hash,
            wallet,
            signature,
            errorData,
        });
    }
}

export class OrderStatusError extends RevertError {
    constructor(orderHash?: string, status?: OrderStatus) {
        super('OrderStatusError(bytes32 orderHash, uint8 status)', { orderHash, status });
    }
}

export class InvalidSenderError extends RevertError {
    constructor(orderHash?: string, sender?: string) {
        super('InvalidSenderError(bytes32 orderHash, address sender)', { orderHash, sender });
    }
}

export class InvalidTakerError extends RevertError {
    constructor(orderHash?: string, taker?: string) {
        super('InvalidTakerError(bytes32 orderHash, address taker)', { orderHash, taker });
    }
}

export class InvalidMakerError extends RevertError {
    constructor(orderHash?: string, maker?: string) {
        super('InvalidMakerError(bytes32 orderHash, address maker)', { orderHash, maker });
    }
}

export class FillError extends RevertError {
    constructor(error?: FillErrorCode, orderHash?: string) {
        super('FillError(uint8 error, bytes32 orderHash)', { error, orderHash });
    }
}

export class OrderEpochError extends RevertError {
    constructor(maker?: string, sender?: string, currentEpoch?: BigNumber | number | string) {
        super('OrderEpochError(address maker, address sender, uint256 currentEpoch)', {
            maker,
            sender,
            currentEpoch,
        });
    }
}

export class AssetProxyExistsError extends RevertError {
    constructor(proxy?: string) {
        super('AssetProxyExistsError(address proxy)', { proxy });
    }
}

export class AssetProxyDispatchError extends RevertError {
    constructor(error?: AssetProxyDispatchErrorCode, orderHash?: string, assetData?: string) {
        super('AssetProxyDispatchError(uint8 error, bytes32 orderHash, bytes assetData)', {
            error,
            orderHash,
            assetData,
        });
    }
}

export class AssetProxyTransferError extends RevertError {
    constructor(orderHash?: string, assetData?: string, errorData?: string) {
        super('AssetProxyTransferError(bytes32 orderHash, bytes assetData, bytes errorData)', {
            orderHash,
            assetData,
            errorData,
        });
    }
}

export class NegativeSpreadError extends RevertError {
    constructor(leftOrderHash?: string, rightOrderHash?: string) {
        super('NegativeSpreadError(bytes32 leftOrderHash, bytes32 rightOrderHash)', { leftOrderHash, rightOrderHash });
    }
}

export class TransactionError extends RevertError {
    constructor(error?: TransactionErrorCode, transactionHash?: string) {
        super('TransactionError(uint8 error, bytes32 transactionHash)', { error, transactionHash });
    }
}

export class TransactionSignatureError extends RevertError {
    constructor(transactionHash?: string, signer?: string, signature?: string) {
        super('TransactionSignatureError(bytes32 transactionHash, address signer, bytes signature)', {
            transactionHash,
            signer,
            signature,
        });
    }
}

export class TransactionExecutionError extends RevertError {
    constructor(transactionHash?: string, errorData?: string) {
        super('TransactionExecutionError(bytes32 transactionHash, bytes errorData)', { transactionHash, errorData });
    }
}

export class IncompleteFillError extends RevertError {
    constructor(orderHash?: string) {
        super('IncompleteFillError(bytes32 orderHash)', { orderHash });
    }
}

const types = [
    OrderStatusError,
    SignatureError,
    SignatureWalletError,
    SignatureValidatorError,
    SignatureOrderValidatorError,
    SignatureWalletOrderValidatorError,
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
