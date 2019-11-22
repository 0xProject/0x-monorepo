import {
    blockchainTests,
    constants,
    describe,
    expect,
    testCombinatoriallyWithReferenceFunc,
    uint256Values,
} from '@0x/contracts-test-utils';
import { SafeMathRevertErrors } from '@0x/contracts-utils';
import { BigNumber, LibMathRevertErrors } from '@0x/utils';

import {
    getPartialAmountCeil,
    getPartialAmountFloor,
    isRoundingErrorCeil,
    isRoundingErrorFloor,
    safeGetPartialAmountCeil,
    safeGetPartialAmountFloor,
} from '../src/reference_functions';

import { artifacts } from './artifacts';
import { TestLibMathContract } from './wrappers';

blockchainTests('LibMath', env => {
    const { ONE_ETHER, MAX_UINT256, MAX_UINT256_ROOT, ZERO_AMOUNT } = constants;
    let libsContract: TestLibMathContract;

    before(async () => {
        libsContract = await TestLibMathContract.deployFrom0xArtifactAsync(
            artifacts.TestLibMath,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    // Wrap a reference function with identical arguments in a promise.
    function createAsyncReferenceFunction<T>(ref: (...args: any[]) => T): (...args: any[]) => Promise<T> {
        return async (...args: any[]): Promise<T> => {
            return ref(...args);
        };
    }

    function createContractTestFunction<T>(name: string): (...args: any[]) => Promise<T> {
        return async (...args: any[]): Promise<T> => {
            return (libsContract as any)[name](...args).callAsync;
        };
    }

    describe('getPartialAmountFloor', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'getPartialAmountFloor',
                createAsyncReferenceFunction(getPartialAmountFloor),
                createContractTestFunction('getPartialAmountFloor'),
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            it('matches the reference function output', async () => {
                const numerator = ONE_ETHER;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = ONE_ETHER.times(0.01);
                const expected = getPartialAmountFloor(numerator, denominator, target);
                const actual = await libsContract.getPartialAmountFloor(numerator, denominator, target).callAsync();
                expect(actual).to.bignumber.eq(expected);
            });

            it('rounds down when computing the partial amount', async () => {
                const numerator = ONE_ETHER.times(0.6);
                const denominator = ONE_ETHER.times(1.8);
                const target = ONE_ETHER;
                const expected = ONE_ETHER.dividedToIntegerBy(3);
                const actual = await libsContract.getPartialAmountFloor(numerator, denominator, target).callAsync();
                expect(actual).to.bignumber.eq(expected);
            });

            it('reverts if `denominator` is zero', async () => {
                const numerator = ONE_ETHER;
                const denominator = ZERO_AMOUNT;
                const target = ONE_ETHER.times(0.01);
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.DivisionByZero,
                    numerator.times(target),
                    denominator,
                );
                return expect(
                    libsContract.getPartialAmountFloor(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });

            it('reverts if `numerator * target` overflows', async () => {
                const numerator = MAX_UINT256;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = MAX_UINT256_ROOT.times(2);
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    numerator,
                    target,
                );
                return expect(
                    libsContract.getPartialAmountFloor(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });
        });
    });

    describe('getPartialAmountCeil', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'getPartialAmountCeil',
                createAsyncReferenceFunction(getPartialAmountCeil),
                createContractTestFunction('getPartialAmountCeil'),
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            it('matches the reference function output', async () => {
                const numerator = ONE_ETHER;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = ONE_ETHER.times(0.01);
                const expected = getPartialAmountCeil(numerator, denominator, target);
                const actual = await libsContract.getPartialAmountCeil(numerator, denominator, target).callAsync();
                expect(actual).to.bignumber.eq(expected);
            });

            it('rounds up when computing the partial amount', async () => {
                const numerator = ONE_ETHER.times(0.6);
                const denominator = ONE_ETHER.times(1.8);
                const target = ONE_ETHER;
                const expected = ONE_ETHER.dividedToIntegerBy(3).plus(1);
                const actual = await libsContract.getPartialAmountCeil(numerator, denominator, target).callAsync();
                expect(actual).to.bignumber.eq(expected);
            });

            it('reverts if `denominator` is zero', async () => {
                const numerator = ONE_ETHER;
                const denominator = ZERO_AMOUNT;
                const target = ONE_ETHER.times(0.01);
                // This will actually manifest as a subtraction underflow.
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.SubtractionUnderflow,
                    denominator,
                    new BigNumber(1),
                );
                return expect(
                    libsContract.getPartialAmountCeil(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });

            it('reverts if `numerator * target` overflows', async () => {
                const numerator = MAX_UINT256;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = MAX_UINT256_ROOT.times(2);
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    numerator,
                    target,
                );
                return expect(
                    libsContract.getPartialAmountCeil(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });
        });
    });

    describe('safeGetPartialAmountFloor', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'safeGetPartialAmountFloor',
                createAsyncReferenceFunction(safeGetPartialAmountFloor),
                createContractTestFunction('safeGetPartialAmountFloor'),
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            it('matches the reference function output', async () => {
                const numerator = ONE_ETHER;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = ONE_ETHER.times(0.01);
                const expected = safeGetPartialAmountFloor(numerator, denominator, target);
                const actual = await libsContract.safeGetPartialAmountFloor(numerator, denominator, target).callAsync();
                expect(actual).to.bignumber.eq(expected);
            });

            it('rounds down when computing the partial amount', async () => {
                const numerator = ONE_ETHER.times(0.6);
                const denominator = ONE_ETHER.times(1.8);
                const target = ONE_ETHER;
                const expected = ONE_ETHER.dividedToIntegerBy(3);
                const actual = await libsContract.safeGetPartialAmountFloor(numerator, denominator, target).callAsync();
                expect(actual).to.bignumber.eq(expected);
            });

            it('reverts for a rounding error', async () => {
                const numerator = new BigNumber(1e3);
                const denominator = new BigNumber(1e4);
                const target = new BigNumber(333);
                const expectedError = new LibMathRevertErrors.RoundingError(numerator, denominator, target);
                return expect(
                    libsContract.safeGetPartialAmountFloor(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });

            it('reverts if `denominator` is zero', async () => {
                const numerator = ONE_ETHER;
                const denominator = ZERO_AMOUNT;
                const target = ONE_ETHER.times(0.01);
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(
                    libsContract.safeGetPartialAmountFloor(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });

            it('reverts if `numerator * target` overflows', async () => {
                const numerator = MAX_UINT256;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = MAX_UINT256_ROOT.times(2);
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    numerator,
                    target,
                );
                return expect(
                    libsContract.safeGetPartialAmountFloor(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });
        });
    });

    describe('safeGetPartialAmountCeil', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'safeGetPartialAmountCeil',
                createAsyncReferenceFunction(safeGetPartialAmountCeil),
                createContractTestFunction('safeGetPartialAmountCeil'),
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            it('matches the reference function output', async () => {
                const numerator = ONE_ETHER;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = ONE_ETHER.times(0.01);
                const expected = safeGetPartialAmountCeil(numerator, denominator, target);
                const actual = await libsContract.safeGetPartialAmountCeil(numerator, denominator, target).callAsync();
                expect(actual).to.bignumber.eq(expected);
            });

            it('rounds up when computing the partial amount', async () => {
                const numerator = ONE_ETHER.times(0.6);
                const denominator = ONE_ETHER.times(1.8);
                const target = ONE_ETHER;
                const expected = ONE_ETHER.dividedToIntegerBy(3).plus(1);
                const actual = await libsContract.safeGetPartialAmountCeil(numerator, denominator, target).callAsync();
                expect(actual).to.bignumber.eq(expected);
            });

            it('reverts for a rounding error', async () => {
                const numerator = new BigNumber(1e3);
                const denominator = new BigNumber(1e4);
                const target = new BigNumber(333);
                const expectedError = new LibMathRevertErrors.RoundingError(numerator, denominator, target);
                return expect(
                    libsContract.safeGetPartialAmountCeil(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });

            it('reverts if `denominator` is zero', async () => {
                const numerator = ONE_ETHER;
                const denominator = ZERO_AMOUNT;
                const target = ONE_ETHER.times(0.01);
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(
                    libsContract.safeGetPartialAmountCeil(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });

            it('reverts if `numerator * target` overflows', async () => {
                const numerator = MAX_UINT256;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = MAX_UINT256_ROOT.times(2);
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    numerator,
                    target,
                );
                return expect(
                    libsContract.safeGetPartialAmountCeil(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });
        });
    });

    describe('isRoundingErrorFloor', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'isRoundingErrorFloor',
                createAsyncReferenceFunction(isRoundingErrorFloor),
                createContractTestFunction('isRoundingErrorFloor'),
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            it('returns true when `numerator * target / denominator` produces an error >= 0.1%', async () => {
                const numerator = new BigNumber(100);
                const denominator = new BigNumber(102);
                const target = new BigNumber(52);
                // tslint:disable-next-line: boolean-naming
                const actual = await libsContract.isRoundingErrorFloor(numerator, denominator, target).callAsync();
                expect(actual).to.eq(true);
            });

            it('returns false when `numerator * target / denominator` produces an error < 0.1%', async () => {
                const numerator = new BigNumber(100);
                const denominator = new BigNumber(101);
                const target = new BigNumber(92);
                // tslint:disable-next-line: boolean-naming
                const actual = await libsContract.isRoundingErrorFloor(numerator, denominator, target).callAsync();
                expect(actual).to.eq(false);
            });

            it('matches the reference function output', async () => {
                const numerator = ONE_ETHER;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = ONE_ETHER.times(0.01);
                // tslint:disable-next-line: boolean-naming
                const expected = isRoundingErrorFloor(numerator, denominator, target);
                // tslint:disable-next-line: boolean-naming
                const actual = await libsContract.isRoundingErrorFloor(numerator, denominator, target).callAsync();
                expect(actual).to.eq(expected);
            });

            it('reverts if `denominator` is zero', async () => {
                const numerator = ONE_ETHER;
                const denominator = ZERO_AMOUNT;
                const target = ONE_ETHER.times(0.01);
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(
                    libsContract.isRoundingErrorFloor(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });

            it('reverts if `numerator * target` overflows', async () => {
                const numerator = MAX_UINT256;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = MAX_UINT256_ROOT.times(2);
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    numerator,
                    target,
                );
                return expect(
                    libsContract.isRoundingErrorFloor(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });
        });
    });

    describe('isRoundingErrorCeil', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'isRoundingErrorCeil',
                createAsyncReferenceFunction(isRoundingErrorCeil),
                createContractTestFunction('isRoundingErrorCeil'),
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            it('returns true when `numerator * target / (denominator - 1)` produces an error >= 0.1%', async () => {
                const numerator = new BigNumber(100);
                const denominator = new BigNumber(101);
                const target = new BigNumber(92);
                // tslint:disable-next-line: boolean-naming
                const actual = await libsContract.isRoundingErrorCeil(numerator, denominator, target).callAsync();
                expect(actual).to.eq(true);
            });

            it('returns false when `numerator * target / (denominator - 1)` produces an error < 0.1%', async () => {
                const numerator = new BigNumber(100);
                const denominator = new BigNumber(102);
                const target = new BigNumber(52);
                // tslint:disable-next-line: boolean-naming
                const actual = await libsContract.isRoundingErrorCeil(numerator, denominator, target).callAsync();
                expect(actual).to.eq(false);
            });

            it('matches the reference function output', async () => {
                const numerator = ONE_ETHER;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = ONE_ETHER.times(0.01);
                // tslint:disable-next-line: boolean-naming
                const expected = isRoundingErrorCeil(numerator, denominator, target);
                // tslint:disable-next-line: boolean-naming
                const actual = await libsContract.isRoundingErrorCeil(numerator, denominator, target).callAsync();
                expect(actual).to.eq(expected);
            });

            it('reverts if `denominator` is zero', async () => {
                const numerator = ONE_ETHER;
                const denominator = ZERO_AMOUNT;
                const target = ONE_ETHER.times(0.01);
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(
                    libsContract.isRoundingErrorCeil(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });

            it('reverts if `numerator * target` overflows', async () => {
                const numerator = MAX_UINT256;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = MAX_UINT256_ROOT.times(2);
                const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                    SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    numerator,
                    target,
                );
                return expect(
                    libsContract.isRoundingErrorCeil(numerator, denominator, target).callAsync(),
                ).to.revertWith(expectedError);
            });
        });
    });
});
