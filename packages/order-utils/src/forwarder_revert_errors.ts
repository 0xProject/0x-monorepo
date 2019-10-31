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

export class OverspentWethError extends RevertError {
    constructor(wethSpent?: BigNumber | number | string, msgValue?: BigNumber | number | string) {
        super('OverspentWethError', 'OverspentWethError(uint256 wethSpent, uint256 msgValue)', {
            wethSpent,
            msgValue,
        });
    }
}

export class DefaultFunctionWethContractOnlyError extends RevertError {
    constructor(senderAddress?: string) {
        super('DefaultFunctionWethContractOnlyError', 'DefaultFunctionWethContractOnlyError(address senderAddress)', {
            senderAddress,
        });
    }
}

export class MsgValueCannotEqualZeroError extends RevertError {
    constructor() {
        super('MsgValueCannotEqualZeroError', 'MsgValueCannotEqualZeroError()', {});
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
    UnsupportedFeeError,
    FeePercentageTooLargeError,
    InsufficientEthForFeeError,
    OverspentWethError,
    DefaultFunctionWethContractOnlyError,
    MsgValueCannotEqualZeroError,
    Erc721AmountMustEqualOneError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
