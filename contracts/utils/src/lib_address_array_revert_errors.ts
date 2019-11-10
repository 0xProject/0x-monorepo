import { BigNumber, RevertError } from '@0x/utils';

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
