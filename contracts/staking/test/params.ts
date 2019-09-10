import { blockchainTests, constants, expect, filterLogsToArguments, Numberish } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber, OwnableRevertErrors } from '@0x/utils';

import { artifacts, IStakingEventsTunedEventArgs, MixinParamsContract } from '../src/';

blockchainTests('Configurable Parameters', env => {
    let testContract: MixinParamsContract;
    let ownerAddress: string;
    let notOwnerAddress: string;

    before(async () => {
        [ownerAddress, notOwnerAddress] = await env.getAccountAddressesAsync();
        testContract = await MixinParamsContract.deployFrom0xArtifactAsync(
            artifacts.MixinParams,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    blockchainTests.resets('setParams()', () => {
        interface HyperParameters {
            epochDurationInSeconds: Numberish;
            rewardDelegatedStakeWeight: Numberish;
            minimumPoolStake: Numberish;
            maximumMakersInPool: Numberish;
            cobbDouglasAlphaNumerator: Numberish;
            cobbDouglasAlphaDenomintor: Numberish;
        }

        const TWO_WEEKS = 14 * 24 * 60 * 60;
        const PPM_90_PERCENT = 10 ** 6 * 0.9;
        const DEFAULT_PARAMS = {
            epochDurationInSeconds: TWO_WEEKS,
            rewardDelegatedStakeWeight: PPM_90_PERCENT,
            minimumPoolStake: '100e18',
            maximumMakersInPool: 10,
            cobbDouglasAlphaNumerator: 1,
            cobbDouglasAlphaDenomintor: 2,
        };

        async function setParamsAndAssertAsync(params: Partial<HyperParameters>, from?: string): Promise<void> {
            const _params = {
                ...DEFAULT_PARAMS,
                ...params,
            };
            const receipt = await testContract.setParams.awaitTransactionSuccessAsync(
                new BigNumber(_params.epochDurationInSeconds),
                new BigNumber(_params.rewardDelegatedStakeWeight),
                new BigNumber(_params.minimumPoolStake),
                new BigNumber(_params.maximumMakersInPool),
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
            expect(event.maximumMakersInPool).to.bignumber.eq(_params.maximumMakersInPool);
            expect(event.cobbDouglasAlphaNumerator).to.bignumber.eq(_params.cobbDouglasAlphaNumerator);
            expect(event.cobbDouglasAlphaDenomintor).to.bignumber.eq(_params.cobbDouglasAlphaDenomintor);
            // Assert `getParams()`.
            const actual = await testContract.getParams.callAsync();
            expect(actual[0]).to.bignumber.eq(_params.epochDurationInSeconds);
            expect(actual[1]).to.bignumber.eq(_params.rewardDelegatedStakeWeight);
            expect(actual[2]).to.bignumber.eq(_params.minimumPoolStake);
            expect(actual[3]).to.bignumber.eq(_params.maximumMakersInPool);
            expect(actual[4]).to.bignumber.eq(_params.cobbDouglasAlphaNumerator);
            expect(actual[5]).to.bignumber.eq(_params.cobbDouglasAlphaDenomintor);
        }

        it('throws if not called by owner', async () => {
            const tx = setParamsAndAssertAsync({}, notOwnerAddress);
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwnerAddress, ownerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('works if called by owner', async () => {
            return setParamsAndAssertAsync({});
        });

        describe('rewardDelegatedStakeWeight', () => {
            it('throws when > PPM_100_PERCENT', async () => {
                const params = {
                    // tslint:disable-next-line restrict-plus-operands
                    rewardDelegatedStakeWeight: constants.PPM_100_PERCENT + 1,
                };
                const tx = setParamsAndAssertAsync(params);
                const expectedError = new StakingRevertErrors.InvalidParamValueError(
                    StakingRevertErrors.InvalidParamValueErrorCode.InvalidRewardDelegatedStakeWeight,
                );
                return expect(tx).to.revertWith(expectedError);
            });
        });

        describe('maximumMakersInPool', () => {
            it('throws when == 0', async () => {
                const params = {
                    maximumMakersInPool: 0,
                };
                const tx = setParamsAndAssertAsync(params);
                const expectedError = new StakingRevertErrors.InvalidParamValueError(
                    StakingRevertErrors.InvalidParamValueErrorCode.InvalidMaximumMakersInPool,
                );
                return expect(tx).to.revertWith(expectedError);
            });
        });

        describe('cobb-douglas alpha', () => {
            it('throws with denominator == 0', async () => {
                const params = {
                    cobbDouglasAlphaNumerator: 0,
                    cobbDouglasAlphaDenomintor: 0,
                };
                const tx = setParamsAndAssertAsync(params);
                const expectedError = new StakingRevertErrors.InvalidParamValueError(
                    StakingRevertErrors.InvalidParamValueErrorCode.InvalidCobbDouglasAlpha,
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it('throws with numerator > denominator', async () => {
                const params = {
                    cobbDouglasAlphaNumerator: 2,
                    cobbDouglasAlphaDenomintor: 1,
                };
                const tx = setParamsAndAssertAsync(params);
                const expectedError = new StakingRevertErrors.InvalidParamValueError(
                    StakingRevertErrors.InvalidParamValueErrorCode.InvalidCobbDouglasAlpha,
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it('accepts numerator == denominator', async () => {
                const params = {
                    cobbDouglasAlphaNumerator: 1,
                    cobbDouglasAlphaDenomintor: 1,
                };
                return setParamsAndAssertAsync(params);
            });

            it('accepts numerator < denominator', async () => {
                const params = {
                    cobbDouglasAlphaNumerator: 1,
                    cobbDouglasAlphaDenomintor: 2,
                };
                return setParamsAndAssertAsync(params);
            });

            it('accepts numerator == 0', async () => {
                const params = {
                    cobbDouglasAlphaNumerator: 0,
                    cobbDouglasAlphaDenomintor: 1,
                };
                return setParamsAndAssertAsync(params);
            });
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
