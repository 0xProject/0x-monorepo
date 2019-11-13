import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    getRandomPortion,
    hexRandom,
    Numberish,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { LogEntry, TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { StoredBalance } from '../utils/types';

import { artifacts, TestMixinStakingPoolRewardsContract, TestMixinStakingPoolRewardsEvents as Events } from '../../src';

blockchainTests.resets('MixinStakingPoolRewards unit tests', env => {
    let testContract: TestMixinStakingPoolRewardsContract;

    const POOL_ID = hexRandom();
    const OPERATOR = randomAddress();
    const OPERATOR_SHARE = getRandomInteger(1, constants.PPM_100_PERCENT);
    let caller: string;

    before(async () => {
        testContract = await TestMixinStakingPoolRewardsContract.deployFrom0xArtifactAsync(
            artifacts.TestMixinStakingPoolRewards,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        await testContract
            .setPool(POOL_ID, {
                operator: OPERATOR,
                operatorShare: OPERATOR_SHARE,
            })
            .awaitTransactionSuccessAsync();
        [caller] = await env.getAccountAddressesAsync();
    });

    async function setUnfinalizedPoolRewardsAsync(
        poolId: string,
        reward: Numberish,
        membersStake: Numberish,
    ): Promise<void> {
        await testContract
            .setUnfinalizedPoolRewards(poolId, new BigNumber(reward), new BigNumber(membersStake))
            .awaitTransactionSuccessAsync();
    }

    // Set the delegated stake of a delegator in a pool.
    // Omitted fields will be randomly generated.
    async function setStakeAsync(
        poolId: string,
        delegator: string,
        stake?: Partial<StoredBalance>,
    ): Promise<StoredBalance> {
        const _stake = {
            currentEpoch: getRandomInteger(1, 4e9),
            currentEpochBalance: getRandomInteger(1, 1e18),
            nextEpochBalance: getRandomInteger(1, 1e18),
            ...stake,
        };
        await testContract
            .setDelegatedStakeToPoolByOwner(delegator, poolId, {
                currentEpoch: _stake.currentEpoch,
                currentEpochBalance: _stake.currentEpochBalance,
                nextEpochBalance: _stake.nextEpochBalance,
            })
            .awaitTransactionSuccessAsync();
        return _stake;
    }

    // Sets up state for a call to `_computeDelegatorReward()` and return the
    // finalized rewards it will compute.
    async function setComputeDelegatorRewardStateAsync(
        poolId: string,
        delegator: string,
        finalizedReward?: Numberish,
    ): Promise<BigNumber> {
        const stake = await testContract.delegatedStakeToPoolByOwner(delegator, poolId).callAsync();
        // Split the rewards up across the two calls to `_computeMemberRewardOverInterval()`
        const reward = finalizedReward === undefined ? getRandomInteger(1, 1e18) : new BigNumber(finalizedReward);
        const oldRewards = getRandomPortion(reward);
        await testContract
            .setMemberRewardsOverInterval(
                poolId,
                stake.currentEpochBalance,
                stake.currentEpoch,
                stake.currentEpoch.plus(1),
                oldRewards,
            )
            .awaitTransactionSuccessAsync();
        const newRewards = reward.minus(oldRewards);
        await testContract
            .setMemberRewardsOverInterval(
                poolId,
                stake.nextEpochBalance,
                stake.currentEpoch.plus(1),
                await testContract.currentEpoch().callAsync(),
                newRewards,
            )
            .awaitTransactionSuccessAsync();
        return reward;
    }

    function toOperatorPortion(operatorShare: Numberish, reward: Numberish): BigNumber {
        return ReferenceFunctions.getPartialAmountCeil(
            new BigNumber(operatorShare),
            new BigNumber(constants.PPM_DENOMINATOR),
            new BigNumber(reward),
        );
    }

    function toMembersPortion(operatorShare: Numberish, reward: Numberish): BigNumber {
        return new BigNumber(reward).minus(toOperatorPortion(operatorShare, reward));
    }

    describe('withdrawDelegatorRewards()', () => {
        it('calls `_withdrawAndSyncDelegatorRewards()` with the sender as the member', async () => {
            const { logs } = await testContract.withdrawDelegatorRewards(POOL_ID).awaitTransactionSuccessAsync();
            verifyEventsFromLogs(
                logs,
                [{ poolId: POOL_ID, delegator: caller }],
                Events.WithdrawAndSyncDelegatorRewards,
            );
        });
    });

    describe('_withdrawAndSyncDelegatorRewards()', () => {
        const POOL_REWARD = getRandomInteger(1, 100e18);
        const WETH_RESERVED_FOR_POOL_REWARDS = POOL_REWARD.plus(getRandomInteger(1, 100e18));
        const DELEGATOR = randomAddress();
        let stake: StoredBalance;

        before(async () => {
            stake = await setStakeAsync(POOL_ID, DELEGATOR);
            await testContract.setPoolRewards(POOL_ID, POOL_REWARD).awaitTransactionSuccessAsync();
            await testContract
                .setWethReservedForPoolRewards(WETH_RESERVED_FOR_POOL_REWARDS)
                .awaitTransactionSuccessAsync();
        });

        async function withdrawAndSyncDelegatorRewardsAsync(): Promise<TransactionReceiptWithDecodedLogs> {
            return testContract.withdrawAndSyncDelegatorRewards(POOL_ID, DELEGATOR).awaitTransactionSuccessAsync();
        }

        it('reverts if the pool is not finalized', async () => {
            await setUnfinalizedPoolRewardsAsync(POOL_ID, 0, 1);
            const tx = withdrawAndSyncDelegatorRewardsAsync();
            return expect(tx).to.revertWith('POOL_NOT_FINALIZED');
        });
        it('calls `_updateCumulativeReward()`', async () => {
            const { logs } = await withdrawAndSyncDelegatorRewardsAsync();
            verifyEventsFromLogs(logs, [{ poolId: POOL_ID }], Events.UpdateCumulativeReward);
        });
        it('transfers finalized rewards to the sender', async () => {
            const finalizedReward = getRandomPortion(POOL_REWARD);
            await setComputeDelegatorRewardStateAsync(POOL_ID, DELEGATOR, finalizedReward);
            const { logs } = await withdrawAndSyncDelegatorRewardsAsync();
            verifyEventsFromLogs(
                logs,
                [{ _from: testContract.address, _to: DELEGATOR, _value: finalizedReward }],
                Events.Transfer,
            );
        });
        it('reduces `rewardsByPoolId` for the pool', async () => {
            const finalizedReward = getRandomPortion(POOL_REWARD);
            await setComputeDelegatorRewardStateAsync(POOL_ID, DELEGATOR, finalizedReward);
            await withdrawAndSyncDelegatorRewardsAsync();
            const poolReward = await testContract.rewardsByPoolId(POOL_ID).callAsync();
            expect(poolReward).to.bignumber.eq(POOL_REWARD.minus(finalizedReward));
        });
        it('reduces `wethReservedForPoolRewards` for the pool', async () => {
            const finalizedReward = getRandomPortion(POOL_REWARD);
            await setComputeDelegatorRewardStateAsync(POOL_ID, DELEGATOR, finalizedReward);
            await withdrawAndSyncDelegatorRewardsAsync();
            const wethReserved = await testContract.wethReservedForPoolRewards().callAsync();
            expect(wethReserved).to.bignumber.eq(WETH_RESERVED_FOR_POOL_REWARDS.minus(finalizedReward));
        });
        it('syncs `_delegatedStakeToPoolByOwner`', async () => {
            await setComputeDelegatorRewardStateAsync(POOL_ID, DELEGATOR, getRandomPortion(POOL_REWARD));
            await withdrawAndSyncDelegatorRewardsAsync();
            const stakeAfter = await testContract.delegatedStakeToPoolByOwner(DELEGATOR, POOL_ID).callAsync();
            // `_loadCurrentBalance` is overridden to just increment `currentEpoch`.
            expect(stakeAfter).to.deep.eq({
                currentEpoch: stake.currentEpoch.plus(1),
                currentEpochBalance: stake.currentEpochBalance,
                nextEpochBalance: stake.nextEpochBalance,
            });
        });
        it('does not transfer zero rewards', async () => {
            await setComputeDelegatorRewardStateAsync(POOL_ID, DELEGATOR, 0);
            const { logs } = await withdrawAndSyncDelegatorRewardsAsync();
            verifyEventsFromLogs(logs, [], Events.Transfer);
        });
        it('no rewards if the delegated stake epoch == current epoch', async () => {
            // Set some finalized rewards that should be ignored.
            await setComputeDelegatorRewardStateAsync(POOL_ID, DELEGATOR, getRandomInteger(1, POOL_REWARD));
            await testContract.setCurrentEpoch(stake.currentEpoch).awaitTransactionSuccessAsync();
            const { logs } = await withdrawAndSyncDelegatorRewardsAsync();
            // There will be no Transfer events if computed rewards are zero.
            verifyEventsFromLogs(logs, [], Events.Transfer);
        });
    });

    describe('computeRewardBalanceOfOperator()', () => {
        async function computeRewardBalanceOfOperatorAsync(): Promise<BigNumber> {
            return testContract.computeRewardBalanceOfOperator(POOL_ID).callAsync();
        }

        it('returns only unfinalized rewards', async () => {
            const unfinalizedReward = getRandomInteger(1, 1e18);
            await setUnfinalizedPoolRewardsAsync(POOL_ID, unfinalizedReward, getRandomInteger(1, 1e18));
            // Set some unfinalized state for a call to `_computeDelegatorReward()`,
            // which should not be called.
            await setComputeDelegatorRewardStateAsync(POOL_ID, OPERATOR, getRandomInteger(1, 1e18));
            const reward = await computeRewardBalanceOfOperatorAsync();
            const expectedReward = toOperatorPortion(OPERATOR_SHARE, unfinalizedReward);
            expect(reward).to.bignumber.eq(expectedReward);
        });
        it('returns operator portion of unfinalized rewards', async () => {
            const unfinalizedReward = getRandomInteger(1, 1e18);
            await setUnfinalizedPoolRewardsAsync(POOL_ID, unfinalizedReward, getRandomInteger(1, 1e18));
            const reward = await computeRewardBalanceOfOperatorAsync();
            const expectedReward = toOperatorPortion(OPERATOR_SHARE, unfinalizedReward);
            expect(reward).to.bignumber.eq(expectedReward);
        });
        it('returns zero if no unfinalized rewards', async () => {
            await setUnfinalizedPoolRewardsAsync(POOL_ID, 0, getRandomInteger(1, 1e18));
            const reward = await computeRewardBalanceOfOperatorAsync();
            expect(reward).to.bignumber.eq(0);
        });
        it('returns all unfinalized reward if member stake is zero', async () => {
            const unfinalizedReward = getRandomInteger(1, 1e18);
            await setUnfinalizedPoolRewardsAsync(POOL_ID, unfinalizedReward, 0);
            const reward = await computeRewardBalanceOfOperatorAsync();
            expect(reward).to.bignumber.eq(unfinalizedReward);
        });
        it('returns no reward if operator share is zero', async () => {
            await testContract
                .setPool(POOL_ID, {
                    operator: OPERATOR,
                    operatorShare: constants.ZERO_AMOUNT,
                })
                .awaitTransactionSuccessAsync();
            await setUnfinalizedPoolRewardsAsync(POOL_ID, getRandomInteger(1, 1e18), getRandomInteger(1, 1e18));
            const reward = await computeRewardBalanceOfOperatorAsync();
            expect(reward).to.bignumber.eq(0);
        });
        it('returns all unfinalized reward if operator share is 100%', async () => {
            await testContract
                .setPool(POOL_ID, {
                    operator: OPERATOR,
                    operatorShare: constants.PPM_100_PERCENT,
                })
                .awaitTransactionSuccessAsync();
            const unfinalizedReward = getRandomInteger(1, 1e18);
            await setUnfinalizedPoolRewardsAsync(POOL_ID, unfinalizedReward, getRandomInteger(1, 1e18));
            const reward = await computeRewardBalanceOfOperatorAsync();
            expect(reward).to.bignumber.eq(unfinalizedReward);
        });
    });

    describe('computeRewardBalanceOfDelegator()', () => {
        const DELEGATOR = randomAddress();
        let currentEpoch: BigNumber;
        let stake: StoredBalance;

        before(async () => {
            currentEpoch = await testContract.currentEpoch().callAsync();
            stake = await setStakeAsync(POOL_ID, DELEGATOR);
        });

        async function computeRewardBalanceOfDelegatorAsync(): Promise<BigNumber> {
            return testContract.computeRewardBalanceOfDelegator(POOL_ID, DELEGATOR).callAsync();
        }

        function getDelegatorPortionOfUnfinalizedReward(
            unfinalizedReward: Numberish,
            unfinalizedMembersStake: Numberish,
        ): BigNumber {
            const unfinalizedStakeBalance = stake.currentEpoch.gte(currentEpoch)
                ? stake.currentEpochBalance
                : stake.nextEpochBalance;
            return ReferenceFunctions.getPartialAmountFloor(
                unfinalizedStakeBalance,
                new BigNumber(unfinalizedMembersStake),
                toMembersPortion(OPERATOR_SHARE, unfinalizedReward),
            );
        }

        it('returns zero when no finalized or unfinalized rewards', async () => {
            const reward = await computeRewardBalanceOfDelegatorAsync();
            expect(reward).to.bignumber.eq(0);
        });
        it('returns only unfinalized rewards when no finalized rewards', async () => {
            const unfinalizedReward = getRandomInteger(1, 1e18);
            const unfinalizedMembersStake = getRandomInteger(1, 1e18);
            await setUnfinalizedPoolRewardsAsync(POOL_ID, unfinalizedReward, unfinalizedMembersStake);
            const expectedReward = getDelegatorPortionOfUnfinalizedReward(unfinalizedReward, unfinalizedMembersStake);
            const reward = await computeRewardBalanceOfDelegatorAsync();
            expect(reward).to.bignumber.eq(expectedReward);
        });
        it("returns zero when delegator's synced stake was zero in the last epoch and no finalized rewards", async () => {
            await setStakeAsync(POOL_ID, DELEGATOR, {
                ...stake,
                currentEpoch: currentEpoch.minus(1),
                currentEpochBalance: constants.ZERO_AMOUNT,
            });
            await setUnfinalizedPoolRewardsAsync(POOL_ID, getRandomInteger(1, 1e18), getRandomInteger(1, 1e18));
            const reward = await computeRewardBalanceOfDelegatorAsync();
            expect(reward).to.bignumber.eq(0);
        });
        it("returns zero when delegator's unsynced stake was zero in the last epoch and no finalized rewards", async () => {
            const epoch = 2;
            await setStakeAsync(POOL_ID, DELEGATOR, {
                ...stake,
                currentEpoch: new BigNumber(epoch - 2),
                nextEpochBalance: constants.ZERO_AMOUNT,
            });
            await testContract.setCurrentEpoch(new BigNumber(epoch)).awaitTransactionSuccessAsync();
            await setUnfinalizedPoolRewardsAsync(POOL_ID, getRandomInteger(1, 1e18), getRandomInteger(1, 1e18));
            const reward = await computeRewardBalanceOfDelegatorAsync();
            expect(reward).to.bignumber.eq(0);
        });
        it('returns only finalized rewards when no unfinalized rewards', async () => {
            const finalizedReward = getRandomInteger(1, 1e18);
            await setComputeDelegatorRewardStateAsync(POOL_ID, DELEGATOR, finalizedReward);
            const reward = await computeRewardBalanceOfDelegatorAsync();
            expect(reward).to.bignumber.eq(finalizedReward);
        });
        it('returns both unfinalized and finalized rewards', async () => {
            const unfinalizedReward = getRandomInteger(1, 1e18);
            const unfinalizedMembersStake = getRandomInteger(1, 1e18);
            await setUnfinalizedPoolRewardsAsync(POOL_ID, unfinalizedReward, unfinalizedMembersStake);
            const finalizedReward = getRandomInteger(1, 1e18);
            await setComputeDelegatorRewardStateAsync(POOL_ID, DELEGATOR, finalizedReward);
            const delegatorUnfinalizedReward = getDelegatorPortionOfUnfinalizedReward(
                unfinalizedReward,
                unfinalizedMembersStake,
            );
            const expectedReward = delegatorUnfinalizedReward.plus(finalizedReward);
            const reward = await computeRewardBalanceOfDelegatorAsync();
            expect(reward).to.bignumber.eq(expectedReward);
        });
    });

    describe('_syncPoolRewards()', async () => {
        const POOL_REWARD = getRandomInteger(1, 100e18);
        const WETH_RESERVED_FOR_POOL_REWARDS = POOL_REWARD.plus(getRandomInteger(1, 100e18));

        before(async () => {
            await testContract.setPoolRewards(POOL_ID, POOL_REWARD).awaitTransactionSuccessAsync();
            await testContract
                .setWethReservedForPoolRewards(WETH_RESERVED_FOR_POOL_REWARDS)
                .awaitTransactionSuccessAsync();
        });

        async function syncPoolRewardsAsync(
            reward: Numberish,
            membersStake: Numberish,
        ): Promise<[[BigNumber, BigNumber], LogEntry[]]> {
            const contractFn = testContract.syncPoolRewards(
                POOL_ID,
                new BigNumber(reward),
                new BigNumber(membersStake),
            );
            const result = await contractFn.callAsync();
            const { logs } = await contractFn.awaitTransactionSuccessAsync();
            return [result, logs];
        }

        it("transfers operator's portion of the reward to the operator", async () => {
            const totalReward = getRandomInteger(1, 1e18);
            const membersStake = getRandomInteger(1, 1e18);
            const [, logs] = await syncPoolRewardsAsync(totalReward, membersStake);
            const expectedOperatorReward = toOperatorPortion(OPERATOR_SHARE, totalReward);
            verifyEventsFromLogs(
                logs,
                [{ _from: testContract.address, _to: OPERATOR, _value: expectedOperatorReward }],
                Events.Transfer,
            );
        });
        it("increases `rewardsByPoolId` with members' portion of rewards", async () => {
            const totalReward = getRandomInteger(1, 1e18);
            const membersStake = getRandomInteger(1, 1e18);
            await syncPoolRewardsAsync(totalReward, membersStake);
            const expectedMembersReward = toMembersPortion(OPERATOR_SHARE, totalReward);
            const poolReward = await testContract.rewardsByPoolId(POOL_ID).callAsync();
            expect(poolReward).to.bignumber.eq(POOL_REWARD.plus(expectedMembersReward));
        });
        it("increases `wethReservedForPoolRewards` with members' portion of rewards", async () => {
            const totalReward = getRandomInteger(1, 1e18);
            const membersStake = getRandomInteger(1, 1e18);
            await syncPoolRewardsAsync(totalReward, membersStake);
            const expectedMembersReward = toMembersPortion(OPERATOR_SHARE, totalReward);
            const wethReserved = await testContract.wethReservedForPoolRewards().callAsync();
            expect(wethReserved).to.bignumber.eq(WETH_RESERVED_FOR_POOL_REWARDS.plus(expectedMembersReward));
        });
        it("returns operator and members' portion of the reward", async () => {
            const totalReward = getRandomInteger(1, 1e18);
            const membersStake = getRandomInteger(1, 1e18);
            const [[operatorReward, membersReward]] = await syncPoolRewardsAsync(totalReward, membersStake);
            const expectedOperatorReward = toOperatorPortion(OPERATOR_SHARE, totalReward);
            const expectedMembersReward = toMembersPortion(OPERATOR_SHARE, totalReward);
            expect(operatorReward).to.bignumber.eq(expectedOperatorReward);
            expect(membersReward).to.bignumber.eq(expectedMembersReward);
        });
        it("gives all rewards to operator if members' stake is zero", async () => {
            const totalReward = getRandomInteger(1, 1e18);
            const [[operatorReward, membersReward], logs] = await syncPoolRewardsAsync(totalReward, 0);
            expect(operatorReward).to.bignumber.eq(totalReward);
            expect(membersReward).to.bignumber.eq(0);
            verifyEventsFromLogs(
                logs,
                [{ _from: testContract.address, _to: OPERATOR, _value: totalReward }],
                Events.Transfer,
            );
        });
        it("gives all rewards to members if operator's share is zero", async () => {
            const totalReward = getRandomInteger(1, 1e18);
            await testContract
                .setPool(POOL_ID, {
                    operator: OPERATOR,
                    operatorShare: constants.ZERO_AMOUNT,
                })
                .awaitTransactionSuccessAsync();
            const [[operatorReward, membersReward], logs] = await syncPoolRewardsAsync(
                totalReward,
                getRandomInteger(1, 1e18),
            );
            expect(operatorReward).to.bignumber.eq(0);
            expect(membersReward).to.bignumber.eq(totalReward);
            // Should be no transfer to the operator.
            verifyEventsFromLogs(logs, [], Events.Transfer);
        });
    });

    describe('_computePoolRewardsSplit', () => {
        it("gives all rewards to operator if members' stake is zero", async () => {
            const operatorShare = getRandomPortion(constants.PPM_100_PERCENT);
            const totalReward = getRandomInteger(1, 1e18);
            const membersStake = constants.ZERO_AMOUNT;
            const [operatorReward, membersReward] = await testContract
                .computePoolRewardsSplit(operatorShare, totalReward, membersStake)
                .callAsync();
            expect(operatorReward).to.bignumber.eq(totalReward);
            expect(membersReward).to.bignumber.eq(0);
        });
        it("gives all rewards to operator if members' stake is zero and operator share is zero", async () => {
            const operatorShare = constants.ZERO_AMOUNT;
            const totalReward = getRandomInteger(1, 1e18);
            const membersStake = constants.ZERO_AMOUNT;
            const [operatorReward, membersReward] = await testContract
                .computePoolRewardsSplit(operatorShare, totalReward, membersStake)
                .callAsync();
            expect(operatorReward).to.bignumber.eq(totalReward);
            expect(membersReward).to.bignumber.eq(0);
        });
        it('gives all rewards to operator if operator share is 100%', async () => {
            const operatorShare = constants.PPM_100_PERCENT;
            const totalReward = getRandomInteger(1, 1e18);
            const membersStake = getRandomInteger(1, 1e18);
            const [operatorReward, membersReward] = await testContract
                .computePoolRewardsSplit(operatorShare, totalReward, membersStake)
                .callAsync();
            expect(operatorReward).to.bignumber.eq(totalReward);
            expect(membersReward).to.bignumber.eq(0);
        });
        it('gives all rewards to members if operator share is 0%', async () => {
            const operatorShare = constants.ZERO_AMOUNT;
            const totalReward = getRandomInteger(1, 1e18);
            const membersStake = getRandomInteger(1, 1e18);
            const [operatorReward, membersReward] = await testContract
                .computePoolRewardsSplit(operatorShare, totalReward, membersStake)
                .callAsync();
            expect(operatorReward).to.bignumber.eq(0);
            expect(membersReward).to.bignumber.eq(totalReward);
        });
        it('splits rewards between operator and members based on operator share', async () => {
            const operatorShare = getRandomPortion(constants.PPM_100_PERCENT);
            const totalReward = getRandomInteger(1, 1e18);
            const membersStake = getRandomInteger(1, 1e18);
            const [operatorReward, membersReward] = await testContract
                .computePoolRewardsSplit(operatorShare, totalReward, membersStake)
                .callAsync();
            expect(operatorReward).to.bignumber.eq(toOperatorPortion(operatorShare, totalReward));
            expect(membersReward).to.bignumber.eq(toMembersPortion(operatorShare, totalReward));
        });
    });
});
// tslint:disable: max-file-line-count
