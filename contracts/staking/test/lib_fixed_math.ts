import { blockchainTests, expect } from '@0x/contracts-test-utils';
import { BigNumber, FixedMathRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts, TestLibFixedMathContract } from '../src/';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests('LibFixedMath', env => {
    const BITS_OF_PRECISION = 127;
    const FIXED_POINT_DIVISOR = new BigNumber(2).pow(BITS_OF_PRECISION);
    const MAX_FIXED_VALUE = new BigNumber(2).pow(255).minus(1);
    const MIN_FIXED_VALUE = new BigNumber(2).pow(255).times(-1);
    const MAX_SIGNED_NUMBER = fromFixed(MAX_FIXED_VALUE);
    const MIN_SIGNED_NUMBER = fromFixed(MIN_FIXED_VALUE);

    type Numberish = BigNumber | string | number;

    function fromFixed(n: Numberish): BigNumber {
        return new BigNumber(n).dividedBy(FIXED_POINT_DIVISOR);
    }

    function toFixed(n: Numberish): BigNumber {
        return new BigNumber(n).times(FIXED_POINT_DIVISOR).integerValue();
    }

    function numberToFixedToNumber(n: Numberish): BigNumber {
        return fromFixed(toFixed(n));
    }

    function add(a: Numberish, b: Numberish): BigNumber {
        return fromFixed(toFixed(a).plus(toFixed(b)));
    }

    function sub(a: Numberish, b: Numberish): BigNumber {
        return fromFixed(toFixed(a).minus(toFixed(b)));
    }

    function mul(a: Numberish, b: Numberish): BigNumber {
        return fromFixed(toFixed(a).times(toFixed(b)).dividedToIntegerBy(FIXED_POINT_DIVISOR));
    }

    function div(a: Numberish, b: Numberish): BigNumber {
        return fromFixed(toFixed(a).times(FIXED_POINT_DIVISOR).dividedBy(toFixed(b)));
    }

    function assertFixedEquals(
        actual: BigNumber | string | number,
        expected: BigNumber | string | number,
    ): void {
        expect(fromFixed(actual)).to.bignumber.eq(numberToFixedToNumber(expected));
    }

    let testContract: TestLibFixedMathContract;

    before(async () => {
        testContract = await TestLibFixedMathContract.deployFrom0xArtifactAsync(
            artifacts.TestLibFixedMath,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('one()', () => {
        it('equals 1', async () => {
            const r = await testContract.one.callAsync();
            assertFixedEquals(r, 1);
        });
    });

    describe('abs()', () => {
        it('abs(n) == n', async () => {
            const n = 1337.5912;
            const r = await testContract.abs.callAsync(toFixed(n));
            assertFixedEquals(r, n);
        });

        it('abs(-n) == n', async () => {
            const n = -1337.5912;
            const r = await testContract.abs.callAsync(toFixed(n));
            assertFixedEquals(r, -n);
        });

        it('abs(0) == 0', async () => {
            const n = 0;
            const r = await testContract.abs.callAsync(toFixed(n));
            assertFixedEquals(r, n);
        });
    });

    describe('add()', () => {
        it('0 + 0 == 0', async () => {
            const [ a, b ] = [ 0, 0 ];
            const r = await testContract.add.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, 0);
        });

        it('adds two positive decimals', async () => {
            const [ a, b ] = ['9310841.31841', '491021921.318948193'];
            const r = await testContract.add.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, add(a, b));
        });

        it('adds two mixed decimals', async () => {
            const [ a, b ] = ['9310841.31841', '-491021921.318948193'];
            const r = await testContract.add.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, add(a, b));
        });

        it('throws on overflow', async () => {
            const [ a, b ] = [ MAX_FIXED_VALUE, new BigNumber(1) ];
            const expectedError = new FixedMathRevertErrors.FixedMathBinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                a,
                b,
            );
            const tx = testContract.add.callAsync(a, b);
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws on underflow', async () => {
            const [ a, b ] = [ MIN_FIXED_VALUE, new BigNumber(-1) ];
            const expectedError = new FixedMathRevertErrors.FixedMathBinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.SubtractionUnderflow,
                a,
                b,
            );
            const tx = testContract.add.callAsync(a, b);
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('sub()', () => {
        it('0 - 0 == 0', async () => {
            const [ a, b ] = [ 0, 0 ];
            const r = await testContract.sub.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, 0);
        });

        it('subtracts two positive decimals', async () => {
            const [ a, b ] = ['9310841.31841', '491021921.318948193'];
            const r = await testContract.sub.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, sub(a, b));
        });

        it('subtracts two mixed decimals', async () => {
            const [ a, b ] = ['9310841.31841', '-491021921.318948193'];
            const r = await testContract.sub.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, sub(a, b));
        });

        it('throws on underflow', async () => {
            const [ a, b ] = [ MIN_FIXED_VALUE, new BigNumber(1) ];
            const expectedError = new FixedMathRevertErrors.FixedMathBinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.SubtractionUnderflow,
                a,
                b.negated(),
            );
            const tx = testContract.sub.callAsync(a, b);
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws on overflow', async () => {
            const [ a, b ] = [ MAX_FIXED_VALUE, new BigNumber(-1) ];
            const expectedError = new FixedMathRevertErrors.FixedMathBinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                a,
                b.negated(),
            );
            const tx = testContract.sub.callAsync(a, b);
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('mul()', () => {
        it('x * 0 == 0', async () => {
            const [ a, b ] = [ 1337, 0 ];
            const r = await testContract.mul.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, b);
        });

        it('x * 1 == x', async () => {
            const [ a, b ] = [ 0.5, 1 ];
            const r = await testContract.mul.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, a);
        });

        it('x * -1 == -x', async () => {
            const [ a, b ] = [ 0.5, -1 ];
            const r = await testContract.mul.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, -a);
        });

        it('multiplies two positive decimals', async () => {
            const [ a, b ] = ['1.25394912112', '0.03413318948193'];
            const r = await testContract.mul.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, mul(a, b));
        });

        it('multiplies two mixed decimals', async () => {
            const [ a, b ] = ['1.25394912112', '-0.03413318948193'];
            const r = await testContract.mul.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, mul(a, b));
        });

        it('throws on underflow', async () => {
            const [ a, b ] = [ MIN_FIXED_VALUE, new BigNumber(2) ];
            const expectedError = new FixedMathRevertErrors.FixedMathBinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            const tx = testContract.mul.callAsync(a, b);
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws on overflow', async () => {
            const [ a, b ] = [ MAX_FIXED_VALUE, new BigNumber(2) ];
            const expectedError = new FixedMathRevertErrors.FixedMathBinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            const tx = testContract.mul.callAsync(a, b);
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('div()', () => {
        it('x / 0 throws', async () => {
            const [ a, b ] = [ 1, 0 ];
            const expectedError = new FixedMathRevertErrors.FixedMathBinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.DivisionByZero,
                toFixed(a).times(FIXED_POINT_DIVISOR),
                toFixed(b),
            );
            const tx = testContract.div.callAsync(toFixed(a), toFixed(b));
            return expect(tx).to.revertWith(expectedError);
        });

        it('x / 1 == x', async () => {
            const [ a, b ] = [ 1.41214552, 1 ];
            const r = await testContract.div.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, a);
        });

        it('x / -1 == -x', async () => {
            const [ a, b ] = [ 1.109312, -1 ];
            const r = await testContract.div.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, -a);
        });

        it('divides two positive decimals', async () => {
            const [ a, b ] = ['1.25394912112', '0.03413318948193'];
            const r = await testContract.div.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, div(a, b));
        });

        it('divides two mixed decimals', async () => {
            const [ a, b ] = ['1.25394912112', '-0.03413318948193'];
            const r = await testContract.div.callAsync(toFixed(a), toFixed(b));
            assertFixedEquals(r, div(a, b));
        });
    });

    describe('uintMul()', () => {
        it('0 * x == 0', async () => {
            const [ a, b ] = [ 0, 1234 ];
            const r = await testContract.uintMul.callAsync(toFixed(a), new BigNumber(b));
            expect(r).to.bignumber.eq(0);
        });

        it('1 * x == int(x)', async () => {
            const [ a, b ] = [ 1, 1234 ];
            const r = await testContract.uintMul.callAsync(toFixed(a), new BigNumber(b));
            expect(r).to.bignumber.eq(Math.trunc(b));
        });

        it('-1 * x == 0', async () => {
            const [ a, b ] = [ -1, 1234 ];
            const r = await testContract.uintMul.callAsync(toFixed(a), new BigNumber(b));
            expect(r).to.bignumber.eq(0);
        });

        it('0.5 * x == x/2', async () => {
            const [ a, b ] = [ 0.5, 1234 ];
            const r = await testContract.uintMul.callAsync(toFixed(a), new BigNumber(b));
            expect(r).to.bignumber.eq(b / 2);
        });

        it('0.5 * x == 0 if x = 1', async () => {
            const [ a, b ] = [ 0.5, 1];
            const r = await testContract.uintMul.callAsync(toFixed(a), new BigNumber(b));
            expect(r).to.bignumber.eq(0);
        });

        it('throws if rhs is too large', async () => {
            const [ a, b ] = [ toFixed(1), MAX_FIXED_VALUE.plus(1) ];
            const expectedError = new FixedMathRevertErrors.FixedMathUnsignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooLarge,
                b,
            );
            const tx = testContract.uintMul.callAsync(a, b);
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws if lhs is too large', async () => {
            const [ a, b ] = [ MAX_FIXED_VALUE, new BigNumber(2) ];
            const expectedError = new FixedMathRevertErrors.FixedMathBinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            const tx = testContract.uintMul.callAsync(a, b);
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('toInteger()', () => {
        it('toInteger(n) == int(n)', async () => {
            const n = 1337.5912;
            const r = await testContract.toInteger.callAsync(toFixed(n));
            expect(r).to.bignumber.eq(Math.trunc(n));
        });

        it('toInteger(-n) == -int(n)', async () => {
            const n = -1337.5912;
            const r = await testContract.toInteger.callAsync(toFixed(n));
            expect(r).to.bignumber.eq(Math.trunc(n));
        });

        it('toInteger(n) == 0, when 0 < n < 1', async () => {
            const n = 0.9995;
            const r = await testContract.toInteger.callAsync(toFixed(n));
            expect(r).to.bignumber.eq(0);
        });

        it('toInteger(-n) == 0, when -1 < n < 0', async () => {
            const n = -0.9995;
            const r = await testContract.toInteger.callAsync(toFixed(n));
            expect(r).to.bignumber.eq(0);
        });

        it('toInteger(0) == 0', async () => {
            const n = 0;
            const r = await testContract.toInteger.callAsync(toFixed(n));
            expect(r).to.bignumber.eq(0);
        });
    });

    describe('toFixed()', () => {
        describe('signed', () => {
            it('converts a positive integer', async () => {
                const n = 1337;
                const r = await testContract.toFixedSigned1.callAsync(new BigNumber(n));
                assertFixedEquals(r, n);
            });

            it('converts a negative integer', async () => {
                const n = -1337;
                const r = await testContract.toFixedSigned1.callAsync(new BigNumber(n));
                assertFixedEquals(r, n);
            });

            it('converts a fraction with a positive numerator and denominator', async () => {
                const [ n, d ] = [ 1337, 1000 ];
                const r = await testContract.toFixedSigned2.callAsync(new BigNumber(n), new BigNumber(d));
                assertFixedEquals(r, div(n, d));
            });

            it('converts a fraction with a negative numerator and positive denominator', async () => {
                const [ n, d ] = [ -1337, 1000 ];
                const r = await testContract.toFixedSigned2.callAsync(new BigNumber(n), new BigNumber(d));
                assertFixedEquals(r, div(n, d));
            });

            it('converts a fraction with a negative numerator and denominator', async () => {
                const [ n, d ] = [ -1337, -1000 ];
                const r = await testContract.toFixedSigned2.callAsync(new BigNumber(n), new BigNumber(d));
                assertFixedEquals(r, div(n, d));
            });

            it('converts a fraction with a negative numerator and negative denominator', async () => {
                const [ n, d ] = [ -1337, -1000 ];
                const r = await testContract.toFixedSigned2.callAsync(new BigNumber(n), new BigNumber(d));
                assertFixedEquals(r, div(n, d));
            });

            it('throws if the numerator is too large to convert', async () => {
                const [ n, d ] = [ MAX_FIXED_VALUE.dividedToIntegerBy(FIXED_POINT_DIVISOR).plus(1), new BigNumber(1000) ];
                const expectedError = new FixedMathRevertErrors.FixedMathBinOpError(
                    FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    n,
                    FIXED_POINT_DIVISOR,
                );
                const tx = testContract.toFixedSigned2.callAsync(n, d);
                return expect(tx).to.revertWith(expectedError);
            });

            it('throws if the denominator is zero', async () => {
                const [ n, d ] = [ new BigNumber(1), new BigNumber(0) ];
                const expectedError = new FixedMathRevertErrors.FixedMathBinOpError(
                    FixedMathRevertErrors.BinOpErrorCodes.DivisionByZero,
                    n.times(FIXED_POINT_DIVISOR),
                    d,
                );
                const tx = testContract.toFixedSigned2.callAsync(n, d);
                return expect(tx).to.revertWith(expectedError);
            });
        });

        describe('unsigned', () => {
            it('converts an integer', async () => {
                const n = 1337;
                const r = await testContract.toFixedUnsigned1.callAsync(new BigNumber(n));
                assertFixedEquals(r, n);
            });

            it('converts a fraction', async () => {
                const [ n, d ] = [ 1337, 1000 ];
                const r = await testContract.toFixedUnsigned2.callAsync(new BigNumber(n), new BigNumber(d));
                assertFixedEquals(r, div(n, d));
            });

            it('throws if the numerator is too large', async () => {
                const [ n, d ] = [ MAX_FIXED_VALUE.plus(1), new BigNumber(1000) ];
                const expectedError = new FixedMathRevertErrors.FixedMathUnsignedValueError(
                    FixedMathRevertErrors.ValueErrorCodes.TooLarge,
                    n,
                );
                const tx = testContract.toFixedUnsigned2.callAsync(n, d);
                return expect(tx).to.revertWith(expectedError);
            });

            it('throws if the denominator is too large', async () => {
                const [ n, d ] = [ new BigNumber(1000), MAX_FIXED_VALUE.plus(1) ];
                const expectedError = new FixedMathRevertErrors.FixedMathUnsignedValueError(
                    FixedMathRevertErrors.ValueErrorCodes.TooLarge,
                    d,
                );
                const tx = testContract.toFixedUnsigned2.callAsync(n, d);
                return expect(tx).to.revertWith(expectedError);
            });

            it('throws if the numerator is too large to convert', async () => {
                const [ n, d ] = [ MAX_FIXED_VALUE.dividedToIntegerBy(FIXED_POINT_DIVISOR).plus(1), new BigNumber(1000) ];
                const expectedError = new FixedMathRevertErrors.FixedMathBinOpError(
                    FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    n,
                    FIXED_POINT_DIVISOR,
                );
                const tx = testContract.toFixedUnsigned2.callAsync(n, d);
                return expect(tx).to.revertWith(expectedError);
            });

            it('throws if the denominator is zero', async () => {
                const [ n, d ] = [ new BigNumber(1), new BigNumber(0) ];
                const expectedError = new FixedMathRevertErrors.FixedMathBinOpError(
                    FixedMathRevertErrors.BinOpErrorCodes.DivisionByZero,
                    n.times(FIXED_POINT_DIVISOR),
                    d,
                );
                const tx = testContract.toFixedUnsigned2.callAsync(n, d);
                return expect(tx).to.revertWith(expectedError);
            });
        });
    });

    // describe('LibFeesMath', () => {
    //     it('nth root', async () => {
    //         const base = new BigNumber(1419857);
    //         const n = new BigNumber(5);
    //         const root = await stakingWrapper.nthRootAsync(base, n);
    //         expect(root).to.be.bignumber.equal(17);
    //     });
    //
    //     it('nth root #2', async () => {
    //         const base = new BigNumber(3375);
    //         const n = new BigNumber(3);
    //         const root = await stakingWrapper.nthRootAsync(base, n);
    //         expect(root).to.be.bignumber.equal(15);
    //     });
    //
    //     it('nth root #3 with fixed point', async () => {
    //         const decimals = 18;
    //         const base = StakingWrapper.toFixedPoint(4.234, decimals);
    //         const n = new BigNumber(2);
    //         const root = await stakingWrapper.nthRootFixedPointAsync(base, n);
    //         const rootAsFloatingPoint = StakingWrapper.toFloatingPoint(root, decimals);
    //         const expectedResult = new BigNumber(2.057668584);
    //         expect(rootAsFloatingPoint).to.be.bignumber.equal(expectedResult);
    //     });
    //
    //     it('nth root #3 with fixed point (integer nth root would fail here)', async () => {
    //         const decimals = 18;
    //         const base = StakingWrapper.toFixedPoint(5429503678976, decimals);
    //         const n = new BigNumber(9);
    //         const root = await stakingWrapper.nthRootFixedPointAsync(base, n);
    //         const rootAsFloatingPoint = StakingWrapper.toFloatingPoint(root, decimals);
    //         const expectedResult = new BigNumber(26);
    //         expect(rootAsFloatingPoint).to.be.bignumber.equal(expectedResult);
    //     });
    //
    //     it.skip('nth root #4 with fixed point (integer nth root would fail here) (max number of decimals - currently does not retain)', async () => {
    //         // @TODO This is the gold standard for nth root. Retain all these decimals :)
    //         const decimals = 18;
    //         const base = StakingWrapper.toFixedPoint(new BigNumber('5429503678976.295036789761543678', 10), decimals);
    //         const n = new BigNumber(9);
    //         const root = await stakingWrapper.nthRootFixedPointAsync(base, n);
    //         const rootAsFloatingPoint = StakingWrapper.toFloatingPoint(root, decimals);
    //         const expectedResult = new BigNumber(26);
    //         expect(rootAsFloatingPoint).to.be.bignumber.equal(expectedResult);
    //     });
    //
    // });
});
