import { RevertError } from '../../revert_error';
import { Numberish } from '../../types';

// tslint:disable:max-classes-per-file
export class SpenderERC20TransferFromFailedError extends RevertError {
    constructor(token?: string, owner?: string, to?: string, amount?: Numberish, errorData?: string) {
        super(
            'SpenderERC20TransferFromFailedError',
            'SpenderERC20TransferFromFailedError(address token, address owner, address to, uint256 amount, bytes errorData)',
            {
                token,
                owner,
                to,
                amount,
                errorData,
            },
        );
    }
}

export class CannotInvokeSelfError extends RevertError {
    constructor() {
        super('CannotInvokeSelfError', 'CannotInvokeSelfError()');
    }
}

const types = [SpenderERC20TransferFromFailedError, CannotInvokeSelfError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
