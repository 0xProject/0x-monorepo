import { RevertError } from '../../revert_error';
import { Numberish } from '../../types';

// tslint:disable:max-classes-per-file
export class PuppetExecuteFailedError extends RevertError {
    constructor(puppet?: string, callTarget?: string, callData?: string, callValue?: Numberish, errorData?: string) {
        super(
            'PuppetExecuteFailedError',
            'PuppetExecuteFailedError(address puppet, address callTarget, bytes callData, uint256 callValue, bytes errorData)',
            {
                puppet,
                callTarget,
                callData,
                callValue,
                errorData,
            },
        );
    }
}

export class PuppetExecuteWithFailedError extends RevertError {
    constructor(puppet?: string, callTarget?: string, callData?: string, errorData?: string) {
        super(
            'PuppetExecuteWithFailedError',
            'PuppetExecuteWithFailedError(address puppet, address callTarget, bytes callData, bytes errorData)',
            {
                puppet,
                callTarget,
                callData,
                errorData,
            },
        );
    }
}

const types = [PuppetExecuteFailedError, PuppetExecuteWithFailedError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
