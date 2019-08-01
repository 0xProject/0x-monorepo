import { BigNumber } from './configured_bignumber';
import { RevertError } from './revert_error';

// tslint:disable:max-classes-per-file
export class AuthorizedAddressMismatchError extends RevertError {
    constructor(authorized?: string, target?: string) {
        super(
            'AuthorizedAddressMismatchError',
            'AuthorizedAddressMismatchError(address authorized, address target)',
            { authorized, target },
        );
    }
}

export class IndexOutOfBoundsError extends RevertError {
    constructor(index?: BigNumber, length?: BigNumber) {
        super(
            'IndexOutOfBoundsError',
            'IndexOutOfBoundsError(uint256 index, uint256 length)',
            { index, length },
        );
    }
}

export class SenderNotAuthorizedError extends RevertError {
    constructor(sender?: string) {
        super('SenderNotAuthorizedError', 'SenderNotAuthorizedError()', { sender });
    }
}

export class TargetAlreadyAuthorizedError extends RevertError {
    constructor(target?: string) {
        super(
            'TargetAlreadyAuthorizedError',
            'TargetAlreadyAuthorizedError(address target)',
            { target },
        );
    }
}

export class TargetNotAuthorizedError extends RevertError {
    constructor(target?: string) {
        super(
            'TargetNotAuthorizedError',
            'TargetNotAuthorizedError(address target)',
            { target },
        );
    }
}

export class ZeroCantBeAuthorizedError extends RevertError {
    constructor() {
        super('ZeroCantBeAuthorizedError', 'ZeroCantBeAuthorizedError()', {});
    }
}

const types = [
    AuthorizedAddressMismatchError,
    IndexOutOfBoundsError,
    SenderNotAuthorizedError,
    TargetAlreadyAuthorizedError,
    TargetNotAuthorizedError,
    ZeroCantBeAuthorizedError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
