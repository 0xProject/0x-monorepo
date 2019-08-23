import { BigNumber } from './configured_bignumber';
import { RevertError } from './revert_error';

// tslint:disable:max-classes-per-file

export enum BinopErrorCodes {
    AdditionOverflow,
    MultiplicationOverflow,
    SubtractionUnderflow,
    DivisionByZero,
}

export enum DowncastErrorCodes {
    ValueTooLargeToDowncastToUint64,
    ValueTooLargeToDowncastToUint96,
}

export class Uint256BinopError extends RevertError {
    constructor(error?: BinopErrorCodes, a?: BigNumber, b?: BigNumber) {
        super('Uint256BinopError', 'Uint256BinopError(uint8 error, uint256 a, uint256 b)', {
            error,
            a,
            b,
        });
    }
}

export class Uint96BinopError extends RevertError {
    constructor(error?: BinopErrorCodes, a?: BigNumber, b?: BigNumber) {
        super('Uint96BinopError', 'Uint96BinopError(uint8 error, uint96 a, uint96 b)', {
            error,
            a,
            b,
        });
    }
}

export class Uint64BinopError extends RevertError {
    constructor(error?: BinopErrorCodes, a?: BigNumber, b?: BigNumber) {
        super('Uint64BinopError', 'Uint64BinopError(uint8 error, uint64 a, uint64 b)', {
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

const types = [Uint256BinopError, Uint96BinopError, Uint64BinopError, Uint256DowncastError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
