import { blockchainTests, expect, hexRandom } from '@0x/contracts-test-utils';
import { BigNumber, FixedMathRevertErrors } from '@0x/utils';
import { Decimal } from 'decimal.js';
import * as _ from 'lodash';

import { artifacts, TestLibFixedMathContract } from '../src/';

Decimal.set({ precision: 128 });

// tslint:disable:no-unnecessary-type-assertion
blockchainTests('LibFixedMath', env => {
    const BITS_OF_PRECISION = 127;
    const FIXED_POINT_DIVISOR = new BigNumber(2).pow(BITS_OF_PRECISION);
    const MAX_FIXED_VALUE = new BigNumber(2).pow(255).minus(1);
    const MIN_FIXED_VALUE = new BigNumber(2).pow(255).times(-1);
    const MIN_EXP_NUMBER = new BigNumber('-69.07755278982137043720332303294494434957608235919531845909733017243007692132225692604324818191230406');
    const FUZZ_COUNT = 1024;

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

    function ln(x: Numberish): BigNumber {
        return new BigNumber(toDecimal(x).ln().toFixed(128));
    }

    function exp(x: Numberish): BigNumber {
        return new BigNumber(toDecimal(x).exp().toFixed(128));
    }

    function toDecimal(x: Numberish): Decimal {
        if (BigNumber.isBigNumber(x)) {
            return new Decimal(x.toString(10));
        }
        return new Decimal(x);
    }

    function getRandomNumber(min: Numberish, max: Numberish): BigNumber {
        const range = new BigNumber(max).minus(min);
        const random = fromFixed(new BigNumber(hexRandom().substr(2), 16));
        return random.mod(range).plus(min);
    }

    function toPrecision(n: Numberish, precision: number = 13): BigNumber {
        const _n = new BigNumber(n);
        const integerDigits = _n.integerValue().sd(true);
        const base = 10 ** (precision - integerDigits);
        return _n.times(base).integerValue(BigNumber.ROUND_HALF_FLOOR).dividedBy(base);
    }

    function assertFixedEquals(
        actual: BigNumber | string | number,
        expected: BigNumber | string | number,
    ): void {
        expect(fromFixed(actual)).to.bignumber.eq(numberToFixedToNumber(expected));
    }

    function assertFixedRoughlyEquals(
        actual: BigNumber | string | number,
        expected: BigNumber | string | number,
        precision: number = 13,
    ): void {
        // SD is not what we want.
        expect(toPrecision(fromFixed(actual), precision))
            .to.bignumber.eq(toPrecision(numberToFixedToNumber(expected), precision));
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

    describe('ln()', () => {
        it('ln(x = 0) throws', async () => {
            const x = toFixed(0);
            const expectedError = new FixedMathRevertErrors.FixedMathSignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooSmall,
                x,
            );
            const tx = testContract.ln.callAsync(x);
            return expect(tx).to.revertWith(expectedError);
        });

        it('ln(x > 1) throws', async () => {
            const x = toFixed(1.000001);
            const expectedError = new FixedMathRevertErrors.FixedMathSignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooLarge,
                x,
            );
            const tx = testContract.ln.callAsync(x);
            return expect(tx).to.revertWith(expectedError);
        });

        it('ln(x < 0) throws', async () => {
            const x = toFixed(-0.000001);
            const expectedError = new FixedMathRevertErrors.FixedMathSignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooSmall,
                x,
            );
            const tx = testContract.ln.callAsync(x);
            return expect(tx).to.revertWith(expectedError);
        });

        it('ln(x = 1) == 0', async () => {
            const x = toFixed(1);
            const r = await testContract.ln.callAsync(x);
            assertFixedEquals(r, 0);
        });

        it('ln(x), where x is close to 0', async () => {
            const x = new BigNumber('1e-27');
            const r = await testContract.ln.callAsync(toFixed(x));
            assertFixedRoughlyEquals(r, ln(x));
        });

        it('ln(x), where x is close to 1', async () => {
            const x = new BigNumber(1).minus('1e-27');
            const r = await testContract.ln.callAsync(toFixed(x));
            assertFixedRoughlyEquals(r, ln(x));
        });

        it('ln(x = 0.5)', async () => {
            const x = 0.5;
            const r = await testContract.ln.callAsync(toFixed(x));
            assertFixedRoughlyEquals(r, ln(x));
        });

        blockchainTests.optional('fuzzing', () => {
            const inputs = _.times(FUZZ_COUNT, () => getRandomNumber(0, 1));
            for (const x of inputs) {
                it(`ln(${x.toString(10)})`, async () => {
                    const r = await testContract.ln.callAsync(toFixed(x));
                    assertFixedRoughlyEquals(r, ln(x), 11);
                });
            }
        });
    });

    describe('exp()', () => {
        it('exp(x = 0) == 1', async () => {
            const x = toFixed(0);
            const r = await testContract.exp.callAsync(x);
            assertFixedEquals(r, 1);
        });

        it('exp(x > 0) throws', async () => {
            const x = toFixed(1e-18);
            const expectedError = new FixedMathRevertErrors.FixedMathSignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooLarge,
                x,
            );
            const tx = testContract.exp.callAsync(x);
            return expect(tx).to.revertWith(expectedError);
        });

        it('exp(x < EXP_MIN_VAL) == 0', async () => {
            const x = toFixed(MIN_EXP_NUMBER).minus(1);
            const r = await testContract.exp.callAsync(x);
            assertFixedEquals(r, 0);
        });

        it('exp(x), where x is close to 0', async () => {
            const x = new BigNumber('-1e-27');
            const r = await testContract.exp.callAsync(toFixed(x));
            assertFixedRoughlyEquals(r, exp(x));
        });

        it('exp(x), where x is close to EXP_MIN_VAL', async () => {
            const x = MIN_EXP_NUMBER.plus('1e-27');
            const r = await testContract.exp.callAsync(toFixed(x));
            assertFixedRoughlyEquals(r, exp(x));
        });

        it('exp(x = -0.5)', async () => {
            const x = -0.5;
            const r = await testContract.exp.callAsync(toFixed(x));
            assertFixedRoughlyEquals(r, exp(x));
        });

        blockchainTests.optional('fuzzing', () => {
            const inputs = _.times(FUZZ_COUNT, () => getRandomNumber(MIN_EXP_NUMBER, 0));
            for (const x of inputs) {
                it(`exp(${x.toString(10)})`, async () => {
                    const r = await testContract.exp.callAsync(toFixed(x));
                    assertFixedRoughlyEquals(r, exp(x), 11);
                });
            }
        });
    });
});
// tslint:disable-next-line: max-file-line-count
