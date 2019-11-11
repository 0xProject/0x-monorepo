import { blockchainTests, constants, describe, expect } from '@0x/contracts-test-utils';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import * as ReferenceFunctions from '../src/reference_functions';

import { artifacts } from './artifacts';
import { TestLibSafeMathContract } from './wrappers';

function toBigNumber(a: number | string): BigNumber {
    return new BigNumber(a);
}

blockchainTests('SafeMath', env => {
    const { ONE_ETHER } = constants;
    let safeMath: TestLibSafeMathContract;

    before(async () => {
        // Deploy SafeMath
        safeMath = await TestLibSafeMathContract.deployFrom0xArtifactAsync(
            artifacts.TestLibSafeMath,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    describe('safeMul', () => {
        it('should match the output of the reference function', async () => {
            const a = ONE_ETHER;
            const b = ONE_ETHER.times(2);
            const expected = ReferenceFunctions.safeMul(a, b);
            const actual = await safeMath.externalSafeMul.callAsync(a, b);
            expect(actual).bignumber.to.be.eq(expected);
        });

        it('should return zero if first argument is zero', async () => {
            const result = await safeMath.externalSafeMul.callAsync(constants.ZERO_AMOUNT, toBigNumber(1));
            expect(result).bignumber.to.be.eq(constants.ZERO_AMOUNT);
        });

        it('should return zero if second argument is zero', async () => {
            const result = await safeMath.externalSafeMul.callAsync(toBigNumber(1), constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(constants.ZERO_AMOUNT);
        });

        it('should revert if the multiplication overflows', async () => {
            const a = toBigNumber('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'); // The largest uint256 number
            const b = toBigNumber(2);
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                a,
                b,
            );
            return expect(safeMath.externalSafeMul.callAsync(a, b)).to.revertWith(expectedError);
        });

        it("should calculate correct value for values that don't overflow", async () => {
            const result = await safeMath.externalSafeMul.callAsync(toBigNumber(15), toBigNumber(13));
            expect(result).bignumber.to.be.eq(toBigNumber(195));
        });
    });

    describe('safeDiv', () => {
        it('should match the output of the reference function', async () => {
            const a = ONE_ETHER;
            const b = ONE_ETHER.times(2);
            const expected = ReferenceFunctions.safeDiv(a, b);
            const actual = await safeMath.externalSafeDiv.callAsync(a, b);
            expect(actual).bignumber.to.be.eq(expected);
        });

        it('should return the correct value if both values are the same', async () => {
            const result = await safeMath.externalSafeDiv.callAsync(toBigNumber(1), toBigNumber(1));
            expect(result).bignumber.to.be.eq(toBigNumber(1));
        });

        it('should return the correct value if the values are different', async () => {
            const result = await safeMath.externalSafeDiv.callAsync(toBigNumber(3), toBigNumber(2));
            expect(result).bignumber.to.be.eq(toBigNumber(1));
        });

        it('should return zero if the numerator is smaller than the denominator', async () => {
            const result = await safeMath.externalSafeDiv.callAsync(toBigNumber(2), toBigNumber(3));
            expect(result).bignumber.to.be.eq(constants.ZERO_AMOUNT);
        });

        it('should return zero if first argument is zero', async () => {
            const result = await safeMath.externalSafeDiv.callAsync(constants.ZERO_AMOUNT, toBigNumber(1));
            expect(result).bignumber.to.be.eq(constants.ZERO_AMOUNT);
        });

        it('should revert if second argument is zero', async () => {
            const a = toBigNumber(1);
            const b = toBigNumber(0);
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.DivisionByZero,
                a,
                b,
            );
            return expect(safeMath.externalSafeDiv.callAsync(a, b)).to.revertWith(expectedError);
        });
    });

    describe('safeSub', () => {
        it('should match the output of the reference function', async () => {
            const a = ONE_ETHER;
            const b = ONE_ETHER.dividedToIntegerBy(2);
            const expected = ReferenceFunctions.safeSub(a, b);
            const actual = await safeMath.externalSafeSub.callAsync(a, b);
            expect(actual).bignumber.to.be.eq(expected);
        });

        it('should revert if the subtraction underflows', async () => {
            const a = toBigNumber(0);
            const b = toBigNumber(1);
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.SubtractionUnderflow,
                a,
                b,
            );
            return expect(safeMath.externalSafeSub.callAsync(a, b)).to.revertWith(expectedError);
        });

        it('should calculate correct value for values that are equal', async () => {
            const result = await safeMath.externalSafeMul.callAsync(constants.ZERO_AMOUNT, constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(constants.ZERO_AMOUNT);
        });

        it('should calculate correct value for values that are not equal', async () => {
            const result = await safeMath.externalSafeSub.callAsync(toBigNumber(15), toBigNumber(13));
            expect(result).bignumber.to.be.eq(toBigNumber(2));
        });
    });

    describe('safeAdd', () => {
        it('should match the output of the reference function', async () => {
            const a = ONE_ETHER;
            const b = ONE_ETHER.dividedToIntegerBy(2);
            const expected = ReferenceFunctions.safeAdd(a, b);
            const actual = await safeMath.externalSafeAdd.callAsync(a, b);
            expect(actual).bignumber.to.be.eq(expected);
        });

        it('should revert if the addition overflows', async () => {
            const a = toBigNumber('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'); // The largest uint256 number
            const b = toBigNumber(1);
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                a,
                b,
            );
            return expect(safeMath.externalSafeAdd.callAsync(a, b)).to.revertWith(expectedError);
        });

        it('should calculate correct value if addition does not overflow', async () => {
            const result = await safeMath.externalSafeAdd.callAsync(toBigNumber(15), toBigNumber(13));
            expect(result).bignumber.to.be.eq(toBigNumber(28));
        });

        it('should calculate correct value if first argument is zero', async () => {
            const result = await safeMath.externalSafeAdd.callAsync(constants.ZERO_AMOUNT, toBigNumber(13));
            expect(result).bignumber.to.be.eq(toBigNumber(13));
        });

        it('should calculate correct value if second argument is zero', async () => {
            const result = await safeMath.externalSafeAdd.callAsync(toBigNumber(13), constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(toBigNumber(13));
        });
    });

    describe('maxUint256', () => {
        it('should return first argument if it is greater than the second', async () => {
            const result = await safeMath.externalMaxUint256.callAsync(toBigNumber(13), constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(toBigNumber(13));
        });

        it('should return first argument if it is equal the second', async () => {
            const result = await safeMath.externalMaxUint256.callAsync(constants.ZERO_AMOUNT, constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(constants.ZERO_AMOUNT);
        });

        it('should return second argument if it is greater than the first', async () => {
            const result = await safeMath.externalMaxUint256.callAsync(constants.ZERO_AMOUNT, toBigNumber(13));
            expect(result).bignumber.to.be.eq(toBigNumber(13));
        });
    });

    describe('minUint256', () => {
        it('should return first argument if it is less than the second', async () => {
            const result = await safeMath.externalMaxUint256.callAsync(constants.ZERO_AMOUNT, toBigNumber(13));
            expect(result).bignumber.to.be.eq(toBigNumber(13));
        });

        it('should return first argument if it is equal the second', async () => {
            const result = await safeMath.externalMaxUint256.callAsync(constants.ZERO_AMOUNT, constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(constants.ZERO_AMOUNT);
        });

        it('should return second argument if it is less than the first', async () => {
            const result = await safeMath.externalMaxUint256.callAsync(toBigNumber(13), constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(toBigNumber(13));
        });
    });
});
