import { RevertError } from '../../revert_error';
import { Numberish } from '../../types';

// tslint:disable:max-classes-per-file
export class InvalidMetaTransactionsArrayLengthsError extends RevertError {
    constructor(mtxCount?: Numberish, signatureCount?: Numberish) {
        super(
            'InvalidMetaTransactionsArrayLengthsError',
            'InvalidMetaTransactionsArrayLengthsError(uint256 mtxCount, uint256 signatureCount)',
            {
                mtxCount,
                signatureCount,
            },
        );
    }
}

export class MetaTransactionAlreadyExecutedError extends RevertError {
    constructor(mtxHash?: string, executedBlockNumber?: Numberish) {
        super(
            'MetaTransactionAlreadyExecutedError',
            'MetaTransactionAlreadyExecutedError(bytes32 mtxHash, uint256 executedBlockNumber)',
            {
                mtxHash,
                executedBlockNumber,
            },
        );
    }
}

export class MetaTransactionUnsupportedFunctionError extends RevertError {
    constructor(mtxHash?: string, selector?: string) {
        super(
            'MetaTransactionUnsupportedFunctionError',
            'MetaTransactionUnsupportedFunctionError(bytes32 mtxHash, bytes4 selector)',
            {
                mtxHash,
                selector,
            },
        );
    }
}

export class MetaTransactionWrongSenderError extends RevertError {
    constructor(mtxHash?: string, sender?: string, expectedSender?: string) {
        super(
            'MetaTransactionWrongSenderError',
            'MetaTransactionWrongSenderError(bytes32 mtxHash, address sender, address expectedSender)',
            {
                mtxHash,
                sender,
                expectedSender,
            },
        );
    }
}

export class MetaTransactionExpiredError extends RevertError {
    constructor(mtxHash?: string, time?: Numberish, expirationTime?: Numberish) {
        super(
            'MetaTransactionExpiredError',
            'MetaTransactionExpiredError(bytes32 mtxHash, uint256 time, uint256 expirationTime)',
            {
                mtxHash,
                time,
                expirationTime,
            },
        );
    }
}

export class MetaTransactionGasPriceError extends RevertError {
    constructor(mtxHash?: string, gasPrice?: Numberish, minGasPrice?: Numberish, maxGasPrice?: Numberish) {
        super(
            'MetaTransactionGasPriceError',
            'MetaTransactionGasPriceError(bytes32 mtxHash, uint256 gasPrice, uint256 minGasPrice, uint256 maxGasPrice)',
            {
                mtxHash,
                gasPrice,
                minGasPrice,
                maxGasPrice,
            },
        );
    }
}

export class MetaTransactionInsufficientEthError extends RevertError {
    constructor(mtxHash?: string, ethBalance?: Numberish, ethRequired?: Numberish) {
        super(
            'MetaTransactionInsufficientEthError',
            'MetaTransactionInsufficientEthError(bytes32 mtxHash, uint256 ethBalance, uint256 ethRequired)',
            {
                mtxHash,
                ethBalance,
                ethRequired,
            },
        );
    }
}

export class MetaTransactionInvalidSignatureError extends RevertError {
    constructor(mtxHash?: string, signature?: string, errData?: string) {
        super(
            'MetaTransactionInvalidSignatureError',
            'MetaTransactionInvalidSignatureError(bytes32 mtxHash, bytes signature, bytes errData)',
            {
                mtxHash,
                signature,
                errData,
            },
        );
    }
}

export class MetaTransactionCallFailedError extends RevertError {
    constructor(mtxHash?: string, callData?: string, returnData?: string) {
        super(
            'MetaTransactionCallFailedError',
            'MetaTransactionCallFailedError(bytes32 mtxHash, bytes callData, bytes returnData)',
            {
                mtxHash,
                callData,
                returnData,
            },
        );
    }
}

const types = [
    InvalidMetaTransactionsArrayLengthsError,
    MetaTransactionAlreadyExecutedError,
    MetaTransactionUnsupportedFunctionError,
    MetaTransactionWrongSenderError,
    MetaTransactionExpiredError,
    MetaTransactionGasPriceError,
    MetaTransactionInsufficientEthError,
    MetaTransactionInvalidSignatureError,
    MetaTransactionCallFailedError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
