import { BigNumber, RevertError } from '@0x/utils';

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

export class CompleteBuyFailedError extends RevertError {
    constructor(
        expectedAssetBuyAmount?: BigNumber | number | string,
        actualAssetBuyAmount?: BigNumber | number | string,
    ) {
        super(
            'CompleteBuyFailedError',
            'CompleteBuyFailedError(uint256 expectedAssetBuyAmount, uint256 actualAssetBuyAmount)',
            { expectedAssetBuyAmount, actualAssetBuyAmount },
        );
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
    constructor(ethFeeRequired?: BigNumber | number | string, ethAvailable?: BigNumber | number | string) {
        super(
            'InsufficientEthForFeeError',
            'InsufficientEthForFeeError(uint256 ethFeeRequired, uint256 ethAvailable)',
            { ethFeeRequired, ethAvailable },
        );
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
    constructor(errorData?: string) {
        super('TransferFailedError', 'TransferFailedError(bytes errorData)', { errorData });
    }
}

export class DefaultFunctionWethContractOnlyError extends RevertError {
    constructor(senderAddress?: string) {
        super('DefaultFunctionWethContractOnlyError', 'DefaultFunctionWethContractOnlyError(address senderAddress)', {
            senderAddress,
        });
    }
}

export class MsgValueCantEqualZeroError extends RevertError {
    constructor() {
        super('MsgValueCantEqualZeroError', 'MsgValueCantEqualZeroError()', {});
    }
}

export class Erc721AmountMustEqualOneError extends RevertError {
    constructor(amount?: BigNumber | number | string) {
        super('Erc721AmountMustEqualOneError', 'Erc721AmountMustEqualOneError(uint256 amount)', {
            amount,
        });
    }
}

const types = [
    UnregisteredAssetProxyError,
    UnsupportedAssetProxyError,
    CompleteBuyFailedError,
    MakerAssetMismatchError,
    UnsupportedFeeError,
    FeePercentageTooLargeError,
    InsufficientEthForFeeError,
    OversoldWethError,
    TransferFailedError,
    DefaultFunctionWethContractOnlyError,
    MsgValueCantEqualZeroError,
    Erc721AmountMustEqualOneError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
