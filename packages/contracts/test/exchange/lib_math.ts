import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';

import { TestLibsContract } from '../../generated_contract_wrappers/test_libs';
import { artifacts } from '../utils/artifacts';
import { chaiSetup } from '../utils/chai_setup';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe.only('LibMath', () => {
    let libs: TestLibsContract;

    const toHex = (number: BigNumber): string =>
        `0x${number.toString(16).padStart(64, '0')}`;

    const uint256Tests: {[label: string]: BigNumber}  = {
        '0':        new BigNumber(0),
        '1':        new BigNumber(1),
        '2':        new BigNumber(2),
        '2²⁵⁶-1':   new BigNumber(2).pow(256).sub(1),
        '2²⁵⁵':     new BigNumber(2).pow(255),
        '2¹²⁸':     new BigNumber(2).pow(128),
        /*
        '2⁶⁴':      new BigNumber(2).pow(64),
        '2¹²⁸-1':   new BigNumber(2).pow(128).sub(1),
        '2²⁵⁵-1':   new BigNumber(2).pow(255).sub(1),
        '3':        new BigNumber(3),
        '4':        new BigNumber(4),
        '5':        new BigNumber(5),
        '2⁶⁴-5':    new BigNumber(2).pow(64).sub(5),
        '2⁶⁴-4':    new BigNumber(2).pow(64).sub(4),
        '2⁶⁴-3':    new BigNumber(2).pow(64).sub(3),
        '2⁶⁴-2':    new BigNumber(2).pow(64).sub(2),
        '2⁶⁴-1':    new BigNumber(2).pow(64).sub(1),
        '2⁶⁴+1':    new BigNumber(2).pow(64).add(1),
        '2⁶⁴+2':    new BigNumber(2).pow(64).add(2),
        '2⁶⁴+3':    new BigNumber(2).pow(64).add(3),
        '2⁶⁴+4':    new BigNumber(2).pow(64).add(4),
        '2⁶⁴+5':    new BigNumber(2).pow(64).add(5),
        '2¹²⁸-5':   new BigNumber(2).pow(128).sub(5),
        '2¹²⁸-4':   new BigNumber(2).pow(128).sub(4),
        '2¹²⁸-3':   new BigNumber(2).pow(128).sub(3),
        '2¹²⁸-2':   new BigNumber(2).pow(128).sub(2),
        '2¹²⁸+1':   new BigNumber(2).pow(128).add(1),
        '2¹²⁸+2':   new BigNumber(2).pow(128).add(2),
        '2¹²⁸+3':   new BigNumber(2).pow(128).add(3),
        '2¹²⁸+4':   new BigNumber(2).pow(128).add(4),
        '2¹²⁸+5':   new BigNumber(2).pow(128).add(5),
        '2²⁵⁵-5':   new BigNumber(2).pow(255).sub(5),
        '2²⁵⁵-4':   new BigNumber(2).pow(255).sub(4),
        '2²⁵⁵-3':   new BigNumber(2).pow(255).sub(3),
        '2²⁵⁵-2':   new BigNumber(2).pow(255).sub(2),
        '2²⁵⁵+1':   new BigNumber(2).pow(255).add(1),
        '2²⁵⁵+2':   new BigNumber(2).pow(255).add(2),
        '2²⁵⁵+3':   new BigNumber(2).pow(255).add(3),
        '2²⁵⁵+4':   new BigNumber(2).pow(255).add(4),
        '2²⁵⁵+5':   new BigNumber(2).pow(255).add(5),
        '2²⁵⁶-5':   new BigNumber(2).pow(256).sub(5),
        '2²⁵⁶-4':   new BigNumber(2).pow(256).sub(4),
        '2²⁵⁶-3':   new BigNumber(2).pow(256).sub(3),
        '2²⁵⁶-2':   new BigNumber(2).pow(256).sub(2),
        */
        // TODO: continue with low disrepancy sequence
    };

    function require(constraint: boolean, error: string) {
        if (!constraint) {
            throw new Error(error);
        }
    }

    // Check if a value is a bignumber
    function isBigNumber(obj: any) {
        if (typeof obj !== 'object') {
            return false;
        }
        return Object.getPrototypeOf(obj).constructor.name === 'BigNumber';
    }

    // Wrapper arround mocha because Mocha doesn't know BigNumber
    function expectEqual(result: any, expected: any) {
        if (isBigNumber(expected)) {
            expect(result).to.be.bignumber.equal(expected);
        } else {
            expect(result).to.equal(expected);
        }
    }

    // We need to use funGen instead of fund directly because of:
    // https://github.com/mochajs/mocha/issues/1628
    function createTest(funcGen: any, reference: any, label: string, args: any) {
        // TypeScript does not support spread operator
        // https://github.com/Microsoft/TypeScript/issues/4130
        try {
            const expected = reference.apply(null, args);
            it(`${label} ↦ ${isBigNumber(expected) ? toHex(expected) : expected}`, async () => {
                const func = funcGen();
                const result = await func.callAsync.apply(func, args);
                expectEqual(result, expected);
            });
        } catch (e) {
            const revertString = e.message;
            it(`${label} ↦ ${revertString}`, async () => {
                const func = funcGen();
                const call = func.callAsync.apply(func, args);
                expect(call).to.rejectedWith(revertString);
            });
        }
    }

    before(async () => {
        await blockchainLifecycle.startAsync();
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    before(async () => {
        libs = await TestLibsContract.deployFrom0xArtifactAsync(artifacts.TestLibs, provider, txDefaults);
    });

    describe('getPartialAmount(numerator, denominator, target)', () => {

        function reference(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber): BigNumber {
            require(numerator.lte(denominator), 'NUMERATOR_GT_DENOMINATOR');
            if (denominator.eq(0)) {
                return new BigNumber(0);
            }
            return target.mul(numerator).divToInt(denominator);
        }

        for (const a in uint256Tests) {
            for (const b in uint256Tests) {
                for (const c in uint256Tests) {
                    createTest(
                        () => libs.publicGetPartialAmount,
                        reference,
                        `(${a}, ${b}, ${c})`,
                        [
                            uint256Tests[a],
                            uint256Tests[b],
                            uint256Tests[c],
                        ],
                    );
                }
            }
        }
    });

    describe('isRoundingError(numerator, denominator, target)', () => {

        function reference(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber): boolean {
            require(numerator.lte(denominator), 'NUMERATOR_GT_DENOMINATOR');

            const error = target.mul(numerator).mod(denominator);
            const ideal = target.mul(numerator).div(denominator);

            // Return true iff error is >0.1% of ideal
            const treshold = ideal.mul(0.001);
            return error.gt(treshold);
        }

        for (const a in uint256Tests) {
            for (const b in uint256Tests) {
                for (const c in uint256Tests) {
                    createTest(
                        () => libs.publicIsRoundingError,
                        reference,
                        `(${a}, ${b}, ${c})`,
                        [
                            uint256Tests[a],
                            uint256Tests[b],
                            uint256Tests[c],
                        ],
                    );
                }
            }
        }

    });

    describe('isRoundingError', () => {

        it('should return false if there is a rounding error of 0.1%', async () => {
            const numerator = new BigNumber(20);
            const denominator = new BigNumber(999);
            const target = new BigNumber(50);
            // rounding error = ((20*50/999) - floor(20*50/999)) / (20*50/999) = 0.1%
            const isRoundingError = await libs.publicIsRoundingError.callAsync(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });

        it('should return false if there is a rounding of 0.09%', async () => {
            const numerator = new BigNumber(20);
            const denominator = new BigNumber(9991);
            const target = new BigNumber(500);
            // rounding error = ((20*500/9991) - floor(20*500/9991)) / (20*500/9991) = 0.09%
            const isRoundingError = await libs.publicIsRoundingError.callAsync(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });

        it('should return true if there is a rounding error of 0.11%', async () => {
            const numerator = new BigNumber(20);
            const denominator = new BigNumber(9989);
            const target = new BigNumber(500);
            // rounding error = ((20*500/9989) - floor(20*500/9989)) / (20*500/9989) = 0.011%
            const isRoundingError = await libs.publicIsRoundingError.callAsync(numerator, denominator, target);
            expect(isRoundingError).to.be.true();
        });

        it('should return true if there is a rounding error > 0.1%', async () => {
            const numerator = new BigNumber(3);
            const denominator = new BigNumber(7);
            const target = new BigNumber(10);
            // rounding error = ((3*10/7) - floor(3*10/7)) / (3*10/7) = 6.67%
            const isRoundingError = await libs.publicIsRoundingError.callAsync(numerator, denominator, target);
            expect(isRoundingError).to.be.true();
        });

        it('should return false when there is no rounding error', async () => {
            const numerator = new BigNumber(1);
            const denominator = new BigNumber(2);
            const target = new BigNumber(10);

            const isRoundingError = await libs.publicIsRoundingError.callAsync(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });

        it('should return false when there is rounding error <= 0.1%', async () => {
            // randomly generated numbers
            const numerator = new BigNumber(76564);
            const denominator = new BigNumber(676373677);
            const target = new BigNumber(105762562);
            // rounding error = ((76564*105762562/676373677) - floor(76564*105762562/676373677)) /
            // (76564*105762562/676373677) = 0.0007%
            const isRoundingError = await libs.publicIsRoundingError.callAsync(numerator, denominator, target);
            expect(isRoundingError).to.be.false();
        });
    });

});
