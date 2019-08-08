import { BigNumber, RevertError } from '@0x/utils';
import * as _ from 'lodash';

// tslint:disable:max-classes-per-file

export class UnregisteredAssetProxyError extends RevertError {
    constructor() {
        super('UnregisteredAssetProxyError', 'UnregisteredAssetProxyError()', {});
    }
}

export class UnsupportedAssetProxyError extends RevertError {
    constructor(proxyId?: string) {
        super('UnsupportedAssetProxyError', 'UnsupportedAssetProxyError(bytes4 proxyId)', { proxyId });
    }
}

export class CompleteFillFailedError extends RevertError {
    constructor() {
        super('CompleteFillFailedError', 'CompleteFillFailedError()', {});
    }
}

export class MakerAssetMismatchError extends RevertError {
    constructor(firstOrderMakerAssetData?: string, mismatchedMakerAssetData?: string) {
        super(
            'MakerAssetMismatchError',
            'MakerAssetMismatchError(bytes firstOrderMakerAssetData, bytes mismatchedMakerAssetData)',
            {
                firstOrderMakerAssetData,
                mismatchedMakerAssetData,
            },
        );
    }
}

export class UnsupportedFeeError extends RevertError {
    constructor(takerFeeAssetData?: string) {
        super('UnsupportedFeeError', 'UnsupportedFeeError(bytes takerFeeAssetData)', { takerFeeAssetData });
    }
}

export class FeePercentageTooLargeError extends RevertError {
    constructor(feePercentage?: BigNumber | number | string) {
        super('FeePercentageTooLargeError', 'FeePercentageTooLargeError(uint256 feePercentage)', {
            feePercentage,
        });
    }
}

export class InsufficientEthForFeeError extends RevertError {
    constructor() {
        super('InsufficientEthForFeeError', 'InsufficientEthForFeeError()', {});
    }
}

export class OversoldWethError extends RevertError {
    constructor(wethSold?: BigNumber | number | string, msgValue?: BigNumber | number | string) {
        super('OversoldWethError', 'OversoldWethError(uint256 wethSold, uint256 msgValue)', {
            wethSold,
            msgValue,
        });
    }
}

export class TransferFailedError extends RevertError {
    constructor() {
        super('TransferFailedError', 'TransferFailedError()', {});
    }
}

export class DefaultFunctionWethContractOnlyError extends RevertError {
    constructor(callerAddress?: string) {
        super('DefaultFunctionWethContractOnlyError', 'DefaultFunctionWethContractOnlyError(address callerAddress)', {
            callerAddress,
        });
    }
}

export class InvalidMsgValueError extends RevertError {
    constructor() {
        super('InvalidMsgValueError', 'InvalidMsgValueError()', {});
    }
}

export class InvalidErc721AmountError extends RevertError {
    constructor(amount?: BigNumber | number | string) {
        super('InvalidErc721AmountError', 'InvalidErc721AmountError(uint256 amount)', {
            amount,
        });
    }
}

const types = [
    UnregisteredAssetProxyError,
    UnsupportedAssetProxyError,
    CompleteFillFailedError,
    MakerAssetMismatchError,
    UnsupportedFeeError,
    FeePercentageTooLargeError,
    InsufficientEthForFeeError,
    OversoldWethError,
    TransferFailedError,
    DefaultFunctionWethContractOnlyError,
    InvalidMsgValueError,
    InvalidErc721AmountError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
