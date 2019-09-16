import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    hexRandom,
    Numberish,
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
    TestFinalizerDepositIntoStakingPoolRewardVaultCallEventArgs,
    TestFinalizerEvents,
} from '../../src';
import { getRandomInteger, toBaseUnitAmount } from '../utils/number_utils';

blockchainTests.resets('finalizer unit tests', env => {
    const { ZERO_AMOUNT } = constants;
    const INITIAL_EPOCH = 0;
    const INITIAL_BALANCE = toBaseUnitAmount(32);
    let rewardReceiverAddress: string;
    let testContract: TestFinalizerContract;

    before(async () => {
        rewardReceiverAddress = hexRandom(constants.ADDRESS_LENGTH);
        testContract = await TestFinalizerContract.deployFrom0xArtifactAsync(
            artifacts.TestFinalizer,
            env.provider,
            env.txDefaults,
            artifacts,
            rewardReceiverAddress,
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
        if (expected.balance !== undefined) {
            expect(actual.balance).to.bignumber.eq(expected.balance);
        }
        if (expected.currentEpoch !== undefined) {
            expect(actual.currentEpoch).to.eq(expected.currentEpoch);
        }
        if (expected.closingEpoch !== undefined) {
            expect(actual.closingEpoch).to.eq(expected.closingEpoch);
        }
        if (expected.numActivePoolsThisEpoch !== undefined) {
            expect(actual.numActivePoolsThisEpoch).to.eq(expected.numActivePoolsThisEpoch);
        }
        if (expected.totalFeesCollectedThisEpoch !== undefined) {
            expect(actual.totalFeesCollectedThisEpoch).to.bignumber.eq(expected.totalFeesCollectedThisEpoch);
        }
        if (expected.totalWeightedStakeThisEpoch !== undefined) {
            expect(actual.totalWeightedStakeThisEpoch).to.bignumber.eq(expected.totalWeightedStakeThisEpoch);
        }
        if (expected.unfinalizedPoolsRemaining !== undefined) {
            expect(actual.unfinalizedPoolsRemaining).to.eq(expected.unfinalizedPoolsRemaining);
        }
        if (expected.unfinalizedRewardsAvailable !== undefined) {
            expect(actual.unfinalizedRewardsAvailable).to.bignumber.eq(expected.unfinalizedRewardsAvailable);
        }
        if (expected.unfinalizedTotalFeesCollected !== undefined) {
            expect(actual.unfinalizedTotalFeesCollected).to.bignumber.eq(expected.unfinalizedTotalFeesCollected);
        }
        if (expected.unfinalizedTotalFeesCollected !== undefined) {
            expect(actual.unfinalizedTotalFeesCollected).to.bignumber.eq(expected.unfinalizedTotalFeesCollected);
        }
    }

    function assertEpochEndedEvent(logs: LogEntry[], args: Partial<IStakingEventsEpochEndedEventArgs>): void {
        const events = getEpochEndedEvents(logs);
        expect(events.length).to.eq(1);
        if (args.epoch !== undefined) {
            expect(events[0].epoch).to.bignumber.eq(INITIAL_EPOCH);
        }
        if (args.numActivePools !== undefined) {
            expect(events[0].numActivePools).to.bignumber.eq(args.numActivePools);
        }
        if (args.rewardsAvailable !== undefined) {
            expect(events[0].rewardsAvailable).to.bignumber.eq(args.rewardsAvailable);
        }
        if (args.totalFeesCollected !== undefined) {
            expect(events[0].totalFeesCollected).to.bignumber.eq(args.totalFeesCollected);
        }
        if (args.totalWeightedStake !== undefined) {
            expect(events[0].totalWeightedStake).to.bignumber.eq(args.totalWeightedStake);
        }
    }

    function assertEpochFinalizedEvent(logs: LogEntry[], args: Partial<IStakingEventsEpochFinalizedEventArgs>): void {
        const events = getEpochFinalizedEvents(logs);
        expect(events.length).to.eq(1);
        if (args.epoch !== undefined) {
            expect(events[0].epoch).to.bignumber.eq(args.epoch);
        }
        if (args.rewardsPaid !== undefined) {
            expect(events[0].rewardsPaid).to.bignumber.eq(args.rewardsPaid);
        }
        if (args.rewardsRemaining !== undefined) {
            expect(events[0].rewardsRemaining).to.bignumber.eq(args.rewardsRemaining);
        }
    }

    function assertDepositIntoStakingPoolRewardVaultCallEvent(logs: LogEntry[], amount?: Numberish): void {
        const events = filterLogsToArguments<TestFinalizerDepositIntoStakingPoolRewardVaultCallEventArgs>(
            logs,
            TestFinalizerEvents.DepositIntoStakingPoolRewardVaultCall,
        );
        expect(events.length).to.eq(1);
        if (amount !== undefined) {
            expect(events[0].amount).to.bignumber.eq(amount);
        }
    }

    async function assertRewarReceiverBalanceAsync(expectedAmount: Numberish): Promise<void> {
        const balance = await getBalanceOfAsync(rewardReceiverAddress);
        expect(balance).to.be.bignumber.eq(expectedAmount);
    }

    function getEpochEndedEvents(logs: LogEntry[]): IStakingEventsEpochEndedEventArgs[] {
        return filterLogsToArguments<IStakingEventsEpochEndedEventArgs>(logs, IStakingEventsEvents.EpochEnded);
    }

    function getEpochFinalizedEvents(logs: LogEntry[]): IStakingEventsEpochFinalizedEventArgs[] {
        return filterLogsToArguments<IStakingEventsEpochFinalizedEventArgs>(logs, IStakingEventsEvents.EpochFinalized);
    }

    function getRewardsPaidEvents(logs: LogEntry[]): IStakingEventsRewardsPaidEventArgs[] {
        return filterLogsToArguments<IStakingEventsRewardsPaidEventArgs>(logs, IStakingEventsEvents.RewardsPaid);
    }

    async function getCurrentEpochAsync(): Promise<number> {
        return (await testContract.getCurrentEpoch.callAsync()).toNumber();
    }

    async function getBalanceOfAsync(whom: string): Promise<BigNumber> {
        return env.web3Wrapper.getBalanceInWeiAsync(whom);
    }

    describe('endEpoch()', () => {
        it('advances the epoch', async () => {
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const currentEpoch = await testContract.getCurrentEpoch.callAsync();
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
            assertFinalizationStateAsync({
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
            assertFinalizationStateAsync({
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
            const rewardsPaidEvents = getRewardsPaidEvents(receipt.logs);
            expect(rewardsPaidEvents.length).to.eq(1);
            expect(rewardsPaidEvents[0].epoch).to.bignumber.eq(INITIAL_EPOCH + 1);
            expect(rewardsPaidEvents[0].poolId).to.eq(pool.poolId);
            assertEpochFinalizedEvent(receipt.logs, {
                epoch: new BigNumber(INITIAL_EPOCH),
                rewardsPaid: INITIAL_BALANCE,
            });
            assertDepositIntoStakingPoolRewardVaultCallEvent(receipt.logs, INITIAL_BALANCE);
            const { rewardsPaid: totalRewardsPaid } = getEpochFinalizedEvents(receipt.logs)[0];
            await assertRewarReceiverBalanceAsync(totalRewardsPaid);
        });

        it('can finalize multiple pools', async () => {
            const nextEpoch = INITIAL_EPOCH + 1;
            const pools = await Promise.all(_.times(3, () => addActivePoolAsync()));
            const poolIds = pools.map(p => p.poolId);
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const receipt = await testContract.finalizePools.awaitTransactionSuccessAsync(poolIds);
            const rewardsPaidEvents = getRewardsPaidEvents(receipt.logs);
            expect(rewardsPaidEvents.length).to.eq(pools.length);
            for (const [pool, event] of _.zip(pools, rewardsPaidEvents) as Array<
                [ActivePoolOpts, IStakingEventsRewardsPaidEventArgs]
            >) {
                expect(event.epoch).to.bignumber.eq(nextEpoch);
                expect(event.poolId).to.eq(pool.poolId);
            }
            assertEpochFinalizedEvent(receipt.logs, { epoch: new BigNumber(INITIAL_EPOCH) });
            assertDepositIntoStakingPoolRewardVaultCallEvent(receipt.logs);
            const { rewardsPaid: totalRewardsPaid } = getEpochFinalizedEvents(receipt.logs)[0];
            await assertRewarReceiverBalanceAsync(totalRewardsPaid);
        });

        it('can finalize multiple pools over multiple transactions', async () => {
            const nextEpoch = INITIAL_EPOCH + 1;
            const pools = await Promise.all(_.times(2, () => addActivePoolAsync()));
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const receipts = await Promise.all(
                pools.map(pool => testContract.finalizePools.awaitTransactionSuccessAsync([pool.poolId])),
            );
            const allLogs = _.flatten(receipts.map(r => r.logs));
            const rewardsPaidEvents = getRewardsPaidEvents(allLogs);
            expect(rewardsPaidEvents.length).to.eq(pools.length);
            for (const [pool, event] of _.zip(pools, rewardsPaidEvents) as Array<
                [ActivePoolOpts, IStakingEventsRewardsPaidEventArgs]
            >) {
                expect(event.epoch).to.bignumber.eq(nextEpoch);
                expect(event.poolId).to.eq(pool.poolId);
            }
            assertEpochFinalizedEvent(allLogs, { epoch: new BigNumber(INITIAL_EPOCH) });
            const { rewardsPaid: totalRewardsPaid } = getEpochFinalizedEvents(allLogs)[0];
            await assertRewarReceiverBalanceAsync(totalRewardsPaid);
        });

        it('ignores a non-active pool', async () => {
            const pools = await Promise.all(_.times(3, () => addActivePoolAsync()));
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
            const pools = await Promise.all(_.times(3, () => addActivePoolAsync()));
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
            const pools = await Promise.all(_.times(3, () => addActivePoolAsync()));
            const pool = _.sample(pools) as ActivePoolOpts;
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            await testContract.finalizePools.awaitTransactionSuccessAsync([pool.poolId]);
            const poolState = await testContract.internalGetActivePoolFromEpoch.callAsync(
                new BigNumber(INITIAL_EPOCH),
                pool.poolId,
            );
            expect(poolState.feesCollected).to.bignumber.eq(0);
            expect(poolState.weightedStake).to.bignumber.eq(0);
            expect(poolState.membersStake).to.bignumber.eq(0);
        });

        it('`rewardsPaid` is the sum of all pool rewards', async () => {
            const pools = await Promise.all(_.times(3, () => addActivePoolAsync()));
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
            const pools = await Promise.all(_.times(3, () => addActivePoolAsync()));
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
                    const pools = await Promise.all(_.times(numPools, () => addActivePoolAsync()));
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
            const receipt = await testContract.internalFinalizePool.awaitTransactionSuccessAsync(poolId);
            expect(receipt.logs).to.deep.eq([]);
        });

        it('can finalize a pool', async () => {
            const pool = await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const receipt = await testContract.internalFinalizePool.awaitTransactionSuccessAsync(pool.poolId);
            const rewardsPaidEvents = getRewardsPaidEvents(receipt.logs);
            expect(rewardsPaidEvents.length).to.eq(1);
            expect(rewardsPaidEvents[0].epoch).to.bignumber.eq(INITIAL_EPOCH + 1);
            expect(rewardsPaidEvents[0].poolId).to.eq(pool.poolId);
            assertEpochFinalizedEvent(receipt.logs, {
                epoch: new BigNumber(INITIAL_EPOCH),
                rewardsPaid: INITIAL_BALANCE,
            });
            assertDepositIntoStakingPoolRewardVaultCallEvent(receipt.logs, INITIAL_BALANCE);
            const { rewardsPaid: totalRewardsPaid } = getEpochFinalizedEvents(receipt.logs)[0];
            await assertRewarReceiverBalanceAsync(totalRewardsPaid);
        });

        it('can finalize multiple pools over multiple transactions', async () => {
            const nextEpoch = INITIAL_EPOCH + 1;
            const pools = await Promise.all(_.times(2, () => addActivePoolAsync()));
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const receipts = await Promise.all(
                pools.map(pool => testContract.internalFinalizePool.awaitTransactionSuccessAsync(pool.poolId)),
            );
            const allLogs = _.flatten(receipts.map(r => r.logs));
            const rewardsPaidEvents = getRewardsPaidEvents(allLogs);
            expect(rewardsPaidEvents.length).to.eq(pools.length);
            for (const [pool, event] of _.zip(pools, rewardsPaidEvents) as Array<
                [ActivePoolOpts, IStakingEventsRewardsPaidEventArgs]
            >) {
                expect(event.epoch).to.bignumber.eq(nextEpoch);
                expect(event.poolId).to.eq(pool.poolId);
            }
            assertEpochFinalizedEvent(allLogs, { epoch: new BigNumber(INITIAL_EPOCH) });
            const { rewardsPaid: totalRewardsPaid } = getEpochFinalizedEvents(allLogs)[0];
            await assertRewarReceiverBalanceAsync(totalRewardsPaid);
        });

        it('ignores a finalized pool', async () => {
            const pools = await Promise.all(_.times(3, () => addActivePoolAsync()));
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const [finalizedPool] = _.sampleSize(pools, 1);
            await testContract.internalFinalizePool.awaitTransactionSuccessAsync(finalizedPool.poolId);
            const receipt = await testContract.internalFinalizePool.awaitTransactionSuccessAsync(finalizedPool.poolId);
            const rewardsPaidEvents = getRewardsPaidEvents(receipt.logs);
            expect(rewardsPaidEvents).to.deep.eq([]);
        });

        it('resets pool state after finalizing it', async () => {
            const pools = await Promise.all(_.times(3, () => addActivePoolAsync()));
            const pool = _.sample(pools) as ActivePoolOpts;
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            await testContract.internalFinalizePool.awaitTransactionSuccessAsync(pool.poolId);
            const poolState = await testContract.internalGetActivePoolFromEpoch.callAsync(
                new BigNumber(INITIAL_EPOCH),
                pool.poolId,
            );
            expect(poolState.feesCollected).to.bignumber.eq(0);
            expect(poolState.weightedStake).to.bignumber.eq(0);
            expect(poolState.membersStake).to.bignumber.eq(0);
        });

        it('`rewardsPaid` <= `rewardsAvailable` <= contract balance at the end of the epoch', async () => {
            const pools = await Promise.all(_.times(3, () => addActivePoolAsync()));
            const receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
            const { rewardsAvailable } = getEpochEndedEvents(receipt.logs)[0];
            expect(rewardsAvailable).to.bignumber.lte(INITIAL_BALANCE);
            const receipts = await Promise.all(
                pools.map(p => testContract.internalFinalizePool.awaitTransactionSuccessAsync(p.poolId)),
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
                [pool1, pool2].map(p => testContract.internalFinalizePool.awaitTransactionSuccessAsync(p.poolId)),
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
                    const pools = await Promise.all(_.times(numPools, () => addActivePoolAsync()));
                    const receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
                    const { rewardsAvailable } = getEpochEndedEvents(receipt.logs)[0];
                    const receipts = await Promise.all(
                        pools.map(p => testContract.internalFinalizePool.awaitTransactionSuccessAsync(p.poolId)),
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
            await Promise.all(poolIds.map(id => addActivePoolAsync({ poolId: id })));
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            let receipt = await testContract.finalizePools.awaitTransactionSuccessAsync(poolIds);
            const { rewardsRemaining: rolledOverRewards } = getEpochFinalizedEvents(receipt.logs)[0];
            await Promise.all(poolIds.map(id => addActivePoolAsync({ poolId: id })));
            receipt = await testContract.endEpoch.awaitTransactionSuccessAsync();
            const { rewardsAvailable } = getEpochEndedEvents(receipt.logs)[0];
            expect(rewardsAvailable).to.bignumber.eq(rolledOverRewards);
        });
    });

    interface PoolRewards {
        operatorReward: Numberish;
        membersReward: Numberish;
        membersStake: Numberish;
    }

    function assertPoolRewards(actual: PoolRewards, expected: Partial<PoolRewards>): void {
        if (expected.operatorReward !== undefined) {
            expect(actual.operatorReward).to.bignumber.eq(expected.operatorReward);
        }
        if (expected.membersReward !== undefined) {
            expect(actual.membersReward).to.bignumber.eq(expected.membersReward);
        }
        if (expected.membersStake !== undefined) {
            expect(actual.membersStake).to.bignumber.eq(expected.membersStake);
        }
    }

    async function callCobbDouglasAsync(
        totalRewards: Numberish,
        fees: Numberish,
        totalFees: Numberish,
        stake: Numberish,
        totalStake: Numberish,
    ): Promise<BigNumber> {
        return testContract.cobbDouglas.callAsync(
            new BigNumber(totalRewards),
            new BigNumber(fees),
            new BigNumber(totalFees),
            new BigNumber(stake),
            new BigNumber(totalStake),
        );
    }

    function splitRewards(pool: ActivePoolOpts, totalReward: Numberish): [BigNumber, BigNumber] {
        if (new BigNumber(pool.membersStake).isZero()) {
            return [new BigNumber(totalReward), ZERO_AMOUNT];
        }
        const operatorShare = new BigNumber(totalReward).times(pool.operatorShare).integerValue(BigNumber.ROUND_DOWN);
        const membersShare = new BigNumber(totalReward).minus(operatorShare);
        return [operatorShare, membersShare];
    }

    describe('_getUnfinalizedPoolReward()', () => {
        const ZERO_REWARDS = {
            operatorReward: 0,
            membersReward: 0,
            membersStake: 0,
        };

        it('returns empty if epoch is 0', async () => {
            const poolId = hexRandom();
            const rewards = await testContract.internalGetUnfinalizedPoolRewards.callAsync(poolId);
            assertPoolRewards(rewards, ZERO_REWARDS);
        });

        it('returns empty if pool was not active', async () => {
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const poolId = hexRandom();
            const rewards = await testContract.internalGetUnfinalizedPoolRewards.callAsync(poolId);
            assertPoolRewards(rewards, ZERO_REWARDS);
        });

        it('returns empty if pool is active only in the current epoch', async () => {
            const pool = await addActivePoolAsync();
            const rewards = await testContract.internalGetUnfinalizedPoolRewards.callAsync(pool.poolId);
            assertPoolRewards(rewards, ZERO_REWARDS);
        });

        it('returns empty if pool was only active in the 2 epochs ago', async () => {
            const pool = await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            await testContract.finalizePools.awaitTransactionSuccessAsync([pool.poolId]);
            const rewards = await testContract.internalGetUnfinalizedPoolRewards.callAsync(pool.poolId);
            assertPoolRewards(rewards, ZERO_REWARDS);
        });

        it('returns empty if pool was already finalized', async () => {
            const pools = await Promise.all(_.times(3, () => addActivePoolAsync()));
            const [pool] = _.sampleSize(pools, 1);
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            await testContract.finalizePools.awaitTransactionSuccessAsync([pool.poolId]);
            const rewards = await testContract.internalGetUnfinalizedPoolRewards.callAsync(pool.poolId);
            assertPoolRewards(rewards, ZERO_REWARDS);
        });

        it('computes one reward among one pool', async () => {
            const pool = await addActivePoolAsync();
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const expectedTotalRewards = INITIAL_BALANCE;
            const [expectedOperatorReward, expectedMembersReward] = splitRewards(pool, expectedTotalRewards);
            const actualRewards = await testContract.internalGetUnfinalizedPoolRewards.callAsync(pool.poolId);
            assertPoolRewards(actualRewards, {
                operatorReward: expectedOperatorReward,
                membersReward: expectedMembersReward,
                membersStake: pool.membersStake,
            });
        });

        it('computes one reward among multiple pools', async () => {
            const pools = await Promise.all(_.times(3, () => addActivePoolAsync()));
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const [pool] = _.sampleSize(pools, 1);
            const totalFeesCollected = BigNumber.sum(...pools.map(p => p.feesCollected));
            const totalWeightedStake = BigNumber.sum(...pools.map(p => p.weightedStake));
            const expectedTotalRewards = await callCobbDouglasAsync(
                INITIAL_BALANCE,
                pool.feesCollected,
                totalFeesCollected,
                pool.weightedStake,
                totalWeightedStake,
            );
            const [expectedOperatorReward, expectedMembersReward] = splitRewards(pool, expectedTotalRewards);
            const actualRewards = await testContract.internalGetUnfinalizedPoolRewards.callAsync(pool.poolId);
            assertPoolRewards(actualRewards, {
                operatorReward: expectedOperatorReward,
                membersReward: expectedMembersReward,
                membersStake: pool.membersStake,
            });
        });

        it('computes a reward with 0% operatorShare', async () => {
            const pool = await addActivePoolAsync({ operatorShare: 0 });
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const actualRewards = await testContract.internalGetUnfinalizedPoolRewards.callAsync(pool.poolId);
            assertPoolRewards(actualRewards, {
                operatorReward: 0,
                membersReward: INITIAL_BALANCE,
                membersStake: pool.membersStake,
            });
        });

        it('computes a reward with 100% operatorShare', async () => {
            const pool = await addActivePoolAsync({ operatorShare: 1 });
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const actualRewards = await testContract.internalGetUnfinalizedPoolRewards.callAsync(pool.poolId);
            assertPoolRewards(actualRewards, {
                operatorReward: INITIAL_BALANCE,
                membersReward: 0,
                membersStake: pool.membersStake,
            });
        });

        it('gives all rewards to operator if membersStake is zero', async () => {
            const pool = await addActivePoolAsync({ membersStake: 0 });
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const actualRewards = await testContract.internalGetUnfinalizedPoolRewards.callAsync(pool.poolId);
            assertPoolRewards(actualRewards, {
                operatorReward: INITIAL_BALANCE,
                membersReward: 0,
                membersStake: pool.membersStake,
            });
        });

        it('gives all rewards to operator if membersStake is zero, even if operatorShare is zero', async () => {
            const pool = await addActivePoolAsync({ membersStake: 0, operatorShare: 0 });
            await testContract.endEpoch.awaitTransactionSuccessAsync();
            const actualRewards = await testContract.internalGetUnfinalizedPoolRewards.callAsync(pool.poolId);
            assertPoolRewards(actualRewards, {
                operatorReward: INITIAL_BALANCE,
                membersReward: 0,
                membersStake: pool.membersStake,
            });
        });
    });
});
// tslint:disable: max-file-line-count
