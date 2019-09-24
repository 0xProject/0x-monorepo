import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, constants, describe, expect, shortZip } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { FinalizerActor } from './actors/finalizer_actor';
import { PoolOperatorActor } from './actors/pool_operator_actor';
import { StakerActor } from './actors/staker_actor';
import { deployAndConfigureContractsAsync, StakingApiWrapper } from './utils/api_wrapper';
import { toBaseUnitAmount } from './utils/number_utils';
import { DelegatorsByPoolId, OperatorByPoolId, StakeInfo, StakeStatus } from './utils/types';

// tslint:disable:no-unnecessary-type-assertion
// tslint:disable:max-file-line-count
blockchainTests.resets('Testing Rewards', env => {
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let actors: string[];
    let exchangeAddress: string;
    let takerAddress: string;
    // wrappers
    let stakingApiWrapper: StakingApiWrapper;
    // let testWrapper: TestRewardBalancesContract;
    let erc20Wrapper: ERC20Wrapper;
    // test parameters
    let stakers: StakerActor[];
    let poolOperatorStaker: StakerActor;
    let poolId: string;
    let poolOperator: PoolOperatorActor;
    let finalizer: FinalizerActor;
    // tests
    before(async () => {
        // create accounts
        accounts = await env.getAccountAddressesAsync();
        owner = accounts[0];
        exchangeAddress = accounts[1];
        takerAddress = accounts[2];
        actors = accounts.slice(3);
        // set up ERC20Wrapper
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        // deploy staking contracts
        stakingApiWrapper = await deployAndConfigureContractsAsync(env, owner, erc20Wrapper);
        // set up staking parameters
        await stakingApiWrapper.utils.setParamsAsync({
            minimumPoolStake: new BigNumber(2),
            cobbDouglasAlphaNumerator: new BigNumber(1),
            cobbDouglasAlphaDenominator: new BigNumber(6),
        });
        // setup stakers
        stakers = actors.slice(0, 2).map(a => new StakerActor(a, stakingApiWrapper));
        // setup pools
        poolOperator = new PoolOperatorActor(actors[2], stakingApiWrapper);
        // Create a pool where all rewards go to members.
        poolId = await poolOperator.createStakingPoolAsync(0, true);
        // Stake something in the pool or else it won't get any rewards.
        poolOperatorStaker = new StakerActor(poolOperator.getOwner(), stakingApiWrapper);
        await poolOperatorStaker.stakeWithPoolAsync(poolId, new BigNumber(2));
        // set exchange address
        await stakingApiWrapper.stakingContract.addExchangeAddress.awaitTransactionSuccessAsync(exchangeAddress);
        // associate operators for tracking in Finalizer
        const operatorByPoolId: OperatorByPoolId = {};
        operatorByPoolId[poolId] = poolOperator.getOwner();
        // associate actors with pools for tracking in Finalizer
        const stakersByPoolId: DelegatorsByPoolId = {};
        stakersByPoolId[poolId] = actors.slice(0, 3);
        // create Finalizer actor
        finalizer = new FinalizerActor(actors[3], stakingApiWrapper, [poolId], operatorByPoolId, stakersByPoolId);
        // Skip to next epoch so operator stake is realized.
        await stakingApiWrapper.utils.skipToNextEpochAndFinalizeAsync();
    });
    describe('Reward Simulation', () => {
        interface EndBalances {
            // staker 1
            stakerRewardBalance_1?: BigNumber;
            stakerWethBalance_1?: BigNumber;
            // staker 2
            stakerRewardBalance_2?: BigNumber;
            stakerWethBalance_2?: BigNumber;
            // operator
            operatorWethBalance?: BigNumber;
            // undivided balance in reward pool
            poolRewardBalance?: BigNumber;
            membersRewardBalance?: BigNumber;
        }
        const validateEndBalances = async (_expectedEndBalances: EndBalances): Promise<void> => {
            const expectedEndBalances = {
                // staker 1
                stakerRewardBalance_1:
                    _expectedEndBalances.stakerRewardBalance_1 !== undefined
                        ? _expectedEndBalances.stakerRewardBalance_1
                        : constants.ZERO_AMOUNT,
                stakerWethBalance_1:
                    _expectedEndBalances.stakerWethBalance_1 !== undefined
                        ? _expectedEndBalances.stakerWethBalance_1
                        : constants.ZERO_AMOUNT,
                // staker 2
                stakerRewardBalance_2:
                    _expectedEndBalances.stakerRewardBalance_2 !== undefined
                        ? _expectedEndBalances.stakerRewardBalance_2
                        : constants.ZERO_AMOUNT,
                stakerWethBalance_2:
                    _expectedEndBalances.stakerWethBalance_2 !== undefined
                        ? _expectedEndBalances.stakerWethBalance_2
                        : constants.ZERO_AMOUNT,
                // operator
                operatorWethBalance:
                    _expectedEndBalances.operatorWethBalance !== undefined
                        ? _expectedEndBalances.operatorWethBalance
                        : constants.ZERO_AMOUNT,
                // undivided balance in reward pool
                poolRewardBalance:
                    _expectedEndBalances.poolRewardBalance !== undefined
                        ? _expectedEndBalances.poolRewardBalance
                        : constants.ZERO_AMOUNT,
            };
            const finalEndBalancesAsArray = await Promise.all([
                // staker 1
                stakingApiWrapper.stakingContract.computeRewardBalanceOfDelegator.callAsync(
                    poolId,
                    stakers[0].getOwner(),
                ),
                stakingApiWrapper.wethContract.balanceOf.callAsync(stakers[0].getOwner()),
                // staker 2
                stakingApiWrapper.stakingContract.computeRewardBalanceOfDelegator.callAsync(
                    poolId,
                    stakers[1].getOwner(),
                ),
                stakingApiWrapper.wethContract.balanceOf.callAsync(stakers[1].getOwner()),
                // operator
                stakingApiWrapper.wethContract.balanceOf.callAsync(poolOperator.getOwner()),
                // undivided balance in reward pool
                stakingApiWrapper.stakingContract.rewardsByPoolId.callAsync(poolId),
            ]);
            expect(finalEndBalancesAsArray[0], 'stakerRewardBalance_1').to.be.bignumber.equal(
                expectedEndBalances.stakerRewardBalance_1,
            );
            expect(finalEndBalancesAsArray[1], 'stakerWethBalance_1').to.be.bignumber.equal(
                expectedEndBalances.stakerWethBalance_1,
            );
            expect(finalEndBalancesAsArray[2], 'stakerRewardBalance_2').to.be.bignumber.equal(
                expectedEndBalances.stakerRewardBalance_2,
            );
            expect(finalEndBalancesAsArray[3], 'stakerWethBalance_2').to.be.bignumber.equal(
                expectedEndBalances.stakerWethBalance_2,
            );
            expect(finalEndBalancesAsArray[4], 'operatorWethBalance').to.be.bignumber.equal(
                expectedEndBalances.operatorWethBalance,
            );
            expect(finalEndBalancesAsArray[5], 'poolRewardBalance').to.be.bignumber.equal(
                expectedEndBalances.poolRewardBalance,
            );
        };
        const payProtocolFeeAndFinalize = async (_fee?: BigNumber) => {
            const fee = _fee !== undefined ? _fee : constants.ZERO_AMOUNT;
            if (!fee.eq(constants.ZERO_AMOUNT)) {
                await stakingApiWrapper.stakingContract.payProtocolFee.awaitTransactionSuccessAsync(
                    poolOperator.getOwner(),
                    takerAddress,
                    fee,
                    { from: exchangeAddress, value: fee },
                );
            }
            await finalizer.finalizeAsync();
        };
        it('Reward balance should be zero if not delegated', async () => {
            // sanity balances - all zero
            await validateEndBalances({});
        });
        it('Reward balance should be zero if not delegated, when epoch is greater than 0', async () => {
            await payProtocolFeeAndFinalize();
            // sanity balances - all zero
            await validateEndBalances({});
        });
        it('Reward balance should be zero in same epoch as delegation', async () => {
            const amount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(amount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                amount,
            );
            await payProtocolFeeAndFinalize();
            // sanit check final balances - all zero
            await validateEndBalances({});
        });
        it('Operator should receive entire reward if no delegators in their pool', async () => {
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            // sanity check final balances - all zero
            await validateEndBalances({
                operatorWethBalance: reward,
            });
        });
        it(`Operator should receive entire reward if no delegators in their pool
            (staker joins this epoch but is active next epoch)`, async () => {
            // delegate
            const amount = toBaseUnitAmount(4);
            await stakers[0].stakeWithPoolAsync(poolId, amount);
            // finalize
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            // sanity check final balances
            await validateEndBalances({
                operatorWethBalance: reward,
            });
        });
        it('Should give pool reward to delegator', async () => {
            // delegate
            const amount = toBaseUnitAmount(4);
            await stakers[0].stakeWithPoolAsync(poolId, amount);
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // finalize
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            // sanity check final balances
            await validateEndBalances({
                stakerRewardBalance_1: reward,
                poolRewardBalance: reward,
                membersRewardBalance: reward,
            });
        });
        it('Should split pool reward between delegators', async () => {
            const stakeAmounts = [toBaseUnitAmount(4), toBaseUnitAmount(6)];
            const totalStakeAmount = toBaseUnitAmount(10);
            // first staker delegates
            await stakers[0].stakeWithPoolAsync(poolId, stakeAmounts[0]);
            // second staker delegates
            await stakers[1].stakeWithPoolAsync(poolId, stakeAmounts[1]);
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // finalize
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            // sanity check final balances
            await validateEndBalances({
                stakerRewardBalance_1: reward.times(stakeAmounts[0]).dividedToIntegerBy(totalStakeAmount),
                stakerRewardBalance_2: reward.times(stakeAmounts[1]).dividedToIntegerBy(totalStakeAmount),
                poolRewardBalance: reward,
                membersRewardBalance: reward,
            });
        });
        it('Should split pool reward between delegators, when they join in different epochs', async () => {
            // first staker delegates (epoch 0)

            const stakeAmounts = [toBaseUnitAmount(4), toBaseUnitAmount(6)];
            const totalStakeAmount = toBaseUnitAmount(10);
            await stakers[0].stakeAsync(stakeAmounts[0]);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmounts[0],
            );

            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize();

            // second staker delegates (epoch 1)
            await stakers[1].stakeAsync(stakeAmounts[1]);
            await stakers[1].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmounts[1],
            );

            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // finalize

            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            // sanity check final balances
            await validateEndBalances({
                stakerRewardBalance_1: reward.times(stakeAmounts[0]).dividedToIntegerBy(totalStakeAmount),
                stakerRewardBalance_2: reward.times(stakeAmounts[1]).dividedToIntegerBy(totalStakeAmount),
                poolRewardBalance: reward,
                membersRewardBalance: reward,
            });
        });
        it('Should give pool reward to delegators only for the epoch during which they delegated', async () => {
            const stakeAmounts = [toBaseUnitAmount(4), toBaseUnitAmount(6)];
            const totalStakeAmount = toBaseUnitAmount(10);
            // first staker delegates (epoch 0)
            await stakers[0].stakeWithPoolAsync(poolId, stakeAmounts[0]);
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // second staker delegates (epoch 1)
            await stakers[1].stakeWithPoolAsync(poolId, stakeAmounts[1]);
            // only the first staker will get this reward
            const rewardForOnlyFirstDelegator = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(rewardForOnlyFirstDelegator);
            // finalize
            const rewardForBothDelegators = toBaseUnitAmount(20);
            await payProtocolFeeAndFinalize(rewardForBothDelegators);
            // sanity check final balances
            await validateEndBalances({
                stakerRewardBalance_1: rewardForOnlyFirstDelegator.plus(
                    rewardForBothDelegators.times(stakeAmounts[0]).dividedToIntegerBy(totalStakeAmount),
                ),
                stakerRewardBalance_2: rewardForBothDelegators
                    .times(stakeAmounts[1])
                    .dividedToIntegerBy(totalStakeAmount),
                poolRewardBalance: rewardForOnlyFirstDelegator.plus(rewardForBothDelegators),
                membersRewardBalance: rewardForOnlyFirstDelegator.plus(rewardForBothDelegators),
            });
        });
        it('Should split pool reward between delegators, over several consecutive epochs', async () => {
            const rewardForOnlyFirstDelegator = toBaseUnitAmount(10);
            const sharedRewards = [
                toBaseUnitAmount(20),
                toBaseUnitAmount(16),
                toBaseUnitAmount(24),
                toBaseUnitAmount(5),
                toBaseUnitAmount(0),
                toBaseUnitAmount(17),
            ];
            const totalSharedRewardsAsNumber = _.sumBy(sharedRewards, v => {
                return v.toNumber();
            });
            const totalSharedRewards = new BigNumber(totalSharedRewardsAsNumber);
            const stakeAmounts = [toBaseUnitAmount(4), toBaseUnitAmount(6)];
            const totalStakeAmount = toBaseUnitAmount(10);
            // first staker delegates (epoch 0)
            await stakers[0].stakeWithPoolAsync(poolId, stakeAmounts[0]);
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // second staker delegates (epoch 1)
            await stakers[1].stakeWithPoolAsync(poolId, stakeAmounts[1]);
            // only the first staker will get this reward
            await payProtocolFeeAndFinalize(rewardForOnlyFirstDelegator);
            // earn a bunch of rewards
            for (const reward of sharedRewards) {
                await payProtocolFeeAndFinalize(reward);
            }
            // sanity check final balances
            await validateEndBalances({
                stakerRewardBalance_1: rewardForOnlyFirstDelegator.plus(
                    totalSharedRewards.times(stakeAmounts[0]).dividedToIntegerBy(totalStakeAmount),
                ),
                stakerRewardBalance_2: totalSharedRewards.times(stakeAmounts[1]).dividedToIntegerBy(totalStakeAmount),
                poolRewardBalance: rewardForOnlyFirstDelegator.plus(totalSharedRewards),
                membersRewardBalance: rewardForOnlyFirstDelegator.plus(totalSharedRewards),
            });
        });
        it('Should withdraw existing rewards when undelegating stake', async () => {
            const stakeAmount = toBaseUnitAmount(4);
            // first staker delegates (epoch 0)
            await stakers[0].stakeWithPoolAsync(poolId, stakeAmount);
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // earn reward
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            // undelegate (withdraws delegator's rewards)
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            // sanity check final balances
            await validateEndBalances({
                stakerRewardBalance_1: constants.ZERO_AMOUNT,
                stakerWethBalance_1: reward,
            });
        });
        it('Should withdraw existing rewards correctly when delegating more stake', async () => {
            const stakeAmount = toBaseUnitAmount(4);
            // first staker delegates (epoch 0)
            await stakers[0].stakeWithPoolAsync(poolId, stakeAmount);
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // earn reward
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            // add more stake
            await stakers[0].stakeWithPoolAsync(poolId, stakeAmount);
            // sanity check final balances
            await validateEndBalances({
                stakerRewardBalance_1: constants.ZERO_AMOUNT,
                stakerWethBalance_1: reward,
            });
        });
        it('Should continue earning rewards after adding more stake and progressing several epochs', async () => {
            const rewardBeforeAddingMoreStake = toBaseUnitAmount(10);
            const rewardsAfterAddingMoreStake = [
                toBaseUnitAmount(20),
                toBaseUnitAmount(16),
                toBaseUnitAmount(24),
                toBaseUnitAmount(5),
                toBaseUnitAmount(0),
                toBaseUnitAmount(17),
            ];
            const totalRewardsAfterAddingMoreStake = BigNumber.sum(...rewardsAfterAddingMoreStake);
            const stakeAmounts = [toBaseUnitAmount(4), toBaseUnitAmount(6)];
            const totalStake = BigNumber.sum(...stakeAmounts);
            // first staker delegates (epoch 0)
            await stakers[0].stakeWithPoolAsync(poolId, stakeAmounts[0]);
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // second staker delegates (epoch 1)
            await stakers[1].stakeWithPoolAsync(poolId, stakeAmounts[1]);
            // only the first staker will get this reward
            await payProtocolFeeAndFinalize(rewardBeforeAddingMoreStake);
            // earn a bunch of rewards
            for (const reward of rewardsAfterAddingMoreStake) {
                await payProtocolFeeAndFinalize(reward);
            }
            // sanity check final balances
            await validateEndBalances({
                stakerRewardBalance_1: rewardBeforeAddingMoreStake.plus(
                    totalRewardsAfterAddingMoreStake
                        .times(stakeAmounts[0])
                        .dividedBy(totalStake)
                        .integerValue(BigNumber.ROUND_DOWN),
                ),
                stakerRewardBalance_2: totalRewardsAfterAddingMoreStake
                    .times(stakeAmounts[1])
                    .dividedBy(totalStake)
                    .integerValue(BigNumber.ROUND_DOWN),
                poolRewardBalance: rewardBeforeAddingMoreStake.plus(totalRewardsAfterAddingMoreStake),
                membersRewardBalance: rewardBeforeAddingMoreStake.plus(totalRewardsAfterAddingMoreStake),
            });
        });
        it('Should stop collecting rewards after undelegating', async () => {
            // first staker delegates (epoch 0)
            const rewardForDelegator = toBaseUnitAmount(10);
            const rewardNotForDelegator = toBaseUnitAmount(7);
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeWithPoolAsync(poolId, stakeAmount);
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // earn reward
            await payProtocolFeeAndFinalize(rewardForDelegator);

            // undelegate stake and finalize epoch
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );

            await payProtocolFeeAndFinalize();

            // this should not go do the delegator
            await payProtocolFeeAndFinalize(rewardNotForDelegator);

            // sanity check final balances
            await validateEndBalances({
                stakerWethBalance_1: rewardForDelegator,
                operatorWethBalance: rewardNotForDelegator,
            });
        });
        it('Should stop collecting rewards after undelegating, after several epochs', async () => {
            // first staker delegates (epoch 0)
            const rewardForDelegator = toBaseUnitAmount(10);
            const rewardsNotForDelegator = [
                toBaseUnitAmount(20),
                toBaseUnitAmount(16),
                toBaseUnitAmount(24),
                toBaseUnitAmount(5),
                toBaseUnitAmount(0),
                toBaseUnitAmount(17),
            ];
            const totalRewardsNotForDelegator = BigNumber.sum(...rewardsNotForDelegator);
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeWithPoolAsync(poolId, stakeAmount);
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // earn reward
            await payProtocolFeeAndFinalize(rewardForDelegator);
            // undelegate stake and finalize epoch
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            await payProtocolFeeAndFinalize();
            // this should not go do the delegator
            for (const reward of rewardsNotForDelegator) {
                await payProtocolFeeAndFinalize(reward);
            }
            // sanity check final balances
            await validateEndBalances({
                stakerWethBalance_1: rewardForDelegator,
                operatorWethBalance: totalRewardsNotForDelegator,
            });
        });
        it('Should collect fees correctly when leaving and returning to a pool', async () => {
            // first staker delegates (epoch 0)
            const rewardsForDelegator = [toBaseUnitAmount(10), toBaseUnitAmount(15)];
            const rewardNotForDelegator = toBaseUnitAmount(7);
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeWithPoolAsync(poolId, stakeAmount);
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // earn reward
            await payProtocolFeeAndFinalize(rewardsForDelegator[0]);
            // undelegate stake and finalize epoch
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            await payProtocolFeeAndFinalize();
            // this should not go do the delegator
            await payProtocolFeeAndFinalize(rewardNotForDelegator);
            // delegate stake and go to next epoch
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            await payProtocolFeeAndFinalize();
            // this reward should go to delegator
            await payProtocolFeeAndFinalize(rewardsForDelegator[1]);
            // sanity check final balances
            await validateEndBalances({
                stakerRewardBalance_1: rewardsForDelegator[1],
                stakerWethBalance_1: rewardsForDelegator[0],
                operatorWethBalance: rewardNotForDelegator,
                poolRewardBalance: rewardsForDelegator[1],
            });
        });
        it('Should collect fees correctly when re-delegating after un-delegating', async () => {
            // Note - there are two ranges over which payouts are computed (see _computeRewardBalanceOfDelegator).
            // This triggers the first range (rewards for `delegatedStake.currentEpoch`), but not the second.
            // first staker delegates (epoch 0)
            const rewardForDelegator = toBaseUnitAmount(10);
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(stakeAmount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // undelegate stake and finalize epoch
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            // this should go to the delegator
            await payProtocolFeeAndFinalize(rewardForDelegator);
            // delegate stake ~ this will result in a payout where rewards are computed on
            // the balance's `currentEpochBalance` field but not the `nextEpochBalance` field.
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            // sanity check final balances
            await validateEndBalances({
                stakerRewardBalance_1: constants.ZERO_AMOUNT,
                stakerWethBalance_1: rewardForDelegator,
                operatorWethBalance: constants.ZERO_AMOUNT,
                poolRewardBalance: constants.ZERO_AMOUNT,
            });
        });
        it('Should withdraw delegator rewards when calling `withdrawDelegatorRewards`', async () => {
            // first staker delegates (epoch 0)
            const rewardForDelegator = toBaseUnitAmount(10);
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(stakeAmount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // this should go to the delegator
            await payProtocolFeeAndFinalize(rewardForDelegator);
            await stakingApiWrapper.stakingContract.withdrawDelegatorRewards.awaitTransactionSuccessAsync(poolId, {
                from: stakers[0].getOwner(),
            });
            // sanity check final balances
            await validateEndBalances({
                stakerRewardBalance_1: constants.ZERO_AMOUNT,
                stakerWethBalance_1: rewardForDelegator,
                operatorWethBalance: constants.ZERO_AMOUNT,
                poolRewardBalance: constants.ZERO_AMOUNT,
            });
        });
        it(`payout should be based on stake at the time of rewards`, async () => {
            const staker = stakers[0];
            const stakeAmount = toBaseUnitAmount(5);
            // stake and delegate
            await stakers[0].stakeWithPoolAsync(poolId, stakeAmount);
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // undelegate some stake
            const undelegateAmount = toBaseUnitAmount(2.5);
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId),
                new StakeInfo(StakeStatus.Active),
                undelegateAmount,
            );
            // finalize
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            // withdraw rewards
            await staker.withdrawDelegatorRewardsAsync(poolId);
            await validateEndBalances({
                stakerRewardBalance_1: toBaseUnitAmount(0),
                stakerWethBalance_1: reward,
            });
        });
        it(`should split payout between two delegators when syncing rewards`, async () => {
            const stakeAmounts = [toBaseUnitAmount(5), toBaseUnitAmount(10)];
            const totalStakeAmount = BigNumber.sum(...stakeAmounts);
            // stake and delegate both
            const stakersAndStake = shortZip(stakers, stakeAmounts);
            for (const [staker, stakeAmount] of stakersAndStake) {
                await staker.stakeWithPoolAsync(poolId, stakeAmount);
            }
            // skip epoch, so stakers can start earning rewards
            await payProtocolFeeAndFinalize();
            // finalize
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            // withdraw rewards
            for (const [staker] of _.reverse(stakersAndStake)) {
                await staker.withdrawDelegatorRewardsAsync(poolId);
            }
            const expectedStakerRewards = stakeAmounts.map(n => reward.times(n).dividedToIntegerBy(totalStakeAmount));
            await validateEndBalances({
                stakerRewardBalance_1: toBaseUnitAmount(0),
                stakerRewardBalance_2: toBaseUnitAmount(0),
                stakerWethBalance_1: expectedStakerRewards[0],
                stakerWethBalance_2: expectedStakerRewards[1],
                poolRewardBalance: new BigNumber(1), // Rounding error
                membersRewardBalance: new BigNumber(1), // Rounding error
            });
        });
        it(`delegator should not be credited payout twice by syncing rewards twice`, async () => {
            const stakeAmounts = [toBaseUnitAmount(5), toBaseUnitAmount(10)];
            const totalStakeAmount = BigNumber.sum(...stakeAmounts);
            // stake and delegate both
            const stakersAndStake = shortZip(stakers, stakeAmounts);
            for (const [staker, stakeAmount] of stakersAndStake) {
                await staker.stakeWithPoolAsync(poolId, stakeAmount);
            }
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // finalize
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            const expectedStakerRewards = stakeAmounts.map(n => reward.times(n).dividedToIntegerBy(totalStakeAmount));
            await validateEndBalances({
                stakerRewardBalance_1: expectedStakerRewards[0],
                stakerRewardBalance_2: expectedStakerRewards[1],
                stakerWethBalance_1: toBaseUnitAmount(0),
                stakerWethBalance_2: toBaseUnitAmount(0),
                poolRewardBalance: reward,
                membersRewardBalance: reward,
            });
            // First staker will withdraw rewards.
            const sneakyStaker = stakers[0];
            const sneakyStakerExpectedWethBalance = expectedStakerRewards[0];
            await sneakyStaker.withdrawDelegatorRewardsAsync(poolId);
            // Should have been credited the correct amount of rewards.
            let sneakyStakerWethBalance = await stakingApiWrapper.wethContract.balanceOf.callAsync(
                sneakyStaker.getOwner(),
            );
            expect(sneakyStakerWethBalance, 'WETH balance after first undelegate').to.bignumber.eq(
                sneakyStakerExpectedWethBalance,
            );
            // Now he'll try to do it again to see if he gets credited twice.
            await sneakyStaker.withdrawDelegatorRewardsAsync(poolId);
            /// The total amount credited should remain the same.
            sneakyStakerWethBalance = await stakingApiWrapper.wethContract.balanceOf.callAsync(sneakyStaker.getOwner());
            expect(sneakyStakerWethBalance, 'WETH balance after second undelegate').to.bignumber.eq(
                sneakyStakerExpectedWethBalance,
            );
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
