import {
    assertRoughlyEquals,
    blockchainTests,
    expect,
    fromFixed,
    Numberish,
    toDecimal,
    toFixed,
} from '@0x/contracts-test-utils';
import { BigNumber, FixedMathRevertErrors } from '@0x/utils';
import { Decimal } from 'decimal.js';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import { TestLibFixedMathContract } from '../wrappers';

blockchainTests('LibFixedMath unit tests', env => {
    let testContract: TestLibFixedMathContract;

    before(async () => {
        testContract = await TestLibFixedMathContract.deployFrom0xArtifactAsync(
            artifacts.TestLibFixedMath,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    const BITS_OF_PRECISION = 127;
    const FIXED_POINT_DIVISOR = new BigNumber(2).pow(BITS_OF_PRECISION);
    const FIXED_1 = FIXED_POINT_DIVISOR;
    const MAX_FIXED_VALUE = new BigNumber(2).pow(255).minus(1);
    const MIN_FIXED_VALUE = new BigNumber(2).pow(255).times(-1);
    const MIN_EXP_NUMBER = new BigNumber('-63.875');
    const MAX_EXP_NUMBER = new BigNumber(0);
    // e ^ MIN_EXP_NUMBER
    const MIN_LN_NUMBER = new BigNumber(new Decimal(MIN_EXP_NUMBER.toFixed(128)).exp().toFixed(128));
    const FUZZ_COUNT = 1024;

    function assertFixedEquals(actualFixed: Numberish, expected: Numberish): void {
        expect(fromFixed(actualFixed)).to.bignumber.eq(fromFixed(toFixed(expected)));
    }

    function assertFixedRoughlyEquals(actualFixed: Numberish, expected: Numberish, precision: number = 18): void {
        assertRoughlyEquals(fromFixed(actualFixed), expected, precision);
    }

    describe('one()', () => {
        it('equals 1', async () => {
            const r = await testContract.one().callAsync();
            assertFixedEquals(r, 1);
        });
    });

    describe('abs()', () => {
        it('abs(n) == n', async () => {
            const n = 1337.5912;
            const r = await testContract.abs(toFixed(n)).callAsync();
            assertFixedEquals(r, n);
        });

        it('abs(-n) == n', async () => {
            const n = -1337.5912;
            const r = await testContract.abs(toFixed(n)).callAsync();
            assertFixedEquals(r, -n);
        });

        it('abs(0) == 0', async () => {
            const n = 0;
            const r = await testContract.abs(toFixed(n)).callAsync();
            expect(r).to.bignumber.eq(0);
        });

        it('abs(MAX_FIXED) == MAX_FIXED', async () => {
            const n = MAX_FIXED_VALUE;
            const r = await testContract.abs(n).callAsync();
            expect(r).to.bignumber.eq(n);
        });

        it('abs(MIN_FIXED) throws', async () => {
            const n = MIN_FIXED_VALUE;
            const expectedError = new FixedMathRevertErrors.SignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooSmall,
                n,
            );
            const tx = testContract.abs(n).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('abs(int(-1)) == int(1)', async () => {
            const n = -1;
            const r = await testContract.abs(new BigNumber(n)).callAsync();
            expect(r).to.bignumber.eq(1);
        });

        it('abs(int(1)) == int(1)', async () => {
            const n = 1;
            const r = await testContract.abs(new BigNumber(n)).callAsync();
            expect(r).to.bignumber.eq(1);
        });
    });

    describe('invert()', () => {
        it('invert(1) == 1', async () => {
            const n = 1;
            const r = await testContract.invert(toFixed(n)).callAsync();
            assertFixedEquals(r, n);
        });

        it('invert(n) == 1 / n', async () => {
            const n = 1337.5912;
            const r = await testContract.invert(toFixed(n)).callAsync();
            assertFixedRoughlyEquals(r, 1 / n);
        });

        it('invert(-n) == -1 / n', async () => {
            const n = -1337.5912;
            const r = await testContract.invert(toFixed(n)).callAsync();
            assertFixedRoughlyEquals(r, 1 / n);
        });

        it('invert(0) throws', async () => {
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.DivisionByZero,
            );
            const tx = testContract.invert(toFixed(0)).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('mulDiv()', () => {
        it('mulDiv(0, 0, 1) == 0', async () => {
            const [a, n, d] = [0, 0, 1];
            const r = await testContract.mulDiv(toFixed(a), new BigNumber(n), new BigNumber(d)).callAsync();
            assertFixedEquals(r, 0);
        });

        it('mulDiv(0, x, y) == 0', async () => {
            const [a, n, d] = [0, 13, 300];
            const r = await testContract.mulDiv(toFixed(a), new BigNumber(n), new BigNumber(d)).callAsync();
            assertFixedEquals(r, 0);
        });

        it('mulDiv(x, y, y) == x', async () => {
            const [a, n, d] = [1.2345, 149, 149];
            const r = await testContract.mulDiv(toFixed(a), new BigNumber(n), new BigNumber(d)).callAsync();
            assertFixedEquals(r, a);
        });

        it('mulDiv(x, -y, y) == -x', async () => {
            const [a, n, d] = [1.2345, -149, 149];
            const r = await testContract.mulDiv(toFixed(a), new BigNumber(n), new BigNumber(d)).callAsync();
            assertFixedEquals(r, -a);
        });

        it('mulDiv(-x, -y, y) == x', async () => {
            const [a, n, d] = [-1.2345, -149, 149];
            const r = await testContract.mulDiv(toFixed(a), new BigNumber(n), new BigNumber(d)).callAsync();
            assertFixedEquals(r, -a);
        });

        it('mulDiv(x, y, 0) throws', async () => {
            const [a, n, d] = [1.2345, 149, 0];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.DivisionByZero,
            );
            const tx = testContract.mulDiv(toFixed(a), new BigNumber(n), new BigNumber(d)).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('mulDiv(int(-1), int(1), int(-1)) == int(1)', async () => {
            const [a, n, d] = [-1, 1, -1];
            const r = await testContract.mulDiv(new BigNumber(a), new BigNumber(n), new BigNumber(d)).callAsync();
            assertFixedEquals(r, fromFixed(1));
        });

        it('mulDiv(int(1), int(-1), int(-1)) == int(1)', async () => {
            const [a, n, d] = [1, -1, -1];
            const r = await testContract.mulDiv(new BigNumber(a), new BigNumber(n), new BigNumber(d)).callAsync();
            assertFixedEquals(r, fromFixed(1));
        });

        it('mulDiv(MIN_FIXED, int(-1), int(1)) throws', async () => {
            const [a, n, d] = [MIN_FIXED_VALUE, -1, 1];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                n,
            );
            const tx = testContract.mulDiv(a, new BigNumber(n), new BigNumber(d)).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('mulDiv(int(-1), MIN_FIXED, int(1)) throws', async () => {
            const [a, n, d] = [-1, MIN_FIXED_VALUE, 1];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                n,
            );
            const tx = testContract.mulDiv(new BigNumber(a), n, new BigNumber(d)).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('mulDiv(MIN_FIXED, int(1), int(-1)) throws', async () => {
            const [a, n, d] = [MIN_FIXED_VALUE, 1, -1];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.DivisionOverflow,
                a,
                d,
            );
            const tx = testContract.mulDiv(a, new BigNumber(n), new BigNumber(d)).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('mulDiv(MAX_FIXED, int(-1), int(1)) == -MAX_FIXED', async () => {
            const [a, n, d] = [MAX_FIXED_VALUE, -1, 1];
            const r = await testContract.mulDiv(a, new BigNumber(n), new BigNumber(d)).callAsync();
            expect(r).to.bignumber.eq(MAX_FIXED_VALUE.negated());
        });

        it('mulDiv(MAX_FIXED, int(1), int(-1)) == -MAX_FIXED', async () => {
            const [a, n, d] = [MAX_FIXED_VALUE, 1, -1];
            const r = await testContract.mulDiv(a, new BigNumber(n), new BigNumber(d)).callAsync();
            expect(r).to.bignumber.eq(MAX_FIXED_VALUE.negated());
        });
    });

    describe('add()', () => {
        function add(a: Numberish, b: Numberish): BigNumber {
            return fromFixed(toFixed(a).plus(toFixed(b)));
        }

        it('0 + 0 == 0', async () => {
            const [a, b] = [0, 0];
            const r = await testContract.add(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, 0);
        });

        it('adds two positive decimals', async () => {
            const [a, b] = ['9310841.31841', '491021921.318948193'];
            const r = await testContract.add(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, add(a, b));
        });

        it('adds two mixed decimals', async () => {
            const [a, b] = ['9310841.31841', '-491021921.318948193'];
            const r = await testContract.add(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, add(a, b));
        });

        it('throws on overflow', async () => {
            const [a, b] = [MAX_FIXED_VALUE, new BigNumber(1)];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                a,
                b,
            );
            const tx = testContract.add(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws on underflow', async () => {
            const [a, b] = [MIN_FIXED_VALUE, new BigNumber(-1)];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                a,
                b,
            );
            const tx = testContract.add(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MIN_FIXED + MIN_FIXED throws', async () => {
            const [a, b] = [MIN_FIXED_VALUE, MIN_FIXED_VALUE];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                a,
                b,
            );
            const tx = testContract.add(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MAX_FIXED + MAX_FIXED throws', async () => {
            const [a, b] = [MAX_FIXED_VALUE, MAX_FIXED_VALUE];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                a,
                b,
            );
            const tx = testContract.add(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MIN_FIXED + MAX_FIXED == int(-1)', async () => {
            const [a, b] = [MIN_FIXED_VALUE, MAX_FIXED_VALUE];
            const r = await testContract.add(a, b).callAsync();
            expect(r).to.bignumber.eq(-1);
        });

        it('MAX_FIXED + (MIN_FIXED + int(1)) == 0', async () => {
            const [a, b] = [MAX_FIXED_VALUE, MIN_FIXED_VALUE.plus(1)];
            const r = await testContract.add(a, b).callAsync();
            expect(r).to.bignumber.eq(0);
        });
    });

    describe('sub()', () => {
        function sub(a: Numberish, b: Numberish): BigNumber {
            return fromFixed(toFixed(a).minus(toFixed(b)));
        }

        it('0 - 0 == 0', async () => {
            const [a, b] = [0, 0];
            const r = await testContract.sub(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, 0);
        });

        it('subtracts two positive decimals', async () => {
            const [a, b] = ['9310841.31841', '491021921.318948193'];
            const r = await testContract.sub(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, sub(a, b));
        });

        it('subtracts two mixed decimals', async () => {
            const [a, b] = ['9310841.31841', '-491021921.318948193'];
            const r = await testContract.sub(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, sub(a, b));
        });

        it('throws on underflow', async () => {
            const [a, b] = [MIN_FIXED_VALUE, new BigNumber(1)];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                a,
                b.negated(),
            );
            const tx = testContract.sub(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws on overflow', async () => {
            const [a, b] = [MAX_FIXED_VALUE, new BigNumber(-1)];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                a,
                b.negated(),
            );
            const tx = testContract.sub(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MIN_FIXED - MIN_FIXED throws', async () => {
            const [a, b] = [MIN_FIXED_VALUE, MIN_FIXED_VALUE];
            // This fails because `-MIN_FIXED_VALUE == MIN_FIXED_VALUE` because of
            // twos-complement.
            const expectedError = new FixedMathRevertErrors.SignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooSmall,
                b,
            );
            const tx = testContract.sub(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MAX_FIXED - MAX_FIXED == 0', async () => {
            const [a, b] = [MAX_FIXED_VALUE, MAX_FIXED_VALUE];
            const r = await testContract.sub(a, b).callAsync();
            expect(r).to.bignumber.eq(0);
        });

        it('MIN_FIXED - MAX_FIXED throws', async () => {
            const [a, b] = [MIN_FIXED_VALUE, MAX_FIXED_VALUE];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                a,
                b.negated(),
            );
            const tx = testContract.sub(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MAX_FIXED - MIN_FIXED throws', async () => {
            const [a, b] = [MAX_FIXED_VALUE, MIN_FIXED_VALUE];
            const expectedError = new FixedMathRevertErrors.SignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooSmall,
                b,
            );
            const tx = testContract.sub(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('mul()', () => {
        function mul(a: Numberish, b: Numberish): BigNumber {
            return fromFixed(
                toFixed(a)
                    .times(toFixed(b))
                    .dividedToIntegerBy(FIXED_POINT_DIVISOR),
            );
        }

        it('x * 0 == 0', async () => {
            const [a, b] = [1337, 0];
            const r = await testContract.mul(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, b);
        });

        it('x * 1 == x', async () => {
            const [a, b] = [0.5, 1];
            const r = await testContract.mul(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, a);
        });

        it('x * -1 == -x', async () => {
            const [a, b] = [0.5, -1];
            const r = await testContract.mul(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, -a);
        });

        it('multiplies two positive decimals', async () => {
            const [a, b] = ['1.25394912112', '0.03413318948193'];
            const r = await testContract.mul(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, mul(a, b));
        });

        it('multiplies two mixed decimals', async () => {
            const [a, b] = ['1.25394912112', '-0.03413318948193'];
            const r = await testContract.mul(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, mul(a, b));
        });

        it('throws on underflow', async () => {
            const [a, b] = [MIN_FIXED_VALUE, new BigNumber(2)];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            const tx = testContract.mul(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws on overflow', async () => {
            const [a, b] = [MAX_FIXED_VALUE, new BigNumber(2)];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            const tx = testContract.mul(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MAX_FIXED * int(1) == MAX_FIXED / FIXED_1', async () => {
            const [a, b] = [MAX_FIXED_VALUE, 1];
            const r = await testContract.mul(a, new BigNumber(b)).callAsync();
            expect(r).to.bignumber.eq(MAX_FIXED_VALUE.dividedToIntegerBy(FIXED_1));
        });

        it('MAX_FIXED * int(2) throws', async () => {
            const [a, b] = [MAX_FIXED_VALUE, 2];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            const tx = testContract.mul(a, new BigNumber(b)).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MAX_FIXED * MAX_FIXED throws', async () => {
            const [a, b] = [MAX_FIXED_VALUE, MAX_FIXED_VALUE];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            const tx = testContract.mul(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MIN_FIXED * MIN_FIXED throws', async () => {
            const [a, b] = [MIN_FIXED_VALUE, MIN_FIXED_VALUE];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            const tx = testContract.mul(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MAX_FIXED * MIN_FIXED throws', async () => {
            const [a, b] = [MAX_FIXED_VALUE, MIN_FIXED_VALUE];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            const tx = testContract.mul(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MIN_FIXED * int(-1) throws', async () => {
            const [a, b] = [MIN_FIXED_VALUE, -1];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            const tx = testContract.mul(a, new BigNumber(b)).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('int(-1) * MIN_FIXED throws', async () => {
            const [a, b] = [-1, MIN_FIXED_VALUE];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            const tx = testContract.mul(new BigNumber(a), b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MAX_FIXED * int(-1) == -MAX_FIXED / FIXED_1', async () => {
            const [a, b] = [MAX_FIXED_VALUE, -1];
            const r = await testContract.mul(a, new BigNumber(b)).callAsync();
            expect(r).to.bignumber.eq(MAX_FIXED_VALUE.negated().dividedToIntegerBy(FIXED_1));
        });
    });

    describe('div()', () => {
        function div(a: Numberish, b: Numberish): BigNumber {
            return fromFixed(
                toFixed(a)
                    .times(FIXED_POINT_DIVISOR)
                    .dividedBy(toFixed(b)),
            );
        }

        it('x / 0 throws', async () => {
            const [a, b] = [1, 0];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.DivisionByZero,
                toFixed(a).times(FIXED_POINT_DIVISOR),
                toFixed(b),
            );
            const tx = testContract.div(toFixed(a), toFixed(b)).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('x / 1 == x', async () => {
            const [a, b] = [1.41214552, 1];
            const r = await testContract.div(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, a);
        });

        it('x / -1 == -x', async () => {
            const [a, b] = [1.109312, -1];
            const r = await testContract.div(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, -a);
        });

        it('divides two positive decimals', async () => {
            const [a, b] = ['1.25394912112', '0.03413318948193'];
            const r = await testContract.div(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, div(a, b));
        });

        it('divides two mixed decimals', async () => {
            const [a, b] = ['1.25394912112', '-0.03413318948193'];
            const r = await testContract.div(toFixed(a), toFixed(b)).callAsync();
            assertFixedEquals(r, div(a, b));
        });

        it('MIN_FIXED / int(-1) throws', async () => {
            const [a, b] = [MIN_FIXED_VALUE, -1];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                FIXED_1,
            );
            const tx = testContract.div(a, new BigNumber(b)).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('MAX_FIXED / int(-1) throws', async () => {
            const [a, b] = [MIN_FIXED_VALUE, -1];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                FIXED_1,
            );
            const tx = testContract.div(a, new BigNumber(b)).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('int(-1) / MIN_FIXED == 0', async () => {
            const [a, b] = [-1, MIN_FIXED_VALUE];
            const r = await testContract.div(new BigNumber(a), b).callAsync();
            expect(r).to.bignumber.eq(0);
        });
    });

    describe('uintMul()', () => {
        it('0 * x == 0', async () => {
            const [a, b] = [0, 1234];
            const r = await testContract.uintMul(toFixed(a), new BigNumber(b)).callAsync();
            expect(r).to.bignumber.eq(0);
        });

        it('1 * x == int(x)', async () => {
            const [a, b] = [1, 1234];
            const r = await testContract.uintMul(toFixed(a), new BigNumber(b)).callAsync();
            expect(r).to.bignumber.eq(Math.trunc(b));
        });

        it('-1 * x == 0', async () => {
            const [a, b] = [-1, 1234];
            const r = await testContract.uintMul(toFixed(a), new BigNumber(b)).callAsync();
            expect(r).to.bignumber.eq(0);
        });

        it('0.5 * x == x/2', async () => {
            const [a, b] = [0.5, 1234];
            const r = await testContract.uintMul(toFixed(a), new BigNumber(b)).callAsync();
            expect(r).to.bignumber.eq(b / 2);
        });

        it('0.5 * x == 0 if x = 1', async () => {
            const [a, b] = [0.5, 1];
            const r = await testContract.uintMul(toFixed(a), new BigNumber(b)).callAsync();
            expect(r).to.bignumber.eq(0);
        });

        it('throws if rhs is too large', async () => {
            const [a, b] = [toFixed(1), MAX_FIXED_VALUE.plus(1)];
            const expectedError = new FixedMathRevertErrors.UnsignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooLarge,
                b,
            );
            const tx = testContract.uintMul(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws if lhs is too large', async () => {
            const [a, b] = [MAX_FIXED_VALUE, new BigNumber(2)];
            const expectedError = new FixedMathRevertErrors.BinOpError(
                FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            const tx = testContract.uintMul(a, b).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('toInteger()', () => {
        it('toInteger(n) == int(n)', async () => {
            const n = 1337.5912;
            const r = await testContract.toInteger(toFixed(n)).callAsync();
            expect(r).to.bignumber.eq(Math.trunc(n));
        });

        it('toInteger(-n) == -int(n)', async () => {
            const n = -1337.5912;
            const r = await testContract.toInteger(toFixed(n)).callAsync();
            expect(r).to.bignumber.eq(Math.trunc(n));
        });

        it('toInteger(n) == 0, when 0 < n < 1', async () => {
            const n = 0.9995;
            const r = await testContract.toInteger(toFixed(n)).callAsync();
            expect(r).to.bignumber.eq(0);
        });

        it('toInteger(-n) == 0, when -1 < n < 0', async () => {
            const n = -0.9995;
            const r = await testContract.toInteger(toFixed(n)).callAsync();
            expect(r).to.bignumber.eq(0);
        });

        it('toInteger(0) == 0', async () => {
            const n = 0;
            const r = await testContract.toInteger(toFixed(n)).callAsync();
            expect(r).to.bignumber.eq(0);
        });
    });

    describe('toFixed()', () => {
        describe('signed', () => {
            it('converts a positive integer', async () => {
                const n = 1337;
                const r = await testContract.toFixedSigned1(new BigNumber(n)).callAsync();
                assertFixedEquals(r, n);
            });

            it('converts a negative integer', async () => {
                const n = -1337;
                const r = await testContract.toFixedSigned1(new BigNumber(n)).callAsync();
                assertFixedEquals(r, n);
            });

            it('converts a fraction with a positive numerator and denominator', async () => {
                const [n, d] = [1337, 1000];
                const r = await testContract.toFixedSigned2(new BigNumber(n), new BigNumber(d)).callAsync();
                assertFixedEquals(r, n / d);
            });

            it('converts a fraction with a negative numerator and positive denominator', async () => {
                const [n, d] = [-1337, 1000];
                const r = await testContract.toFixedSigned2(new BigNumber(n), new BigNumber(d)).callAsync();
                assertFixedEquals(r, n / d);
            });

            it('converts a fraction with a negative numerator and denominator', async () => {
                const [n, d] = [-1337, -1000];
                const r = await testContract.toFixedSigned2(new BigNumber(n), new BigNumber(d)).callAsync();
                assertFixedEquals(r, n / d);
            });

            it('converts a fraction with a negative numerator and negative denominator', async () => {
                const [n, d] = [-1337, -1000];
                const r = await testContract.toFixedSigned2(new BigNumber(n), new BigNumber(d)).callAsync();
                assertFixedEquals(r, n / d);
            });

            it('throws if the numerator is too large to convert', async () => {
                const [n, d] = [MAX_FIXED_VALUE.dividedToIntegerBy(FIXED_POINT_DIVISOR).plus(1), new BigNumber(1000)];
                const expectedError = new FixedMathRevertErrors.BinOpError(
                    FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    n,
                    FIXED_POINT_DIVISOR,
                );
                const tx = testContract.toFixedSigned2(n, d).callAsync();
                return expect(tx).to.revertWith(expectedError);
            });

            it('throws if the denominator is zero', async () => {
                const [n, d] = [new BigNumber(1), new BigNumber(0)];
                const expectedError = new FixedMathRevertErrors.BinOpError(
                    FixedMathRevertErrors.BinOpErrorCodes.DivisionByZero,
                    n.times(FIXED_POINT_DIVISOR),
                    d,
                );
                const tx = testContract.toFixedSigned2(n, d).callAsync();
                return expect(tx).to.revertWith(expectedError);
            });
        });

        describe('unsigned', () => {
            it('converts an integer', async () => {
                const n = 1337;
                const r = await testContract.toFixedUnsigned1(new BigNumber(n)).callAsync();
                assertFixedEquals(r, n);
            });

            it('converts a fraction', async () => {
                const [n, d] = [1337, 1000];
                const r = await testContract.toFixedUnsigned2(new BigNumber(n), new BigNumber(d)).callAsync();
                assertFixedEquals(r, n / d);
            });

            it('throws if the numerator is too large', async () => {
                const [n, d] = [MAX_FIXED_VALUE.plus(1), new BigNumber(1000)];
                const expectedError = new FixedMathRevertErrors.UnsignedValueError(
                    FixedMathRevertErrors.ValueErrorCodes.TooLarge,
                    n,
                );
                const tx = testContract.toFixedUnsigned2(n, d).callAsync();
                return expect(tx).to.revertWith(expectedError);
            });

            it('throws if the denominator is too large', async () => {
                const [n, d] = [new BigNumber(1000), MAX_FIXED_VALUE.plus(1)];
                const expectedError = new FixedMathRevertErrors.UnsignedValueError(
                    FixedMathRevertErrors.ValueErrorCodes.TooLarge,
                    d,
                );
                const tx = testContract.toFixedUnsigned2(n, d).callAsync();
                return expect(tx).to.revertWith(expectedError);
            });

            it('throws if the numerator is too large to convert', async () => {
                const [n, d] = [MAX_FIXED_VALUE.dividedToIntegerBy(FIXED_POINT_DIVISOR).plus(1), new BigNumber(1000)];
                const expectedError = new FixedMathRevertErrors.BinOpError(
                    FixedMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                    n,
                    FIXED_POINT_DIVISOR,
                );
                const tx = testContract.toFixedUnsigned2(n, d).callAsync();
                return expect(tx).to.revertWith(expectedError);
            });

            it('throws if the denominator is zero', async () => {
                const [n, d] = [new BigNumber(1), new BigNumber(0)];
                const expectedError = new FixedMathRevertErrors.BinOpError(
                    FixedMathRevertErrors.BinOpErrorCodes.DivisionByZero,
                    n.times(FIXED_POINT_DIVISOR),
                    d,
                );
                const tx = testContract.toFixedUnsigned2(n, d).callAsync();
                return expect(tx).to.revertWith(expectedError);
            });
        });
    });

    function getRandomDecimal(min: Numberish, max: Numberish): BigNumber {
        const range = new BigNumber(max).minus(min);
        const random = fromFixed(new BigNumber(hexUtils.random().substr(2), 16));
        return random.mod(range).plus(min);
    }

    describe('ln()', () => {
        const LN_PRECISION = 16;

        function ln(x: Numberish): BigNumber {
            return new BigNumber(
                toDecimal(x)
                    .ln()
                    .toFixed(128),
            );
        }

        it('ln(x = 0) throws', async () => {
            const x = toFixed(0);
            const expectedError = new FixedMathRevertErrors.SignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooSmall,
                x,
            );
            const tx = testContract.ln(x).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('ln(x > 1) throws', async () => {
            const x = toFixed(1.000001);
            const expectedError = new FixedMathRevertErrors.SignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooLarge,
                x,
            );
            const tx = testContract.ln(x).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('ln(x < 0) throws', async () => {
            const x = toFixed(-0.000001);
            const expectedError = new FixedMathRevertErrors.SignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooSmall,
                x,
            );
            const tx = testContract.ln(x).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('ln(x = 1) == 0', async () => {
            const x = toFixed(1);
            const r = await testContract.ln(x).callAsync();
            assertFixedEquals(r, 0);
        });

        it('ln(x < LN_MIN_VAL) == EXP_MIN_VAL', async () => {
            const x = toFixed(MIN_LN_NUMBER).minus(1);
            const r = await testContract.ln(x).callAsync();
            assertFixedEquals(r, MIN_EXP_NUMBER);
        });

        it('ln(x), where x is close to 0', async () => {
            const x = new BigNumber('1e-27');
            const r = await testContract.ln(toFixed(x)).callAsync();
            assertFixedRoughlyEquals(r, ln(x), 12);
        });

        it('ln(x), where x is close to 1', async () => {
            const x = new BigNumber(1).minus('1e-27');
            const r = await testContract.ln(toFixed(x)).callAsync();
            assertFixedRoughlyEquals(r, ln(x), LN_PRECISION);
        });

        it('ln(x = 0.85)', async () => {
            const x = 0.85;
            const r = await testContract.ln(toFixed(x)).callAsync();
            assertFixedRoughlyEquals(r, ln(x), LN_PRECISION);
        });

        blockchainTests.optional('fuzzing', () => {
            const inputs = _.times(FUZZ_COUNT, () => getRandomDecimal(0, 1));
            for (const x of inputs) {
                it(`ln(${x.toString(10)})`, async () => {
                    const r = await testContract.ln(toFixed(x)).callAsync();
                    assertFixedRoughlyEquals(r, ln(x), LN_PRECISION);
                });
            }
        });
    });

    describe('exp()', () => {
        const EXP_PRECISION = 18;

        function exp(x: Numberish): BigNumber {
            return new BigNumber(
                toDecimal(x)
                    .exp()
                    .toFixed(128),
            );
        }

        it('exp(x = 0) == 1', async () => {
            const x = toFixed(0);
            const r = await testContract.exp(x).callAsync();
            assertFixedEquals(r, 1);
        });

        it('exp(x > EXP_MAX_VAL) throws', async () => {
            const x = toFixed(MAX_EXP_NUMBER).plus(1);
            const expectedError = new FixedMathRevertErrors.SignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooLarge,
                x,
            );
            const tx = testContract.exp(x).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('exp(x < EXP_MIN_VAL) == 0', async () => {
            const x = toFixed(MIN_EXP_NUMBER).minus(1);
            const r = await testContract.exp(x).callAsync();
            assertFixedEquals(r, 0);
        });

        it('exp(x < 0), where x is close to 0', async () => {
            const x = new BigNumber('-1e-18');
            const r = await testContract.exp(toFixed(x)).callAsync();
            assertFixedRoughlyEquals(r, exp(x), EXP_PRECISION);
        });

        it('exp(x), where x is close to EXP_MIN_VAL', async () => {
            const x = MIN_EXP_NUMBER.plus('1e-18');
            const r = await testContract.exp(toFixed(x)).callAsync();
            assertFixedRoughlyEquals(r, exp(x), EXP_PRECISION);
        });

        it('exp(x = -0.85)', async () => {
            const x = -0.85;
            const r = await testContract.exp(toFixed(x)).callAsync();
            assertFixedRoughlyEquals(r, exp(x), EXP_PRECISION);
        });

        blockchainTests.optional('fuzzing', () => {
            const inputs = _.times(FUZZ_COUNT, () => getRandomDecimal(MIN_EXP_NUMBER, MAX_EXP_NUMBER));
            for (const x of inputs) {
                it(`exp(${x.toString(10)})`, async () => {
                    const r = await testContract.exp(toFixed(x)).callAsync();
                    assertFixedRoughlyEquals(r, exp(x), EXP_PRECISION);
                });
            }
        });
    });
});
// tslint:disable-next-line: max-file-line-count
