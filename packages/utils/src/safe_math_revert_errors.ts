import { BigNumber } from './configured_bignumber';
import { RevertError } from './revert_error';

export enum SafeMathErrorCodes {
    Uint256AdditionOverflow,
    Uint256MultiplicationOverflow,
    Uint256SubtractionUnderflow,
}

export class SafeMathError extends RevertError {
    constructor(error?: SafeMathErrorCodes, a?: BigNumber, b?: BigNumber) {
        super('SafeMathError', 'SafeMathError(uint8 error, uint256 a, uint256 b)', {
            error,
            a,
            b,
        });
    }
}

RevertError.registerType(SafeMathError);
