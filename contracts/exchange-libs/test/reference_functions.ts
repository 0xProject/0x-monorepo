import { constants, describe, expect } from '@0x/contracts-test-utils';
import { LibMathRevertErrors } from '@0x/order-utils';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import {
    addFillResults,
    getPartialAmountCeil,
    getPartialAmountFloor,
    isRoundingErrorCeil,
    isRoundingErrorFloor,
    safeGetPartialAmountCeil,
    safeGetPartialAmountFloor,
} from '../src/reference_functions';

describe('Reference Functions', () => {
    const { ONE_ETHER, MAX_UINT256, MAX_UINT256_ROOT, ZERO_AMOUNT } = constants;
    describe('LibFillResults', () => {
        describe('addFillResults', () => {
            const DEFAULT_FILL_RESULTS = [
                {
                    makerAssetFilledAmount: ONE_ETHER,
                    takerAssetFilledAmount: ONE_ETHER.times(2),
                    makerFeePaid: ONE_ETHER.times(0.001),
                    takerFeePaid: ONE_ETHER.times(0.002),
                    protocolFeePaid: ONE_ETHER.times(0.003),
                },
                {
                    makerAssetFilledAmount: ONE_ETHER.times(0.01),
                    takerAssetFilledAmount: ONE_ETHER.times(2).times(0.01),
                    makerFeePaid: ONE_ETHER.times(0.001).times(0.01),
                    takerFeePaid: ONE_ETHER.times(0.002).times(0.01),
                    protocolFeePaid: ONE_ETHER.times(0.003).times(0.01),
                },
            ];

            it('reverts if computing `makerAssetFilledAmount` overflows', () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.makerAssetFilledAmount = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.makerAssetFilledAmount,
                    b.makerAssetFilledAmount,
                );
                expect(() => addFillResults(a, b)).to.throw(expectedError.message);
            });

            it('reverts if computing `takerAssetFilledAmount` overflows', () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.takerAssetFilledAmount = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.takerAssetFilledAmount,
                    b.takerAssetFilledAmount,
                );
                expect(() => addFillResults(a, b)).to.throw(expectedError.message);
            });

            it('reverts if computing `makerFeePaid` overflows', () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.makerFeePaid = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.makerFeePaid,
                    b.makerFeePaid,
                );
                expect(() => addFillResults(a, b)).to.throw(expectedError.message);
            });

            it('reverts if computing `takerFeePaid` overflows', () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.takerFeePaid = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.takerFeePaid,
                    b.takerFeePaid,
                );
                expect(() => addFillResults(a, b)).to.throw(expectedError.message);
            });

            it('reverts if computing `protocolFeePaid` overflows', () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.protocolFeePaid = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.protocolFeePaid,
                    b.protocolFeePaid,
                );
                expect(() => addFillResults(a, b)).to.throw(expectedError.message);
            });
        });
    });

    describe('LibMath', () => {
        describe('getPartialAmountFloor', () => {
            describe('explicit tests', () => {
                it('reverts if `denominator` is zero', () => {
                    const numerator = ONE_ETHER;
                    const denominator = ZERO_AMOUNT;
                    const target = ONE_ETHER.times(0.01);
                    const expectedError = new SafeMathRevertErrors.SafeMathError(
                        SafeMathRevertErrors.SafeMathErrorCodes.Uint256DivisionByZero,
                        numerator.times(target),
                        denominator,
                    );
                    return expect(() => getPartialAmountFloor(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });

                it('reverts if `numerator * target` overflows', () => {
                    const numerator = MAX_UINT256;
                    const denominator = ONE_ETHER.dividedToIntegerBy(2);
                    const target = MAX_UINT256_ROOT.times(2);
                    const expectedError = new SafeMathRevertErrors.SafeMathError(
                        SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                        numerator,
                        target,
                    );
                    return expect(() => getPartialAmountFloor(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });
            });
        });

        describe('getPartialAmountCeil', () => {
            describe('explicit tests', () => {
                it('reverts if `denominator` is zero', () => {
                    const numerator = ONE_ETHER;
                    const denominator = ZERO_AMOUNT;
                    const target = ONE_ETHER.times(0.01);
                    // This will actually manifest as a subtraction underflow.
                    const expectedError = new SafeMathRevertErrors.SafeMathError(
                        SafeMathRevertErrors.SafeMathErrorCodes.Uint256SubtractionUnderflow,
                        denominator,
                        new BigNumber(1),
                    );
                    return expect(() => getPartialAmountCeil(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });

                it('reverts if `numerator * target` overflows', () => {
                    const numerator = MAX_UINT256;
                    const denominator = ONE_ETHER.dividedToIntegerBy(2);
                    const target = MAX_UINT256_ROOT.times(2);
                    const expectedError = new SafeMathRevertErrors.SafeMathError(
                        SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                        numerator,
                        target,
                    );
                    return expect(() => getPartialAmountCeil(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });
            });
        });

        describe('safeGetPartialAmountFloor', () => {
            describe('explicit tests', () => {
                it('reverts for a rounding error', () => {
                    const numerator = new BigNumber(1e3);
                    const denominator = new BigNumber(1e4);
                    const target = new BigNumber(333);
                    const expectedError = new LibMathRevertErrors.RoundingError(numerator, denominator, target);
                    return expect(() => safeGetPartialAmountFloor(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });

                it('reverts if `denominator` is zero', () => {
                    const numerator = ONE_ETHER;
                    const denominator = ZERO_AMOUNT;
                    const target = ONE_ETHER.times(0.01);
                    const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                    return expect(() => safeGetPartialAmountFloor(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });

                it('reverts if `numerator * target` overflows', () => {
                    const numerator = MAX_UINT256;
                    const denominator = ONE_ETHER.dividedToIntegerBy(2);
                    const target = MAX_UINT256_ROOT.times(2);
                    const expectedError = new SafeMathRevertErrors.SafeMathError(
                        SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                        numerator,
                        target,
                    );
                    return expect(() => safeGetPartialAmountFloor(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });
            });
        });

        describe('safeGetPartialAmountCeil', () => {
            describe('explicit tests', () => {
                it('reverts for a rounding error', () => {
                    const numerator = new BigNumber(1e3);
                    const denominator = new BigNumber(1e4);
                    const target = new BigNumber(333);
                    const expectedError = new LibMathRevertErrors.RoundingError(numerator, denominator, target);
                    return expect(() => safeGetPartialAmountCeil(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });

                it('reverts if `denominator` is zero', () => {
                    const numerator = ONE_ETHER;
                    const denominator = ZERO_AMOUNT;
                    const target = ONE_ETHER.times(0.01);
                    const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                    return expect(() => safeGetPartialAmountCeil(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });

                it('reverts if `numerator * target` overflows', () => {
                    const numerator = MAX_UINT256;
                    const denominator = ONE_ETHER.dividedToIntegerBy(2);
                    const target = MAX_UINT256_ROOT.times(2);
                    const expectedError = new SafeMathRevertErrors.SafeMathError(
                        SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                        numerator,
                        target,
                    );
                    return expect(() => safeGetPartialAmountCeil(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });
            });
        });

        describe('isRoundingErrorFloor', () => {
            describe('explicit tests', () => {
                it('returns true when `numerator * target / denominator` produces an error >= 0.1%', async () => {
                    const numerator = new BigNumber(100);
                    const denominator = new BigNumber(102);
                    const target = new BigNumber(52);
                    // tslint:disable-next-line: boolean-naming
                    const actual = isRoundingErrorFloor(numerator, denominator, target);
                    expect(actual).to.eq(true);
                });

                it('returns false when `numerator * target / denominator` produces an error < 0.1%', async () => {
                    const numerator = new BigNumber(100);
                    const denominator = new BigNumber(101);
                    const target = new BigNumber(92);
                    // tslint:disable-next-line: boolean-naming
                    const actual = isRoundingErrorFloor(numerator, denominator, target);
                    expect(actual).to.eq(false);
                });

                it('reverts if `denominator` is zero', () => {
                    const numerator = ONE_ETHER;
                    const denominator = ZERO_AMOUNT;
                    const target = ONE_ETHER.times(0.01);
                    const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                    return expect(() => isRoundingErrorFloor(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });

                it('reverts if `numerator * target` overflows', () => {
                    const numerator = MAX_UINT256;
                    const denominator = ONE_ETHER.dividedToIntegerBy(2);
                    const target = MAX_UINT256_ROOT.times(2);
                    const expectedError = new SafeMathRevertErrors.SafeMathError(
                        SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                        numerator,
                        target,
                    );
                    return expect(() => isRoundingErrorFloor(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });
            });
        });

        describe('isRoundingErrorCeil', () => {
            describe('explicit tests', () => {
                it('returns true when `numerator * target / (denominator - 1)` produces an error >= 0.1%', async () => {
                    const numerator = new BigNumber(100);
                    const denominator = new BigNumber(101);
                    const target = new BigNumber(92);
                    // tslint:disable-next-line: boolean-naming
                    const actual = isRoundingErrorCeil(numerator, denominator, target);
                    expect(actual).to.eq(true);
                });

                it('returns false when `numerator * target / (denominator - 1)` produces an error < 0.1%', async () => {
                    const numerator = new BigNumber(100);
                    const denominator = new BigNumber(102);
                    const target = new BigNumber(52);
                    // tslint:disable-next-line: boolean-naming
                    const actual = isRoundingErrorCeil(numerator, denominator, target);
                    expect(actual).to.eq(false);
                });

                it('reverts if `denominator` is zero', () => {
                    const numerator = ONE_ETHER;
                    const denominator = ZERO_AMOUNT;
                    const target = ONE_ETHER.times(0.01);
                    const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                    return expect(() => isRoundingErrorCeil(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });

                it('reverts if `numerator * target` overflows', () => {
                    const numerator = MAX_UINT256;
                    const denominator = ONE_ETHER.dividedToIntegerBy(2);
                    const target = MAX_UINT256_ROOT.times(2);
                    const expectedError = new SafeMathRevertErrors.SafeMathError(
                        SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                        numerator,
                        target,
                    );
                    return expect(() => isRoundingErrorCeil(numerator, denominator, target)).to.throw(
                        expectedError.message,
                    );
                });
            });
        });
    });
});
