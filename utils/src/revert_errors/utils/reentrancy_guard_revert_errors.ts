import { RevertError } from '../../revert_error';

export class IllegalReentrancyError extends RevertError {
    constructor() {
        super('IllegalReentrancyError', 'IllegalReentrancyError()', {});
    }
}

// Register the IllegalReentrancyError type
RevertError.registerType(IllegalReentrancyError);
