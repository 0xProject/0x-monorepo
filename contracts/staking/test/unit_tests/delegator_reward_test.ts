import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    hexHash,
    hexRandom,
    hexSlice,
    Numberish,
    randomAddress,
} from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { LogEntry } from 'ethereum-types';

import { artifacts } from '../artifacts';
import {
    assertIntegerRoughlyEquals as assertRoughlyEquals,
    getRandomInteger,
    toBaseUnitAmount,
} from '../utils/number_utils';

import {
    TestDelegatorRewardsContract,
    TestDelegatorRewardsEvents,
    TestDelegatorRewardsTransferEventArgs,
} from '../wrappers';

blockchainTests.resets('Delegator rewards unit tests', env => {
    let testContract: TestDelegatorRewardsContract;

    before(async () => {
        testContract = await TestDelegatorRewardsContract.deployFrom0xArtifactAsync(
            artifacts.TestDelegatorRewards,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    interface RewardPoolOpts {
        poolId: string;
        operator: string;
        membersReward: Numberish;
        operatorReward: Numberish;
        membersStake: Numberish;
    }

    async function rewardPoolAsync(opts?: Partial<RewardPoolOpts>): Promise<RewardPoolOpts> {
        const _opts = {
            poolId: hexRandom(),
            operator: constants.NULL_ADDRESS,
            membersReward: getRandomInteger(1, toBaseUnitAmount(100)),
            operatorReward: getRandomInteger(1, toBaseUnitAmount(100)),
            membersStake: getRandomInteger(1, toBaseUnitAmount(10)),
            ...opts,
        };
        // Generate a deterministic operator address based on the poolId.
        _opts.operator = poolIdToOperator(_opts.poolId);
        await testContract
            .syncPoolRewards(
                _opts.poolId,
                _opts.operator,
                new BigNumber(_opts.operatorReward),
                new BigNumber(_opts.membersReward),
                new BigNumber(_opts.membersStake),
            )
            .awaitTransactionSuccessAsync();
        // Because the operator share is implicitly defined by the member and
        // operator reward, and is stored as a uint32, there will be precision
        // loss when the reward is combined then split again in the contracts.
        // So we perform this transformation on the values and return them.
        [_opts.operatorReward, _opts.membersReward] = toActualRewards(_opts.operatorReward, _opts.membersReward);
        return _opts;
    }

    interface SetUnfinalizedMembersRewardsOpts extends RewardPoolOpts {}

    async function setUnfinalizedPoolRewardAsync(
        opts?: Partial<SetUnfinalizedMembersRewardsOpts>,
    ): Promise<SetUnfinalizedMembersRewardsOpts> {
        const _opts = {
            poolId: hexRandom(),
            operator: constants.NULL_ADDRESS,
            membersReward: getRandomInteger(1, toBaseUnitAmount(100)),
            operatorReward: getRandomInteger(1, toBaseUnitAmount(100)),
            membersStake: getRandomInteger(1, toBaseUnitAmount(10)),
            ...opts,
        };
        // Generate a deterministic operator address based on the poolId.
        _opts.operator = poolIdToOperator(_opts.poolId);
        await testContract
            .setUnfinalizedPoolReward(
                _opts.poolId,
                _opts.operator,
                new BigNumber(_opts.operatorReward),
                new BigNumber(_opts.membersReward),
                new BigNumber(_opts.membersStake),
            )
            .awaitTransactionSuccessAsync();
        // Because the operator share is implicitly defined by the member and
        // operator reward, and is stored as a uint32, there will be precision
        // loss when the reward is combined then split again in the contracts.
        // So we perform this transformation on the values and return them.
        [_opts.operatorReward, _opts.membersReward] = toActualRewards(_opts.operatorReward, _opts.membersReward);
        return _opts;
    }

    // Generates a deterministic operator address given a pool ID.
    function poolIdToOperator(poolId: string): string {
        return hexSlice(hexHash(poolId), -20);
    }

    // Converts pre-split rewards to the amounts the contracts will calculate
    // after suffering precision loss from the low-precision `operatorShare`.
    function toActualRewards(operatorReward: Numberish, membersReward: Numberish): [BigNumber, BigNumber] {
        const totalReward = BigNumber.sum(operatorReward, membersReward);
        const operatorSharePPM = new BigNumber(operatorReward)
            .times(constants.PPM_100_PERCENT)
            .dividedBy(totalReward)
            .integerValue(BigNumber.ROUND_DOWN);
        const _operatorReward = totalReward
            .times(operatorSharePPM)
            .dividedBy(constants.PPM_100_PERCENT)
            .integerValue(BigNumber.ROUND_UP);
        const _membersReward = totalReward.minus(_operatorReward);
        return [_operatorReward, _membersReward];
    }

    type ResultWithTransfers<T extends {}> = T & {
        delegatorTransfers: BigNumber;
    };

    interface DelegateStakeOpts {
        delegator: string;
        stake: Numberish;
    }

    async function delegateStakeNowAsync(
        poolId: string,
        opts?: Partial<DelegateStakeOpts>,
    ): Promise<ResultWithTransfers<DelegateStakeOpts>> {
        return delegateStakeAsync(poolId, opts, true);
    }

    async function delegateStakeAsync(
        poolId: string,
        opts?: Partial<DelegateStakeOpts>,
        now?: boolean,
    ): Promise<ResultWithTransfers<DelegateStakeOpts>> {
        const _opts = {
            delegator: randomAddress(),
            stake: getRandomInteger(1, toBaseUnitAmount(10)),
            ...opts,
        };
        const fn = now
            ? testContract.delegateStakeNow.bind(testContract)
            : testContract.delegateStake.bind(testContract);
        const receipt = await fn(_opts.delegator, poolId, new BigNumber(_opts.stake)).awaitTransactionSuccessAsync();
        const delegatorTransfers = getTransfersFromLogs(receipt.logs, _opts.delegator);
        return {
            ..._opts,
            delegatorTransfers,
        };
    }

    async function undelegateStakeAsync(
        poolId: string,
        delegator: string,
        stake?: Numberish,
    ): Promise<ResultWithTransfers<{ stake: BigNumber }>> {
        const _stake = new BigNumber(
            stake ||
                (await testContract.getStakeDelegatedToPoolByOwner(delegator, poolId).callAsync()).currentEpochBalance,
        );
        const receipt = await testContract.undelegateStake(delegator, poolId, _stake).awaitTransactionSuccessAsync();
        const delegatorTransfers = getTransfersFromLogs(receipt.logs, delegator);
        return {
            stake: _stake,
            delegatorTransfers,
        };
    }

    function getTransfersFromLogs(logs: LogEntry[], delegator?: string): BigNumber {
        let delegatorTransfers = constants.ZERO_AMOUNT;
        const transferArgs = filterLogsToArguments<TestDelegatorRewardsTransferEventArgs>(
            logs,
            TestDelegatorRewardsEvents.Transfer,
        );
        for (const event of transferArgs) {
            if (event._to === delegator) {
                delegatorTransfers = delegatorTransfers.plus(event._value);
            }
        }
        return delegatorTransfers;
    }

    async function advanceEpochAsync(): Promise<number> {
        await testContract.advanceEpoch().awaitTransactionSuccessAsync();
        const epoch = await testContract.currentEpoch().callAsync();
        return epoch.toNumber();
    }

    async function getDelegatorRewardBalanceAsync(poolId: string, delegator: string): Promise<BigNumber> {
        return testContract.computeRewardBalanceOfDelegator(poolId, delegator).callAsync();
    }

    async function getOperatorRewardBalanceAsync(poolId: string): Promise<BigNumber> {
        return testContract.computeRewardBalanceOfOperator(poolId).callAsync();
    }

    async function touchStakeAsync(poolId: string, delegator: string): Promise<ResultWithTransfers<{}>> {
        return undelegateStakeAsync(poolId, delegator, 0);
    }

    async function finalizePoolAsync(poolId: string): Promise<ResultWithTransfers<{}>> {
        const receipt = await testContract.finalizePool(poolId).awaitTransactionSuccessAsync();
        const delegatorTransfers = getTransfersFromLogs(receipt.logs, poolId);
        return {
            delegatorTransfers,
        };
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

    describe('computeRewardBalanceOfOperator()', () => {
        it('nothing in epoch 1', async () => {
            const { poolId } = await rewardPoolAsync();
            const operatorReward = await getOperatorRewardBalanceAsync(poolId);
            expect(operatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 2', async () => {
            await advanceEpochAsync();
            const { poolId } = await rewardPoolAsync();
            const operatorReward = await getOperatorRewardBalanceAsync(poolId);
            expect(operatorReward).to.bignumber.eq(0);
        });

        it('nothing one epoch after rewards', async () => {
            const { poolId } = await rewardPoolAsync();
            await advanceEpochAsync();
            const operatorReward = await getOperatorRewardBalanceAsync(poolId);
            expect(operatorReward).to.bignumber.eq(0);
        });

        describe('with unfinalized rewards', () => {
            it('something with unfinalized rewards', async () => {
                const { poolId, operatorReward: expectedOperatorReward } = await setUnfinalizedPoolRewardAsync();
                const operatorReward = await getOperatorRewardBalanceAsync(poolId);
                assertRoughlyEquals(operatorReward, expectedOperatorReward);
            });

            it('nothing for operator with 0% share', async () => {
                // We define operator shares implicitly, so we set the operator
                // reward to 0, which kind of makes this silly.
                const { poolId } = await setUnfinalizedPoolRewardAsync({ operatorReward: 0 });
                const operatorReward = await getOperatorRewardBalanceAsync(poolId);
                expect(operatorReward).to.bignumber.eq(0);
            });

            it('everything for operator with 100% share', async () => {
                // We define operator shares implicitly, so we set the members
                // reward to 0.
                const { poolId, operatorReward: expectedOperatorReward } = await setUnfinalizedPoolRewardAsync({
                    membersReward: 0,
                });
                const operatorReward = await getOperatorRewardBalanceAsync(poolId);
                assertRoughlyEquals(operatorReward, expectedOperatorReward);
            });

            it('nothing once rewards are finalized', async () => {
                const { poolId } = await setUnfinalizedPoolRewardAsync();
                await finalizePoolAsync(poolId);
                const operatorReward = await getOperatorRewardBalanceAsync(poolId);
                expect(operatorReward).to.bignumber.eq(0);
            });
        });
    });

    describe('computeRewardBalanceOfDelegator()', () => {
        it('nothing in epoch 1 for delegator with no stake', async () => {
            const { poolId } = await rewardPoolAsync();
            const delegator = randomAddress();
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 2 for delegator with no stake', async () => {
            await advanceEpochAsync(); // epoch 2
            const { poolId } = await rewardPoolAsync();
            const delegator = randomAddress();
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 1 for delegator staked in epoch 1', async () => {
            const { poolId } = await rewardPoolAsync();
            // Assign active stake to pool in epoch 1, which is usuaslly not
            // possible due to delegating delays.
            const { delegator } = await delegateStakeNowAsync(poolId);
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 2 for delegator delegating in epoch 2', async () => {
            await advanceEpochAsync(); // epoch 2
            const { poolId } = await rewardPoolAsync();
            const { delegator } = await delegateStakeAsync(poolId);
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('nothing in epoch 2 for delegator delegating in epoch 1', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 2 (stake now active)
            // rewards paid for stake in epoch 1.
            await rewardPoolAsync({ poolId, membersStake: stake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('all rewards from epoch 3 for delegator delegating in epoch 1', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 2 (stake now active)
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2.
            const { membersReward: reward } = await rewardPoolAsync({ poolId, membersStake: stake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(reward);
        });

        it('all rewards from epoch 3 and 3 for delegator delegating in epoch 1', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 2 (stake now active)
            await advanceEpochAsync(); // epoch 3
            const { membersReward: reward1 } = await rewardPoolAsync({ poolId, membersStake: stake });
            await advanceEpochAsync(); // epoch 4
            const { membersReward: reward2 } = await rewardPoolAsync({ poolId, membersStake: stake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            assertRoughlyEquals(delegatorReward, BigNumber.sum(reward1, reward2));
        });

        it('partial rewards from epoch 3 and 3 for delegator partially delegating in epoch 1', async () => {
            const poolId = hexRandom();
            const { delegator, stake: delegatorStake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 2 (stake now active)
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2.
            const { membersReward: reward, membersStake: rewardStake } = await rewardPoolAsync({
                poolId,
                membersStake: new BigNumber(delegatorStake).times(2),
            });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            const expectedDelegatorRewards = computeDelegatorRewards(reward, delegatorStake, rewardStake);
            assertRoughlyEquals(delegatorReward, expectedDelegatorRewards);
        });

        it('has correct reward immediately after undelegating', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 2 (stake now active)
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2.
            const { membersReward: reward } = await rewardPoolAsync({ poolId, membersStake: stake });
            const { delegatorTransfers: withdrawal } = await undelegateStakeAsync(poolId, delegator);
            assertRoughlyEquals(withdrawal, reward);
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('has correct reward immediately after undelegating and redelegating', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 2 (stake now active)
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2.
            const { membersReward: reward } = await rewardPoolAsync({ poolId, membersStake: stake });
            const { delegatorTransfers: withdrawal } = await undelegateStakeAsync(poolId, delegator);
            assertRoughlyEquals(withdrawal, reward);
            await delegateStakeAsync(poolId, { delegator, stake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(0);
        });

        it('has correct reward immediately after undelegating, redelegating, and rewarding fees', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 2 (stake now active)
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2.
            await rewardPoolAsync({ poolId, membersStake: stake });
            await undelegateStakeAsync(poolId, delegator);
            await delegateStakeAsync(poolId, { delegator, stake });
            await advanceEpochAsync(); // epoch 4
            await advanceEpochAsync(); // epoch 5
            // rewards paid for stake in epoch 4.
            const { membersReward: reward } = await rewardPoolAsync({ poolId, membersStake: stake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            assertRoughlyEquals(delegatorReward, reward);
        });

        it('ignores rewards paid in the same epoch the stake was first active in', async () => {
            const poolId = hexRandom();
            // stake at 0
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 2 (stake now active)
            // Pay rewards for epoch 1.
            await advanceEpochAsync(); // epoch 3
            // Pay rewards for epoch 2.
            const { membersReward: reward } = await rewardPoolAsync({ poolId, membersStake: stake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(delegatorReward).to.bignumber.eq(reward);
        });

        it('uses old stake for rewards paid in the same epoch extra stake is added', async () => {
            const poolId = hexRandom();
            // stake at 0
            const { delegator, stake: stake1 } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 2 (stake1 now active)
            await advanceEpochAsync(); // epoch 3
            const stake2 = getRandomInteger(0, stake1);
            const totalStake = BigNumber.sum(stake1, stake2);
            // Make the total stake in rewards > totalStake so delegator never
            // receives 100% of rewards.
            const rewardStake = totalStake.times(2);
            // Pay rewards for epoch 2.
            const { membersReward: reward1 } = await rewardPoolAsync({ poolId, membersStake: rewardStake });
            // add extra stake
            const { delegatorTransfers: withdrawal } = await delegateStakeAsync(poolId, { delegator, stake: stake2 });
            await advanceEpochAsync(); // epoch 4 (stake2 now active)
            // Pay rewards for epoch 3.
            await advanceEpochAsync(); // epoch 5
            // Pay rewards for epoch 4.
            const { membersReward: reward2 } = await rewardPoolAsync({ poolId, membersStake: rewardStake });
            const delegatorReward = await getDelegatorRewardBalanceAsync(poolId, delegator);
            const expectedDelegatorReward = BigNumber.sum(
                computeDelegatorRewards(reward1, stake1, rewardStake),
                computeDelegatorRewards(reward2, totalStake, rewardStake),
            );
            assertRoughlyEquals(BigNumber.sum(withdrawal, delegatorReward), expectedDelegatorReward);
        });

        it('uses old stake for rewards paid in the epoch right after extra stake is added', async () => {
            const poolId = hexRandom();
            // stake at 0
            const { delegator, stake: stake1 } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 2 (stake1 now active)
            // add extra stake
            const { stake: stake2 } = await delegateStakeAsync(poolId, { delegator });
            const totalStake = BigNumber.sum(stake1, stake2);
            await advanceEpochAsync(); // epoch 3 (stake2 now active)
            // Make the total stake in rewards > totalStake so delegator never
            // receives 100% of rewards.
            const rewardStake = totalStake.times(2);
            // Pay rewards for epoch 2.
            const { membersReward: reward1 } = await rewardPoolAsync({ poolId, membersStake: rewardStake });
            await advanceEpochAsync(); // epoch 4
            // Pay rewards for epoch 3.
            const { membersReward: reward2 } = await rewardPoolAsync({ poolId, membersStake: rewardStake });
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
            await advanceEpochAsync(); // epoch 2 (stake A now active)
            const { delegator: delegatorB, stake: stakeB } = await delegateStakeAsync(poolId);
            const totalStake = BigNumber.sum(stakeA, stakeB);
            await advanceEpochAsync(); // epoch 3 (stake B now active)
            // rewards paid for stake in epoch 2 (delegator A only)
            const { membersReward: reward1 } = await rewardPoolAsync({ poolId, membersStake: stakeA });
            await advanceEpochAsync(); // epoch 4
            // rewards paid for stake in epoch 3 (delegator A and B)
            const { membersReward: reward2 } = await rewardPoolAsync({ poolId, membersStake: totalStake });
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
            await advanceEpochAsync(); // epoch 2 (stake A now active)
            const { delegator: delegatorB, stake: stakeB } = await delegateStakeAsync(poolId);
            const totalStake = BigNumber.sum(stakeA, stakeB);
            await advanceEpochAsync(); // epoch 3 (stake B now active)
            // rewards paid for stake in epoch 2 (delegator A only)
            const { membersReward: reward1 } = await rewardPoolAsync({ poolId, membersStake: stakeA });
            await advanceEpochAsync(); // epoch 4
            await advanceEpochAsync(); // epoch 5
            // rewards paid for stake in epoch 4 (delegator A and B)
            const { membersReward: reward2 } = await rewardPoolAsync({ poolId, membersStake: totalStake });
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
            await advanceEpochAsync(); // epoch 2 (stake now active)
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2.
            const { membersReward: reward1, membersStake: rewardStake1 } = await rewardPoolAsync({
                poolId,
                membersStake: new BigNumber(delegatorStake).times(2),
            });
            await advanceEpochAsync(); // epoch 4
            // rewards paid for stake in epoch 3
            const { membersReward: reward2, membersStake: rewardStake2 } = await rewardPoolAsync({
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
            it('nothing with only unfinalized rewards from epoch 2 for delegator with nothing delegated', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId, { stake: 0 });
                await advanceEpochAsync(); // epoch 2
                await setUnfinalizedPoolRewardAsync({ poolId, membersStake: stake });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
                expect(reward).to.bignumber.eq(0);
            });

            it('nothing with only unfinalized rewards from epoch 2 for delegator delegating in epoch 1', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 2
                await setUnfinalizedPoolRewardAsync({ poolId, membersStake: stake });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
                expect(reward).to.bignumber.eq(0);
            });

            it('returns unfinalized rewards from epoch 3 for delegator delegating in epoch 1', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 2
                await advanceEpochAsync(); // epoch 3
                const { membersReward: unfinalizedReward } = await setUnfinalizedPoolRewardAsync({
                    poolId,
                    membersStake: stake,
                });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
                assertRoughlyEquals(reward, unfinalizedReward);
            });

            it('returns unfinalized rewards from epoch 4 for delegator delegating in epoch 1', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 2
                await advanceEpochAsync(); // epoch 3
                await advanceEpochAsync(); // epoch 4
                const { membersReward: unfinalizedReward } = await setUnfinalizedPoolRewardAsync({
                    poolId,
                    membersStake: stake,
                });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
                assertRoughlyEquals(reward, unfinalizedReward);
            });

            it('returns unfinalized rewards from epoch 4 + rewards from epoch 3 for delegator delegating in epoch 1', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 2
                await advanceEpochAsync(); // epoch 3
                const { membersReward: prevReward } = await rewardPoolAsync({ poolId, membersStake: stake });
                await advanceEpochAsync(); // epoch 4
                const { membersReward: unfinalizedReward } = await setUnfinalizedPoolRewardAsync({
                    poolId,
                    membersStake: stake,
                });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
                const expectedReward = BigNumber.sum(prevReward, unfinalizedReward);
                assertRoughlyEquals(reward, expectedReward);
            });

            it('returns unfinalized rewards from epoch 5 + rewards from epoch 3 for delegator delegating in epoch 2', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 2
                await advanceEpochAsync(); // epoch 3
                const { membersReward: prevReward } = await rewardPoolAsync({ poolId, membersStake: stake });
                await advanceEpochAsync(); // epoch 4
                await advanceEpochAsync(); // epoch 5
                const { membersReward: unfinalizedReward } = await setUnfinalizedPoolRewardAsync({
                    poolId,
                    membersStake: stake,
                });
                const reward = await getDelegatorRewardBalanceAsync(poolId, delegator);
                const expectedReward = BigNumber.sum(prevReward, unfinalizedReward);
                assertRoughlyEquals(reward, expectedReward);
            });

            it('returns correct rewards if unfinalized stake is different from previous rewards', async () => {
                const poolId = hexRandom();
                const { delegator, stake } = await delegateStakeAsync(poolId);
                await advanceEpochAsync(); // epoch 2
                await advanceEpochAsync(); // epoch 3
                const { membersReward: prevReward, membersStake: prevStake } = await rewardPoolAsync({
                    poolId,
                    membersStake: new BigNumber(stake).times(2),
                });
                await advanceEpochAsync(); // epoch 4
                await advanceEpochAsync(); // epoch 5
                const {
                    membersReward: unfinalizedReward,
                    membersStake: unfinalizedStake,
                } = await setUnfinalizedPoolRewardAsync({
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
        it('transfers all rewards to delegator when touching stake', async () => {
            const poolId = hexRandom();
            const { delegator, stake } = await delegateStakeAsync(poolId);
            await advanceEpochAsync(); // epoch 2 (stake now active)
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2
            const { membersReward: reward } = await rewardPoolAsync({ poolId, membersStake: stake });
            const { delegatorTransfers: withdrawal } = await touchStakeAsync(poolId, delegator);
            const finalRewardBalance = await getDelegatorRewardBalanceAsync(poolId, delegator);
            expect(withdrawal).to.bignumber.eq(reward);
            expect(finalRewardBalance).to.bignumber.eq(0);
        });

        it('does not collect extra rewards from delegating more stake in the reward epoch', async () => {
            const poolId = hexRandom();
            const stakeResults = [];
            // stake
            stakeResults.push(await delegateStakeAsync(poolId));
            const { delegator, stake } = stakeResults[0];
            const rewardStake = new BigNumber(stake).times(2);
            await advanceEpochAsync(); // epoch 2 (stake now active)
            // add more stake.
            stakeResults.push(await delegateStakeAsync(poolId, { delegator, stake }));
            await advanceEpochAsync(); // epoch 2 (2 * stake now active)
            // reward for epoch 2, using 2 * stake so delegator should
            // only be entitled to a fraction of the rewards.
            const { membersReward: reward } = await rewardPoolAsync({ poolId, membersStake: rewardStake });
            await advanceEpochAsync(); // epoch 3
            // touch the stake one last time
            stakeResults.push(await touchStakeAsync(poolId, delegator));
            // Should only see deposits for epoch 3.
            const allDeposits = stakeResults.map(r => r.delegatorTransfers);
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
            await advanceEpochAsync(); // epoch 2 (full stake now active)
            // reward for epoch 1
            await rewardPoolAsync({ poolId, membersStake: rewardStake });
            // unstake some
            const unstake = new BigNumber(stake).dividedToIntegerBy(2);
            stakeResults.push(await undelegateStakeAsync(poolId, delegator, unstake));
            await advanceEpochAsync(); // epoch 3 (half active stake)
            // reward for epoch 2
            const { membersReward: reward1 } = await rewardPoolAsync({ poolId, membersStake: rewardStake });
            // re-stake
            stakeResults.push(await delegateStakeAsync(poolId, { delegator, stake: unstake }));
            await advanceEpochAsync(); // epoch 4 (full stake now active)
            // reward for epoch 3
            const { membersReward: reward2 } = await rewardPoolAsync({ poolId, membersStake: rewardStake });
            // touch the stake to claim rewards
            stakeResults.push(await touchStakeAsync(poolId, delegator));
            const allDeposits = stakeResults.map(r => r.delegatorTransfers);
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
            await advanceEpochAsync(); // epoch 2 (stakes now active)
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2
            const { membersReward: reward } = await rewardPoolAsync({ poolId, membersStake: totalStake });
            // delegator A will finalize and collect rewards by touching stake.
            const { delegatorTransfers: withdrawalA } = await touchStakeAsync(poolId, delegatorA);
            assertRoughlyEquals(withdrawalA, computeDelegatorRewards(reward, stakeA, totalStake));
            // delegator B will collect rewards by touching stake
            const { delegatorTransfers: withdrawalB } = await touchStakeAsync(poolId, delegatorB);
            assertRoughlyEquals(withdrawalB, computeDelegatorRewards(reward, stakeB, totalStake));
        });

        it('delegator B collects correct rewards after delegator A finalizes', async () => {
            const poolId = hexRandom();
            const { delegator: delegatorA, stake: stakeA } = await delegateStakeAsync(poolId);
            const { delegator: delegatorB, stake: stakeB } = await delegateStakeAsync(poolId);
            const totalStake = BigNumber.sum(stakeA, stakeB);
            await advanceEpochAsync(); // epoch 2 (stakes now active)
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2
            const { membersReward: prevReward } = await rewardPoolAsync({ poolId, membersStake: totalStake });
            await advanceEpochAsync(); // epoch 4
            // unfinalized rewards for stake in epoch 3
            const { membersReward: unfinalizedReward } = await setUnfinalizedPoolRewardAsync({
                poolId,
                membersStake: totalStake,
            });
            const totalRewards = BigNumber.sum(prevReward, unfinalizedReward);
            await finalizePoolAsync(poolId);
            const { delegatorTransfers: withdrawalA } = await touchStakeAsync(poolId, delegatorA);
            assertRoughlyEquals(withdrawalA, computeDelegatorRewards(totalRewards, stakeA, totalStake));
            // delegator B will collect rewards by touching stake
            const { delegatorTransfers: withdrawalB } = await touchStakeAsync(poolId, delegatorB);
            assertRoughlyEquals(withdrawalB, computeDelegatorRewards(totalRewards, stakeB, totalStake));
        });

        it('delegator A and B collect correct rewards after external finalization', async () => {
            const poolId = hexRandom();
            const { delegator: delegatorA, stake: stakeA } = await delegateStakeAsync(poolId);
            const { delegator: delegatorB, stake: stakeB } = await delegateStakeAsync(poolId);
            const totalStake = BigNumber.sum(stakeA, stakeB);
            await advanceEpochAsync(); // epoch 2 (stakes now active)
            await advanceEpochAsync(); // epoch 3
            // rewards paid for stake in epoch 2
            const { membersReward: prevReward } = await rewardPoolAsync({ poolId, membersStake: totalStake });
            await advanceEpochAsync(); // epoch 4
            // unfinalized rewards for stake in epoch 3
            const { membersReward: unfinalizedReward } = await setUnfinalizedPoolRewardAsync({
                poolId,
                membersStake: totalStake,
            });
            const totalRewards = BigNumber.sum(prevReward, unfinalizedReward);
            // finalize
            await finalizePoolAsync(poolId);
            // delegator A will collect rewards by touching stake.
            const { delegatorTransfers: withdrawalA } = await touchStakeAsync(poolId, delegatorA);
            assertRoughlyEquals(withdrawalA, computeDelegatorRewards(totalRewards, stakeA, totalStake));
            // delegator B will collect rewards by touching stake
            const { delegatorTransfers: withdrawalB } = await touchStakeAsync(poolId, delegatorB);
            assertRoughlyEquals(withdrawalB, computeDelegatorRewards(totalRewards, stakeB, totalStake));
        });
    });
});
// tslint:disable: max-file-line-count
