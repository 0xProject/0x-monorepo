import { BigNumber, RevertError } from '@0x/utils';

// tslint:disable:max-classes-per-file

export enum MakerPoolAssignmentErrorCodes {
    MakerAddressAlreadyRegistered,
    MakerAddressNotRegistered,
    MakerAddressNotPendingAdd,
    PoolIsFull,
}

export enum OperatorShareErrorCodes {
    OperatorShareMustBeBetween0And100,
    CanOnlyDecreaseOperatorShare,
}

export enum ProtocolFeePaymentErrorCodes {
    ZeroProtocolFeePaid,
    MismatchedFeeAndPayment,
}

export enum InvalidTuningValueErrorCode {
    InvalidCobbDouglasAlpha = 0,
}

export enum InitializationErrorCode {
    MixinSchedulerAlreadyInitialized = 0,
}

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

export class MakerPoolAssignmentError extends RevertError {
    constructor(error?: MakerPoolAssignmentErrorCodes, makerAddress?: string, poolId?: string) {
        super(
            'MakerPoolAssignmentError',
            'MakerPoolAssignmentError(uint8 error, address makerAddress, bytes32 poolId)',
            {
                error,
                makerAddress,
                poolId,
            },
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
            'BlockTimestampTooLowError(uint256 epochEndTime, uint256 currentBlockTimestamp)',
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

export class OperatorShareError extends RevertError {
    constructor(error?: OperatorShareErrorCodes, poolId?: string, operatorShare?: BigNumber | number | string) {
        super('OperatorShareError', 'OperatorShareError(uint8 error, bytes32 poolId, uint32 operatorShare)', {
            error,
            poolId,
            operatorShare,
        });
    }
}

export class PoolAlreadyExistsError extends RevertError {
    constructor(poolId?: string) {
        super('PoolAlreadyExistsError', 'PoolAlreadyExistsError(bytes32 poolId)', { poolId });
    }
}

export class InvalidTuningValueError extends RevertError {
    constructor(error?: InvalidTuningValueErrorCode) {
        super('InvalidTuningValue', 'InvalidTuningValue(uint8 error)', {
            error,
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

export class InvalidProtocolFeePaymentError extends RevertError {
    constructor(
        errorCode?: ProtocolFeePaymentErrorCodes,
        expectedProtocolFeePaid?: BigNumber | number | string,
        actualProtocolFeePaid?: BigNumber | number | string,
    ) {
        super(
            'InvalidProtocolFeePaymentError',
            'InvalidProtocolFeePaymentError(uint8 errorCode, uint256 expectedProtocolFeePaid, uint256 actualProtocolFeePaid)',
            { errorCode, expectedProtocolFeePaid, actualProtocolFeePaid },
        );
    }
}

export class InitializationError extends RevertError {
    constructor(error?: InitializationErrorCode) {
        super('InitializationError', 'InitializationError(uint8 error)', { error });
    }
}

const types = [
    AmountExceedsBalanceOfPoolError,
    BlockTimestampTooLowError,
    EthVaultNotSetError,
    ExchangeAddressAlreadyRegisteredError,
    ExchangeAddressNotRegisteredError,
    InitializationError,
    InsufficientBalanceError,
    InvalidProtocolFeePaymentError,
    InvalidStakeStatusError,
    InvalidStakeStatusError,
    InvalidTuningValueError,
    MakerPoolAssignmentError,
    MiscalculatedRewardsError,
    OnlyCallableByExchangeError,
    OnlyCallableByPoolOperatorError,
    OnlyCallableByPoolOperatorOrMakerError,
    OnlyCallableByStakingContractError,
    OnlyCallableIfInCatastrophicFailureError,
    OnlyCallableIfNotInCatastrophicFailureError,
    OperatorShareError,
    PoolAlreadyExistsError,
    RewardVaultNotSetError,
    WithdrawAmountExceedsMemberBalanceError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
