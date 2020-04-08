import { RevertError } from '../../revert_error';

// tslint:disable:max-classes-per-file
export class NoRollbackHistoryError extends RevertError {
    constructor(selector?: string) {
        super('NoRollbackHistoryError', 'NoRollbackHistoryError(bytes4 selector)', {
            selector,
        });
    }
}

const types = [NoRollbackHistoryError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
