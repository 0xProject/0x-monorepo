import { BigNumber } from '@0x/utils';

import SafeMathRevertErrors = require('./safe_math_revert_errors');

const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

/**
 * Add two `uint256` values. Reverts on overflow.
 */
export function safeAdd(a: BigNumber, b: BigNumber): BigNumber {
    const r = a.plus(b);
    if (r.isGreaterThan(MAX_UINT256)) {
        throw new SafeMathRevertErrors.Uint256BinOpError(SafeMathRevertErrors.BinOpErrorCodes.AdditionOverflow, a, b);
    }
    return r;
}

/**
 * Subract two `uint256` values. Reverts on overflow.
 */
export function safeSub(a: BigNumber, b: BigNumber): BigNumber {
    const r = a.minus(b);
    if (r.isLessThan(0)) {
        throw new SafeMathRevertErrors.Uint256BinOpError(
            SafeMathRevertErrors.BinOpErrorCodes.SubtractionUnderflow,
            a,
            b,
        );
    }
    return r;
}

/**
 * Multiplies two `uint256` values. Reverts on overflow.
 */
export function safeMul(a: BigNumber, b: BigNumber): BigNumber {
    const r = a.times(b);
    if (r.isGreaterThan(MAX_UINT256)) {
        throw new SafeMathRevertErrors.Uint256BinOpError(
            SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
            a,
            b,
        );
    }
    return r;
}

/**
 * Divides two `uint256` values. Reverts on division by zero.
 */
export function safeDiv(a: BigNumber, b: BigNumber): BigNumber {
    if (b.isEqualTo(0)) {
        throw new SafeMathRevertErrors.Uint256BinOpError(SafeMathRevertErrors.BinOpErrorCodes.DivisionByZero, a, b);
    }
    return a.dividedToIntegerBy(b);
}
