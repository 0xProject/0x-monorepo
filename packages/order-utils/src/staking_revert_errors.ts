import { BigNumber, RevertError } from '@0x/utils';

// tslint:disable:max-classes-per-file

export enum MakerPoolAssignmentErrorCodes {
    MakerAddressAlreadyRegistered,
    MakerAddressNotRegistered,
    MakerAddressNotPendingAdd,
    PoolIsFull,
}

export enum OperatorShareErrorCodes {
    OperatorShareTooLarge,
    CanOnlyDecreaseOperatorShare,
}

export enum ProtocolFeePaymentErrorCodes {
    ZeroProtocolFeePaid,
    MismatchedFeeAndPayment,
}

export enum InvalidParamValueErrorCode {
    InvalidCobbDouglasAlpha,
    InvalidRewardDelegatedStakeWeight,
    InvalidMaximumMakersInPool,
    InvalidWethProxyAddress,
    InvalidEthVaultAddress,
    InvalidRewardVaultAddress,
    InvalidZrxVaultAddress,
    InvalidEpochDuration,
    InvalidMinimumPoolStake,
    InvalidWethProxyAddress,
    InvalidEthVaultAddress,
    InvalidRewardVaultAddress,
    InvalidZrxVaultAddress,
}

export enum InitializationErrorCode {
    MixinSchedulerAlreadyInitialized,
    MixinParamsAlreadyInitialized,
}

export enum CumulativeRewardIntervalErrorCode {
    BeginEpochMustBeLessThanEndEpoch,
    BeginEpochDoesNotHaveReward,
    EndEpochDoesNotHaveReward,
}

export enum StorageLayoutErrorCodes {
    UnexpectedSlot,
    UnexpectedOffset,
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

export class PoolExistenceError extends RevertError {
    constructor(poolId?: string, alreadyExists?: boolean) {
        super('PoolExistenceError', 'PoolExistenceError(bytes32 poolId, bool alreadyExists)', {
            poolId,
            alreadyExists,
        });
    }
}

export class InvalidParamValueError extends RevertError {
    constructor(error?: InvalidParamValueErrorCode) {
        super('InvalidParamValueError', 'InvalidParamValueError(uint8 error)', {
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

export class ProxyDestinationCannotBeNilError extends RevertError {
    constructor() {
        super('ProxyDestinationCannotBeNilError', 'ProxyDestinationCannotBeNilError()', {});
    }
}

export class CumulativeRewardIntervalError extends RevertError {
    constructor(
        errorCode?: CumulativeRewardIntervalErrorCode,
        poolId?: string,
        beginEpoch?: BigNumber | number | string,
        endEpoch?: BigNumber | number | string,
    ) {
        super(
            'CumulativeRewardIntervalError',
            'CumulativeRewardIntervalError(uint8 errorCode, bytes32 poolId, uint256 beginEpoch, uint256 endEpoch)',
            { errorCode, poolId, beginEpoch, endEpoch },
        );
    }
}

export class StorageLayoutError extends RevertError {
    constructor(
        errorCode?: StorageLayoutErrorCodes,
        expected?: BigNumber | number | string,
        actual?: BigNumber | number | string,
    ) {
        super('StorageLayoutError', 'StorageLayoutError(uint8 errorCode, uint256 expected, uint256 actual)', {
            errorCode,
            expected,
            actual,
        });
    }
}

export class PreviousEpochNotFinalizedError extends RevertError {
    constructor(closingEpoch?: BigNumber | number | string, unfinalizedPoolsRemaining?: BigNumber | number | string) {
        super(
            'PreviousEpochNotFinalizedError',
            'PreviousEpochNotFinalizedError(uint256 closingEpoch, uint256 unfinalizedPoolsRemaining)',
            { closingEpoch, unfinalizedPoolsRemaining },
        );
    }
}

const types = [
    AmountExceedsBalanceOfPoolError,
    BlockTimestampTooLowError,
    CumulativeRewardIntervalError,
    EthVaultNotSetError,
    ExchangeAddressAlreadyRegisteredError,
    ExchangeAddressNotRegisteredError,
    InitializationError,
    InsufficientBalanceError,
    InvalidProtocolFeePaymentError,
    InvalidStakeStatusError,
    InvalidParamValueError,
    MakerPoolAssignmentError,
    MiscalculatedRewardsError,
    OnlyCallableByExchangeError,
    OnlyCallableByPoolOperatorError,
    OnlyCallableByPoolOperatorOrMakerError,
    OnlyCallableByStakingContractError,
    OnlyCallableIfInCatastrophicFailureError,
    OnlyCallableIfNotInCatastrophicFailureError,
    OperatorShareError,
    PoolExistenceError,
    PreviousEpochNotFinalizedError,
    ProxyDestinationCannotBeNilError,
    RewardVaultNotSetError,
    WithdrawAmountExceedsMemberBalanceError,
    StorageLayoutError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
