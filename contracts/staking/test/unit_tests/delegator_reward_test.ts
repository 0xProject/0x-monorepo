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
    TestDelegatorRewardsEvents,
    TestDelegatorRewardsRecordDepositToEthVaultEventArgs as EthVaultDepositEventArgs,
    TestDelegatorRewardsRecordDepositToRewardVaultEventArgs as RewardVaultDepositEventArgs,
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
        membersReward: Numberish;
        operatorReward: Numberish;
        membersStake: Numberish;
    }

    async function rewardPoolMembersAsync(opts?: Partial<RewardPoolMembersOpts>): Promise<RewardPoolMembersOpts> {
        const _opts = {
            poolId: hexRandom(),
            membersReward: getRandomInteger(1, toBaseUnitAmount(100)),
            operatorReward: getRandomInteger(1, toBaseUnitAmount(100)),
            membersStake: getRandomInteger(1, toBaseUnitAmount(10)),
            ...opts,
        };
        await testContract.recordStakingPoolRewards.awaitTransactionSuccessAsync(
            _opts.poolId,
            new BigNumber(_opts.operatorReward),
            new BigNumber(_opts.membersReward),
            new BigNumber(_opts.membersStake),
        );
        return _opts;
    }

    interface SetUnfinalizedMembersRewardsOpts extends RewardPoolMembersOpts {}

    async function setUnfinalizedPoolRewardAsync(
        opts?: Partial<SetUnfinalizedMembersRewardsOpts>,
    ): Promise<SetUnfinalizedMembersRewardsOpts> {
        const _opts = {
            poolId: hexRandom(),
            membersReward: getRandomInteger(1, toBaseUnitAmount(100)),
            operatorReward: getRandomInteger(1, toBaseUnitAmount(100)),
            membersStake: getRandomInteger(1, toBaseUnitAmount(10)),
            ...opts,
        };
        await testContract.setUnfinalizedPoolReward.awaitTransactionSuccessAsync(
            _opts.poolId,
            new BigNumber(_opts.operatorReward),
            new BigNumber(_opts.membersReward),
            new BigNumber(_opts.membersStake),
        );
        return _opts;
    }

    type ResultWithDeposits<T extends {}> = T & {
        ethVaultDeposit: BigNumber;
        rewardVaultDeposit: BigNumber;
    };

    interface DelegateStakeOpts {
        delegator: string;
        stake: Numberish;
    }

    async function delegateStakeNowAsync(
        poolId: string,
        opts?: Partial<DelegateStakeOpts>,
    ): Promise<ResultWithDeposits<DelegateStakeOpts>> {
        return delegateStakeAsync(poolId, opts, true);
    }

    async function delegateStakeAsync(
        poolId: string,
        opts?: Partial<DelegateStakeOpts>,
        now?: boolean,
    ): Promise<ResultWithDeposits<DelegateStakeOpts>> {
        const _opts = {
            delegator: randomAddress(),
            stake: getRandomInteger(1, toBaseUnitAmount(10)),
            ...opts,
        };
        const fn = now ? testContract.delegateStakeNow : testContract.delegateStake;
        const receipt = await fn.awaitTransactionSuccessAsync(_opts.delegator, poolId, new BigNumber(_opts.stake));
        const [ethVaultDeposit, rewardVaultDeposit] = getDepositsFromLogs(receipt.logs, poolId, _opts.delegator);
        return {
            ..._opts,
            ethVaultDeposit,
            rewardVaultDeposit,
        };
    }

    async function undelegateStakeAsync(
        poolId: string,
        delegator: string,
        stake?: Numberish,
    ): Promise<ResultWithDeposits<{ stake: BigNumber }>> {
        const _stake = new BigNumber(
            stake ||
                (await testContract.getStakeDelegatedToPoolByOwner.callAsync(delegator, poolId)).currentEpochBalance,
        );
        const receipt = await testContract.undelegateStake.awaitTransactionSuccessAsync(delegator, poolId, _stake);
        const [ethVaultDeposit, rewardVaultDeposit] = getDepositsFromLogs(receipt.logs, poolId, delegator);
        return {
            stake: _stake,
            ethVaultDeposit,
            rewardVaultDeposit,
        };
    }

    function getDepositsFromLogs(logs: LogEntry[], poolId: string, delegator?: string): [BigNumber, BigNumber] {
        let ethVaultDeposit = constants.ZERO_AMOUNT;
        let rewardVaultDeposit = constants.ZERO_AMOUNT;
        const ethVaultDepositArgs = filterLogsToArguments<EthVaultDepositEventArgs>(
            logs,
            TestDelegatorRewardsEvents.RecordDepositToEthVault,
        );
        if (ethVaultDepositArgs.length > 0) {
            expect(ethVaultDepositArgs.length).to.eq(1);
            if (delegator !== undefined) {
                expect(ethVaultDepositArgs[0].owner).to.eq(delegator);
            }
            ethVaultDeposit = ethVaultDepositArgs[0].amount;
        }
        const rewardVaultDepositArgs = filterLogsToArguments<RewardVaultDepositEventArgs>(
            logs,
            TestDelegatorRewardsEvents.RecordDepositToRewardVault,
        );
        if (rewardVaultDepositArgs.length > 0) {
            expect(rewardVaultDepositArgs.length).to.eq(1);
            expect(rewardVaultDepositArgs[0].poolId).to.eq(poolId);
            rewardVaultDeposit = rewardVaultDepositArgs[0].amount;
        }
        return [ethVaultDeposit, rewardVaultDeposit];
    }

    async function advanceEpochAsync(): Promise<number> {
        await testContract.advanceEpoch.awaitTransactionSuccessAsync();
        const epoch = await testContract.currentEpoch.callAsync();
        return epoch.toNumber();
    }

    async function getDelegatorRewardBalanceAsync(poolId: string, delegator: string): Promise<BigNumber> {
        return testContract.computeRewardBalanceOfDelegator.callAsync(poolId, delegator);
    }

    async function touchStakeAsync(poolId: string, delegator: string): Promise<ResultWithDeposits<{}>> {
        return undelegateStakeAsync(poolId, delegator, 0);
    }

    async function finalizePoolAsync(poolId: string): Promise<ResultWithDeposits<{}>> {
        const receipt = await testContract.internalFinalizePool.awaitTransactionSuccessAsync(poolId);
        const [ethVaultDeposit, rewardVaultDeposit] = getDepositsFromLogs(receipt.logs, poolId);
        return {
            ethVaultDeposit,
            rewardVaultDeposit,
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
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 1 for delegator with no stake', async () => {
            await advanceEpochAsync(); // epoch 1
            const { poolId } = await rewardPoolMembersAsync();
            const delegator = randomAddress();
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 0 for delegator staked in epoch 0', async () => {
            const { poolId } = await rewardPoolMembersAsync();
            // Assign active stake to pool in epoch 0, which is usuaslly not
            // possible due to delegating delays.
            const { delegator } = await delegateStakeNowAsync(poolId);
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 1 for delegator delegating in epoch 1', async () => {
            await advanceEpochAsync(); // epoch 1
            const { poolId } = await rewardPoolMembersAsync();
            const { delegator } = await delegateStakeAsync(poolId);
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 1 for delegator delegating in epoch 0', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            // rewards paid for stake in epoch 0.
            await rewardPoolMembersAsync({ poolId, membersStake: stake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('all rewards from epoch 2 for delegator delegating in epoch 0', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1.
            const { membersReward: reward } = await rewardPoolMembersAsync({ poolId, membersStake: stake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(reward);
        });

        it('all rewards from epoch 2 and 3 for delegator delegating in epoch 0', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            const { membersReward: reward1 } = await rewardPoolMembersAsync({ poolId, membersStake: stake });
            await advanceEpochAsync(); // epoch 3
            const { membersReward: reward2 } = await rewardPoolMembersAsync({ poolId, membersStake: stake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            assertRoughlyEquals(delegatorReward, BigNumber.sum(reward1, reward2));
        });

        it('partial rewards from epoch 2 and 3 for delegator partially delegating in epoch 0', async () => {
            const poolId = hexRandom();
            const { delegator, stake: delegatorStake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1.
            const { membersReward: reward, membersStake: rewardStake } = await rewardPoolMembersAsync({
                poolId,
                membersStake: new BigNumber(delegatorStake).times(2),
            });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            const expectedDelegatorRewards = computeDelegatorRewards(reward, delegatorStake, rewardStake);
            assertRoughlyEquals(delegatorReward, expectedDelegatorRewards);
        });

        it('has correct reward immediately after unstaking', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1.
            const { membersReward: reward } = await rewardPoolMembersAsync({ poolId, membersStake: stake });
            const { ethVaultDeposit: deposit } = await undelegateStakeAsync(poolId, delegator);
            expect(deposit).to.bignumber.eq(reward);
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('has correct reward immediately after unstaking and restaking', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1.
            const { membersReward: reward } = await rewardPoolMembersAsync({ poolId, membersStake: stake });
            const { ethVaultDeposit: deposit } = await undelegateStakeAsync(poolId, delegator);
            expect(deposit).to.bignumber.eq(reward);
            await delegateStakeAsync(poolId, { delegator, stake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('has correct reward immediately after unstaking, restaking, and rewarding fees', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1.
            await rewardPoolMembersAsync({ poolId, membersStake: stake });
            await undelegateStakeAsync(poolId, delegator);
            await delegateStakeAsync(poolId, { delegator, stake });
            await advanceEpochAsync(); // epoch 3
            await advanceEpochAsync(); // epoch 4
            // rewards paid for stake in epoch 3.
            const { membersReward: reward } = await rewardPoolMembersAsync({ poolId, membersStake: stake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(reward);
        });

        it('ignores rewards paid in the same epoch the stake was first active in', async () => {
            const poolId = hexRandom();
            // stake at 0
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            // Pay rewards for epoch 0.
            await advanceEpochAsync(); // epoch 2
            // Pay rewards for epoch 1.
            const { membersReward: reward } = await rewardPoolMembersAsync({ poolId, membersStake: stake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(reward);
        });

        it('uses old stake for rewards paid in the same epoch extra stake is added', async () => {
            const poolId = hexRandom();
            // stake at 0
            const { delegator, stake: stake1 } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake1 now active)
            await advanceEpochAsync(); // epoch 2
            const stake2 = getRandomInteger(0, stake1);
            const totalStake = BigNumber.sum(stake1, stake2);
            // Make the total stake in rewards > totalStake so delegator never
            // receives 100% of rewards.
            const rewardStake = totalStake.times(2);
            // Pay rewards for epoch 1.
            const { membersReward: reward1 } = await rewardPoolMembersAsync({ poolId, membersStake: rewardStake });
            // add extra stake
            const { ethVaultDeposit: deposit } = await delegateStakeAsync(poolId, { delegator, stake: stake2 });
            await advanceEpochAsync(); // epoch 3 (stake2 now active)
            // Pay rewards for epoch 2.
            await advanceEpochAsync(); // epoch 4
            // Pay rewards for epoch 3.
            const { membersReward: reward2 } = await rewardPoolMembersAsync({ poolId, membersStake: rewardStake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            const expectedDelegatorReward = BigNumber.sum(
                computeDelegatorRewards(reward1, stake1, rewardStake),
                computeDelegatorRewards(reward2, totalStake, rewardStake),
            );
            assertRoughlyEquals(BigNumber.sum(deposit, delegatorReward), expectedDelegatorReward);
        });

        it('uses old stake for rewards paid in the epoch right after extra stake is added', async () => {
            const poolId = hexRandom();
            // stake at 0
            const { delegator, stake: stake1 } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake1 now active)
            // add extra stake
            const { stake: stake2 } = await delegateStakeAsync(poolId, { delegator });
            const totalStake = BigNumber.sum(stake1, stake2);
            await advanceEpochAsync(); // epoch 2 (stake2 now active)
            // Make the total stake in rewards > totalStake so delegator never
            // receives 100% of rewards.
            const rewardStake = totalStake.times(2);
            // Pay rewards for epoch 1.
            const { membersReward: reward1 } = await rewardPoolMembersAsync({ poolId, membersStake: rewardStake });
            await advanceEpochAsync(); // epoch 3
            // Pay rewards for epoch 2.
            const { membersReward: reward2 } = await rewardPoolMembersAsync({ poolId, membersStake: rewardStake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            const expectedDelegatorReward = BigNumber.sum(
                computeDelegatorRewards(reward1, stake1, rewardStake),
                computeDelegatorRewards(reward2, totalStake, rewardStake),
            );
            assertRoughlyEquals(delegatorReward, expectedDelegatorReward);
        });

        it('computes correct rewards for 2 staggered delegators', async () => {
            const poolId = hexRandom();
            const { delegator: delegatorA, stake: stakeA } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake A now active)
            const { delegator: delegatorB, stake: stakeB } = await delegateStakeAsync(poolId);
            const totalStake = BigNumber.sum(stakeA, stakeB);
            await advanceEpochAsync(); // epoch 2 (stake B now active)
            // rewards paid for stake in epoch 1 (delegator A only)
            const { membersReward: reward1 } = await rewardPoolMembersAsync({ poolId, membersStake: stakeA });
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2 (delegator A and B)
            const { membersReward: reward2 } = await rewardPoolMembersAsync({ poolId, membersStake: totalStake });
            const delegatorRewardA = await getDelegatorRewardBalanceAsync(poolId, delegatorA);
            const expectedDelegatorRewardA = BigNumber.sum(
                computeDelegatorRewards(reward1, stakeA, stakeA),
                computeDelegatorRewards(reward2, stakeA, totalStake),
            );
            assertRoughlyEquals(delegatorRewardA, expectedDelegatorRewardA);
            const delegatorRewardB = await getDelegatorRewardBalanceAsync(poolId, delegatorB);
            const expectedDelegatorRewardB = BigNumber.sum(computeDelegatorRewards(reward2, stakeB, totalStake));
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
            const { membersReward: reward1 } = await rewardPoolMembersAsync({ poolId, membersStake: stakeA });
            await advanceEpochAsync(); // epoch 3
            await advanceEpochAsync(); // epoch 4
            // rewards paid for stake in epoch 3 (delegator A and B)
            const { membersReward: reward2 } = await rewardPoolMembersAsync({ poolId, membersStake: totalStake });
            const delegatorRewardA = await getDelegatorRewardBalanceAsync(poolId, delegatorA);
            const expectedDelegatorRewardA = BigNumber.sum(
                computeDelegatorRewards(reward1, stakeA, stakeA),
                computeDelegatorRewards(reward2, stakeA, totalStake),
            );
            assertRoughlyEquals(delegatorRewardA, expectedDelegatorRewardA);
            const delegatorRewardB = await getDelegatorRewardBalanceAsync(poolId, delegatorB);
            const expectedDelegatorRewardB = BigNumber.sum(computeDelegatorRewards(reward2, stakeB, totalStake));
            assertRoughlyEquals(delegatorRewardB, expectedDelegatorRewardB);
        });

        it('correct rewards for rewards with different stakes', async () => {
            const poolId = hexRandom();
            const { delegator, stake: delegatorStake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1.
            const { membersReward: reward1, membersStake: rewardStake1 } = await rewardPoolMembersAsync({
                poolId,
                membersStake: new BigNumber(delegatorStake).times(2),
            });
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2
            const { membersReward: reward2, membersStake: rewardStake2 } = await rewardPoolMembersAsync({
                poolId,
                membersStake: new BigNumber(delegatorStake).times(3),
            });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
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
                await setUnfinalizedPoolRewardAsync({ poolId, membersStake: stake });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
                expect(reward).to.bignumber.eq(0);
            });

            it('nothing with only unfinalized rewards from epoch 1 for deleator delegating in epoch 0', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 1
                await setUnfinalizedPoolRewardAsync({ poolId, membersStake: stake });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
                expect(reward).to.bignumber.eq(0);
            });

            it('returns unfinalized rewards from epoch 2 for delegator delegating in epoch 0', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 1
                await advanceEpochAsync(); // epoch 2
                const { membersReward: unfinalizedReward } =
                    await setUnfinalizedPoolRewardAsync({ poolId, membersStake: stake });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
                expect(reward).to.bignumber.eq(unfinalizedReward);
            });

            it('returns unfinalized rewards from epoch 3 for delegator delegating in epoch 0', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 1
                await advanceEpochAsync(); // epoch 2
                await advanceEpochAsync(); // epoch 3
                const { membersReward: unfinalizedReward } =
                    await setUnfinalizedPoolRewardAsync({ poolId, membersStake: stake });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
                expect(reward).to.bignumber.eq(unfinalizedReward);
            });

            it('returns unfinalized rewards from epoch 3 + rewards from epoch 2 for delegator delegating in epoch 0', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 1
                await advanceEpochAsync(); // epoch 2
                const { membersReward: prevReward } = await rewardPoolMembersAsync({ poolId, membersStake: stake });
                await advanceEpochAsync(); // epoch 3
                const { membersReward: unfinalizedReward } = await setUnfinalizedPoolRewardAsync({ poolId, membersStake: stake });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
                const expectedReward = BigNumber.sum(prevReward, unfinalizedReward);
                expect(reward).to.bignumber.eq(expectedReward);
            });

            it('returns unfinalized rewards from epoch 4 + rewards from epoch 2 for delegator delegating in epoch 1', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 1
                await advanceEpochAsync(); // epoch 2
                const { membersReward: prevReward } = await rewardPoolMembersAsync({ poolId, membersStake: stake });
                await advanceEpochAsync(); // epoch 3
                await advanceEpochAsync(); // epoch 4
                const { membersReward: unfinalizedReward } =
                    await setUnfinalizedPoolRewardAsync({ poolId, membersStake: stake });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
                const expectedReward = BigNumber.sum(prevReward, unfinalizedReward);
                expect(reward).to.bignumber.eq(expectedReward);
            });

            it('returns correct rewards if unfinalized stake is different from previous rewards', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 1
                await advanceEpochAsync(); // epoch 2
                const { membersReward: prevReward, membersStake: prevStake } = await rewardPoolMembersAsync({
                    poolId,
                    membersStake: new BigNumber(stake).times(2),
                });
                await advanceEpochAsync(); // epoch 3
                await advanceEpochAsync(); // epoch 4
                const { membersReward: unfinalizedReward, membersStake: unfinalizedStake } =
                    await setUnfinalizedPoolRewardAsync({
                        poolId,
                        membersStake: new BigNumber(stake).times(5),
                    });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
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
            const { membersReward: reward } = await rewardPoolMembersAsync({ poolId, membersStake: stake });
            const { ethVaultDeposit: deposit } = await touchStakeAsync(poolId, delegator);
            const finalRewardBalance = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(deposit).to.bignumber.eq(reward);
            expect(finalRewardBalance).to.bignumber.eq(0);
        });

        it('does not collect extra rewards from delegating more stake in the reward epoch', async () => {
            const poolId = hexRandom();
            const stakeResults = [];
            // stake
            stakeResults.push(await delegateStakeAsync(poolId));
            const { delegator, stake } = stakeResults[0];
            const rewardStake = new BigNumber(stake).times(2);
            await advanceEpochAsync(); // epoch 1 (stake now active)
            // add more stake.
            stakeResults.push(await delegateStakeAsync(poolId, { delegator, stake }));
            await advanceEpochAsync(); // epoch 1 (2 * stake now active)
            // reward for epoch 1, using 2 * stake so delegator should
            // only be entitled to a fraction of the rewards.
            const { membersReward: reward } = await rewardPoolMembersAsync({ poolId, membersStake: rewardStake });
            await advanceEpochAsync(); // epoch 2
            // touch the stake one last time
            stakeResults.push(await touchStakeAsync(poolId, delegator));
            // Should only see deposits for epoch 2.
            const allDeposits = stakeResults.map(r => r.ethVaultDeposit);
            const expectedReward = computeDelegatorRewards(reward, stake, rewardStake);
            assertRoughlyEquals(BigNumber.sum(...allDeposits), expectedReward);
        });

        it('only collects rewards from staked epochs', async () => {
            const poolId = hexRandom();
            const stakeResults = [];
            // stake
            stakeResults.push(await delegateStakeAsync(poolId));
            const { delegator, stake } = stakeResults[0];
            const rewardStake = new BigNumber(stake).times(2);
            await advanceEpochAsync(); // epoch 1 (full stake now active)
            // reward for epoch 0
            await rewardPoolMembersAsync({ poolId, membersStake: rewardStake });
            // unstake some
            const unstake = new BigNumber(stake).dividedToIntegerBy(2);
            stakeResults.push(await undelegateStakeAsync(poolId, delegator, unstake));
            await advanceEpochAsync(); // epoch 2 (half active stake)
            // reward for epoch 1
            const { membersReward: reward1 } = await rewardPoolMembersAsync({ poolId, membersStake: rewardStake });
            // re-stake
            stakeResults.push(await delegateStakeAsync(poolId, { delegator, stake: unstake }));
            await advanceEpochAsync(); // epoch 3 (full stake now active)
            // reward for epoch 2
            const { membersReward: reward2 } = await rewardPoolMembersAsync({ poolId, membersStake: rewardStake });
            // touch the stake to claim rewards
            stakeResults.push(await touchStakeAsync(poolId, delegator));
            const allDeposits = stakeResults.map(r => r.ethVaultDeposit);
            const expectedReward = BigNumber.sum(
                computeDelegatorRewards(reward1, stake, rewardStake),
                computeDelegatorRewards(reward2, new BigNumber(stake).minus(unstake), rewardStake),
            );
            assertRoughlyEquals(BigNumber.sum(...allDeposits), expectedReward);
        });

        it('two delegators can collect split rewards as soon as available', async () => {
            const poolId = hexRandom();
            const { delegator: delegatorA, stake: stakeA } = await delegateStakeAsync(poolId);
            const { delegator: delegatorB, stake: stakeB } = await delegateStakeAsync(poolId);
            const totalStake = BigNumber.sum(stakeA, stakeB);
            await advanceEpochAsync(); // epoch 1 (stakes now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1
            const { membersReward: reward } = await rewardPoolMembersAsync({ poolId, membersStake: totalStake });
            // delegator A will finalize and collect rewards by touching stake.
            const { ethVaultDeposit: depositA } = await touchStakeAsync(poolId, delegatorA);
            assertRoughlyEquals(depositA, computeDelegatorRewards(reward, stakeA, totalStake));
            // delegator B will collect rewards by touching stake
            const { ethVaultDeposit: depositB } = await touchStakeAsync(poolId, delegatorB);
            assertRoughlyEquals(depositB, computeDelegatorRewards(reward, stakeB, totalStake));
        });

        it('delegator B collects correct rewards after delegator A finalizes', async () => {
            const poolId = hexRandom();
            const { delegator: delegatorA, stake: stakeA } = await delegateStakeAsync(poolId);
            const { delegator: delegatorB, stake: stakeB } = await delegateStakeAsync(poolId);
            const totalStake = BigNumber.sum(stakeA, stakeB);
            await advanceEpochAsync(); // epoch 1 (stakes now active)
            await advanceEpochAsync(); // epoch 2
            // rewards paid for stake in epoch 1
            const { membersReward: prevReward } = await rewardPoolMembersAsync({ poolId, membersStake: totalStake });
            await advanceEpochAsync(); // epoch 3
            // unfinalized rewards for stake in epoch 2
            const { membersReward: unfinalizedReward } = await setUnfinalizedPoolRewardAsync({
                poolId,
                membersStake: totalStake,
            });
            const totalRewards = BigNumber.sum(prevReward, unfinalizedReward);
            // delegator A will finalize and collect rewards by touching stake.
            const { ethVaultDeposit: depositA } = await touchStakeAsync(poolId, delegatorA);
            assertRoughlyEquals(depositA, computeDelegatorRewards(totalRewards, stakeA, totalStake));
            // delegator B will collect rewards by touching stake
            const { ethVaultDeposit: depositB } = await touchStakeAsync(poolId, delegatorB);
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
            const { membersReward: prevReward } = await rewardPoolMembersAsync({ poolId, membersStake: totalStake });
            await advanceEpochAsync(); // epoch 3
            // unfinalized rewards for stake in epoch 2
            const { membersReward: unfinalizedReward } = await setUnfinalizedPoolRewardAsync({
                poolId,
                membersStake: totalStake,
            });
            const totalRewards = BigNumber.sum(prevReward, unfinalizedReward);
            // finalize
            await finalizePoolAsync(poolId);
            // delegator A will collect rewards by touching stake.
            const { ethVaultDeposit: depositA } = await touchStakeAsync(poolId, delegatorA);
            assertRoughlyEquals(depositA, computeDelegatorRewards(totalRewards, stakeA, totalStake));
            // delegator B will collect rewards by touching stake
            const { ethVaultDeposit: depositB } = await touchStakeAsync(poolId, delegatorB);
            assertRoughlyEquals(depositB, computeDelegatorRewards(totalRewards, stakeB, totalStake));
        });
    });
});
// tslint:disable: max-file-line-count
