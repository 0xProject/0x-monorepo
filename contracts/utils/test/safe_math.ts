import { chaiSetup, constants, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { artifacts, TestSafeMathContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

function toBigNumber(a: number | string): BigNumber {
    return new BigNumber(a);
}

describe('SafeMath', () => {
    let safeMath: TestSafeMathContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
        // Deploy SafeMath
        safeMath = await TestSafeMathContract.deployFrom0xArtifactAsync(artifacts.TestSafeMath, provider, txDefaults);
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('_safeMul', () => {
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
            const expectedError = new SafeMathRevertErrors.SafeMathError(
                SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
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

    describe('_safeDiv', () => {
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
            const errMessage = 'VM Exception while processing transaction: invalid opcode';
            return expect(safeMath.externalSafeDiv.callAsync(toBigNumber(1), constants.ZERO_AMOUNT)).to.be.rejectedWith(
                errMessage,
            );
        });
    });

    describe('_safeSub', () => {
        it('should revert if the subtraction underflows', async () => {
            const a = toBigNumber(0);
            const b = toBigNumber(1);
            const expectedError = new SafeMathRevertErrors.SafeMathError(
                SafeMathRevertErrors.SafeMathErrorCodes.Uint256SubtractionUnderflow,
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

    describe('_safeAdd', () => {
        it('should revert if the addition overflows', async () => {
            const a = toBigNumber('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'); // The largest uint256 number
            const b = toBigNumber(1);
            const expectedError = new SafeMathRevertErrors.SafeMathError(
                SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
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

    describe('_maxUint256', () => {
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

    describe('_minUint256', () => {
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
