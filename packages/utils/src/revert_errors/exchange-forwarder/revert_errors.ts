import { BigNumber } from '../../configured_bignumber';
import { RevertError } from '../../revert_error';

// tslint:disable:max-classes-per-file

export class UnregisteredAssetProxyError extends RevertError {
    constructor() {
        super('UnregisteredAssetProxyError', 'UnregisteredAssetProxyError()', {});
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

export class EthFeeLengthMismatchError extends RevertError {
    constructor(ethFeesLength?: BigNumber | number | string, feeRecipientsLength?: BigNumber | number | string) {
        super(
            'EthFeeLengthMismatchError',
            'EthFeeLengthMismatchError(uint256 ethFeesLength, uint256 feeRecipientsLength)',
            {
                ethFeesLength,
                feeRecipientsLength,
            },
        );
    }
}

const types = [
    UnregisteredAssetProxyError,
    CompleteBuyFailedError,
    UnsupportedFeeError,
    InsufficientEthForFeeError,
    OverspentWethError,
    DefaultFunctionWethContractOnlyError,
    MsgValueCannotEqualZeroError,
    EthFeeLengthMismatchError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
