import { RevertError } from '../../revert_error';
import { Numberish } from '../../types';

// tslint:disable:max-classes-per-file
export class InsufficientEthAttachedError extends RevertError {
    constructor(ethAttached?: Numberish, ethNeeded?: Numberish) {
        super('InsufficientEthAttachedError', 'InsufficientEthAttachedError(uint256 ethAttached, uint256 ethNeeded)', {
            ethAttached,
            ethNeeded,
        });
    }
}

export class IncompleteTransformERC20Error extends RevertError {
    constructor(outputToken?: string, outputTokenAmount?: Numberish, minOutputTokenAmount?: Numberish) {
        super(
            'IncompleteTransformERC20Error',
            'IncompleteTransformERC20Error(address outputToken, uint256 outputTokenAmount, uint256 minOutputTokenAmount)',
            {
                outputToken,
                outputTokenAmount,
                minOutputTokenAmount,
            },
        );
    }
}

export class NegativeTransformERC20OutputError extends RevertError {
    constructor(outputToken?: string, outputTokenLostAmount?: Numberish) {
        super(
            'NegativeTransformERC20OutputError',
            'NegativeTransformERC20OutputError(address outputToken, uint256 outputTokenLostAmount)',
            {
                outputToken,
                outputTokenLostAmount,
            },
        );
    }
}

export class TransformerFailedError extends RevertError {
    constructor(transformer?: string, transformerData?: string, resultData?: string) {
        super(
            'TransformerFailedError',
            'TransformerFailedError(address transformer, bytes transformerData, bytes resultData)',
            {
                transformer,
                transformerData,
                resultData,
            },
        );
    }
}

export class OnlyCallableByDeployerError extends RevertError {
    constructor(caller?: string, deployer?: string) {
        super('OnlyCallableByDeployerError', 'OnlyCallableByDeployerError(address caller, address deployer)', {
            caller,
            deployer,
        });
    }
}

export class InvalidExecutionContextError extends RevertError {
    constructor(actualContext?: string, expectedContext?: string) {
        super(
            'InvalidExecutionContextError',
            'InvalidExecutionContextError(address actualContext, address expectedContext)',
            {
                actualContext,
                expectedContext,
            },
        );
    }
}

export enum InvalidTransformDataErrorCode {
    InvalidTokens,
    InvalidArrayLength,
}

export class InvalidTransformDataError extends RevertError {
    constructor(errorCode?: InvalidTransformDataErrorCode, transformData?: string) {
        super('InvalidTransformDataError', 'InvalidTransformDataError(uint8 errorCode, bytes transformData)', {
            errorCode,
            transformData,
        });
    }
}

export class IncompleteFillSellQuoteError extends RevertError {
    constructor(sellToken?: string, soldAmount?: Numberish, sellAmount?: Numberish) {
        super(
            'IncompleteFillSellQuoteError',
            'IncompleteFillSellQuoteError(address sellToken, uint256 soldAmount, uint256 sellAmount)',
            {
                sellToken,
                soldAmount,
                sellAmount,
            },
        );
    }
}

export class IncompleteFillBuyQuoteError extends RevertError {
    constructor(buyToken?: string, boughtAmount?: Numberish, buyAmount?: Numberish) {
        super(
            'IncompleteFillBuyQuoteError',
            'IncompleteFillBuyQuoteError(address buyToken, uint256 boughtAmount, uint256 buyAmount)',
            {
                buyToken,
                boughtAmount,
                buyAmount,
            },
        );
    }
}

export class InsufficientTakerTokenError extends RevertError {
    constructor(tokenBalance?: Numberish, tokensNeeded?: Numberish) {
        super(
            'InsufficientTakerTokenError',
            'InsufficientTakerTokenError(uint256 tokenBalance, uint256 tokensNeeded)',
            {
                tokenBalance,
                tokensNeeded,
            },
        );
    }
}

export class InsufficientProtocolFeeError extends RevertError {
    constructor(ethBalance?: Numberish, ethNeeded?: Numberish) {
        super('InsufficientProtocolFeeError', 'InsufficientProtocolFeeError(uint256 ethBalance, uint256 ethNeeded)', {
            ethBalance,
            ethNeeded,
        });
    }
}

export class InvalidERC20AssetDataError extends RevertError {
    constructor(assetData?: string) {
        super('InvalidERC20AssetDataError', 'InvalidERC20AssetDataError(bytes assetData)', {
            assetData,
        });
    }
}

export class WrongNumberOfTokensReceivedError extends RevertError {
    constructor(actual?: Numberish, expected?: Numberish) {
        super(
            'WrongNumberOfTokensReceivedError',
            'WrongNumberOfTokensReceivedError(uint256 actual, uint256 expected)',
            {
                actual,
                expected,
            },
        );
    }
}

export class InvalidTokenReceivedError extends RevertError {
    constructor(token?: string) {
        super('InvalidTokenReceivedError', 'InvalidTokenReceivedError(address token)', {
            token,
        });
    }
}

export class InvalidTakerFeeTokenError extends RevertError {
    constructor(token?: string) {
        super('InvalidTakerFeeTokenError', 'InvalidTakerFeeTokenError(address token)', {
            token,
        });
    }
}

const types = [
    InsufficientEthAttachedError,
    IncompleteTransformERC20Error,
    NegativeTransformERC20OutputError,
    TransformerFailedError,
    IncompleteFillSellQuoteError,
    IncompleteFillBuyQuoteError,
    InsufficientTakerTokenError,
    InsufficientProtocolFeeError,
    InvalidERC20AssetDataError,
    WrongNumberOfTokensReceivedError,
    InvalidTokenReceivedError,
    InvalidTransformDataError,
    InvalidTakerFeeTokenError,
    OnlyCallableByDeployerError,
    InvalidExecutionContextError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
