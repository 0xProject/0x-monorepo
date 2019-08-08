import {
    blockchainTests,
    constants,
    describe,
    expect,
    testCombinatoriallyWithReferenceFunc,
    uint256Values,
} from '@0x/contracts-test-utils';
import { LibMathRevertErrors } from '@0x/order-utils';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';

import { artifacts, ReferenceFunctions, TestLibsContract } from '../src';

blockchainTests('LibMath', env => {
    const CHAIN_ID = 1337;
    const { ONE_ETHER, MAX_UINT256, MAX_UINT256_ROOT, ZERO_AMOUNT } = constants;
    let libsContract: TestLibsContract;

    before(async () => {
        libsContract = await TestLibsContract.deployFrom0xArtifactAsync(
            artifacts.TestLibs,
            env.provider,
            env.txDefaults,
            new BigNumber(CHAIN_ID),
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
            const method = (libsContract as any)[name] as { callAsync: (...args: any[]) => Promise<T> };
            return method.callAsync(...args);
        };
    }

    describe('getPartialAmountFloor', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'getPartialAmountFloor',
                createAsyncReferenceFunction(ReferenceFunctions.getPartialAmountFloor),
                createContractTestFunction('getPartialAmountFloor'),
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            it('matches the reference function output', async () => {
                const numerator = ONE_ETHER;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = ONE_ETHER.times(0.01);
                const expected = ReferenceFunctions.getPartialAmountFloor(numerator, denominator, target);
                const actual = await libsContract.getPartialAmountFloor.callAsync(numerator, denominator, target);
                expect(actual).to.bignumber.eq(expected);
            });

            it('rounds down when computing the partial amount', async () => {
                const numerator = ONE_ETHER.times(0.6);
                const denominator = ONE_ETHER.times(1.8);
                const target = ONE_ETHER;
                const expected = ONE_ETHER.dividedToIntegerBy(3);
                const actual = await libsContract.getPartialAmountFloor.callAsync(numerator, denominator, target);
                expect(actual).to.bignumber.eq(expected);
            });

            it('reverts if `denominator` is zero', async () => {
                const numerator = ONE_ETHER;
                const denominator = ZERO_AMOUNT;
                const target = ONE_ETHER.times(0.01);
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256DivisionByZero,
                    numerator.times(target),
                    denominator,
                );
                return expect(
                    libsContract.getPartialAmountFloor.callAsync(numerator, denominator, target),
                ).to.revertWith(expectedError);
            });

            it('reverts if `numerator * target` overflows', async () => {
                const numerator = MAX_UINT256;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = MAX_UINT256_ROOT.times(2);
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    numerator,
                    target,
                );
                return expect(
                    libsContract.getPartialAmountFloor.callAsync(numerator, denominator, target),
                ).to.revertWith(expectedError);
            });
        });
    });

    describe('getPartialAmountCeil', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'getPartialAmountCeil',
                createAsyncReferenceFunction(ReferenceFunctions.getPartialAmountCeil),
                createContractTestFunction('getPartialAmountCeil'),
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            it('matches the reference function output', async () => {
                const numerator = ONE_ETHER;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = ONE_ETHER.times(0.01);
                const expected = ReferenceFunctions.getPartialAmountCeil(numerator, denominator, target);
                const actual = await libsContract.getPartialAmountCeil.callAsync(numerator, denominator, target);
                expect(actual).to.bignumber.eq(expected);
            });

            it('rounds up when computing the partial amount', async () => {
                const numerator = ONE_ETHER.times(0.6);
                const denominator = ONE_ETHER.times(1.8);
                const target = ONE_ETHER;
                const expected = ONE_ETHER.dividedToIntegerBy(3).plus(1);
                const actual = await libsContract.getPartialAmountCeil.callAsync(numerator, denominator, target);
                expect(actual).to.bignumber.eq(expected);
            });

            it('reverts if `denominator` is zero', async () => {
                const numerator = ONE_ETHER;
                const denominator = ZERO_AMOUNT;
                const target = ONE_ETHER.times(0.01);
                // This will actually manifest as a subtraction underflow.
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256SubtractionUnderflow,
                    denominator,
                    new BigNumber(1),
                );
                return expect(
                    libsContract.getPartialAmountCeil.callAsync(numerator, denominator, target),
                ).to.revertWith(expectedError);
            });

            it('reverts if `numerator * target` overflows', async () => {
                const numerator = MAX_UINT256;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = MAX_UINT256_ROOT.times(2);
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    numerator,
                    target,
                );
                return expect(
                    libsContract.getPartialAmountCeil.callAsync(numerator, denominator, target),
                ).to.revertWith(expectedError);
            });
        });
    });

    describe('safeGetPartialAmountFloor', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'safeGetPartialAmountFloor',
                createAsyncReferenceFunction(ReferenceFunctions.safeGetPartialAmountFloor),
                createContractTestFunction('safeGetPartialAmountFloor'),
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            it('matches the reference function output', async () => {
                const numerator = ONE_ETHER;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = ONE_ETHER.times(0.01);
                const expected = ReferenceFunctions.safeGetPartialAmountFloor(numerator, denominator, target);
                const actual = await libsContract.safeGetPartialAmountFloor.callAsync(numerator, denominator, target);
                expect(actual).to.bignumber.eq(expected);
            });

            it('rounds down when computing the partial amount', async () => {
                const numerator = ONE_ETHER.times(0.6);
                const denominator = ONE_ETHER.times(1.8);
                const target = ONE_ETHER;
                const expected = ONE_ETHER.dividedToIntegerBy(3);
                const actual = await libsContract.safeGetPartialAmountFloor.callAsync(numerator, denominator, target);
                expect(actual).to.bignumber.eq(expected);
            });

            it('reverts for a rounding error', async () => {
                const numerator = new BigNumber(1e3);
                const denominator = new BigNumber(1e4);
                const target = new BigNumber(333);
                const expectedError = new LibMathRevertErrors.RoundingError(numerator, denominator, target);
                return expect(
                    libsContract.safeGetPartialAmountFloor.callAsync(numerator, denominator, target),
                ).to.revertWith(expectedError);
            });

            it('reverts if `denominator` is zero', async () => {
                const numerator = ONE_ETHER;
                const denominator = ZERO_AMOUNT;
                const target = ONE_ETHER.times(0.01);
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(
                    libsContract.safeGetPartialAmountFloor.callAsync(numerator, denominator, target),
                ).to.revertWith(expectedError);
            });

            it('reverts if `numerator * target` overflows', async () => {
                const numerator = MAX_UINT256;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = MAX_UINT256_ROOT.times(2);
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    numerator,
                    target,
                );
                return expect(
                    libsContract.safeGetPartialAmountFloor.callAsync(numerator, denominator, target),
                ).to.revertWith(expectedError);
            });
        });
    });

    describe('safeGetPartialAmountCeil', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'safeGetPartialAmountCeil',
                createAsyncReferenceFunction(ReferenceFunctions.safeGetPartialAmountCeil),
                createContractTestFunction('safeGetPartialAmountCeil'),
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            it('matches the reference function output', async () => {
                const numerator = ONE_ETHER;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = ONE_ETHER.times(0.01);
                const expected = ReferenceFunctions.safeGetPartialAmountCeil(numerator, denominator, target);
                const actual = await libsContract.safeGetPartialAmountCeil.callAsync(numerator, denominator, target);
                expect(actual).to.bignumber.eq(expected);
            });

            it('rounds up when computing the partial amount', async () => {
                const numerator = ONE_ETHER.times(0.6);
                const denominator = ONE_ETHER.times(1.8);
                const target = ONE_ETHER;
                const expected = ONE_ETHER.dividedToIntegerBy(3).plus(1);
                const actual = await libsContract.safeGetPartialAmountCeil.callAsync(numerator, denominator, target);
                expect(actual).to.bignumber.eq(expected);
            });

            it('reverts for a rounding error', async () => {
                const numerator = new BigNumber(1e3);
                const denominator = new BigNumber(1e4);
                const target = new BigNumber(333);
                const expectedError = new LibMathRevertErrors.RoundingError(numerator, denominator, target);
                return expect(
                    libsContract.safeGetPartialAmountCeil.callAsync(numerator, denominator, target),
                ).to.revertWith(expectedError);
            });

            it('reverts if `denominator` is zero', async () => {
                const numerator = ONE_ETHER;
                const denominator = ZERO_AMOUNT;
                const target = ONE_ETHER.times(0.01);
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(
                    libsContract.safeGetPartialAmountCeil.callAsync(numerator, denominator, target),
                ).to.revertWith(expectedError);
            });

            it('reverts if `numerator * target` overflows', async () => {
                const numerator = MAX_UINT256;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = MAX_UINT256_ROOT.times(2);
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    numerator,
                    target,
                );
                return expect(
                    libsContract.safeGetPartialAmountCeil.callAsync(numerator, denominator, target),
                ).to.revertWith(expectedError);
            });
        });
    });

    describe('isRoundingErrorFloor', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'isRoundingErrorFloor',
                createAsyncReferenceFunction(ReferenceFunctions.isRoundingErrorFloor),
                createContractTestFunction('isRoundingErrorFloor'),
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            it('returns true for a rounding error', async () => {
                const numerator = new BigNumber(1e3);
                const denominator = new BigNumber(1e4);
                const target = new BigNumber(333);
                // tslint:disable-next-line: boolean-naming
                const actual = await libsContract.isRoundingErrorFloor.callAsync(numerator, denominator, target);
                expect(actual).to.eq(true);
            });

            it('returns false for not a rounding error', async () => {
                const numerator = new BigNumber(1e3);
                const denominator = new BigNumber(1e4);
                const target = new BigNumber(5e2);
                // tslint:disable-next-line: boolean-naming
                const actual = await libsContract.isRoundingErrorFloor.callAsync(numerator, denominator, target);
                expect(actual).to.eq(false);
            });

            it('matches the reference function output', async () => {
                const numerator = ONE_ETHER;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = ONE_ETHER.times(0.01);
                // tslint:disable-next-line: boolean-naming
                const expected = ReferenceFunctions.isRoundingErrorFloor(numerator, denominator, target);
                // tslint:disable-next-line: boolean-naming
                const actual = await libsContract.isRoundingErrorFloor.callAsync(numerator, denominator, target);
                expect(actual).to.eq(expected);
            });

            it('reverts if `denominator` is zero', async () => {
                const numerator = ONE_ETHER;
                const denominator = ZERO_AMOUNT;
                const target = ONE_ETHER.times(0.01);
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(
                    libsContract.isRoundingErrorFloor.callAsync(numerator, denominator, target),
                ).to.revertWith(expectedError);
            });

            it('reverts if `numerator * target` overflows', async () => {
                const numerator = MAX_UINT256;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = MAX_UINT256_ROOT.times(2);
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    numerator,
                    target,
                );
                return expect(
                    libsContract.isRoundingErrorFloor.callAsync(numerator, denominator, target),
                ).to.revertWith(expectedError);
            });
        });
    });

    describe('isRoundingErrorCeil', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'isRoundingErrorCeil',
                createAsyncReferenceFunction(ReferenceFunctions.isRoundingErrorCeil),
                createContractTestFunction('isRoundingErrorCeil'),
                [uint256Values, uint256Values, uint256Values],
            );
        });

        describe('explicit tests', () => {
            it('returns true for a rounding error', async () => {
                const numerator = new BigNumber(1e3);
                const denominator = new BigNumber(1e4);
                const target = new BigNumber(333);
                // tslint:disable-next-line: boolean-naming
                const actual = await libsContract.isRoundingErrorCeil.callAsync(numerator, denominator, target);
                expect(actual).to.eq(true);
            });

            it('returns false for not a rounding error', async () => {
                const numerator = new BigNumber(1e3);
                const denominator = new BigNumber(1e4);
                const target = new BigNumber(5e2);
                // tslint:disable-next-line: boolean-naming
                const actual = await libsContract.isRoundingErrorCeil.callAsync(numerator, denominator, target);
                expect(actual).to.eq(false);
            });

            it('matches the reference function output', async () => {
                const numerator = ONE_ETHER;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = ONE_ETHER.times(0.01);
                // tslint:disable-next-line: boolean-naming
                const expected = ReferenceFunctions.isRoundingErrorCeil(numerator, denominator, target);
                // tslint:disable-next-line: boolean-naming
                const actual = await libsContract.isRoundingErrorCeil.callAsync(numerator, denominator, target);
                expect(actual).to.eq(expected);
            });

            it('reverts if `denominator` is zero', async () => {
                const numerator = ONE_ETHER;
                const denominator = ZERO_AMOUNT;
                const target = ONE_ETHER.times(0.01);
                const expectedError = new LibMathRevertErrors.DivisionByZeroError();
                return expect(libsContract.isRoundingErrorCeil.callAsync(numerator, denominator, target)).to.revertWith(
                    expectedError,
                );
            });

            it('reverts if `numerator * target` overflows', async () => {
                const numerator = MAX_UINT256;
                const denominator = ONE_ETHER.dividedToIntegerBy(2);
                const target = MAX_UINT256_ROOT.times(2);
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                    numerator,
                    target,
                );
                return expect(libsContract.isRoundingErrorCeil.callAsync(numerator, denominator, target)).to.revertWith(
                    expectedError,
                );
            });
        });
    });
});
