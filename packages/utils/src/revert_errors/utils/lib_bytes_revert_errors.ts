import { BigNumber } from '../../configured_bignumber';
import { RevertError } from '../../revert_error';

export enum InvalidByteOperationErrorCodes {
    FromLessThanOrEqualsToRequired,
    ToLessThanOrEqualsLengthRequired,
    LengthGreaterThanZeroRequired,
    LengthGreaterThanOrEqualsFourRequired,
    LengthGreaterThanOrEqualsTwentyRequired,
    LengthGreaterThanOrEqualsThirtyTwoRequired,
    LengthGreaterThanOrEqualsNestedBytesLengthRequired,
    DestinationLengthGreaterThanOrEqualSourceLengthRequired,
}

export class InvalidByteOperationError extends RevertError {
    constructor(error?: InvalidByteOperationErrorCodes, offset?: BigNumber, required?: BigNumber) {
        super('InvalidByteOperationError', 'InvalidByteOperationError(uint8 error, uint256 offset, uint256 required)', {
            error,
            offset,
            required,
        });
    }
}

// Register the InvalidByteOperationError type
RevertError.registerType(InvalidByteOperationError);
