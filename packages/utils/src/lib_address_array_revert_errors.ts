import { BigNumber } from './configured_bignumber';
import { RevertError } from './revert_error';

export class MismanagedMemoryError extends RevertError {
    constructor(freeMemPtr?: BigNumber, addressArrayEndPtr?: BigNumber) {
        super('MismanagedMemoryError', 'MismanagedMemoryError(uint256 freeMemPtr, uint256 addressArrayEndPtr)', {
            freeMemPtr,
            addressArrayEndPtr,
        });
    }
}

// Register the MismanagedMemoryError type
RevertError.registerType(MismanagedMemoryError);
