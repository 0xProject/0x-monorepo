import { BigNumber, RevertError } from '@0x/utils';

// tslint:disable:max-classes-per-file

export class MiscalculatedRewardsError extends RevertError {
    constructor(totalRewardsPaid?: BigNumber | number | string, initialContractBalance?: BigNumber | number | string) {
        super(
            'MiscalculatedRewardsError',
            'MiscalculatedRewardsError(uint256 totalRewardsPaid, uint256 initialContractBalance)',
            { totalRewardsPaid, initialContractBalance },
        );
    }
}

export class OnlyCallableByExchangeError extends RevertError {
    constructor(senderAddress?: string) {
        super('OnlyCallableByExchangeError', 'OnlyCallableByExchangeError(address senderAddress)', { senderAddress });
    }
}

export class ExchangeAddressAlreadyRegisteredError extends RevertError {
    constructor(exchangeAddress?: string) {
        super(
            'ExchangeAddressAlreadyRegisteredError',
            'ExchangeAddressAlreadyRegisteredError(address exchangeAddress)',
            { exchangeAddress },
        );
    }
}

export class ExchangeAddressNotRegisteredError extends RevertError {
    constructor(exchangeAddress?: string) {
        super('ExchangeAddressNotRegisteredError', 'ExchangeAddressNotRegisteredError(address exchangeAddress)', {
            exchangeAddress,
        });
    }
}

export class SignatureLengthGreaterThan0RequiredError extends RevertError {
    constructor() {
        super('SignatureLengthGreaterThan0RequiredError', 'SignatureLengthGreaterThan0RequiredError()', {});
    }
}

export class SignatureUnsupportedError extends RevertError {
    constructor(signature?: string) {
        super('SignatureUnsupportedError', 'SignatureUnsupportedError(bytes signature)', { signature });
    }
}

export class SignatureIllegalError extends RevertError {
    constructor(signature?: string) {
        super('SignatureIllegalError', 'SignatureIllegalError(bytes signature)', { signature });
    }
}

export class SignatureLength0RequiredError extends RevertError {
    constructor(signature?: string) {
        super('SignatureLength0RequiredError', 'SignatureLength0RequiredError(bytes signature)', { signature });
    }
}

export class SignatureLength65RequiredError extends RevertError {
    constructor(signature?: string) {
        super('SignatureLength65RequiredError', 'SignatureLength65RequiredError(bytes signature)', { signature });
    }
}

export class WalletError extends RevertError {
    constructor(walletAddress?: string, errorData?: string) {
        super('WalletError', 'WalletError(address walletAddress, bytes errorData)', { walletAddress, errorData });
    }
}

export class InsufficientBalanceError extends RevertError {
    constructor(amount?: BigNumber | number | string, balance?: BigNumber | number | string) {
        super('InsufficientBalanceError', 'InsufficientBalanceError(uint256 amount, uint256 balance)', {
            amount,
            balance,
        });
    }
}

export class OnlyCallableByPoolOperatorError extends RevertError {
    constructor(senderAddress?: string, poolOperatorAddress?: string) {
        super(
            'OnlyCallableByPoolOperatorError',
            'OnlyCallableByPoolOperatorError(address senderAddress, address poolOperatorAddress)',
            { senderAddress, poolOperatorAddress },
        );
    }
}

export class OnlyCallableByPoolOperatorOrMakerError extends RevertError {
    constructor(senderAddress?: string, poolOperatorAddress?: string, makerAddress?: string) {
        super(
            'OnlyCallableByPoolOperatorOrMakerError',
            'OnlyCallableByPoolOperatorOrMakerError(address senderAddress, address poolOperatorAddress, address makerAddress)',
            { senderAddress, poolOperatorAddress, makerAddress },
        );
    }
}

export class InvalidMakerSignatureError extends RevertError {
    constructor(poolId?: string, makerAddress?: string, makerSignature?: string) {
        super(
            'InvalidMakerSignatureError',
            'InvalidMakerSignatureError(bytes32 poolId, address makerAddress, bytes makerSignature)',
            { poolId, makerAddress, makerSignature },
        );
    }
}

export class MakerAddressAlreadyRegisteredError extends RevertError {
    constructor(makerAddress?: string) {
        super('MakerAddressAlreadyRegisteredError', 'MakerAddressAlreadyRegisteredError(address makerAddress)', {
            makerAddress,
        });
    }
}

export class MakerAddressNotRegisteredError extends RevertError {
    constructor(makerAddress?: string, makerPoolId?: string, poolId?: string) {
        super(
            'MakerAddressNotRegisteredError',
            'MakerAddressNotRegisteredError(address makerAddress, bytes32 makerPoolId, bytes32 poolId)',
            { makerAddress, makerPoolId, poolId },
        );
    }
}

export class WithdrawAmountExceedsMemberBalanceError extends RevertError {
    constructor(withdrawAmount?: BigNumber | number | string, balance?: BigNumber | number | string) {
        super(
            'WithdrawAmountExceedsMemberBalanceError',
            'WithdrawAmountExceedsMemberBalanceError(uint256 withdrawAmount, uint256 balance)',
            { withdrawAmount, balance },
        );
    }
}

export class BlockTimestampTooLowError extends RevertError {
    constructor(epochEndTime?: BigNumber | number | string, currentBlockTimestamp?: BigNumber | number | string) {
        super(
            'BlockTimestampTooLowError',
            'BlockTimestampTooLowError(uint64 epochEndTime, uint64 currentBlockTimestamp)',
            { epochEndTime, currentBlockTimestamp },
        );
    }
}

export class OnlyCallableByStakingContractError extends RevertError {
    constructor(senderAddress?: string) {
        super('OnlyCallableByStakingContractError', 'OnlyCallableByStakingContractError(address senderAddress)', {
            senderAddress,
        });
    }
}

export class OnlyCallableIfInCatastrophicFailureError extends RevertError {
    constructor() {
        super('OnlyCallableIfInCatastrophicFailureError', 'OnlyCallableIfInCatastrophicFailureError()', {});
    }
}

export class OnlyCallableIfNotInCatastrophicFailureError extends RevertError {
    constructor() {
        super('OnlyCallableIfNotInCatastrophicFailureError', 'OnlyCallableIfNotInCatastrophicFailureError()', {});
    }
}

export class AmountExceedsBalanceOfPoolError extends RevertError {
    constructor(amount?: BigNumber | number | string, poolBalance?: BigNumber | number | string) {
        super(
            'AmountExceedsBalanceOfPoolError',
            'AmountExceedsBalanceOfPoolError(uint256 amount, uint96 poolBalance)',
            { amount, poolBalance },
        );
    }
}

export class InvalidPoolOperatorShareError extends RevertError {
    constructor(poolId?: string, poolOperatorShare?: BigNumber | number | string) {
        super(
            'InvalidPoolOperatorShareError',
            'InvalidPoolOperatorShareError(bytes32 poolId, uint32 poolOperatorShare)',
            { poolId, poolOperatorShare },
        );
    }
}

export class PoolAlreadyExistsError extends RevertError {
    constructor(poolId?: string) {
        super('PoolAlreadyExistsError', 'PoolAlreadyExistsError(bytes32 poolId)', { poolId });
    }
}

export class InvalidCobbDouglasAlphaError extends RevertError {
    constructor(numerator: BigNumber | number | string, denominator: BigNumber | number | string) {
        super('InvalidCobbDouglasAlphaError', 'InvalidCobbDouglasAlphaError(uint256 numerator, uint256 denominator)', {
            numerator,
            denominator,
        });
    }
}

export class EthVaultNotSetError extends RevertError {
    constructor() {
        super('EthVaultNotSetError', 'EthVaultNotSetError()');
    }
}

export class RewardVaultNotSetError extends RevertError {
    constructor() {
        super('RewardVaultNotSetError', 'RewardVaultNotSetError()');
    }
}

export class InvalidStakeStatusError extends RevertError {
    constructor(status?: BigNumber) {
        super('InvalidStakeStatusError', 'InvalidStakeStatusError(uint256 status)', { status });
    }
}

const types = [
    MiscalculatedRewardsError,
    OnlyCallableByExchangeError,
    ExchangeAddressAlreadyRegisteredError,
    ExchangeAddressNotRegisteredError,
    SignatureLengthGreaterThan0RequiredError,
    SignatureUnsupportedError,
    SignatureIllegalError,
    SignatureLength0RequiredError,
    SignatureLength65RequiredError,
    WalletError,
    InsufficientBalanceError,
    OnlyCallableByPoolOperatorError,
    OnlyCallableByPoolOperatorOrMakerError,
    InvalidMakerSignatureError,
    MakerAddressAlreadyRegisteredError,
    MakerAddressNotRegisteredError,
    WithdrawAmountExceedsMemberBalanceError,
    BlockTimestampTooLowError,
    OnlyCallableByStakingContractError,
    OnlyCallableIfInCatastrophicFailureError,
    OnlyCallableIfNotInCatastrophicFailureError,
    AmountExceedsBalanceOfPoolError,
    InvalidPoolOperatorShareError,
    PoolAlreadyExistsError,
    InvalidCobbDouglasAlphaError,
    EthVaultNotSetError,
    RewardVaultNotSetError,
    InvalidStakeStatusError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
