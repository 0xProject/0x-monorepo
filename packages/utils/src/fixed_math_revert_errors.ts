import { BigNumber } from './configured_bignumber';
import { RevertError } from './revert_error';

// tslint:disable:max-classes-per-file

export enum ValueErrorCodes {
    TooSmall,
    TooLarge,
}

export enum BinOpErrorCodes {
    AdditionOverflow,
    SubtractionUnderflow,
    MultiplicationOverflow,
    DivisionByZero,
}

export class FixedMathSignedValueError extends RevertError {
    constructor(error?: ValueErrorCodes, n?: BigNumber | number | string) {
        super('FixedMathSignedValueError', 'FixedMathSignedValueError(uint8 error, int256 n)', {
            error,
            n,
        });
    }
}

export class FixedMathUnsignedValueError extends RevertError {
    constructor(error?: ValueErrorCodes, n?: BigNumber | number | string) {
        super('FixedMathUnsignedValueError', 'FixedMathUnsignedValueError(uint8 error, uint256 n)', {
            error,
            n,
        });
    }
}

export class FixedMathBinOpError extends RevertError {
    constructor(error?: BinOpErrorCodes, a?: BigNumber | number | string, b?: BigNumber | number | string) {
        super('FixedMathBinOpError', 'FixedMathBinOpError(uint8 error, int256 a, int256 b)', {
            error,
            a,
            b,
        });
    }
}

const types = [ FixedMathSignedValueError, FixedMathUnsignedValueError, FixedMathBinOpError ];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
