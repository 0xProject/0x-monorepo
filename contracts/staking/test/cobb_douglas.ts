import { blockchainTests, constants, expect, filterLogsToArguments, hexRandom } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { AnyRevertError, BigNumber, FixedMathRevertErrors, OwnableRevertErrors } from '@0x/utils';
import { Decimal } from 'decimal.js';
import * as _ from 'lodash';

import {
    artifacts,
    TestCobbDouglasCobbDouglasAlphaChangedEventArgs,
    TestCobbDouglasContract,
    TestCobbDouglasEvents,
} from '../src/';

import { assertRoughlyEquals, Numberish } from './utils/number_utils';

// tslint:disable: no-unnecessary-type-assertion
blockchainTests('Cobb-Douglas', env => {
    const FUZZ_COUNT = 1024;
    const PRECISION = 15;

    let testContract: TestCobbDouglasContract;
    let ownerAddress: string;
    let notOwnerAddress: string;

    before(async () => {
        [ownerAddress, notOwnerAddress] = await env.getAccountAddressesAsync();
        testContract = await TestCobbDouglasContract.deployFrom0xArtifactAsync(
            artifacts.TestCobbDouglas,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    function toDecimal(x: Numberish): Decimal {
        if (BigNumber.isBigNumber(x)) {
            return new Decimal(x.toString(10));
        }
        return new Decimal(x);
    }

    function getRandomInteger(min: Numberish, max: Numberish): BigNumber {
        const range = new BigNumber(max).minus(min);
        const random = new BigNumber(hexRandom().substr(2), 16);
        return random.mod(range).plus(min);
    }

    function getRandomPortion(total: Numberish): BigNumber {
        return new BigNumber(total).times(Math.random()).integerValue();
    }

    blockchainTests.resets('setCobbDouglasAlpha()', () => {
        const NEGATIVE_ONE = constants.MAX_UINT256.minus(1);

        it('throws if not called by owner', async () => {
            const [n, d] = [new BigNumber(1), new BigNumber(2)];
            const tx = testContract.setCobbDouglasAlpha.awaitTransactionSuccessAsync(n, d, { from: notOwnerAddress });
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwnerAddress, ownerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws with int256(numerator) < 0', async () => {
            const [n, d] = [NEGATIVE_ONE, NEGATIVE_ONE];
            const tx = testContract.setCobbDouglasAlpha.awaitTransactionSuccessAsync(n, d);
            const expectedError = new StakingRevertErrors.InvalidCobbDouglasAlphaError(n, d);
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws with int256(denominator) < 0', async () => {
            const [n, d] = [new BigNumber(1), NEGATIVE_ONE];
            const tx = testContract.setCobbDouglasAlpha.awaitTransactionSuccessAsync(n, d);
            const expectedError = new StakingRevertErrors.InvalidCobbDouglasAlphaError(n, d);
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws with denominator == 0', async () => {
            const [n, d] = [new BigNumber(0), new BigNumber(0)];
            const tx = testContract.setCobbDouglasAlpha.awaitTransactionSuccessAsync(n, d);
            const expectedError = new StakingRevertErrors.InvalidCobbDouglasAlphaError(n, d);
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws with numerator > denominator', async () => {
            const [n, d] = [new BigNumber(2), new BigNumber(1)];
            const tx = testContract.setCobbDouglasAlpha.awaitTransactionSuccessAsync(n, d);
            const expectedError = new StakingRevertErrors.InvalidCobbDouglasAlphaError(n, d);
            return expect(tx).to.revertWith(expectedError);
        });

        async function setCobbDouglasAlphaAndAssertEffectsAsync(n: Numberish, d: Numberish): Promise<void> {
            const [_n, _d] = [new BigNumber(n), new BigNumber(d)];
            const receipt = await testContract.setCobbDouglasAlpha.awaitTransactionSuccessAsync(_n, _d);
            const logs = filterLogsToArguments<TestCobbDouglasCobbDouglasAlphaChangedEventArgs>(
                receipt.logs,
                TestCobbDouglasEvents.CobbDouglasAlphaChanged,
            );
            expect(logs.length).to.eq(1);
            expect(logs[0].numerator).to.bignumber.eq(_n);
            expect(logs[0].denominator).to.bignumber.eq(_d);
            const [actualNumerator, actualDenominator] = await testContract.getCobbDouglasAlpha.callAsync();
            expect(actualNumerator).to.bignumber.eq(_n);
            expect(actualDenominator).to.bignumber.eq(_d);
        }

        it('accepts numerator == denominator', async () => {
            return setCobbDouglasAlphaAndAssertEffectsAsync(1, 1);
        });

        it('accepts numerator < denominator', async () => {
            return setCobbDouglasAlphaAndAssertEffectsAsync(1, 2);
        });

        it('accepts numerator == 0', async () => {
            return setCobbDouglasAlphaAndAssertEffectsAsync(0, 1);
        });
    });

    describe('cobbDouglas()', () => {
        interface CobbDouglasParams {
            totalRewards: Numberish;
            ownerFees: Numberish;
            totalFees: Numberish;
            ownerStake: Numberish;
            totalStake: Numberish;
            alphaNumerator: Numberish;
            alphaDenominator: Numberish;
            gas?: number;
        }

        const MAX_COBB_DOUGLAS_GAS = 15e3;
        const TX_GAS_FEE = 21e3;
        const DEFAULT_COBB_DOUGLAS_PARAMS: CobbDouglasParams = {
            totalRewards: 100e18,
            ownerFees: 10e18,
            totalFees: 500e18,
            ownerStake: 1.1e21,
            totalStake: 3e27,
            alphaNumerator: 1,
            alphaDenominator: 3,
            gas: MAX_COBB_DOUGLAS_GAS,
        };

        async function callCobbDouglasAsync(params?: Partial<CobbDouglasParams>): Promise<BigNumber> {
            const _params = {
                ...DEFAULT_COBB_DOUGLAS_PARAMS,
                ...params,
            };
            return testContract.cobbDouglas.callAsync(
                new BigNumber(_params.totalRewards),
                new BigNumber(_params.ownerFees),
                new BigNumber(_params.totalFees),
                new BigNumber(_params.ownerStake),
                new BigNumber(_params.totalStake),
                new BigNumber(_params.alphaNumerator),
                new BigNumber(_params.alphaDenominator),
                {
                    gas: TX_GAS_FEE + (_params.gas === undefined ? MAX_COBB_DOUGLAS_GAS : _params.gas),
                },
            );
        }

        function cobbDouglas(params?: Partial<CobbDouglasParams>): BigNumber {
            const { totalRewards, ownerFees, totalFees, ownerStake, totalStake, alphaNumerator, alphaDenominator } = {
                ...DEFAULT_COBB_DOUGLAS_PARAMS,
                ...params,
            };
            const feeRatio = toDecimal(ownerFees).dividedBy(toDecimal(totalFees));
            const stakeRatio = toDecimal(ownerStake).dividedBy(toDecimal(totalStake));
            const alpha = toDecimal(alphaNumerator).dividedBy(toDecimal(alphaDenominator));
            // totalRewards * feeRatio ^ alpha * stakeRatio ^ (1-alpha)
            return new BigNumber(
                feeRatio
                    .pow(alpha)
                    .times(stakeRatio.pow(new Decimal(1).minus(alpha)))
                    .times(toDecimal(totalRewards))
                    .toFixed(0, BigNumber.ROUND_FLOOR),
            );
        }

        function getRandomParams(overrides?: Partial<CobbDouglasParams>): CobbDouglasParams {
            const totalRewards = _.get(overrides, 'totalRewards', getRandomInteger(0, 1e27)) as Numberish;
            const totalFees = _.get(overrides, 'totalFees', getRandomInteger(1, 1e27)) as Numberish;
            const ownerFees = _.get(overrides, 'ownerFees', getRandomPortion(totalFees)) as Numberish;
            const totalStake = _.get(overrides, 'totalStake', getRandomInteger(1, 1e27)) as Numberish;
            const ownerStake = _.get(overrides, 'ownerStake', getRandomPortion(totalStake)) as Numberish;
            const alphaDenominator = _.get(overrides, 'alphaDenominator', getRandomInteger(1, 1e6)) as Numberish;
            const alphaNumerator = _.get(overrides, 'alphaNumerator', getRandomPortion(alphaDenominator)) as Numberish;
            return {
                totalRewards,
                ownerFees,
                totalFees,
                ownerStake,
                totalStake,
                alphaNumerator,
                alphaDenominator,
            };
        }

        it('throws if `alphaNumerator` > `alphaDenominator`', async () => {
            return expect(
                callCobbDouglasAsync({
                    alphaNumerator: 11,
                    alphaDenominator: 10,
                }),
            ).to.revertWith(new AnyRevertError()); // Just an assertion failure.
        });

        it('throws if `ownerFees` > `totalFees`', async () => {
            const expectedError = new FixedMathRevertErrors.FixedMathSignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooLarge,
            );
            return expect(
                callCobbDouglasAsync({
                    ownerFees: 11,
                    totalFees: 10,
                }),
            ).to.revertWith(expectedError);
        });

        it('throws if `ownerStake` > `totalStake`', async () => {
            const expectedError = new FixedMathRevertErrors.FixedMathSignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooLarge,
            );
            return expect(
                callCobbDouglasAsync({
                    ownerStake: 11,
                    totalStake: 10,
                }),
            ).to.revertWith(expectedError);
        });

        it('computes the correct reward', async () => {
            const expected = cobbDouglas();
            const r = await callCobbDouglasAsync();
            assertRoughlyEquals(r, expected, PRECISION);
        });

        it('computes the correct reward with zero stake ratio', async () => {
            const ownerStake = 0;
            const expected = cobbDouglas({ ownerStake });
            const r = await callCobbDouglasAsync({ ownerStake });
            assertRoughlyEquals(r, expected, PRECISION);
        });

        it('computes the correct reward with full stake ratio', async () => {
            const ownerStake = DEFAULT_COBB_DOUGLAS_PARAMS.totalStake;
            const expected = cobbDouglas({ ownerStake });
            const r = await callCobbDouglasAsync({ ownerStake });
            assertRoughlyEquals(r, expected, PRECISION);
        });

        it('computes the correct reward with a very low stake ratio', async () => {
            const ownerStake = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalStake).times(1e-18);
            const expected = cobbDouglas({ ownerStake });
            const r = await callCobbDouglasAsync({ ownerStake });
            assertRoughlyEquals(r, expected, PRECISION);
        });

        it('computes the correct reward with a very high stake ratio', async () => {
            const ownerStake = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalStake).times(1 - 1e-18);
            const expected = cobbDouglas({ ownerStake });
            const r = await callCobbDouglasAsync({ ownerStake });
            assertRoughlyEquals(r, expected, PRECISION);
        });

        it('computes the correct reward with zero fee ratio', async () => {
            const ownerFees = 0;
            const expected = cobbDouglas({ ownerFees });
            const r = await callCobbDouglasAsync({ ownerFees });
            assertRoughlyEquals(r, expected, PRECISION);
        });

        it('computes the correct reward with full fee ratio', async () => {
            const ownerFees = DEFAULT_COBB_DOUGLAS_PARAMS.totalFees;
            const expected = cobbDouglas({ ownerFees });
            const r = await callCobbDouglasAsync({ ownerFees });
            assertRoughlyEquals(r, expected, PRECISION);
        });

        it('computes the correct reward with a very low fee ratio', async () => {
            const ownerFees = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalFees).times(1e-18);
            const expected = cobbDouglas({ ownerFees });
            const r = await callCobbDouglasAsync({ ownerFees });
            assertRoughlyEquals(r, expected, PRECISION);
        });

        it('computes the correct reward with a very high fee ratio', async () => {
            const ownerFees = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalFees).times(1 - 1e-18);
            const expected = cobbDouglas({ ownerFees });
            const r = await callCobbDouglasAsync({ ownerFees });
            assertRoughlyEquals(r, expected, PRECISION);
        });

        it('computes the correct reward with equal fee and stake ratios', async () => {
            const ownerFees = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalFees).times(0.5);
            const ownerStake = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalStake).times(0.5);
            const expected = cobbDouglas({ ownerFees, ownerStake });
            const r = await callCobbDouglasAsync({ ownerFees, ownerStake });
            assertRoughlyEquals(r, expected, PRECISION);
        });

        it('computes the correct reward with full fee and stake ratios', async () => {
            const ownerFees = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalFees);
            const ownerStake = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalStake);
            const expected = cobbDouglas({ ownerFees, ownerStake });
            const r = await callCobbDouglasAsync({ ownerFees, ownerStake });
            assertRoughlyEquals(r, expected, PRECISION);
        });

        it('computes the correct reward with zero fee and stake ratios', async () => {
            const ownerFees = 0;
            const ownerStake = 0;
            const expected = cobbDouglas({ ownerFees, ownerStake });
            const r = await callCobbDouglasAsync({ ownerFees, ownerStake });
            assertRoughlyEquals(r, expected, PRECISION);
        });

        blockchainTests.optional('fuzzing', () => {
            const inputs = _.times(FUZZ_COUNT, () => getRandomParams());
            for (const params of inputs) {
                it(`cobbDouglas(${JSON.stringify(params)})`, async () => {
                    const expected = cobbDouglas(params);
                    const r = await callCobbDouglasAsync(params);
                    assertRoughlyEquals(r, expected, PRECISION);
                });
            }
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
