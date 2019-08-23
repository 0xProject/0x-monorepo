import { constants, describe, expect } from '@0x/contracts-test-utils';
import { SafeMathRevertErrors } from '@0x/utils';

import { safeAdd, safeDiv, safeMul, safeSub } from '../src/reference_functions';

describe('Reference Functions', () => {
    const { ONE_ETHER, MAX_UINT256, ZERO_AMOUNT } = constants;
    const DEFAULT_VALUES = {
        a: ONE_ETHER.times(2),
        b: ONE_ETHER,
    };
    describe('SafeMath', () => {
        describe('safeAdd', () => {
            it('adds two numbers', () => {
                const { a, b } = DEFAULT_VALUES;
                const expected = a.plus(b);
                const actual = safeAdd(a, b);
                expect(actual).to.bignumber.eq(expected);
            });

            it('reverts on overflow', () => {
                const a = MAX_UINT256.dividedToIntegerBy(2);
                const b = MAX_UINT256.dividedToIntegerBy(2).plus(2);
                const expectedError = new SafeMathRevertErrors.Uint256BinopError(
                    SafeMathRevertErrors.BinopErrorCodes.AdditionOverflow,
                    a,
                    b,
                );
                expect(() => safeAdd(a, b)).to.throw(expectedError.message);
            });
        });

        describe('safeSub', () => {
            it('subracts two numbers', () => {
                const { a, b } = DEFAULT_VALUES;
                const expected = a.minus(b);
                const actual = safeSub(a, b);
                expect(actual).to.bignumber.eq(expected);
            });

            it('reverts on underflow', () => {
                const a = MAX_UINT256.dividedToIntegerBy(2);
                const b = MAX_UINT256.dividedToIntegerBy(2).plus(2);
                const expectedError = new SafeMathRevertErrors.Uint256BinopError(
                    SafeMathRevertErrors.BinopErrorCodes.SubtractionUnderflow,
                    a,
                    b,
                );
                expect(() => safeSub(a, b)).to.throw(expectedError.message);
            });
        });

        describe('safeMul', () => {
            it('multiplies two numbers', () => {
                const { a, b } = DEFAULT_VALUES;
                const expected = a.times(b);
                const actual = safeMul(a, b);
                expect(actual).to.bignumber.eq(expected);
            });

            it('reverts on overflow', () => {
                const a = MAX_UINT256.dividedToIntegerBy(2);
                const b = MAX_UINT256.dividedToIntegerBy(2).plus(2);
                const expectedError = new SafeMathRevertErrors.Uint256BinopError(
                    SafeMathRevertErrors.BinopErrorCodes.MultiplicationOverflow,
                    a,
                    b,
                );
                expect(() => safeMul(a, b)).to.throw(expectedError.message);
            });
        });

        describe('safeDiv', () => {
            it('multiplies two numbers', () => {
                const { a, b } = DEFAULT_VALUES;
                const expected = a.times(b);
                const actual = safeMul(a, b);
                expect(actual).to.bignumber.eq(expected);
            });

            it('reverts if denominator is zero', () => {
                const a = MAX_UINT256.dividedToIntegerBy(2);
                const b = ZERO_AMOUNT;
                const expectedError = new SafeMathRevertErrors.Uint256BinopError(
                    SafeMathRevertErrors.BinopErrorCodes.DivisionByZero,
                    a,
                    b,
                );
                expect(() => safeDiv(a, b)).to.throw(expectedError.message);
            });
        });
    });
});
