import {
    blockchainTests,
    expect,
    filterLogs,
    filterLogsToArguments,
    getRandomInteger,
    hexLeftPad,
    hexRandom,
    Numberish,
    shortZip,
} from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { StakeStatus } from '../utils/types';

import {
    artifacts,
    TestMixinStakeContract,
    TestMixinStakeDecreaseCurrentAndNextBalanceEventArgs as DecreaseCurrentAndNextBalanceEventArgs,
    TestMixinStakeDecreaseNextBalanceEventArgs as DecreaseNextBalanceEventArgs,
    TestMixinStakeEvents as StakeEvents,
    TestMixinStakeIncreaseCurrentAndNextBalanceEventArgs as IncreaseCurrentAndNextBalanceEventArgs,
    TestMixinStakeIncreaseNextBalanceEventArgs as IncreaseNextBalanceEventArgs,
    TestMixinStakeMoveStakeEventArgs as MoveStakeEventArgs,
    TestMixinStakeMoveStakeStorageEventArgs as MoveStakeStorageEventArgs,
    TestMixinStakeStakeEventArgs as StakeEventArgs,
    TestMixinStakeUnstakeEventArgs as UnstakeEventArgs,
    TestMixinStakeWithdrawAndSyncDelegatorRewardsEventArgs as WithdrawAndSyncDelegatorRewardsEventArgs,
    TestMixinStakeZrxVaultDepositFromEventArgs as ZrxVaultDepositFromEventArgs,
    TestMixinStakeZrxVaultWithdrawFromEventArgs as ZrxVaultWithdrawFromEventArgs,
} from '../../src';

blockchainTests.resets('MixinStake unit tests', env => {
    let testContract: TestMixinStakeContract;
    let staker: string;
    let stakerUndelegatedStakeSlot: string;
    let currentEpoch: BigNumber;

    before(async () => {
        [staker] = await env.getAccountAddressesAsync();
        testContract = await TestMixinStakeContract.deployFrom0xArtifactAsync(
            artifacts.TestMixinStake,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        currentEpoch = await testContract.currentEpoch.callAsync();
        stakerUndelegatedStakeSlot = await testContract.getOwnerStakeByStatusSlot.callAsync(
            staker,
            StakeStatus.Undelegated,
        );
    });

    describe('stake()', () => {
        it('deposits funds into the ZRX vault', async () => {
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract.stake.awaitTransactionSuccessAsync(amount);
            const events = filterLogsToArguments<ZrxVaultDepositFromEventArgs>(logs, StakeEvents.ZrxVaultDepositFrom);
            expect(events).to.be.length(1);
            expect(events[0].staker).to.eq(staker);
            expect(events[0].amount).to.bignumber.eq(amount);
        });

        it('increases current and next undelegated stake balance', async () => {
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract.stake.awaitTransactionSuccessAsync(amount);
            const events = filterLogsToArguments<IncreaseCurrentAndNextBalanceEventArgs>(
                logs,
                StakeEvents.IncreaseCurrentAndNextBalance,
            );
            expect(events).to.be.length(1);
            expect(events[0].balanceSlot).to.eq(stakerUndelegatedStakeSlot);
            expect(events[0].amount).to.bignumber.eq(amount);
        });

        it('raises a `Stake` event', async () => {
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract.stake.awaitTransactionSuccessAsync(amount);
            const events = filterLogsToArguments<StakeEventArgs>(logs, StakeEvents.Stake);
            expect(events).to.be.length(1);
            expect(events[0].staker).to.eq(staker);
            expect(events[0].amount).to.bignumber.eq(amount);
        });
    });

    describe('unstake()', () => {
        async function setUndelegatedStakeAsync(
            currentEpochBalance: Numberish,
            nextEpochBalance: Numberish,
        ): Promise<void> {
            await testContract.setOwnerStakeByStatus.awaitTransactionSuccessAsync(staker, StakeStatus.Undelegated, {
                currentEpoch,
                currentEpochBalance: new BigNumber(currentEpochBalance),
                nextEpochBalance: new BigNumber(nextEpochBalance),
            });
        }

        it('throws if not enough undelegated stake in the current epoch', async () => {
            const amount = getRandomInteger(0, 100e18);
            await setUndelegatedStakeAsync(amount.minus(1), amount);
            const tx = testContract.unstake.awaitTransactionSuccessAsync(amount);
            const expectedError = new StakingRevertErrors.InsufficientBalanceError(amount, amount.minus(1));
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws if not enough undelegated stake in the next epoch', async () => {
            const amount = getRandomInteger(0, 100e18);
            await setUndelegatedStakeAsync(amount, amount.minus(1));
            const tx = testContract.unstake.awaitTransactionSuccessAsync(amount);
            const expectedError = new StakingRevertErrors.InsufficientBalanceError(amount, amount.minus(1));
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws if not enough undelegated stake in both epochs', async () => {
            const amount = getRandomInteger(0, 100e18);
            await setUndelegatedStakeAsync(amount.minus(1), amount.minus(1));
            const tx = testContract.unstake.awaitTransactionSuccessAsync(amount);
            const expectedError = new StakingRevertErrors.InsufficientBalanceError(amount, amount.minus(1));
            return expect(tx).to.revertWith(expectedError);
        });

        it('decreases current and next undelegated stake balance', async () => {
            const amount = getRandomInteger(0, 100e18);
            await setUndelegatedStakeAsync(amount, amount);
            const { logs } = await testContract.unstake.awaitTransactionSuccessAsync(amount);
            const events = filterLogsToArguments<DecreaseCurrentAndNextBalanceEventArgs>(
                logs,
                StakeEvents.DecreaseCurrentAndNextBalance,
            );
            expect(events).to.be.length(1);
            expect(events[0].balanceSlot).to.eq(stakerUndelegatedStakeSlot);
            expect(events[0].amount).to.bignumber.eq(amount);
        });

        it('withdraws funds from the ZRX vault', async () => {
            const amount = getRandomInteger(0, 100e18);
            await setUndelegatedStakeAsync(amount, amount);
            const { logs } = await testContract.unstake.awaitTransactionSuccessAsync(amount);
            const events = filterLogsToArguments<ZrxVaultWithdrawFromEventArgs>(logs, StakeEvents.ZrxVaultWithdrawFrom);
            expect(events).to.be.length(1);
            expect(events[0].staker).to.eq(staker);
            expect(events[0].amount).to.bignumber.eq(amount);
        });

        it('emits an `Unstake` event', async () => {
            const amount = getRandomInteger(0, 100e18);
            await setUndelegatedStakeAsync(amount, amount);
            const { logs } = await testContract.unstake.awaitTransactionSuccessAsync(amount);
            const events = filterLogsToArguments<UnstakeEventArgs>(logs, StakeEvents.Unstake);
            expect(events).to.be.length(1);
            expect(events[0].staker).to.eq(staker);
            expect(events[0].amount).to.bignumber.eq(amount);
        });
    });

    describe('moveStake()', () => {
        const INVALID_POOL_ERROR = 'INVALID_POOL';
        const INVALID_POOL_ID = hexLeftPad(0);
        const VALID_POOL_IDS = [hexRandom(), hexRandom()];
        let delegatedStakeToPoolByOwnerSlots: string[];
        let delegatedStakeByPoolIdSlots: string[];
        let globalDelegatedStakeSlot: string;
        let stakerDelegatedStakeSlot: string;

        before(async () => {
            delegatedStakeToPoolByOwnerSlots = await Promise.all(
                VALID_POOL_IDS.map(async poolId =>
                    testContract.getDelegatedStakeToPoolByOwnerSlot.callAsync(poolId, staker),
                ),
            );
            delegatedStakeByPoolIdSlots = await Promise.all(
                VALID_POOL_IDS.map(async poolId => testContract.getDelegatedStakeByPoolIdSlot.callAsync(poolId)),
            );
            globalDelegatedStakeSlot = await testContract.getGlobalStakeByStatusSlot.callAsync(StakeStatus.Delegated);
            stakerDelegatedStakeSlot = await testContract.getOwnerStakeByStatusSlot.callAsync(
                staker,
                StakeStatus.Delegated,
            );
        });

        it('throws if the "from" pool is invalid', async () => {
            const tx = testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Delegated, poolId: INVALID_POOL_ID },
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[0] },
                getRandomInteger(0, 100e18),
            );
            return expect(tx).to.revertWith(INVALID_POOL_ERROR);
        });

        it('throws if the "to" pool is invalid', async () => {
            const tx = testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Delegated, poolId: INVALID_POOL_ID },
                getRandomInteger(0, 100e18),
            );
            return expect(tx).to.revertWith(INVALID_POOL_ERROR);
        });

        it('throws if the "from" and "to" pools are invalid', async () => {
            const tx = testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Delegated, poolId: INVALID_POOL_ID },
                { status: StakeStatus.Delegated, poolId: INVALID_POOL_ID },
                getRandomInteger(0, 100e18),
            );
            return expect(tx).to.revertWith(INVALID_POOL_ERROR);
        });

        it('withdraws delegator rewards when "from" stake is delegated', async () => {
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[1] },
                getRandomInteger(0, 100e18),
            );
            const events = filterLogsToArguments<WithdrawAndSyncDelegatorRewardsEventArgs>(
                logs,
                StakeEvents.WithdrawAndSyncDelegatorRewards,
            );
            expect(events).to.be.length(1);
            expect(events[0].poolId).to.eq(VALID_POOL_IDS[0]);
            expect(events[0].delegator).to.eq(staker);
        });

        it('withdraws delegator rewards when "to" stake is delegated', async () => {
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[1] },
                getRandomInteger(0, 100e18),
            );
            const events = filterLogsToArguments<WithdrawAndSyncDelegatorRewardsEventArgs>(
                logs,
                StakeEvents.WithdrawAndSyncDelegatorRewards,
            );
            expect(events).to.be.length(1);
            expect(events[0].poolId).to.eq(VALID_POOL_IDS[1]);
            expect(events[0].delegator).to.eq(staker);
        });

        it('withdraws delegator rewards when both stakes are both delegated', async () => {
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[1] },
                getRandomInteger(0, 100e18),
            );
            const events = filterLogsToArguments<WithdrawAndSyncDelegatorRewardsEventArgs>(
                logs,
                StakeEvents.WithdrawAndSyncDelegatorRewards,
            );
            expect(events).to.be.length(2);
            for (const [event, poolId] of shortZip(events, VALID_POOL_IDS)) {
                expect(event.poolId).to.eq(poolId);
                expect(event.delegator).to.eq(staker);
            }
        });

        it('does not withdraw delegator rewards when both stakes are both undelegated', async () => {
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[1] },
                getRandomInteger(0, 100e18),
            );
            const events = filterLogsToArguments<WithdrawAndSyncDelegatorRewardsEventArgs>(
                logs,
                StakeEvents.WithdrawAndSyncDelegatorRewards,
            );
            expect(events).to.be.length(0);
        });

        it('decreases pool and global delegated stake counters when "from" stake is delegated', async () => {
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[1] },
                amount,
            );
            const decreaseNextBalanceEvents = filterLogsToArguments<DecreaseNextBalanceEventArgs>(
                logs,
                StakeEvents.DecreaseNextBalance,
            );
            const counters = [
                delegatedStakeToPoolByOwnerSlots[0],
                delegatedStakeByPoolIdSlots[0],
                globalDelegatedStakeSlot,
            ];
            expect(decreaseNextBalanceEvents).to.be.length(3);
            for (const [event, slot] of shortZip(decreaseNextBalanceEvents, counters)) {
                expect(event.balanceSlot).to.eq(slot);
                expect(event.amount).to.bignumber.eq(amount);
            }
        });

        it('increases pool and global delegated stake counters when "to" stake is delegated', async () => {
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[1] },
                amount,
            );
            const increaseNextBalanceEvents = filterLogsToArguments<IncreaseNextBalanceEventArgs>(
                logs,
                StakeEvents.IncreaseNextBalance,
            );
            const counters = [
                delegatedStakeToPoolByOwnerSlots[1],
                delegatedStakeByPoolIdSlots[1],
                globalDelegatedStakeSlot,
            ];
            expect(increaseNextBalanceEvents).to.be.length(3);
            for (const [event, slot] of shortZip(increaseNextBalanceEvents, counters)) {
                expect(event.balanceSlot).to.eq(slot);
                expect(event.amount).to.bignumber.eq(amount);
            }
        });

        it('decreases then increases pool and global delegated stake counters when both stakes are delegated', async () => {
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[1] },
                amount,
            );
            const decreaseNextBalanceEvents = filterLogs<DecreaseNextBalanceEventArgs>(
                logs,
                StakeEvents.DecreaseNextBalance,
            );
            const increaseNextBalanceEvents = filterLogs<IncreaseNextBalanceEventArgs>(
                logs,
                StakeEvents.IncreaseNextBalance,
            );
            const decreaseCounters = [
                delegatedStakeToPoolByOwnerSlots[0],
                delegatedStakeByPoolIdSlots[0],
                globalDelegatedStakeSlot,
            ];
            expect(decreaseNextBalanceEvents).to.be.length(3);
            for (const [event, slot] of shortZip(decreaseNextBalanceEvents, decreaseCounters)) {
                expect(event.args.balanceSlot).to.eq(slot);
                expect(event.args.amount).to.bignumber.eq(amount);
            }
            const increaseCounters = [
                delegatedStakeToPoolByOwnerSlots[1],
                delegatedStakeByPoolIdSlots[1],
                globalDelegatedStakeSlot,
            ];
            expect(increaseNextBalanceEvents).to.be.length(3);
            for (const [event, slot] of shortZip(increaseNextBalanceEvents, increaseCounters)) {
                expect(event.args.balanceSlot).to.eq(slot);
                expect(event.args.amount).to.bignumber.eq(amount);
            }
            // Check that all decreases occur before the increases.
            const maxDecreaseIndex = _.max(decreaseNextBalanceEvents.map(e => e.logIndex)) as number;
            const maxIncreaseIndex = _.max(increaseNextBalanceEvents.map(e => e.logIndex)) as number;
            expect(maxDecreaseIndex).to.be.lt(maxIncreaseIndex);
        });

        it('does not change pool and global delegated stake counters when both stakes are undelegated', async () => {
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[1] },
                amount,
            );
            const decreaseNextBalanceEvents = filterLogsToArguments<DecreaseNextBalanceEventArgs>(
                logs,
                StakeEvents.DecreaseNextBalance,
            );
            const increaseNextBalanceEvents = filterLogsToArguments<IncreaseNextBalanceEventArgs>(
                logs,
                StakeEvents.IncreaseNextBalance,
            );
            expect(decreaseNextBalanceEvents).to.be.length(0);
            expect(increaseNextBalanceEvents).to.be.length(0);
        });

        it('moves the owner stake between the same pointer when both are undelegated', async () => {
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[1] },
                amount,
            );
            const events = filterLogsToArguments<MoveStakeStorageEventArgs>(logs, StakeEvents.MoveStakeStorage);
            expect(events).to.be.length(1);
            expect(events[0].fromBalanceSlot).to.eq(stakerUndelegatedStakeSlot);
            expect(events[0].toBalanceSlot).to.eq(stakerUndelegatedStakeSlot);
            expect(events[0].amount).to.bignumber.eq(amount);
        });

        it('moves the owner stake between the same pointer when both are delegated', async () => {
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[1] },
                amount,
            );
            const events = filterLogsToArguments<MoveStakeStorageEventArgs>(logs, StakeEvents.MoveStakeStorage);
            expect(events).to.be.length(1);
            expect(events[0].fromBalanceSlot).to.eq(stakerDelegatedStakeSlot);
            expect(events[0].toBalanceSlot).to.eq(stakerDelegatedStakeSlot);
            expect(events[0].amount).to.bignumber.eq(amount);
        });

        it('moves the owner stake between different pointers when "from" is undelegated and "to" is delegated', async () => {
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[1] },
                amount,
            );
            const events = filterLogsToArguments<MoveStakeStorageEventArgs>(logs, StakeEvents.MoveStakeStorage);
            expect(events).to.be.length(1);
            expect(events[0].fromBalanceSlot).to.eq(stakerUndelegatedStakeSlot);
            expect(events[0].toBalanceSlot).to.eq(stakerDelegatedStakeSlot);
            expect(events[0].amount).to.bignumber.eq(amount);
        });

        it('moves the owner stake between different pointers when "to" is undelegated and "to" is delegated', async () => {
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[1] },
                amount,
            );
            const events = filterLogsToArguments<MoveStakeStorageEventArgs>(logs, StakeEvents.MoveStakeStorage);
            expect(events).to.be.length(1);
            expect(events[0].fromBalanceSlot).to.eq(stakerDelegatedStakeSlot);
            expect(events[0].toBalanceSlot).to.eq(stakerUndelegatedStakeSlot);
            expect(events[0].amount).to.bignumber.eq(amount);
        });

        it('emits a `MoveStake` event', async () => {
            const amount = getRandomInteger(0, 100e18);
            const { logs } = await testContract.moveStake.awaitTransactionSuccessAsync(
                { status: StakeStatus.Undelegated, poolId: VALID_POOL_IDS[0] },
                { status: StakeStatus.Delegated, poolId: VALID_POOL_IDS[1] },
                amount,
            );
            const events = filterLogsToArguments<MoveStakeEventArgs>(logs, StakeEvents.MoveStake);
            expect(events).to.be.length(1);
            expect(events[0].staker).to.eq(staker);
            expect(events[0].amount).to.bignumber.eq(amount);
            expect(events[0].fromStatus).to.eq(StakeStatus.Undelegated);
            expect(events[0].toStatus).to.eq(StakeStatus.Delegated);
            expect(events[0].fromPool).to.eq(VALID_POOL_IDS[0]);
            expect(events[0].toPool).to.eq(VALID_POOL_IDS[1]);
        });
    });
});
// tslint:disable: max-file-line-count
