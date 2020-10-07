import { RevertError } from '../../revert_error';

// tslint:disable:max-classes-per-file

export class MigrateCallFailedError extends RevertError {
    constructor(target?: string, resultData?: string) {
        super('MigrateCallFailedError', 'MigrateCallFailedError(address target, bytes resultData)', {
            target,
            resultData,
        });
    }
}

export class OnlyOwnerError extends RevertError {
    constructor(sender?: string, owner?: string) {
        super('OnlyOwnerError', 'OnlyOwnerError(address sender, bytes owner)', {
            sender,
            owner,
        });
    }
}

// This is identical to the one in utils.
// export class TransferOwnerToZeroError extends RevertError {
//     constructor() {
//         super('TransferOwnerToZeroError', 'TransferOwnerToZeroError()', {});
//     }
// }

const types = [MigrateCallFailedError, OnlyOwnerError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
