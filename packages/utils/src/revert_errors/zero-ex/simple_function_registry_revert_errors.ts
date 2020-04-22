import { RevertError } from '../../revert_error';

// tslint:disable:max-classes-per-file
export class NotInRollbackHistoryError extends RevertError {
    constructor(selector?: string, targetImpl?: string) {
        super('NotInRollbackHistoryError', 'NotInRollbackHistoryError(bytes4 selector, address targetImpl)', {
            selector,
            targetImpl,
        });
    }
}

const types = [NotInRollbackHistoryError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
