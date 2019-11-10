import { RevertError } from '@0x/utils';

export class IllegalReentrancyError extends RevertError {
    constructor() {
        super('IllegalReentrancyError', 'IllegalReentrancyError()', {});
    }
}

// Register the IllegalReentrancyError type
RevertError.registerType(IllegalReentrancyError);
