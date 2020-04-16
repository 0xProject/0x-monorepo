import { RevertError } from '../../revert_error';

// tslint:disable:max-classes-per-file
export class AlreadyMigratingError extends RevertError {
    constructor() {
        super('AlreadyMigratingError', 'AlreadyMigratingError()', {});
    }
}

export class MigrateCallFailedError extends RevertError {
    constructor(target?: string, resultData?: string) {
        super('MigrateCallFailedError', 'MigrateCallFailedError(address target, bytes resultData)', {
            target,
            resultData,
        });
    }
}

const types = [AlreadyMigratingError, MigrateCallFailedError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
