import { RevertError } from '../../revert_error';
import { Numberish } from '../../types';

// tslint:disable:max-classes-per-file
export class OnlyCallableBySelfError extends RevertError {
    constructor(sender?: string) {
        super('OnlyCallableBySelfError', 'OnlyCallableBySelfError(address sender)', {
            sender,
        });
    }
}

export class IllegalReentrancyError extends RevertError {
    constructor(selector?: string, reentrancyFlags?: Numberish) {
        super('IllegalReentrancyError', 'IllegalReentrancyError(bytes4 selector, uint256 reentrancyFlags)', {
            selector,
            reentrancyFlags,
        });
    }
}

const types = [OnlyCallableBySelfError, IllegalReentrancyError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
