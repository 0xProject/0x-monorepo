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
    WalletError,
    ValidatorError,
}

export enum AssetProxyDispatchErrorCode {
    InvalidAssetDataLength,
    UnknownAssetProxy,
}

export enum TransactionErrorCode {
    NoReentrancy,
    AlreadyExecuted,
    BadSignature,
}

export class SignatureError extends RevertError {
    constructor(error?: SignatureErrorCode, orderHash?: string) {
        super('SignatureError(uint8 error,bytes32 orderHash)', { error, orderHash });
    }
}

export class OrderStatusError extends RevertError {
    constructor(status?: OrderStatus, orderHash?: string) {
        super('OrderStatusError(uint8 status, bytes32 orderHash)', { status, orderHash });
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
    constructor(orderHash?: string, assetData?: string, errorMessage?: string) {
        super('AssetProxyTransferError(bytes32 orderHash, bytes assetData, string errorMessage)', {
            orderHash,
            assetData,
            errorMessage,
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
    TransactionExecutionError,
    IncompleteFillError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
