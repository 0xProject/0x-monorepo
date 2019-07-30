import { chaiSetup, constants, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { artifacts, TestSafeMathContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

function toBN(a: number | string): BigNumber {
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
            const result = await safeMath.externalSafeMul.callAsync(constants.ZERO_AMOUNT, toBN(1));
            expect(result).bignumber.to.be.eq(constants.ZERO_AMOUNT);
        });

        it('should return zero if second argument is zero', async () => {
            const result = await safeMath.externalSafeMul.callAsync(toBN(1), constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(constants.ZERO_AMOUNT);
        });

        it('should revert if the multiplication overflows', async () => {
            const a = toBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'); // The largest uint256 number
            const b = toBN(2);
            const expectedError = new SafeMathRevertErrors.SafeMathError(
                SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
                a,
                b,
            );
            return expect(safeMath.externalSafeMul.callAsync(a, b)).to.revertWith(expectedError);
        });

        it("should calculate correct value for values that don't overflow", async () => {
            const result = await safeMath.externalSafeMul.callAsync(toBN(15), toBN(13));
            expect(result).bignumber.to.be.eq(toBN(195));
        });
    });

    describe('_safeSub', () => {
        it('should throw if the subtraction underflows', async () => {
            const a = toBN(0);
            const b = toBN(1);
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
            const result = await safeMath.externalSafeSub.callAsync(toBN(15), toBN(13));
            expect(result).bignumber.to.be.eq(toBN(2));
        });
    });

    describe('_safeAdd', () => {
        it('should throw if the addition overflows', async () => {
            const a = toBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'); // The largest uint256 number
            const b = toBN(1);
            const expectedError = new SafeMathRevertErrors.SafeMathError(
                SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                a,
                b,
            );
            return expect(safeMath.externalSafeAdd.callAsync(a, b)).to.revertWith(expectedError);
        });

        it('should calculate correct value if addition does not overflow', async () => {
            const result = await safeMath.externalSafeAdd.callAsync(toBN(15), toBN(13));
            expect(result).bignumber.to.be.eq(toBN(28));
        });

        it('should calculate correct value if first argument is zero', async () => {
            const result = await safeMath.externalSafeAdd.callAsync(constants.ZERO_AMOUNT, toBN(13));
            expect(result).bignumber.to.be.eq(toBN(13));
        });

        it('should calculate correct value if second argument is zero', async () => {
            const result = await safeMath.externalSafeAdd.callAsync(toBN(13), constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(toBN(13));
        });
    });

    describe('_maxUint256', () => {
        it('should return first argument if it is greater than the second', async () => {
            const result = await safeMath.externalMaxUint256.callAsync(toBN(13), constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(toBN(13));
        });

        it('should return first argument if it is equal the second', async () => {
            const result = await safeMath.externalMaxUint256.callAsync(constants.ZERO_AMOUNT, constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(constants.ZERO_AMOUNT);
        });

        it('should return second argument if it is greater than the first', async () => {
            const result = await safeMath.externalMaxUint256.callAsync(constants.ZERO_AMOUNT, toBN(13));
            expect(result).bignumber.to.be.eq(toBN(13));
        });
    });

    describe('_minUint256', () => {
        it('should return first argument if it is less than the second', async () => {
            const result = await safeMath.externalMaxUint256.callAsync(constants.ZERO_AMOUNT, toBN(13));
            expect(result).bignumber.to.be.eq(toBN(13));
        });

        it('should return first argument if it is equal the second', async () => {
            const result = await safeMath.externalMaxUint256.callAsync(constants.ZERO_AMOUNT, constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(constants.ZERO_AMOUNT);
        });

        it('should return second argument if it is less than the first', async () => {
            const result = await safeMath.externalMaxUint256.callAsync(toBN(13), constants.ZERO_AMOUNT);
            expect(result).bignumber.to.be.eq(toBN(13));
        });
    });
});
