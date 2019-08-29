import { blockchainTests, expect, hexRandom } from '@0x/contracts-test-utils';
import { AnyRevertError, BigNumber, FixedMathRevertErrors } from '@0x/utils';
import { Decimal } from 'decimal.js';
import * as _ from 'lodash';

import { artifacts, TestCobbDouglasContract } from '../src/';

Decimal.set({ precision: 128 });
type Numberish = BigNumber | string | number;

blockchainTests('Cobb-Douglas', env => {
    const FUZZ_COUNT = 1024;

    let testContract: TestCobbDouglasContract;

    before(async () => {
        testContract = await TestCobbDouglasContract.deployFrom0xArtifactAsync(
            artifacts.TestCobbDouglas,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    function toPrecision(n: Numberish, precision: number): BigNumber {
        const _n = new BigNumber(n);
        const integerDigits = _n.integerValue().sd(true);
        const base = 10 ** (precision - integerDigits);
        return _n.times(base).integerValue(BigNumber.ROUND_FLOOR).dividedBy(base);
    }

    function toDecimal(x: Numberish): Decimal {
        if (BigNumber.isBigNumber(x)) {
            return new Decimal(x.toString(10));
        }
        return new Decimal(x);
    }

    function assertRoughlyEquals(
        actual: Numberish,
        expected: Numberish,
        precision: number = 14,
    ): void {
        // SD is not what we want.
        expect(toPrecision(actual, precision)).to.bignumber.eq(toPrecision(expected, precision));
    }

    function getRandomAmount(min: Numberish, max: Numberish): BigNumber {
        const range = new BigNumber(max).minus(min);
        const random = new BigNumber(hexRandom().substr(2), 16);
        return random.mod(range).plus(min);
    }

    function getRandomPortion(total: Numberish): BigNumber {
        return new BigNumber(total).times(Math.random()).integerValue();
    }

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
            const {
                totalRewards,
                ownerFees,
                totalFees,
                ownerStake,
                totalStake,
                alphaNumerator,
                alphaDenominator,
            } = {
                ...DEFAULT_COBB_DOUGLAS_PARAMS,
                ...params,
            };
            const feeRatio = toDecimal(ownerFees).dividedBy(toDecimal(totalFees));
            const stakeRatio = toDecimal(ownerStake).dividedBy(toDecimal(totalStake));
            const alpha = toDecimal(alphaNumerator).dividedBy(toDecimal(alphaDenominator));
            // totalRewards * feeRatio ^ alpha * stakeRatio ^ (1-alpha)
            return new BigNumber(
                feeRatio.pow(alpha).times(
                    stakeRatio.pow(new Decimal(1).minus(alpha)),
                ).times(toDecimal(totalRewards)).toFixed(0, BigNumber.ROUND_FLOOR),
            );
        }

        function getRandomParams(overrides?: Partial<CobbDouglasParams>): CobbDouglasParams {
            const totalRewards = _.get(overrides, 'totalRewards', getRandomAmount(0, 1e27)) as Numberish;
            const totalFees = _.get(overrides, 'totalFees', getRandomAmount(1, 1e27)) as Numberish;
            const ownerFees = _.get(overrides, 'ownerFees', getRandomPortion(totalFees)) as Numberish;
            const totalStake = _.get(overrides, 'totalStake', getRandomAmount(1, 1e27)) as Numberish;
            const ownerStake = _.get(overrides, 'ownerStake', getRandomPortion(totalStake)) as Numberish;
            const alphaDenominator = _.get(overrides, 'alphaDenominator', getRandomAmount(1, 1e6)) as Numberish;
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
            return expect(callCobbDouglasAsync({
                alphaNumerator: 11,
                alphaDenominator: 10,
            })).to.revertWith(new AnyRevertError()); // Just an assertion failure.
        });

        it('throws if `ownerFees` > `totalFees`', async () => {
            const expectedError = new FixedMathRevertErrors.FixedMathSignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooLarge,
            );
            return expect(callCobbDouglasAsync({
                ownerFees: 11,
                totalFees: 10,
            })).to.revertWith(expectedError);
        });

        it('throws if `ownerStake` > `totalStake`', async () => {
            const expectedError = new FixedMathRevertErrors.FixedMathSignedValueError(
                FixedMathRevertErrors.ValueErrorCodes.TooLarge,
            );
            return expect(callCobbDouglasAsync({
                ownerStake: 11,
                totalStake: 10,
            })).to.revertWith(expectedError);
        });

        it('computes the correct reward', async () => {
            const expected = cobbDouglas();
            const r = await callCobbDouglasAsync();
            assertRoughlyEquals(r, expected);
        });

        it('computes the correct reward with zero stake ratio', async () => {
            const ownerStake = 0;
            const expected = cobbDouglas({ ownerStake });
            const r = await callCobbDouglasAsync({ ownerStake });
            assertRoughlyEquals(r, expected);
        });

        it('computes the correct reward with full stake ratio', async () => {
            const ownerStake = DEFAULT_COBB_DOUGLAS_PARAMS.totalStake;
            const expected = cobbDouglas({ ownerStake });
            const r = await callCobbDouglasAsync({ ownerStake });
            assertRoughlyEquals(r, expected);
        });

        it('computes the correct reward with a very low stake ratio', async () => {
            const ownerStake = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalStake).times(1e-18);
            const expected = cobbDouglas({ ownerStake });
            const r = await callCobbDouglasAsync({ ownerStake });
            assertRoughlyEquals(r, expected);
        });

        it('computes the correct reward with a very high stake ratio', async () => {
            const ownerStake = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalStake).times(1 - 1e-18);
            const expected = cobbDouglas({ ownerStake });
            const r = await callCobbDouglasAsync({ ownerStake });
            assertRoughlyEquals(r, expected);
        });

        it('computes the correct reward with zero fee ratio', async () => {
            const ownerFees = 0;
            const expected = cobbDouglas({ ownerFees });
            const r = await callCobbDouglasAsync({ ownerFees });
            assertRoughlyEquals(r, expected);
        });

        it('computes the correct reward with full fee ratio', async () => {
            const ownerFees = DEFAULT_COBB_DOUGLAS_PARAMS.totalFees;
            const expected = cobbDouglas({ ownerFees });
            const r = await callCobbDouglasAsync({ ownerFees });
            assertRoughlyEquals(r, expected);
        });

        it('computes the correct reward with a very low fee ratio', async () => {
            const ownerFees = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalFees).times(1e-18);
            const expected = cobbDouglas({ ownerFees });
            const r = await callCobbDouglasAsync({ ownerFees });
            assertRoughlyEquals(r, expected);
        });

        it('computes the correct reward with a very high fee ratio', async () => {
            const ownerFees = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalFees).times(1 - 1e-18);
            const expected = cobbDouglas({ ownerFees });
            const r = await callCobbDouglasAsync({ ownerFees });
            assertRoughlyEquals(r, expected);
        });

        it('computes the correct reward with equal fee and stake ratios', async () => {
            const ownerFees = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalFees).times(0.5);
            const ownerStake = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalStake).times(0.5);
            const expected = cobbDouglas({ ownerFees, ownerStake });
            const r = await callCobbDouglasAsync({ ownerFees, ownerStake });
            assertRoughlyEquals(r, expected);
        });

        it('computes the correct reward with full fee and stake ratios', async () => {
            const ownerFees = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalFees);
            const ownerStake = new BigNumber(DEFAULT_COBB_DOUGLAS_PARAMS.totalStake);
            const expected = cobbDouglas({ ownerFees, ownerStake });
            const r = await callCobbDouglasAsync({ ownerFees, ownerStake });
            assertRoughlyEquals(r, expected);
        });

        it('computes the correct reward with zero fee and stake ratios', async () => {
            const ownerFees = 0;
            const ownerStake = 0;
            const expected = cobbDouglas({ ownerFees, ownerStake });
            const r = await callCobbDouglasAsync({ ownerFees, ownerStake });
            assertRoughlyEquals(r, expected);
        });

        blockchainTests.optional('fuzzing', () => {
            const inputs = _.times(FUZZ_COUNT, () => getRandomParams());
            for (const params of inputs) {
                it(`cobbDouglas(${JSON.stringify(params)})`, async () => {
                    const expected = cobbDouglas(params);
                    const r = await callCobbDouglasAsync(params);
                    assertRoughlyEquals(r, expected, 12);
                });
            }
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
