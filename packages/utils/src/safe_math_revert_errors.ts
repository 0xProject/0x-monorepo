import { BigNumber } from './configured_bignumber';
import { RevertError } from './revert_error';

// tslint:disable:max-classes-per-file

export enum BinOpErrorCodes {
    AdditionOverflow,
    MultiplicationOverflow,
    SubtractionUnderflow,
    DivisionByZero,
}

export enum DowncastErrorCodes {
    ValueTooLargeToDowncastToUint32,
    ValueTooLargeToDowncastToUint64,
    ValueTooLargeToDowncastToUint96,
}

export class Uint256BinOpError extends RevertError {
    constructor(error?: BinOpErrorCodes, a?: BigNumber, b?: BigNumber) {
        super('Uint256BinOpError', 'Uint256BinOpError(uint8 error, uint256 a, uint256 b)', {
            error,
            a,
            b,
        });
    }
}

export class Uint96BinOpError extends RevertError {
    constructor(error?: BinOpErrorCodes, a?: BigNumber, b?: BigNumber) {
        super('Uint96BinOpError', 'Uint96BinOpError(uint8 error, uint96 a, uint96 b)', {
            error,
            a,
            b,
        });
    }
}

export class Uint64BinOpError extends RevertError {
    constructor(error?: BinOpErrorCodes, a?: BigNumber, b?: BigNumber) {
        super('Uint64BinOpError', 'Uint64BinOpError(uint8 error, uint64 a, uint64 b)', {
            error,
            a,
            b,
        });
    }
}

export class Uint256DowncastError extends RevertError {
    constructor(error?: DowncastErrorCodes, a?: BigNumber) {
        super('Uint256DowncastError', 'Uint256DowncastError(uint8 error, uint256 a)', {
            error,
            a,
        });
    }
}

const types = [Uint256BinOpError, Uint96BinOpError, Uint64BinOpError, Uint256DowncastError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
