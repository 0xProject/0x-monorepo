import { RevertError } from '../../revert_error';
import { Numberish } from '../../types';

// tslint:disable:max-classes-per-file
export class WalletExecuteCallFailedError extends RevertError {
    constructor(wallet?: string, callTarget?: string, callData?: string, callValue?: Numberish, errorData?: string) {
        super(
            'WalletExecuteCallFailedError',
            'WalletExecuteCallFailedError(address wallet, address callTarget, bytes callData, uint256 callValue, bytes errorData)',
            {
                wallet,
                callTarget,
                callData,
                callValue,
                errorData,
            },
        );
    }
}

export class WalletExecuteDelegateCallFailedError extends RevertError {
    constructor(wallet?: string, callTarget?: string, callData?: string, errorData?: string) {
        super(
            'WalletExecuteDelegateCallFailedError',
            'WalletExecuteDelegateCallFailedError(address wallet, address callTarget, bytes callData, bytes errorData)',
            {
                wallet,
                callTarget,
                callData,
                errorData,
            },
        );
    }
}

const types = [WalletExecuteCallFailedError, WalletExecuteDelegateCallFailedError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
