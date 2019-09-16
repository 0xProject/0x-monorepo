import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    hexRandom,
    Numberish,
} from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { LogEntry } from 'ethereum-types';

import {
    artifacts,
    TestDelegatorRewardsContract,
    TestDelegatorRewardsDepositEventArgs,
    TestDelegatorRewardsEvents,
} from '../../src';

import { assertRoughlyEquals, getRandomInteger, toBaseUnitAmount } from '../utils/number_utils';

blockchainTests.resets('delegator unit rewards', env => {
    let testContract: TestDelegatorRewardsContract;

    before(async () => {
        testContract = await TestDelegatorRewardsContract.deployFrom0xArtifactAsync(
            artifacts.TestDelegatorRewards,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    interface RewardPoolMembersOpts {
        poolId: string;
        reward: Numberish;
        stake: Numberish;
    }

    async function rewardPoolMembersAsync(
        opts?: Partial<RewardPoolMembersOpts>,
    ): Promise<RewardPoolMembersOpts> {
        const _opts = {
            poolId: hexRandom(),
            reward: getRandomInteger(1, toBaseUnitAmount(100)),
            stake: getRandomInteger(1, toBaseUnitAmount(10)),
            ...opts,
        };
        await testContract.recordRewardForDelegators.awaitTransactionSuccessAsync(
            _opts.poolId,
            new BigNumber(_opts.reward),
            new BigNumber(_opts.stake),
        );
        return _opts;
    }

    interface SetUnfinalizedMembersRewardsOpts {
        poolId: string;
        reward: Numberish;
        stake: Numberish;
    }

    async function setUnfinalizedMembersRewardsAsync(
        opts?: Partial<SetUnfinalizedMembersRewardsOpts>,
    ): Promise<SetUnfinalizedMembersRewardsOpts> {
        const _opts = {
            poolId: hexRandom(),
            reward: getRandomInteger(1, toBaseUnitAmount(100)),
            stake: getRandomInteger(1, toBaseUnitAmount(10)),
            ...opts,
        };
        await testContract.setUnfinalizedMembersRewards.awaitTransactionSuccessAsync(
            _opts.poolId,
            new BigNumber(_opts.reward),
            new BigNumber(_opts.stake),
        );
        return _opts;
    }

    type ResultWithDeposit<T extends {}> = T & {
        deposit: BigNumber;
    };

    interface DelegateStakeOpts {
        delegator: string;
        stake: Numberish;
    }

    async function delegateStakeNowAsync(
        poolId: string,
        opts?: Partial<DelegateStakeOpts>,
    ): Promise<ResultWithDeposit<DelegateStakeOpts>> {
        return delegateStakeAsync(poolId, opts, true);
    }

    async function delegateStakeAsync(
        poolId: string,
        opts?: Partial<DelegateStakeOpts>,
        now?: boolean,
    ): Promise<ResultWithDeposit<DelegateStakeOpts>> {
        const _opts = {
            delegator: randomAddress(),
            stake: getRandomInteger(1, toBaseUnitAmount(10)),
            ...opts,
        };
        const fn = now ? testContract.delegateStakeNow : testContract.delegateStake;
        const receipt = await fn.awaitTransactionSuccessAsync(
            _opts.delegator,
            poolId,
            new BigNumber(_opts.stake),
        );
        return {
            ..._opts,
            deposit: getDepositFromLogs(receipt.logs, poolId, _opts.delegator),
        };
    }

    async function undelegateStakeAsync(
        poolId: string,
        delegator: string,
        stake?: Numberish,
    ): Promise<ResultWithDeposit<{ stake: BigNumber }>> {
        const _stake = new BigNumber(
            stake || (await
                testContract
                .getStakeDelegatedToPoolByOwner
                .callAsync(delegator, poolId)
            ).currentEpochBalance,
        );
        const receipt = await testContract.undelegateStake.awaitTransactionSuccessAsync(
            delegator,
            poolId,
            _stake,
        );
        return {
            stake: _stake,
            deposit: getDepositFromLogs(receipt.logs, poolId, delegator),
        };
    }

    function getDepositFromLogs(logs: LogEntry[], poolId: string, delegator?: string): BigNumber {
        const events =
            filterLogsToArguments<TestDelegatorRewardsDepositEventArgs>(
                logs,
                TestDelegatorRewardsEvents.Deposit,
            );
        if (events.length > 0) {
            expect(events.length).to.eq(1);
            expect(events[0].poolId).to.eq(poolId);
            if (delegator !== undefined) {
                expect(events[0].member).to.eq(delegator);
            }
            return events[0].balance;
        }
        return constants.ZERO_AMOUNT;
    }

    async function advanceEpochAsync(): Promise<number> {
        await testContract.advanceEpoch.awaitTransactionSuccessAsync();
        const epoch = await testContract.getCurrentEpoch.callAsync();
        return epoch.toNumber();
    }

    async function getDelegatorRewardAsync(poolId: string, delegator: string): Promise<BigNumber> {
        return testContract.computeRewardBalanceOfDelegator.callAsync(
            poolId,
            delegator,
        );
    }

    async function touchStakeAsync(poolId: string, delegator: string): Promise<ResultWithDeposit<{}>> {
        return undelegateStakeAsync(poolId, delegator, 0);
    }

    async function finalizePoolAsync(poolId: string): Promise<ResultWithDeposit<{}>> {
        const receipt = await testContract.internalFinalizePool.awaitTransactionSuccessAsync(poolId);
        return {
            deposit: getDepositFromLogs(receipt.logs, poolId),
        };
    }

    function randomAddress(): string {
        return hexRandom(constants.ADDRESS_LENGTH);
    }

    function computeDelegatorRewards(
        totalRewards: Numberish,
        delegatorStake: Numberish,
        totalDelegatorStake: Numberish,
    ): BigNumber {
        return new BigNumber(totalRewards)
            .times(delegatorStake)
            .dividedBy(new BigNumber(totalDelegatorStake))
            .integerValue(BigNumber.ROUND_DOWN);
    }

    describe('computeRewardBalanceOfDelegator()', () => {
        it('nothing in epoch 0 for delegator with no stake', async () => {
            const { poolId } = await rewardPoolMembersAsync();
            const delegator = randomAddress();
            const delegatorReward = await getDelegatorRewardAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 1 for delegator with no stake', async () => {
            await advanceEpochAsync(); // epoch 1
            const { poolId } = await rewardPoolMembersAsync();
            const delegator = randomAddress();
            const delegatorReward = await getDelegatorRewardAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 0 for delegator staked in epoch 0', async () => {
            const { poolId } = await rewardPoolMembersAsync();
            // Assign active stake to pool in epoch 0, which is usuaslly not
            // possible due to delegating delays.
            const { delegator } = await delegateStakeNowAsync(poolId);
            const delegatorReward = await getDelegatorRewardAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 1 for delegator delegating in epoch 1', async () => {
            await advanceEpochAsync(); // epoch 1
            const { poolId } = await rewardPoolMembersAsync();
            const { delegator } = await delegateStakeAsync(poolId);
            const delegatorReward = await getDelegatorRewardAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 1 for delegator delegating in epoch 0', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            // rewards paid for stake in epoch 0.
            await rewardPoolMembersAsync({ poolId, stake });
            const delegatorReward = await getDelegatorRewardAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('all rewards from epoch 2 for delegator delegating in epoch 0', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1.
            const { reward } = await rewardPoolMembersAsync({ poolId, stake });
            const delegatorReward = await getDelegatorRewardAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(reward);
        });

        it('all rewards from epoch 2 and 3 for delegator delegating in epoch 0', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            const { reward: reward1 } = await rewardPoolMembersAsync({ poolId, stake });
            await advanceEpochAsync(); // epoch 3
            const { reward: reward2 } = await rewardPoolMembersAsync({ poolId, stake });
            const delegatorReward = await getDelegatorRewardAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(BigNumber.sum(reward1, reward2));
        });

        it('partial rewards from epoch 2 and 3 for delegator partially delegating in epoch 0', async () => {
            const poolId = hexRandom();
            const { delegator, stake: delegatorStake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1.
            const { reward, stake: rewardStake } = await rewardPoolMembersAsync(
                { poolId, stake: new BigNumber(delegatorStake).times(2) },
            );
            const delegatorReward = await getDelegatorRewardAsync(poolId, delegator);
            const expectedDelegatorRewards = computeDelegatorRewards(reward, delegatorStake, rewardStake);
            assertRoughlyEquals(delegatorReward, expectedDelegatorRewards);
        });

        it('has correct reward immediately after unstaking', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1.
            const { reward }  = await rewardPoolMembersAsync(
                { poolId, stake },
            );
            const { deposit } = await undelegateStakeAsync(poolId, delegator);
            expect(deposit).to.bignumber.eq(reward);
            const delegatorReward = await getDelegatorRewardAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('has correct reward immediately after unstaking and restaking', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1.
            const { reward } = await rewardPoolMembersAsync(
                { poolId, stake },
            );
            const { deposit } = await undelegateStakeAsync(poolId, delegator);
            expect(deposit).to.bignumber.eq(reward);
            await delegateStakeAsync(poolId, { delegator, stake });
            const delegatorReward = await getDelegatorRewardAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it.only('has correct reward immediately after unstaking, restaking, and rewarding fees', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1.
            await rewardPoolMembersAsync({ poolId, stake });
            await undelegateStakeAsync(poolId, delegator);
            await delegateStakeAsync(poolId, { delegator, stake });
            await advanceEpochAsync(); // epoch 3
            await advanceEpochAsync(); // epoch 4
            // rewards paid for stake in epoch 3.
            const { reward } = await rewardPoolMembersAsync(
                { poolId, stake },
            );
            const delegatorReward = await getDelegatorRewardAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(reward);
        });

        it('computes correct rewards for 2 staggered delegators', async () => {
            const poolId = hexRandom();
            const { delegator: delegatorA, stake: stakeA } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake A now active)
            const { delegator: delegatorB, stake: stakeB } = await delegateStakeAsync(poolId);
            const totalStake = BigNumber.sum(stakeA, stakeB);
            await advanceEpochAsync(); // epoch 2 (stake B now active)
            // rewards paid for stake in epoch 1 (delegator A only)
            const { reward: reward1 } = await rewardPoolMembersAsync(
                { poolId, stake: stakeA },
            );
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2 (delegator A and B)
            const { reward: reward2 } = await rewardPoolMembersAsync(
                { poolId, stake: totalStake },
            );
            const delegatorRewardA = await getDelegatorRewardAsync(poolId, delegatorA);
            const expectedDelegatorRewardA = BigNumber.sum(
                computeDelegatorRewards(reward1, stakeA, stakeA),
                computeDelegatorRewards(reward2, stakeA, totalStake),
            );
            assertRoughlyEquals(delegatorRewardA, expectedDelegatorRewardA);
            const delegatorRewardB = await getDelegatorRewardAsync(poolId, delegatorB);
            const expectedDelegatorRewardB = BigNumber.sum(
                computeDelegatorRewards(reward2, stakeB, totalStake),
            );
            assertRoughlyEquals(delegatorRewardB, expectedDelegatorRewardB);
        });

        it('computes correct rewards for 2 staggered delegators with a 2 epoch gap between payments', async () => {
            const poolId = hexRandom();
            const { delegator: delegatorA, stake: stakeA } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake A now active)
            const { delegator: delegatorB, stake: stakeB } = await delegateStakeAsync(poolId);
            const totalStake = BigNumber.sum(stakeA, stakeB);
            await advanceEpochAsync(); // epoch 2 (stake B now active)
            // rewards paid for stake in epoch 1 (delegator A only)
            const { reward: reward1 } = await rewardPoolMembersAsync(
                { poolId, stake: stakeA },
            );
            await advanceEpochAsync(); // epoch 3
            await advanceEpochAsync(); // epoch 4
            // rewards paid for stake in epoch 3 (delegator A and B)
            const { reward: reward2 } = await rewardPoolMembersAsync(
                { poolId, stake: totalStake },
            );
            const delegatorRewardA = await getDelegatorRewardAsync(poolId, delegatorA);
            const expectedDelegatorRewardA = BigNumber.sum(
                computeDelegatorRewards(reward1, stakeA, stakeA),
                computeDelegatorRewards(reward2, stakeA, totalStake),
            );
            assertRoughlyEquals(delegatorRewardA, expectedDelegatorRewardA);
            const delegatorRewardB = await getDelegatorRewardAsync(poolId, delegatorB);
            const expectedDelegatorRewardB = BigNumber.sum(
                computeDelegatorRewards(reward2, stakeB, totalStake),
            );
            assertRoughlyEquals(delegatorRewardB, expectedDelegatorRewardB);
        });

        it('correct rewards for rewards with different stakes', async () => {
            const poolId = hexRandom();
            const { delegator, stake: delegatorStake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1.
            const { reward: reward1, stake: rewardStake1 } = await rewardPoolMembersAsync(
                { poolId, stake: new BigNumber(delegatorStake).times(2) },
            );
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2
            const { reward: reward2, stake: rewardStake2 } = await rewardPoolMembersAsync(
                { poolId, stake: new BigNumber(delegatorStake).times(3) },
            );
            const delegatorReward = await getDelegatorRewardAsync(poolId, delegator);
            const expectedDelegatorReward = BigNumber.sum(
                computeDelegatorRewards(reward1, delegatorStake, rewardStake1),
                computeDelegatorRewards(reward2, delegatorStake, rewardStake2),
            );
            assertRoughlyEquals(delegatorReward, expectedDelegatorReward);
        });

        describe('with unfinalized rewards', async () => {
            it('nothing with only unfinalized rewards from epoch 1 for deleator with nothing delegated', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId, { stake: 0 });
                await advanceEpochAsync(); // epoch 1
                await setUnfinalizedMembersRewardsAsync({ poolId, stake });
                const reward = await getDelegatorRewardAsync(poolId, delegator);
                expect(reward).to.bignumber.eq(0);
            });

            it('nothing with only unfinalized rewards from epoch 1 for deleator delegating in epoch 0', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 1
                await setUnfinalizedMembersRewardsAsync({ poolId, stake });
                const reward = await getDelegatorRewardAsync(poolId, delegator);
                expect(reward).to.bignumber.eq(0);
            });

            it('returns only unfinalized rewards from epoch 2 for delegator delegating in epoch 1', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 1
                await advanceEpochAsync(); // epoch 2
                const { reward: unfinalizedReward } = await setUnfinalizedMembersRewardsAsync({ poolId, stake });
                const reward = await getDelegatorRewardAsync(poolId, delegator);
                expect(reward).to.bignumber.eq(unfinalizedReward);
            });

            it('returns only unfinalized rewards from epoch 3 for delegator delegating in epoch 1', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 1
                await advanceEpochAsync(); // epoch 2
                await advanceEpochAsync(); // epoch 3
                const { reward: unfinalizedReward } = await setUnfinalizedMembersRewardsAsync({ poolId, stake });
                const reward = await getDelegatorRewardAsync(poolId, delegator);
                expect(reward).to.bignumber.eq(unfinalizedReward);
            });

            it('returns unfinalized rewards from epoch 3 + rewards from epoch 2 for delegator delegating in epoch 1', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 1
                await advanceEpochAsync(); // epoch 2
                const { reward: prevReward } = await rewardPoolMembersAsync({ poolId, stake });
                await advanceEpochAsync(); // epoch 3
                const { reward: unfinalizedReward } = await setUnfinalizedMembersRewardsAsync({ poolId, stake });
                const reward = await getDelegatorRewardAsync(poolId, delegator);
                const expectedReward = BigNumber.sum(prevReward, unfinalizedReward);
                expect(reward).to.bignumber.eq(expectedReward);
            });

            it('returns unfinalized rewards from epoch 4 + rewards from epoch 2 for delegator delegating in epoch 1', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 1
                await advanceEpochAsync(); // epoch 2
                const { reward: prevReward } = await rewardPoolMembersAsync({ poolId, stake });
                await advanceEpochAsync(); // epoch 3
                await advanceEpochAsync(); // epoch 4
                const { reward: unfinalizedReward } = await setUnfinalizedMembersRewardsAsync({ poolId, stake });
                const reward = await getDelegatorRewardAsync(poolId, delegator);
                const expectedReward = BigNumber.sum(prevReward, unfinalizedReward);
                expect(reward).to.bignumber.eq(expectedReward);
            });

            it('returns correct rewards if unfinalized stake is different from previous rewards', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 1
                await advanceEpochAsync(); // epoch 2
                const { reward: prevReward, stake: prevStake } = await rewardPoolMembersAsync(
                    { poolId, stake: new BigNumber(stake).times(2) },
                );
                await advanceEpochAsync(); // epoch 3
                await advanceEpochAsync(); // epoch 4
                const { reward: unfinalizedReward, stake: unfinalizedStake } =
                    await setUnfinalizedMembersRewardsAsync(
                        { poolId, stake: new BigNumber(stake).times(5) },
                    );
                const reward = await getDelegatorRewardAsync(poolId, delegator);
                const expectedReward = BigNumber.sum(
                    computeDelegatorRewards(prevReward, stake, prevStake),
                    computeDelegatorRewards(unfinalizedReward, stake, unfinalizedStake),
                );
                assertRoughlyEquals(reward, expectedReward);
            });
        });
    });

    describe('reward transfers', async () => {
        it('transfers all rewards to eth vault when touching stake', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1
            const { reward } = await rewardPoolMembersAsync({ poolId, stake });
            const { deposit } = await touchStakeAsync(poolId, delegator);
            expect(deposit).to.bignumber.eq(reward);
        });

        it('does not collect extra rewards from delegating more stake in the reward epoch', async () => {
            const poolId = hexRandom();
            const stakeResults = [];
            // stake
            stakeResults.push(await delegateStakeAsync(poolId));
            const { delegator, stake } = stakeResults[0];
            const totalStake = new BigNumber(stake).times(2);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            // add more stake.
            stakeResults.push(await delegateStakeAsync(poolId, { delegator, stake }));
            await advanceEpochAsync(); // epoch 1 (2 * stake now active)
            // reward for epoch 1, using 2 * stake so delegator should
            // only be entitled to a fraction of the rewards.
            const { reward } = await rewardPoolMembersAsync({ poolId, stake: totalStake });
            await advanceEpochAsync(); // epoch 2
            // touch the stake one last time
            stakeResults.push(await touchStakeAsync(poolId, delegator));
            // Should only see deposits for epoch 2.
            const expectedDeposit = computeDelegatorRewards(reward, stake, totalStake);
            const allDeposits = stakeResults.map(r => r.deposit);
            assertRoughlyEquals(BigNumber.sum(...allDeposits), expectedDeposit);
        });

        it('only collects rewards from staked epochs', async () => {
            const poolId = hexRandom();
            const stakeResults = [];
            // stake
            stakeResults.push(await delegateStakeAsync(poolId));
            const { delegator, stake } = stakeResults[0];
            await advanceEpochAsync(); // epoch 1 (stake now active)
            // unstake before and after reward payout, to be extra sneaky.
            const unstake1 = new BigNumber(stake).dividedToIntegerBy(2);
            stakeResults.push(await undelegateStakeAsync(poolId, delegator, unstake1));
            // reward for epoch 0
            await rewardPoolMembersAsync({ poolId, stake });
            const unstake2 = new BigNumber(stake).minus(unstake1);
            stakeResults.push(await undelegateStakeAsync(poolId, delegator, unstake2));
            await advanceEpochAsync(); // epoch 2 (no active stake)
            // reward for epoch 1
            const { reward } = await rewardPoolMembersAsync({ poolId, stake });
            // re-stake
            stakeResults.push(await delegateStakeAsync(poolId, { delegator, stake }));
            await advanceEpochAsync(); // epoch 3 (stake now active)
            // reward for epoch 2
            await rewardPoolMembersAsync({ poolId, stake });
            // touch the stake one last time
            stakeResults.push(await touchStakeAsync(poolId, delegator));
            // Should only see deposits for epoch 2.
            const allDeposits = stakeResults.map(r => r.deposit);
            assertRoughlyEquals(BigNumber.sum(...allDeposits), reward);
        });

        it('delegator B collects correct rewards after delegator A finalizes', async () => {
            const poolId = hexRandom();
            const { delegator: delegatorA, stake: stakeA } = await delegateStakeAsync(poolId);
            const { delegator: delegatorB, stake: stakeB } = await delegateStakeAsync(poolId);
            const totalStake = BigNumber.sum(stakeA, stakeB);
            await advanceEpochAsync(); // epoch 1 (stakes now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1
            const { reward: prevReward } = await rewardPoolMembersAsync({ poolId, stake: totalStake });
            await advanceEpochAsync(); // epoch 3
            // unfinalized rewards for stake in epoch 2
            const { reward: unfinalizedReward } = await setUnfinalizedMembersRewardsAsync({ poolId, stake: totalStake });
            const totalRewards = BigNumber.sum(prevReward, unfinalizedReward);
            // delegator A will finalize and collect rewards by touching stake.
            const { deposit: depositA } = await touchStakeAsync(poolId, delegatorA);
            assertRoughlyEquals(depositA, computeDelegatorRewards(totalRewards, stakeA, totalStake));
            // delegator B will collect rewards by touching stake
            const { deposit: depositB } = await touchStakeAsync(poolId, delegatorB);
            assertRoughlyEquals(depositB, computeDelegatorRewards(totalRewards, stakeB, totalStake));
        });

        it('delegator A and B collect correct rewards after external finalization', async () => {
            const poolId = hexRandom();
            const { delegator: delegatorA, stake: stakeA } = await delegateStakeAsync(poolId);
            const { delegator: delegatorB, stake: stakeB } = await delegateStakeAsync(poolId);
            const totalStake = BigNumber.sum(stakeA, stakeB);
            await advanceEpochAsync(); // epoch 1 (stakes now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1
            const { reward: prevReward } = await rewardPoolMembersAsync({ poolId, stake: totalStake });
            await advanceEpochAsync(); // epoch 3
            // unfinalized rewards for stake in epoch 2
            const { reward: unfinalizedReward } = await setUnfinalizedMembersRewardsAsync({ poolId, stake: totalStake });
            const totalRewards = BigNumber.sum(prevReward, unfinalizedReward);
            // finalize
            await finalizePoolAsync(poolId);
            // delegator A will collect rewards by touching stake.
            const { deposit: depositA } = await touchStakeAsync(poolId, delegatorA);
            assertRoughlyEquals(depositA, computeDelegatorRewards(totalRewards, stakeA, totalStake));
            // delegator B will collect rewards by touching stake
            const { deposit: depositB } = await touchStakeAsync(poolId, delegatorB);
            assertRoughlyEquals(depositB, computeDelegatorRewards(totalRewards, stakeB, totalStake));
        });
    });
});
// tslint:disable: max-file-line-count
