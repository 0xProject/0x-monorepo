import { RevertError } from '@0x/utils';

// tslint:disable:max-classes-per-file
export class OnlyOwnerError extends RevertError {
    constructor(sender?: string, owner?: string) {
        super('OnlyOwnerError', 'OnlyOwnerError(address sender, address owner)', {
            sender,
            owner,
        });
    }
}

export class TransferOwnerToZeroError extends RevertError {
    constructor() {
        super('TransferOwnerToZeroError', 'TransferOwnerToZeroError()', {});
    }
}

const types = [OnlyOwnerError, TransferOwnerToZeroError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
