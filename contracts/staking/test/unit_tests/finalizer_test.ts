import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    hexRandom,
    Numberish,
    shortZip,
} from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { LogEntry } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    IStakingEventsEpochEndedEventArgs,
    IStakingEventsEpochFinalizedEventArgs,
    IStakingEventsEvents,
    IStakingEventsRewardsPaidEventArgs,
    TestFinalizerContract,
    TestFinalizerDepositStakingPoolRewardsEventArgs as DepositStakingPoolRewardsEventArgs,
    TestFinalizerEvents,
    TestFinalizerRecordStakingPoolRewardsEventArgs as RecordStakingPoolRewardsEventArgs,
} from '../../src';
import {
    assertRoughlyEquals as _assertIntegerRoughlyEquals,
    getRandomInteger,
    toBaseUnitAmount,
} from '../utils/number_utils';

blockchainTests.resets('finalizer unit tests', env => {
    const { ZERO_AMOUNT } = constants;
    const INITIAL_EPOCH = 0;
    const INITIAL_BALANCE = toBaseUnitAmount(32);
    let operatorRewardsReceiver: string;
    let membersRewardsReceiver: string;
    let testContract: TestFinalizerContract;

    before(async () => {
        operatorRewardsReceiver = hexRandom(constants.ADDRESS_LENGTH);
        membersRewardsReceiver = hexRandom(constants.ADDRESS_LENGTH);
        testContract = await TestFinalizerContract.deployFrom0xArtifactAsync(
            artifacts.TestFinalizer,
            env.provider,
            env.txDefaults,
            artifacts,
            operatorRewardsReceiver,
            membersRewardsReceiver,
        );
        // Give the contract a balance.
        await sendEtherAsync(testContract.address, INITIAL_BALANCE);
    });

    async function sendEtherAsync(to: string, amount: Numberish): Promise<void> {
        await env.web3Wrapper.awaitTransactionSuccessAsync(
            await env.web3Wrapper.sendTransactionAsync({
                from: (await env.getAccountAddressesAsync())[0],
                to,
                value: new BigNumber(amount),
            }),
        );
    }

    interface ActivePoolOpts {
        poolId: string;
        operatorShare: number;
        feesCollected: Numberish;
        membersStake: Numberish;
        weightedStake: Numberish;
    }

    async function addActivePoolAsync(opts?: Partial<ActivePoolOpts>): Promise<ActivePoolOpts> {
        const maxAmount = toBaseUnitAmount(1e9);
        const _opts = {
            poolId: hexRandom(),
            operatorShare: Math.floor(Math.random() * constants.PPM_DENOMINATOR) / constants.PPM_DENOMINATOR,
            feesCollected: getRandomInteger(0, maxAmount),
            membersStake: getRandomInteger(0, maxAmount),
            weightedStake: getRandomInteger(0, maxAmount),
            ...opts,
        };
        await testContract.addActivePool.awaitTransactionSuccessAsync(
            _opts.poolId,
            new BigNumber(_opts.operatorShare * constants.PPM_DENOMINATOR).integerValue(),
            new BigNumber(_opts.feesCollected),
            new BigNumber(_opts.membersStake),
            new BigNumber(_opts.weightedStake),
        );
        return _opts;
    }

    interface FinalizationState {
        balance: Numberish;
        currentEpoch: number;
        closingEpoch: number;
        numActivePoolsThisEpoch: number;
        totalFeesCollectedThisEpoch: Numberish;
        totalWeightedStakeThisEpoch: Numberish;
        unfinalizedPoolsRemaining: number;
        unfinalizedRewardsAvailable: Numberish;
        unfinalizedTotalFeesCollected: Numberish;
        unfinalizedTotalWeightedStake: Numberish;
    }

    async function getFinalizationStateAsync(): Promise<FinalizationState> {
        const r = await testContract.getFinalizationState.callAsync();
        return {
            balance: r[0],
            currentEpoch: r[1].toNumber(),
            closingEpoch: r[2].toNumber(),
            numActivePoolsThisEpoch: r[3].toNumber(),
            totalFeesCollectedThisEpoch: r[4],
            totalWeightedStakeThisEpoch: r[5],
            unfinalizedPoolsRemaining: r[6].toNumber(),
            unfinalizedRewardsAvailable: r[7],
            unfinalizedTotalFeesCollected: r[8],
            unfinalizedTotalWeightedStake: r[9],
        };
    }

    async function assertFinalizationStateAsync(expected: Partial<FinalizationState>): Promise<void> {
        const actual = await getFinalizationStateAsync();
        assertEqualNumberFields(actual, expected);
    }

    function assertEpochEndedEvent(logs: LogEntry[], args: Partial<IStakingEventsEpochEndedEventArgs>): void {
        const events = getEpochEndedEvents(logs);
        expect(events.length).to.eq(1);
        assertEqualNumberFields(events[0], args);
    }

    function assertEpochFinalizedEvent(logs: LogEntry[], args: Partial<IStakingEventsEpochFinalizedEventArgs>): void {
        const events = getEpochFinalizedEvents(logs);
        expect(events.length).to.eq(1);
        assertEqualNumberFields(events[0], args);
    }

    function assertRoughlyEquals(actual: Numberish, expected: Numberish): void {
        _assertIntegerRoughlyEquals(actual, expected, 5);
    }

    function assertEqualNumberFields<T>(actual: T, expected: Partial<T>): void {
        for (const key of Object.keys(actual)) {
            const a = (actual as any)[key] as BigNumber;
            const e = (expected as any)[key] as Numberish;
            if (e !== undefined) {
                expect(a, key).to.bignumber.eq(e);
            }
        }
    }

    async function assertFinalizationLogsAndBalancesAsync(
        rewardsAvailable: Numberish,
        activePools: ActivePoolOpts[],
        finalizationLogs: LogEntry[],
    ): Promise<void> {
        const currentEpoch = await getCurrentEpochAsync();
        // Compute the expected rewards for each pool.
        const poolRewards = await calculatePoolRewardsAsync(rewardsAvailable, activePools);
        const totalRewards = BigNumber.sum(...poolRewards);
        const rewardsRemaining = new BigNumber(rewardsAvailable).minus(totalRewards);
        const nonZeroPoolRewards = poolRewards.filter(r => !r.isZero());
        const poolsWithNonZeroRewards = _.filter(activePools, (p, i) => !poolRewards[i].isZero());
        const [totalOperatorRewards, totalMembersRewards] = getTotalSplitRewards(activePools, poolRewards);

        // Assert the `RewardsPaid` logs.
        const rewardsPaidEvents = getRewardsPaidEvents(finalizationLogs);
        expect(rewardsPaidEvents.length).to.eq(poolsWithNonZeroRewards.length);
        for (const i of _.times(rewardsPaidEvents.length)) {
            const event = rewardsPaidEvents[i];
            const pool = poolsWithNonZeroRewards[i];
            const reward = nonZeroPoolRewards[i];
            const [operatorReward, membersReward] = splitRewards(pool, reward);
            expect(event.epoch).to.bignumber.eq(currentEpoch);
            assertRoughlyEquals(event.operatorReward, operatorReward);
            assertRoughlyEquals(event.membersReward, membersReward);
        }

        // Assert the `RecordStakingPoolRewards` logs.
        const recordStakingPoolRewardsEvents = getRecordStakingPoolRewardsEvents(finalizationLogs);
        for (const i of _.times(recordStakingPoolRewardsEvents.length)) {
            const event = recordStakingPoolRewardsEvents[i];
            const pool = poolsWithNonZeroRewards[i];
            const reward = nonZeroPoolRewards[i];
            expect(event.poolId).to.eq(pool.poolId);
            assertRoughlyEquals(event.totalReward, reward);
            assertRoughlyEquals(event.membersStake, pool.membersStake);
        }

        // Assert the `DepositStakingPoolRewards` logs.
        // Make sure they all sum up to the totals.
        const depositStakingPoolRewardsEvents = getDepositStakingPoolRewardsEvents(finalizationLogs);
        {
            const totalDepositedOperatorRewards = BigNumber.sum(
                ...depositStakingPoolRewardsEvents.map(e => e.operatorReward),
            );
            const totalDepositedMembersRewards = BigNumber.sum(
                ...depositStakingPoolRewardsEvents.map(e => e.membersReward),
            );
            assertRoughlyEquals(totalDepositedOperatorRewards, totalOperatorRewards);
            assertRoughlyEquals(totalDepositedMembersRewards, totalMembersRewards);
        }

        // Assert the `EpochFinalized` logs.
        const epochFinalizedEvents = getEpochFinalizedEvents(finalizationLogs);
        expect(epochFinalizedEvents.length).to.eq(1);
        expect(epochFinalizedEvents[0].epoch).to.bignumber.eq(currentEpoch - 1);
        assertRoughlyEquals(epochFinalizedEvents[0].rewardsPaid, totalRewards);
        assertRoughlyEquals(epochFinalizedEvents[0].rewardsRemaining, rewardsRemaining);

        // Assert the receiver balances.
        await assertReceiverBalancesAsync(totalOperatorRewards, totalMembersRewards);
    }

    async function assertReceiverBalancesAsync(operatorRewards: Numberish, membersRewards: Numberish): Promise<void> {
        const operatorRewardsBalance = await getBalanceOfAsync(operatorRewardsReceiver);
        assertRoughlyEquals(operatorRewardsBalance, operatorRewards);
        const membersRewardsBalance = await getBalanceOfAsync(membersRewardsReceiver);
        assertRoughlyEquals(membersRewardsBalance, membersRewards);
    }

    async function calculatePoolRewardsAsync(
        rewardsAvailable: Numberish,
        activePools: ActivePoolOpts[],
    ): Promise<BigNumber[]> {
        const totalFees = BigNumber.sum(...activePools.map(p => p.feesCollected));
        const totalStake = BigNumber.sum(...activePools.map(p => p.weightedStake));
        const poolRewards = _.times(activePools.length, () => constants.ZERO_AMOUNT);
        for (const i of _.times(activePools.length)) {
            const pool = activePools[i];
            const feesCollected = new BigNumber(pool.feesCollected);
            if (feesCollected.isZero()) {
                continue;
            }
            poolRewards[i] = await testContract.cobbDouglas.callAsync(
                new BigNumber(rewardsAvailable),
                new BigNumber(feesCollected),
                new BigNumber(totalFees),
                new BigNumber(pool.weightedStake),
                new BigNumber(totalStake),
            );
        }
        return poolRewards;
    }

    function splitRewards(pool: ActivePoolOpts, totalReward: Numberish): [BigNumber, BigNumber] {
        if (new BigNumber(pool.membersStake).isZero()) {
            return [new BigNumber(totalReward), ZERO_AMOUNT];
        }
        const operatorShare = new BigNumber(totalReward).times(pool.operatorShare).integerValue(BigNumber.ROUND_DOWN);
        const membersShare = new BigNumber(totalReward).minus(operatorShare);
        return [operatorShare, membersShare];
    }

    // Calculates the split rewards for every pool and returns the operator
    // and member sums.
    function getTotalSplitRewards(pools: ActivePoolOpts[], rewards: Numberish[]): [BigNumber, BigNumber] {
        const _rewards = _.times(pools.length).map(i => splitRewards(pools[i], rewards[i]));
        const totalOperatorRewards = BigNumber.sum(..._rewards.map(([o]) => o));
        const totalMembersRewards = BigNumber.sum(..._rewards.map(([, m]) => m));
        return [totalOperatorRewards, totalMembersRewards];
    }

    function getEpochEndedEvents(logs: LogEntry[]): IStakingEventsEpochEndedEventArgs[] {
        return filterLogsToArguments<IStakingEventsEpochEndedEventArgs>(logs, IStakingEventsEvents.EpochEnded);
    }

    function getEpochFinalizedEvents(logs: LogEntry[]): IStakingEventsEpochFinalizedEventArgs[] {
        return filterLogsToArguments<IStakingEventsEpochFinalizedEventArgs>(logs, IStakingEventsEvents.EpochFinalized);
    }

    function getRecordStakingPoolRewardsEvents(logs: LogEntry[]): RecordStakingPoolRewardsEventArgs[] {
        return filterLogsToArguments<RecordStakingPoolRewardsEventArgs>(
            logs,
            TestFinalizerEvents.RecordStakingPoolRewards,
        );
    }

    function getDepositStakingPoolRewardsEvents(logs: LogEntry[]): DepositStakingPoolRewardsEventArgs[] {
        return filterLogsToArguments<DepositStakingPoolRewardsEventArgs>(
            logs,
            TestFinalizerEvents.DepositStakingPoolRewards,
        );
    }

    function getRewardsPaidEvents(logs: LogEntry[]): IStakingEventsRewardsPaidEventArgs[] {
        return filterLogsToArguments<IStakingEventsRewardsPaidEventArgs>(logs, IStakingEventsEvents.RewardsPaid);
    }

    async function getCurrentEpochAsync(): Promise<number> {
        return (await testContract.currentEpoch.callAsync()).toNumber();
    }

    async function getBalanceOfAsync(whom: string): Promise<BigNumber> {
        return env.web3Wrapper.getBalanceInWeiAsync(whom);
    }

    describe('endEpoch()', () => {
        it('advances the epoch', async () => {
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const currentEpoch = await testContract.currentEpoch.callAsync();
            expect(currentEpoch).to.bignumber.eq(INITIAL_EPOCH + 1);
        });

        it('emits an `EpochEnded` event', async () => {
            const receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
            assertEpochEndedEvent(receipt.logs, {
                epoch: new BigNumber(INITIAL_EPOCH),
                numActivePools: ZERO_AMOUNT,
                rewardsAvailable: INITIAL_BALANCE,
                totalFeesCollected: ZERO_AMOUNT,
                totalWeightedStake: ZERO_AMOUNT,
            });
        });

        it('immediately finalizes if there are no active pools', async () => {
            const receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
            assertEpochFinalizedEvent(receipt.logs, {
                epoch: new BigNumber(INITIAL_EPOCH),
                rewardsPaid: ZERO_AMOUNT,
                rewardsRemaining: INITIAL_BALANCE,
            });
        });

        it('does not immediately finalize if there is an active pool', async () => {
            await addActivePoolAsync();
            const receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
            const events = filterLogsToArguments<IStakingEventsEpochFinalizedEventArgs>(
                receipt.logs,
                IStakingEventsEvents.EpochFinalized,
            );
            expect(events).to.deep.eq([]);
        });

        it("clears the next epoch's finalization state", async () => {
            // Add a pool so there is state to clear.
            await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            return assertFinalizationStateAsync({
                currentEpoch: INITIAL_EPOCH + 1,
                closingEpoch: INITIAL_EPOCH,
                numActivePoolsThisEpoch: 0,
                totalFeesCollectedThisEpoch: 0,
                totalWeightedStakeThisEpoch: 0,
            });
        });

        it('prepares finalization state', async () => {
            // Add a pool so there is state to clear.
            const pool = await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            return assertFinalizationStateAsync({
                unfinalizedPoolsRemaining: 1,
                unfinalizedRewardsAvailable: INITIAL_BALANCE,
                unfinalizedTotalFeesCollected: pool.feesCollected,
                unfinalizedTotalWeightedStake: pool.weightedStake,
            });
        });

        it('reverts if the prior epoch is unfinalized', async () => {
            await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const tx = testContract.endEpoch.awaitTransactionSuccessAsync();
            const expectedError = new StakingRevertErrors.PreviousEpochNotFinalizedError(INITIAL_EPOCH, 1);
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('finalizePools()', () => {
        it('does nothing if there were no active pools', async () => {
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const poolId = hexRandom();
            const receipt = await testContract.finalizePools.awaitTransactionSuccessAsync([poolId]);
            expect(receipt.logs).to.deep.eq([]);
        });

        it('does nothing if no pools are passed in', async () => {
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const receipt = await testContract.finalizePools.awaitTransactionSuccessAsync([]);
            expect(receipt.logs).to.deep.eq([]);
        });

        it('can finalize a single pool', async () => {
            const pool = await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const receipt = await testContract.finalizePools.awaitTransactionSuccessAsync([pool.poolId]);
            return assertFinalizationLogsAndBalancesAsync(INITIAL_BALANCE, [pool], receipt.logs);
        });

        it('can finalize multiple pools', async () => {
            const pools = await Promise.all(_.times(3, async () => addActivePoolAsync()));
            const poolIds = pools.map(p => p.poolId);
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const receipt = await testContract.finalizePools.awaitTransactionSuccessAsync(poolIds);
            return assertFinalizationLogsAndBalancesAsync(INITIAL_BALANCE, pools, receipt.logs);
        });

        it('can finalize multiple pools over multiple transactions', async () => {
            const pools = await Promise.all(_.times(2, async () => addActivePoolAsync()));
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const receipts = await Promise.all(
                pools.map(pool => testContract.finalizePools.awaitTransactionSuccessAsync([pool.poolId])),
            );
            const allLogs = _.flatten(receipts.map(r => r.logs));
            return assertFinalizationLogsAndBalancesAsync(INITIAL_BALANCE, pools, allLogs);
        });

        it('ignores a non-active pool', async () => {
            const pools = await Promise.all(_.times(3, async () => addActivePoolAsync()));
            const nonActivePoolId = hexRandom();
            const poolIds = _.shuffle([...pools.map(p => p.poolId), nonActivePoolId]);
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const receipt = await testContract.finalizePools.awaitTransactionSuccessAsync(poolIds);
            const rewardsPaidEvents = getRewardsPaidEvents(receipt.logs);
            expect(rewardsPaidEvents.length).to.eq(pools.length);
            for (const event of rewardsPaidEvents) {
                expect(event.poolId).to.not.eq(nonActivePoolId);
            }
        });

        it('ignores a finalized pool', async () => {
            const pools = await Promise.all(_.times(3, async () => addActivePoolAsync()));
            const poolIds = pools.map(p => p.poolId);
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const [finalizedPool] = _.sampleSize(pools, 1);
            await testContract.finalizePools.awaitTransactionSuccessAsync([finalizedPool.poolId]);
            const receipt = await testContract.finalizePools.awaitTransactionSuccessAsync(poolIds);
            const rewardsPaidEvents = getRewardsPaidEvents(receipt.logs);
            expect(rewardsPaidEvents.length).to.eq(pools.length - 1);
            for (const event of rewardsPaidEvents) {
                expect(event.poolId).to.not.eq(finalizedPool.poolId);
            }
        });

        it('resets pool state after finalizing it', async () => {
            const pools = await Promise.all(_.times(3, async () => addActivePoolAsync()));
            const pool = _.sample(pools) as ActivePoolOpts;
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            await testContract.finalizePools.awaitTransactionSuccessAsync([pool.poolId]);
            const poolState = await testContract.getActivePoolFromEpoch.callAsync(
                new BigNumber(INITIAL_EPOCH),
                pool.poolId,
            );
            expect(poolState.feesCollected).to.bignumber.eq(0);
            expect(poolState.weightedStake).to.bignumber.eq(0);
            expect(poolState.membersStake).to.bignumber.eq(0);
        });

        it('`rewardsPaid` is the sum of all pool rewards', async () => {
            const pools = await Promise.all(_.times(3, async () => addActivePoolAsync()));
            const poolIds = pools.map(p => p.poolId);
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const receipt = await testContract.finalizePools.awaitTransactionSuccessAsync(poolIds);
            const rewardsPaidEvents = getRewardsPaidEvents(receipt.logs);
            const expectedTotalRewardsPaid = BigNumber.sum(
                ...rewardsPaidEvents.map(e => e.membersReward.plus(e.operatorReward)),
            );
            const { rewardsPaid: totalRewardsPaid } = getEpochFinalizedEvents(receipt.logs)[0];
            expect(totalRewardsPaid).to.bignumber.eq(expectedTotalRewardsPaid);
        });

        it('`rewardsPaid` <= `rewardsAvailable` <= contract balance at the end of the epoch', async () => {
            const pools = await Promise.all(_.times(3, async () => addActivePoolAsync()));
            const poolIds = pools.map(p => p.poolId);
            let receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
            const { rewardsAvailable } = getEpochEndedEvents(receipt.logs)[0];
            expect(rewardsAvailable).to.bignumber.lte(INITIAL_BALANCE);
            receipt = await testContract.finalizePools.awaitTransactionSuccessAsync(poolIds);
            const { rewardsPaid } = getEpochFinalizedEvents(receipt.logs)[0];
            expect(rewardsPaid).to.bignumber.lte(rewardsAvailable);
        });

        it('`rewardsPaid` <= `rewardsAvailable` with two equal pools', async () => {
            const pool1 = await addActivePoolAsync();
            const pool2 = await addActivePoolAsync(_.omit(pool1, 'poolId'));
            const poolIds = [pool1, pool2].map(p => p.poolId);
            let receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
            const { rewardsAvailable } = getEpochEndedEvents(receipt.logs)[0];
            receipt = await testContract.finalizePools.awaitTransactionSuccessAsync(poolIds);
            const { rewardsPaid } = getEpochFinalizedEvents(receipt.logs)[0];
            expect(rewardsPaid).to.bignumber.lte(rewardsAvailable);
        });

        blockchainTests.optional('`rewardsPaid` fuzzing', async () => {
            const numTests = 32;
            for (const i of _.times(numTests)) {
                const numPools = _.random(1, 32);
                it(`${i + 1}/${numTests} \`rewardsPaid\` <= \`rewardsAvailable\` (${numPools} pools)`, async () => {
                    const pools = await Promise.all(_.times(numPools, async () => addActivePoolAsync()));
                    const poolIds = pools.map(p => p.poolId);
                    let receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
                    const { rewardsAvailable } = getEpochEndedEvents(receipt.logs)[0];
                    receipt = await testContract.finalizePools.awaitTransactionSuccessAsync(poolIds);
                    const { rewardsPaid } = getEpochFinalizedEvents(receipt.logs)[0];
                    expect(rewardsPaid).to.bignumber.lte(rewardsAvailable);
                });
            }
        });
    });

    describe('_finalizePool()', () => {
        it('does nothing if there were no active pools', async () => {
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const poolId = hexRandom();
            const receipt = await testContract.finalizePool.awaitTransactionSuccessAsync(poolId);
            expect(receipt.logs).to.deep.eq([]);
        });

        it('can finalize a pool', async () => {
            const pool = await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const receipt = await testContract.finalizePool.awaitTransactionSuccessAsync(pool.poolId);
            return assertFinalizationLogsAndBalancesAsync(INITIAL_BALANCE, [pool], receipt.logs);
        });

        it('can finalize multiple pools over multiple transactions', async () => {
            const pools = await Promise.all(_.times(2, async () => addActivePoolAsync()));
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const receipts = await Promise.all(
                pools.map(pool => testContract.finalizePool.awaitTransactionSuccessAsync(pool.poolId)),
            );
            const allLogs = _.flatten(receipts.map(r => r.logs));
            return assertFinalizationLogsAndBalancesAsync(INITIAL_BALANCE, pools, allLogs);
        });

        it('ignores a finalized pool', async () => {
            const pools = await Promise.all(_.times(3, async () => addActivePoolAsync()));
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const [finalizedPool] = _.sampleSize(pools, 1);
            await testContract.finalizePool.awaitTransactionSuccessAsync(finalizedPool.poolId);
            const receipt = await testContract.finalizePool.awaitTransactionSuccessAsync(finalizedPool.poolId);
            const rewardsPaidEvents = getRewardsPaidEvents(receipt.logs);
            expect(rewardsPaidEvents).to.deep.eq([]);
        });

        it('resets pool state after finalizing it', async () => {
            const pools = await Promise.all(_.times(3, async () => addActivePoolAsync()));
            const pool = _.sample(pools) as ActivePoolOpts;
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            await testContract.finalizePool.awaitTransactionSuccessAsync(pool.poolId);
            const poolState = await testContract.getActivePoolFromEpoch.callAsync(
                new BigNumber(INITIAL_EPOCH),
                pool.poolId,
            );
            expect(poolState.feesCollected).to.bignumber.eq(0);
            expect(poolState.weightedStake).to.bignumber.eq(0);
            expect(poolState.membersStake).to.bignumber.eq(0);
        });

        it('`rewardsPaid` <= `rewardsAvailable` <= contract balance at the end of the epoch', async () => {
            const pools = await Promise.all(_.times(3, async () => addActivePoolAsync()));
            const receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
            const { rewardsAvailable } = getEpochEndedEvents(receipt.logs)[0];
            expect(rewardsAvailable).to.bignumber.lte(INITIAL_BALANCE);
            const receipts = await Promise.all(
                pools.map(p => testContract.finalizePool.awaitTransactionSuccessAsync(p.poolId)),
            );
            const allLogs = _.flatten(receipts.map(r => r.logs));
            const { rewardsPaid } = getEpochFinalizedEvents(allLogs)[0];
            expect(rewardsPaid).to.bignumber.lte(rewardsAvailable);
        });

        it('`rewardsPaid` <= `rewardsAvailable` with two equal pools', async () => {
            const pool1 = await addActivePoolAsync();
            const pool2 = await addActivePoolAsync(_.omit(pool1, 'poolId'));
            const receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
            const { rewardsAvailable } = getEpochEndedEvents(receipt.logs)[0];
            const receipts = await Promise.all(
                [pool1, pool2].map(p => testContract.finalizePool.awaitTransactionSuccessAsync(p.poolId)),
            );
            const allLogs = _.flatten(receipts.map(r => r.logs));
            const { rewardsPaid } = getEpochFinalizedEvents(allLogs)[0];
            expect(rewardsPaid).to.bignumber.lte(rewardsAvailable);
        });

        blockchainTests.optional('`rewardsPaid` fuzzing', async () => {
            const numTests = 32;
            for (const i of _.times(numTests)) {
                const numPools = _.random(1, 32);
                it(`${i + 1}/${numTests} \`rewardsPaid\` <= \`rewardsAvailable\` (${numPools} pools)`, async () => {
                    const pools = await Promise.all(_.times(numPools, async () => addActivePoolAsync()));
                    const receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
                    const { rewardsAvailable } = getEpochEndedEvents(receipt.logs)[0];
                    const receipts = await Promise.all(
                        pools.map(p => testContract.finalizePool.awaitTransactionSuccessAsync(p.poolId)),
                    );
                    const allLogs = _.flatten(receipts.map(r => r.logs));
                    const { rewardsPaid } = getEpochFinalizedEvents(allLogs)[0];
                    expect(rewardsPaid).to.bignumber.lte(rewardsAvailable);
                });
            }
        });
    });

    describe('lifecycle', () => {
        it('can advance the epoch after the prior epoch is finalized', async () => {
            const pool = await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            await testContract.finalizePools.awaitTransactionSuccessAsync([pool.poolId]);
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            return expect(getCurrentEpochAsync()).to.become(INITIAL_EPOCH + 2);
        });

        it('does not reward a pool that was only active 2 epochs ago', async () => {
            const pool1 = await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            await testContract.finalizePools.awaitTransactionSuccessAsync([pool1.poolId]);
            await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            expect(getCurrentEpochAsync()).to.become(INITIAL_EPOCH + 2);
            const receipt = await testContract.finalizePools.awaitTransactionSuccessAsync([pool1.poolId]);
            const rewardsPaidEvents = getRewardsPaidEvents(receipt.logs);
            expect(rewardsPaidEvents).to.deep.eq([]);
        });

        it('does not reward a pool that was only active 3 epochs ago', async () => {
            const pool1 = await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            await testContract.finalizePools.awaitTransactionSuccessAsync([pool1.poolId]);
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            expect(getCurrentEpochAsync()).to.become(INITIAL_EPOCH + 3);
            const receipt = await testContract.finalizePools.awaitTransactionSuccessAsync([pool1.poolId]);
            const rewardsPaidEvents = getRewardsPaidEvents(receipt.logs);
            expect(rewardsPaidEvents).to.deep.eq([]);
        });

        it('rolls over leftover rewards into th next epoch', async () => {
            const poolIds = _.times(3, () => hexRandom());
            await Promise.all(poolIds.map(async id => addActivePoolAsync({ poolId: id })));
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            let receipt = await testContract.finalizePools.awaitTransactionSuccessAsync(poolIds);
            const { rewardsRemaining: rolledOverRewards } = getEpochFinalizedEvents(receipt.logs)[0];
            await Promise.all(poolIds.map(async id => addActivePoolAsync({ poolId: id })));
            receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
            const { rewardsAvailable } = getEpochEndedEvents(receipt.logs)[0];
            expect(rewardsAvailable).to.bignumber.eq(rolledOverRewards);
        });
    });

    interface FinalizedPoolRewards {
        totalReward: Numberish;
        membersStake: Numberish;
    }

    async function assertUnfinalizedPoolRewardsAsync(
        poolId: string,
        expected: Partial<FinalizedPoolRewards>,
    ): Promise<void> {
        const actual = await testContract.getUnfinalizedPoolRewards.callAsync(poolId);
        if (expected.totalReward !== undefined) {
            expect(actual.totalReward).to.bignumber.eq(expected.totalReward);
        }
        if (expected.membersStake !== undefined) {
            expect(actual.membersStake).to.bignumber.eq(expected.membersStake);
        }
    }

    describe('_getUnfinalizedPoolReward()', () => {
        const ZERO_REWARDS = {
            totalReward: 0,
            membersStake: 0,
        };

        it('returns empty if epoch is 0', async () => {
            const poolId = hexRandom();
            return assertUnfinalizedPoolRewardsAsync(poolId, ZERO_REWARDS);
        });

        it('returns empty if pool was not active', async () => {
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const poolId = hexRandom();
            return assertUnfinalizedPoolRewardsAsync(poolId, ZERO_REWARDS);
        });

        it('returns empty if pool is active only in the current epoch', async () => {
            const pool = await addActivePoolAsync();
            return assertUnfinalizedPoolRewardsAsync(pool.poolId, ZERO_REWARDS);
        });

        it('returns empty if pool was only active in the 2 epochs ago', async () => {
            const pool = await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            await testContract.finalizePools.awaitTransactionSuccessAsync([pool.poolId]);
            return assertUnfinalizedPoolRewardsAsync(pool.poolId, ZERO_REWARDS);
        });

        it('returns empty if pool was already finalized', async () => {
            const pools = await Promise.all(_.times(3, async () => addActivePoolAsync()));
            const [pool] = _.sampleSize(pools, 1);
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            await testContract.finalizePools.awaitTransactionSuccessAsync([pool.poolId]);
            return assertUnfinalizedPoolRewardsAsync(pool.poolId, ZERO_REWARDS);
        });

        it('computes one reward among one pool', async () => {
            const pool = await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const expectedTotalRewards = INITIAL_BALANCE;
            return assertUnfinalizedPoolRewardsAsync(pool.poolId, {
                totalReward: expectedTotalRewards,
                membersStake: pool.membersStake,
            });
        });

        it('computes one reward among multiple pools', async () => {
            const pools = await Promise.all(_.times(3, async () => addActivePoolAsync()));
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const expectedPoolRewards = await calculatePoolRewardsAsync(INITIAL_BALANCE, pools);
            const [pool, reward] = _.sampleSize(shortZip(pools, expectedPoolRewards), 1)[0];
            return assertUnfinalizedPoolRewardsAsync(pool.poolId, {
                totalReward: (reward as any) as BigNumber,
                membersStake: pool.membersStake,
            });
        });

        it('computes a reward with 0% operatorShare', async () => {
            const pool = await addActivePoolAsync({ operatorShare: 0 });
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            return assertUnfinalizedPoolRewardsAsync(pool.poolId, {
                totalReward: INITIAL_BALANCE,
                membersStake: pool.membersStake,
            });
        });

        it('computes a reward with 100% operatorShare', async () => {
            const pool = await addActivePoolAsync({ operatorShare: 1 });
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            return assertUnfinalizedPoolRewardsAsync(pool.poolId, {
                totalReward: INITIAL_BALANCE,
                membersStake: pool.membersStake,
            });
        });
    });
});
// tslint:disable: max-file-line-count
