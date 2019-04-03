import { OrderStatus } from '@0x/types';
import { BigNumber, RichRevertReason } from '@0x/utils';
import * as _ from 'lodash';

// tslint:disable:max-classes-per-file

export enum FillErrorCodes {
    InvalidTakerAmount,
    TakerOverpay,
    Overfill,
    InvalidFillPrice,
}

export enum SignatureErrorCodes {
    BadSignature,
    InvalidLength,
    Unsupported,
    Illegal,
    WalletError,
    ValidatorError,
}

export enum AssetProxyDispatchErrorCodes {
    InvalidAssetDataLength,
    UnknownAssetProxy,
}

export enum TransactionErrorCodes {
    NoReentrancy,
    AlreadyExecuted,
    BadSignature,
}

export class SignatureError extends RichRevertReason {
    constructor(orderHash?: string, error?: SignatureErrorCodes) {
        super('SignatureError(bytes32 orderHash, uint8 error)', { orderHash, error });
    }
}

export class OrderStatusError extends RichRevertReason {
    constructor(orderHash?: string, status?: OrderStatus) {
        super('OrderStatusError(bytes32 orderHash, uint8 status)', { orderHash, status });
    }
}

export class InvalidSenderError extends RichRevertReason {
    constructor(orderHash?: string, sender?: string) {
        super('InvalidSenderError(bytes32 orderHash, address sender)', { orderHash, sender });
    }
}

export class InvalidTakerError extends RichRevertReason {
    constructor(orderHash?: string, taker?: string) {
        super('InvalidTakerError(bytes32 orderHash, address taker)', { orderHash, taker });
    }
}

export class InvalidMakerError extends RichRevertReason {
    constructor(orderHash?: string, maker?: string) {
        super('InvalidMakerError(bytes32 orderHash, address maker)', { orderHash, maker });
    }
}

export class FillError extends RichRevertReason {
    constructor(orderHash?: string, error?: FillErrorCodes) {
        super('FillError(bytes32 orderHash, uint8 error)', { orderHash, error });
    }
}

export class OrderEpochError extends RichRevertReason {
    constructor(maker?: string, sender?: string, currentEpoch?: BigNumber | number | string) {
        super('OrderEpochError(address maker, address sender, uint256 currentEpoch)', { maker, sender, currentEpoch });
    }
}

export class AssetProxyExistsError extends RichRevertReason {
    constructor(proxy?: string) {
        super('AssetProxyExistsError(address proxy)', { proxy });
    }
}

export class AssetProxyDispatchError extends RichRevertReason {
    constructor(orderHash?: string, assetData?: string, errorMessage?: string) {
        super('AssetProxyDispatchError(bytes32 orderHash, bytes assetData, string errorMessage)', {
            orderHash,
            assetData,
            errorMessage,
        });
    }
}

export class NegativeSpreadError extends RichRevertReason {
    constructor(leftOrderHash?: string, rightOrderHash?: string) {
        super('NegativeSpreadError(bytes32 leftOrderHash, bytes32 rightOrderHash)', { leftOrderHash, rightOrderHash });
    }
}

export class TransactionError extends RichRevertReason {
    constructor(transactionHash?: string, error?: TransactionErrorCodes) {
        super('TransactionError(bytes32 transactionHash, uint8 error)', { transactionHash, error });
    }
}

export class TransactionExecutionError extends RichRevertReason {
    constructor(transactionHash?: string, errorData?: string) {
        super('TransactionExecutionError(bytes32 transactionHash, bytes errorData)', { transactionHash, errorData });
    }
}

export class IncompleteFillError extends RichRevertReason {
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
    NegativeSpreadError,
    TransactionError,
    TransactionExecutionError,
    IncompleteFillError,
];

// Register the types we've defined.
for (const type of types) {
    RichRevertReason.registerType(type);
}
