import { BigNumber } from '../../configured_bignumber';
import { RevertError } from '../../revert_error';

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

export enum InvalidParamValueErrorCodes {
    InvalidCobbDouglasAlpha,
    InvalidRewardDelegatedStakeWeight,
    InvalidMaximumMakersInPool,
    InvalidMinimumPoolStake,
    InvalidEpochDuration,
}

export enum InitializationErrorCodes {
    MixinSchedulerAlreadyInitialized,
    MixinParamsAlreadyInitialized,
}

export enum ExchangeManagerErrorCodes {
    ExchangeAlreadyRegistered,
    ExchangeNotRegistered,
}

export class OnlyCallableByExchangeError extends RevertError {
    constructor(senderAddress?: string) {
        super('OnlyCallableByExchangeError', 'OnlyCallableByExchangeError(address senderAddress)', { senderAddress });
    }
}

export class ExchangeManagerError extends RevertError {
    constructor(errorCode?: ExchangeManagerErrorCodes, senderAddress?: string) {
        super('ExchangeManagerError', 'ExchangeManagerError(uint8 errorCode, address senderAddress)', {
            errorCode,
            senderAddress,
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
    constructor(senderAddress?: string, poolId?: string) {
        super(
            'OnlyCallableByPoolOperatorError',
            'OnlyCallableByPoolOperatorError(address senderAddress, bytes32 poolId)',
            { senderAddress, poolId },
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
    constructor(error?: InvalidParamValueErrorCodes) {
        super('InvalidParamValueError', 'InvalidParamValueError(uint8 error)', {
            error,
        });
    }
}

export class InvalidProtocolFeePaymentError extends RevertError {
    constructor(
        expectedProtocolFeePaid?: BigNumber | number | string,
        actualProtocolFeePaid?: BigNumber | number | string,
    ) {
        super(
            'InvalidProtocolFeePaymentError',
            'InvalidProtocolFeePaymentError(uint256 expectedProtocolFeePaid, uint256 actualProtocolFeePaid)',
            { expectedProtocolFeePaid, actualProtocolFeePaid },
        );
    }
}

export class InitializationError extends RevertError {
    constructor(error?: InitializationErrorCodes) {
        super('InitializationError', 'InitializationError(uint8 error)', { error });
    }
}

export class ProxyDestinationCannotBeNilError extends RevertError {
    constructor() {
        super('ProxyDestinationCannotBeNilError', 'ProxyDestinationCannotBeNilError()', {});
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

export class PoolNotFinalizedError extends RevertError {
    constructor(poolId: string, epoch: BigNumber | number | string) {
        super('PoolNotFinalizedError', 'PoolNotFinalizedError(bytes32 poolId, uint256 epoch)', { poolId, epoch });
    }
}

const types = [
    BlockTimestampTooLowError,
    ExchangeManagerError,
    InitializationError,
    InsufficientBalanceError,
    InvalidProtocolFeePaymentError,
    InvalidParamValueError,
    MakerPoolAssignmentError,
    OnlyCallableByExchangeError,
    OnlyCallableByPoolOperatorError,
    OnlyCallableByStakingContractError,
    OnlyCallableIfInCatastrophicFailureError,
    OnlyCallableIfNotInCatastrophicFailureError,
    OperatorShareError,
    PoolExistenceError,
    PreviousEpochNotFinalizedError,
    ProxyDestinationCannotBeNilError,
    PoolNotFinalizedError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
