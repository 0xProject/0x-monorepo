import { blockchainTests, constants, expect, filterLogsToArguments, Numberish } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber, OwnableRevertErrors } from '@0x/utils';

import { artifacts, IStakingEventsTunedEventArgs, MixinHyperParametersContract } from '../src/';

blockchainTests('Hyper-Parameters', env => {
    let testContract: MixinHyperParametersContract;
    let ownerAddress: string;
    let notOwnerAddress: string;

    before(async () => {
        [ownerAddress, notOwnerAddress] = await env.getAccountAddressesAsync();
        testContract = await MixinHyperParametersContract.deployFrom0xArtifactAsync(
            artifacts.MixinHyperParameters,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    blockchainTests.resets('tune()', () => {
        interface HyperParameters {
            epochDurationInSeconds: Numberish;
            rewardDelegatedStakeWeight: Numberish;
            minimumPoolStake: Numberish;
            cobbDouglasAlphaNumerator: Numberish;
            cobbDouglasAlphaDenomintor: Numberish;
        }

        const TWO_WEEKS = 14 * 24 * 60 * 60;
        const PPM_90_PERCENT = 10 ** 6 * 0.9;
        const DEFAULT_HYPER_PARAMETERS = {
            epochDurationInSeconds: TWO_WEEKS,
            rewardDelegatedStakeWeight: PPM_90_PERCENT,
            minimumPoolStake: '100e18',
            cobbDouglasAlphaNumerator: 1,
            cobbDouglasAlphaDenomintor: 2,
        };

        async function tuneAndAssertAsync(params: Partial<HyperParameters>, from?: string): Promise<void> {
            const _params = {
                ...DEFAULT_HYPER_PARAMETERS,
                ...params,
            };
            const receipt = await testContract.tune.awaitTransactionSuccessAsync(
                new BigNumber(_params.epochDurationInSeconds),
                new BigNumber(_params.rewardDelegatedStakeWeight),
                new BigNumber(_params.minimumPoolStake),
                new BigNumber(_params.cobbDouglasAlphaNumerator),
                new BigNumber(_params.cobbDouglasAlphaDenomintor),
                { from },
            );
            // Assert event.
            expect(receipt.logs.length).to.eq(1);
            const event = filterLogsToArguments<IStakingEventsTunedEventArgs>(receipt.logs, 'Tuned')[0];
            expect(event.epochDurationInSeconds).to.bignumber.eq(_params.epochDurationInSeconds);
            expect(event.rewardDelegatedStakeWeight).to.bignumber.eq(_params.rewardDelegatedStakeWeight);
            expect(event.minimumPoolStake).to.bignumber.eq(_params.minimumPoolStake);
            expect(event.cobbDouglasAlphaNumerator).to.bignumber.eq(_params.cobbDouglasAlphaNumerator);
            expect(event.cobbDouglasAlphaDenomintor).to.bignumber.eq(_params.cobbDouglasAlphaDenomintor);
            // Assert `getHyperParameters()`.
            const actual = await testContract.getHyperParameters.callAsync();
            expect(actual[0]).to.bignumber.eq(_params.epochDurationInSeconds);
            expect(actual[1]).to.bignumber.eq(_params.rewardDelegatedStakeWeight);
            expect(actual[2]).to.bignumber.eq(_params.minimumPoolStake);
            expect(actual[3]).to.bignumber.eq(_params.cobbDouglasAlphaNumerator);
            expect(actual[4]).to.bignumber.eq(_params.cobbDouglasAlphaDenomintor);
        }

        it('throws if not called by owner', async () => {
            const tx = tuneAndAssertAsync({}, notOwnerAddress);
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwnerAddress, ownerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('works if called by owner', async () => {
            return tuneAndAssertAsync({});
        });

        describe('cobb-douglas alpha', () => {
            const NEGATIVE_ONE = constants.MAX_UINT256.minus(1);

            it('throws with int256(numerator) < 0', async () => {
                const params = {
                    cobbDouglasAlphaNumerator: NEGATIVE_ONE,
                    cobbDouglasAlphaDenomintor: NEGATIVE_ONE,
                };
                const tx = tuneAndAssertAsync(params);
                const expectedError = new StakingRevertErrors.InvalidTuningValueError(
                    StakingRevertErrors.InvalidTuningValueErrorCode.InvalidCobbDouglasAlpha,
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it('throws with int256(denominator) < 0', async () => {
                const params = {
                    cobbDouglasAlphaNumerator: 1,
                    cobbDouglasAlphaDenomintor: NEGATIVE_ONE,
                };
                const tx = tuneAndAssertAsync(params);
                const expectedError = new StakingRevertErrors.InvalidTuningValueError(
                    StakingRevertErrors.InvalidTuningValueErrorCode.InvalidCobbDouglasAlpha,
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it('throws with denominator == 0', async () => {
                const params = {
                    cobbDouglasAlphaNumerator: 0,
                    cobbDouglasAlphaDenomintor: 0,
                };
                const tx = tuneAndAssertAsync(params);
                const expectedError = new StakingRevertErrors.InvalidTuningValueError(
                    StakingRevertErrors.InvalidTuningValueErrorCode.InvalidCobbDouglasAlpha,
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it('throws with numerator > denominator', async () => {
                const params = {
                    cobbDouglasAlphaNumerator: 2,
                    cobbDouglasAlphaDenomintor: 1,
                };
                const tx = tuneAndAssertAsync(params);
                const expectedError = new StakingRevertErrors.InvalidTuningValueError(
                    StakingRevertErrors.InvalidTuningValueErrorCode.InvalidCobbDouglasAlpha,
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it('accepts numerator == denominator', async () => {
                const params = {
                    cobbDouglasAlphaNumerator: 1,
                    cobbDouglasAlphaDenomintor: 1,
                };
                return tuneAndAssertAsync(params);
            });

            it('accepts numerator < denominator', async () => {
                const params = {
                    cobbDouglasAlphaNumerator: 1,
                    cobbDouglasAlphaDenomintor: 2,
                };
                return tuneAndAssertAsync(params);
            });

            it('accepts numerator == 0', async () => {
                const params = {
                    cobbDouglasAlphaNumerator: 0,
                    cobbDouglasAlphaDenomintor: 1,
                };
                return tuneAndAssertAsync(params);
            });
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
