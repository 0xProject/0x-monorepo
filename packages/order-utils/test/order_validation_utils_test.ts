import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { OrderValidationUtils } from '../src/order_validation_utils';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('OrderValidationUtils', () => {
    describe('#isRoundingError', () => {
        it('should return false if there is a rounding error of 0.1%', async () => {
            const numerator = new BigNumber(20);
            const denominator = new BigNumber(999);
            const target = new BigNumber(50);
            // rounding error = ((20*50/999) - floor(20*50/999)) / (20*50/999) = 0.1%
            const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });

        it('should return false if there is a rounding of 0.09%', async () => {
            const numerator = new BigNumber(20);
            const denominator = new BigNumber(9991);
            const target = new BigNumber(500);
            // rounding error = ((20*500/9991) - floor(20*500/9991)) / (20*500/9991) = 0.09%
            const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });

        it('should return true if there is a rounding error of 0.11%', async () => {
            const numerator = new BigNumber(20);
            const denominator = new BigNumber(9989);
            const target = new BigNumber(500);
            // rounding error = ((20*500/9989) - floor(20*500/9989)) / (20*500/9989) = 0.011%
            const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(numerator, denominator, target);
            expect(isRoundingError).to.be.true();
        });

        it('should return true if there is a rounding error > 0.1%', async () => {
            const numerator = new BigNumber(3);
            const denominator = new BigNumber(7);
            const target = new BigNumber(10);
            // rounding error = ((3*10/7) - floor(3*10/7)) / (3*10/7) = 6.67%
            const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(numerator, denominator, target);
            expect(isRoundingError).to.be.true();
        });

        it('should return false when there is no rounding error', async () => {
            const numerator = new BigNumber(1);
            const denominator = new BigNumber(2);
            const target = new BigNumber(10);

            const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });

        it('should return false when there is rounding error <= 0.1%', async () => {
            // randomly generated numbers
            const numerator = new BigNumber(76564);
            const denominator = new BigNumber(676373677);
            const target = new BigNumber(105762562);
            // rounding error = ((76564*105762562/676373677) - floor(76564*105762562/676373677)) /
            // (76564*105762562/676373677) = 0.0007%
            const isRoundingError = OrderValidationUtils.isRoundingErrorFloor(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });
    });
});
