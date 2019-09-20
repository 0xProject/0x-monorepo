import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, constants, describe, expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts } from '../src';

import { FinalizerActor } from './actors/finalizer_actor';
import { StakerActor } from './actors/staker_actor';
import { deployAndConfigureContractsAsync, StakingApiWrapper } from './utils/api_wrapper';
import { toBaseUnitAmount } from './utils/number_utils';
import { MembersByPoolId, OperatorByPoolId, StakeInfo, StakeStatus } from './utils/types';

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
    let poolId1: string;
    let poolId2: string;
    let poolOperator1: string;
    let poolOperator2: string;
    let finalizer: FinalizerActor;
    // tests
    before(async () => {
        // create accounts
        accounts = await env.getAccountAddressesAsync();
        owner = accounts[0];
        exchangeAddress = accounts[1];
        takerAddress = accounts[2];
        actors = accounts.slice(6);
        // set up ERC20Wrapper
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        // deploy staking contracts
        stakingApiWrapper = await deployAndConfigureContractsAsync(env, owner, erc20Wrapper, artifacts.TestStaking);
        // set up staking parameters
        await stakingApiWrapper.utils.setParamsAsync({
            minimumPoolStake: new BigNumber(0),
            cobbDouglasAlphaNumerator: new BigNumber(1),
            cobbDouglasAlphaDenominator: new BigNumber(6),
            rewardVaultAddress: stakingApiWrapper.rewardVaultContract.address,
            ethVaultAddress: stakingApiWrapper.ethVaultContract.address,
            zrxVaultAddress: stakingApiWrapper.zrxVaultContract.address,
        });
        // setup stakers
        stakers = [
            new StakerActor(actors[0], stakingApiWrapper),
            new StakerActor(actors[1], stakingApiWrapper),
            new StakerActor(actors[3], stakingApiWrapper),
            new StakerActor(actors[4], stakingApiWrapper),
        ];
        // setup pools
        poolOperator1 = actors[2];
        poolOperator2 = actors[5];
        poolId1 = await stakingApiWrapper.utils.createStakingPoolAsync(poolOperator1, 0, true); // add operator as maker
        poolId2 = await stakingApiWrapper.utils.createStakingPoolAsync(poolOperator2, 0, true); // add operator as maker
        // set exchange address
        await stakingApiWrapper.stakingContract.addExchangeAddress.awaitTransactionSuccessAsync(exchangeAddress);
        // associate operators for tracking in Finalizer
        const operatorByPoolId: OperatorByPoolId = {};
        operatorByPoolId[poolId1] = poolOperator1;
        operatorByPoolId[poolId2] = poolOperator2;
        // associate actors with pools for tracking in Finalizer
        const membersByPoolId: MembersByPoolId = {};
        membersByPoolId[poolId1] = [actors[0], actors[1]];
        membersByPoolId[poolId2] = [actors[3], actors[4]];
        // create Finalizer actor
        finalizer = new FinalizerActor(
            actors[3],
            stakingApiWrapper,
            [poolId1, poolId2],
            operatorByPoolId,
            membersByPoolId,
        );
    });
    describe('Reward Simulation', () => {
        interface EndBalances {
            // staker 1
            stakerRewardVaultBalance_1?: BigNumber;
            stakerEthVaultBalance_1?: BigNumber;
            // staker 2
            stakerRewardVaultBalance_2?: BigNumber;
            stakerEthVaultBalance_2?: BigNumber;
            // operator
            operatorEthVaultBalance?: BigNumber;
            // undivided balance in reward pool
            poolRewardVaultBalance?: BigNumber;
            membersRewardVaultBalance?: BigNumber;
        }
        const validateEndBalances = async (
            _poolId: string,
            _poolOperator: string,
            _expectedEndBalances: EndBalances,
        ): Promise<void> => {
            const expectedEndBalances = {
                // staker 1
                stakerRewardVaultBalance_1:
                    _expectedEndBalances.stakerRewardVaultBalance_1 !== undefined
                        ? _expectedEndBalances.stakerRewardVaultBalance_1
                        : ZERO,
                stakerEthVaultBalance_1:
                    _expectedEndBalances.stakerEthVaultBalance_1 !== undefined
                        ? _expectedEndBalances.stakerEthVaultBalance_1
                        : ZERO,
                // staker 2
                stakerRewardVaultBalance_2:
                    _expectedEndBalances.stakerRewardVaultBalance_2 !== undefined
                        ? _expectedEndBalances.stakerRewardVaultBalance_2
                        : ZERO,
                stakerEthVaultBalance_2:
                    _expectedEndBalances.stakerEthVaultBalance_2 !== undefined
                        ? _expectedEndBalances.stakerEthVaultBalance_2
                        : ZERO,
                // operator
                operatorEthVaultBalance:
                    _expectedEndBalances.operatorEthVaultBalance !== undefined
                        ? _expectedEndBalances.operatorEthVaultBalance
                        : ZERO,
                // undivided balance in reward pool
                poolRewardVaultBalance:
                    _expectedEndBalances.poolRewardVaultBalance !== undefined
                        ? _expectedEndBalances.poolRewardVaultBalance
                        : ZERO,
            };
            /*
            const pool = await stakingApiWrapper.stakingContract.getStakingPool.callAsync(poolId);
            const operatorBalance = pool[2];
            const membersBalance = pool[3];
            const poolBalances = { poolBalance: operatorBalance.plus(membersBalance), operatorBalance, membersBalance };
            */
            const finalEndBalancesAsArray = await Promise.all([
                // staker 1
                stakingApiWrapper.stakingContract.computeRewardBalanceOfDelegator.callAsync(
                    _poolId,
                    stakers[0].getOwner(),
                ),
                stakingApiWrapper.ethVaultContract.balanceOf.callAsync(stakers[0].getOwner()),
                // staker 2
                stakingApiWrapper.stakingContract.computeRewardBalanceOfDelegator.callAsync(
                    _poolId,
                    stakers[1].getOwner(),
                ),
                stakingApiWrapper.ethVaultContract.balanceOf.callAsync(stakers[1].getOwner()),
                // operator
                stakingApiWrapper.ethVaultContract.balanceOf.callAsync(_poolOperator),
                // undivided balance in reward pool
                stakingApiWrapper.rewardVaultContract.balanceOf.callAsync(_poolId),
            ]);
            expect(finalEndBalancesAsArray[0], 'stakerRewardVaultBalance_1').to.be.bignumber.equal(
                expectedEndBalances.stakerRewardVaultBalance_1,
            );
            expect(finalEndBalancesAsArray[1], 'stakerEthVaultBalance_1').to.be.bignumber.equal(
                expectedEndBalances.stakerEthVaultBalance_1,
            );
            expect(finalEndBalancesAsArray[2], 'stakerRewardVaultBalance_2').to.be.bignumber.equal(
                expectedEndBalances.stakerRewardVaultBalance_2,
            );
            expect(finalEndBalancesAsArray[3], 'stakerEthVaultBalance_2').to.be.bignumber.equal(
                expectedEndBalances.stakerEthVaultBalance_2,
            );
            expect(finalEndBalancesAsArray[4], 'operatorEthVaultBalance').to.be.bignumber.equal(
                expectedEndBalances.operatorEthVaultBalance,
            );
            expect(finalEndBalancesAsArray[5], 'poolRewardVaultBalance').to.be.bignumber.equal(
                expectedEndBalances.poolRewardVaultBalance,
            );
        };
        const payProtocolFeeAndFinalize = async (_poolId: string, _poolOperator: string, _fee?: BigNumber) => {
            const fee = _fee !== undefined ? _fee : ZERO;
            if (!fee.eq(ZERO)) {
                await stakingApiWrapper.stakingContract.payProtocolFee.awaitTransactionSuccessAsync(
                    _poolOperator,
                    takerAddress,
                    fee,
                    { from: exchangeAddress, value: fee },
                );
            }
            await finalizer.finalizeAsync([{ reward: fee, poolId: _poolId }]);
        };
        const ZERO = new BigNumber(0);
        it('Reward balance should be zero if not delegated', async () => {
            // sanity balances - all zero
            await validateEndBalances(poolId1, poolOperator1, {});
        });
        it('Reward balance should be zero if not delegated, when epoch is greater than 0', async () => {
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // sanity balances - all zero
            await validateEndBalances(poolId1, poolOperator1, {});
        });
        it('Reward balance should be zero in same epoch as delegation', async () => {
            const amount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(amount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                amount,
            );
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // sanit check final balances - all zero
            await validateEndBalances(poolId1, poolOperator1, {});
        });
        it('Operator should receive entire reward if no delegators in their pool', async () => {
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, reward);
            // sanity check final balances - all zero
            await validateEndBalances(poolId1, poolOperator1, {
                operatorEthVaultBalance: reward,
            });
        });
        it('Operator should receive entire reward if no delegators in their pool (staker joins this epoch but is active next epoch)', async () => {
            // delegate
            const amount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(amount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                amount,
            );
            // finalize
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, reward);
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                operatorEthVaultBalance: reward,
            });
        });
        it('Should give pool reward to delegator', async () => {
            // delegate
            const amount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(amount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                amount,
            );
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // finalize
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, reward);
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: reward,
                poolRewardVaultBalance: reward,
                membersRewardVaultBalance: reward,
            });
        });
        it('Should split pool reward between delegators', async () => {
            // first staker delegates
            const stakeAmounts = [toBaseUnitAmount(4), toBaseUnitAmount(6)];
            const totalStakeAmount = toBaseUnitAmount(10);
            await stakers[0].stakeAsync(stakeAmounts[0]);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmounts[0],
            );
            // second staker delegates
            await stakers[1].stakeAsync(stakeAmounts[1]);
            await stakers[1].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmounts[1],
            );
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // finalize
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, reward);
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: reward.times(stakeAmounts[0]).dividedToIntegerBy(totalStakeAmount),
                stakerRewardVaultBalance_2: reward.times(stakeAmounts[1]).dividedToIntegerBy(totalStakeAmount),
                poolRewardVaultBalance: reward,
                membersRewardVaultBalance: reward,
            });
        });
        it('Should split pool reward between delegators, when they join in different epochs', async () => {
            // first staker delegates (epoch 0)

            const stakeAmounts = [toBaseUnitAmount(4), toBaseUnitAmount(6)];
            const totalStakeAmount = toBaseUnitAmount(10);
            await stakers[0].stakeAsync(stakeAmounts[0]);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmounts[0],
            );

            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);

            // second staker delegates (epoch 1)
            await stakers[1].stakeAsync(stakeAmounts[1]);
            await stakers[1].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmounts[1],
            );

            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // finalize

            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, reward);
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: reward.times(stakeAmounts[0]).dividedToIntegerBy(totalStakeAmount),
                stakerRewardVaultBalance_2: reward.times(stakeAmounts[1]).dividedToIntegerBy(totalStakeAmount),
                poolRewardVaultBalance: reward,
                membersRewardVaultBalance: reward,
            });
        });
        it('Should give pool reward to delegators only for the epoch during which they delegated', async () => {
            // first staker delegates (epoch 0)
            const stakeAmounts = [toBaseUnitAmount(4), toBaseUnitAmount(6)];
            const totalStakeAmount = toBaseUnitAmount(10);
            await stakers[0].stakeAsync(stakeAmounts[0]);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmounts[0],
            );
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // second staker delegates (epoch 1)
            await stakers[1].stakeAsync(stakeAmounts[1]);
            await stakers[1].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmounts[1],
            );
            // only the first staker will get this reward
            const rewardForOnlyFirstDelegator = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardForOnlyFirstDelegator);
            // finalize
            const rewardForBothDelegators = toBaseUnitAmount(20);
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardForBothDelegators);
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: rewardForOnlyFirstDelegator.plus(
                    rewardForBothDelegators.times(stakeAmounts[0]).dividedToIntegerBy(totalStakeAmount),
                ),
                stakerRewardVaultBalance_2: rewardForBothDelegators
                    .times(stakeAmounts[1])
                    .dividedToIntegerBy(totalStakeAmount),
                poolRewardVaultBalance: rewardForOnlyFirstDelegator.plus(rewardForBothDelegators),
                membersRewardVaultBalance: rewardForOnlyFirstDelegator.plus(rewardForBothDelegators),
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
            // first staker delegates (epoch 0)
            const stakeAmounts = [toBaseUnitAmount(4), toBaseUnitAmount(6)];
            const totalStakeAmount = toBaseUnitAmount(10);
            await stakers[0].stakeAsync(stakeAmounts[0]);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmounts[0],
            );
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // second staker delegates (epoch 1)
            await stakers[1].stakeAsync(stakeAmounts[1]);
            await stakers[1].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmounts[1],
            );
            // only the first staker will get this reward
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardForOnlyFirstDelegator);
            // earn a bunch of rewards
            for (const reward of sharedRewards) {
                await payProtocolFeeAndFinalize(poolId1, poolOperator1, reward);
            }
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: rewardForOnlyFirstDelegator.plus(
                    totalSharedRewards.times(stakeAmounts[0]).dividedToIntegerBy(totalStakeAmount),
                ),
                stakerRewardVaultBalance_2: totalSharedRewards
                    .times(stakeAmounts[1])
                    .dividedToIntegerBy(totalStakeAmount),
                poolRewardVaultBalance: rewardForOnlyFirstDelegator.plus(totalSharedRewards),
                membersRewardVaultBalance: rewardForOnlyFirstDelegator.plus(totalSharedRewards),
            });
        });
        it('Should send existing rewards from reward vault to eth vault correctly when undelegating stake', async () => {
            // first staker delegates (epoch 0)
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(stakeAmount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount,
            );
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // earn reward
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, reward);
            // undelegate (moves delegator's from the transient reward vault into the eth vault)
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId1),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: ZERO,
                stakerEthVaultBalance_1: reward,
            });
        });
        it('Should send existing rewards from reward vault to eth vault correctly when delegating more stake', async () => {
            // first staker delegates (epoch 0)
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(stakeAmount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount,
            );
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // earn reward
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, reward);
            // add more stake
            await stakers[0].stakeAsync(stakeAmount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount,
            );
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: ZERO,
                stakerEthVaultBalance_1: reward,
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
            const totalRewardsAfterAddingMoreStake = new BigNumber(
                _.sumBy(rewardsAfterAddingMoreStake, v => {
                    return v.toNumber();
                }),
            );
            // first staker delegates (epoch 0)
            const stakeAmounts = [toBaseUnitAmount(4), toBaseUnitAmount(6)];
            await stakers[0].stakeAsync(stakeAmounts[0]);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmounts[0],
            );
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // second staker delegates (epoch 1)
            await stakers[0].stakeAsync(stakeAmounts[1]);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmounts[1],
            );
            // only the first staker will get this reward
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardBeforeAddingMoreStake);
            // earn a bunch of rewards
            for (const reward of rewardsAfterAddingMoreStake) {
                await payProtocolFeeAndFinalize(poolId1, poolOperator1, reward);
            }
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: rewardBeforeAddingMoreStake.plus(totalRewardsAfterAddingMoreStake),
                poolRewardVaultBalance: rewardBeforeAddingMoreStake.plus(totalRewardsAfterAddingMoreStake),
                membersRewardVaultBalance: rewardBeforeAddingMoreStake.plus(totalRewardsAfterAddingMoreStake),
            });
        });
        it('Should stop collecting rewards after undelegating', async () => {
            // first staker delegates (epoch 0)
            const rewardForDelegator = toBaseUnitAmount(10);
            const rewardNotForDelegator = toBaseUnitAmount(7);
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(stakeAmount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount,
            );
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // earn reward
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardForDelegator);

            // undelegate stake and finalize epoch
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId1),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );

            await payProtocolFeeAndFinalize(poolId1, poolOperator1);

            // this should not go do the delegator
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardNotForDelegator);

            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerEthVaultBalance_1: rewardForDelegator,
                operatorEthVaultBalance: rewardNotForDelegator,
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
            const totalRewardsNotForDelegator = new BigNumber(
                _.sumBy(rewardsNotForDelegator, v => {
                    return v.toNumber();
                }),
            );
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(stakeAmount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount,
            );
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // earn reward
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardForDelegator);
            // undelegate stake and finalize epoch
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId1),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // this should not go do the delegator
            for (const reward of rewardsNotForDelegator) {
                await payProtocolFeeAndFinalize(poolId1, poolOperator1, reward);
            }
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerEthVaultBalance_1: rewardForDelegator,
                operatorEthVaultBalance: totalRewardsNotForDelegator,
            });
        });
        it('Should collect fees correctly when leaving and returning to a pool', async () => {
            // first staker delegates (epoch 0)
            const rewardsForDelegator = [toBaseUnitAmount(10), toBaseUnitAmount(15)];
            const rewardNotForDelegator = toBaseUnitAmount(7);
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(stakeAmount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount,
            );
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // earn reward
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardsForDelegator[0]);
            // undelegate stake and finalize epoch
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId1),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // this should not go do the delegator
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardNotForDelegator);
            // delegate stake and go to next epoch
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount,
            );
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // this reward should go to delegator
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardsForDelegator[1]);
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: rewardsForDelegator[1],
                stakerEthVaultBalance_1: rewardsForDelegator[0],
                operatorEthVaultBalance: rewardNotForDelegator,
                poolRewardVaultBalance: rewardsForDelegator[1],
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
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount,
            );
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // undelegate stake and finalize epoch
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId1),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            // this should go to the delegator
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardForDelegator);
            // delegate stake ~ this will result in a payout where rewards are computed on
            // the balance's `currentEpochBalance` field but not the `nextEpochBalance` field.
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount,
            );
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: ZERO,
                stakerEthVaultBalance_1: rewardForDelegator,
                operatorEthVaultBalance: ZERO,
                poolRewardVaultBalance: ZERO,
            });
        });
        it('Should withdraw delegator rewards to eth vault when calling `syncDelegatorRewards`', async () => {
            // first staker delegates (epoch 0)
            const rewardForDelegator = toBaseUnitAmount(10);
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(stakeAmount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount,
            );
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // this should go to the delegator
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardForDelegator);
            await stakingApiWrapper.stakingContract.syncDelegatorRewards.awaitTransactionSuccessAsync(poolId1, {
                from: stakers[0].getOwner(),
            });
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: ZERO,
                stakerEthVaultBalance_1: rewardForDelegator,
                operatorEthVaultBalance: ZERO,
                poolRewardVaultBalance: ZERO,
            });
        });

        it('Should withdraw all delegator rewards to eth vault when calling `withdrawFromPools` with one pool', async () => {
            // first staker delegates (epoch 0)
            const rewardForDelegator = toBaseUnitAmount(10);
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(stakeAmount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount,
            );
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            // this should go to the delegator
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardForDelegator);
            // ensure that the staker's final balance was increased by the protocol fees collected.
            const initialStakerBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            const receipt = await stakingApiWrapper.stakingContract.withdrawFromPools.awaitTransactionSuccessAsync(
                [poolId1],
                {
                    from: stakers[0].getOwner(),
                    gasPrice: constants.DEFAULT_GAS_PRICE,
                },
            );
            const finalStakerBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            expect(
                finalStakerBalance,
                'staker balance should have increased by the `rewardForDelegator`',
            ).to.bignumber.equal(
                initialStakerBalance.plus(rewardForDelegator).minus(constants.DEFAULT_GAS_PRICE * receipt.gasUsed),
            );
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: ZERO,
                stakerEthVaultBalance_1: ZERO,
                operatorEthVaultBalance: ZERO,
                poolRewardVaultBalance: ZERO,
            });
        });

        it('Should withdraw partial delegator rewards to eth vault when calling `withdrawFromPools` with only one of two delegated pools', async () => {
            // first staker delegates (epoch 0)
            const rewardForDelegator = toBaseUnitAmount(10);
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(stakeAmount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount.div(2),
            );
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId2),
                stakeAmount.div(2),
            );
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            await payProtocolFeeAndFinalize(poolId2, poolOperator2);
            // this should go to the delegator
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardForDelegator);
            await payProtocolFeeAndFinalize(poolId2, poolOperator2, rewardForDelegator);
            // ensure that the staker's final balance was increased by the protocol fees collected.
            const initialStakerBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            const receipt = await stakingApiWrapper.stakingContract.withdrawFromPools.awaitTransactionSuccessAsync(
                [poolId1],
                {
                    from: stakers[0].getOwner(),
                    gasPrice: constants.DEFAULT_GAS_PRICE,
                },
            );
            const finalStakerBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            expect(
                finalStakerBalance,
                'staker balance should have increased by the `rewardForDelegator`',
            ).to.bignumber.equal(
                initialStakerBalance.plus(rewardForDelegator).minus(constants.DEFAULT_GAS_PRICE * receipt.gasUsed),
            );
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: ZERO,
                stakerEthVaultBalance_1: ZERO,
                operatorEthVaultBalance: ZERO,
                poolRewardVaultBalance: ZERO,
            });
            await validateEndBalances(poolId2, poolOperator2, {
                stakerRewardVaultBalance_1: rewardForDelegator,
                stakerEthVaultBalance_1: ZERO,
                operatorEthVaultBalance: ZERO,
                poolRewardVaultBalance: rewardForDelegator,
            });
        });

        it('Should withdraw all delegator rewards to eth vault when calling `withdrawFromPools` with two pools', async () => {
            // first staker delegates (epoch 0)
            const rewardForDelegator = toBaseUnitAmount(10);
            const stakeAmount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(stakeAmount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId1),
                stakeAmount.div(2),
            );
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId2),
                stakeAmount.div(2),
            );
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize(poolId1, poolOperator1);
            await payProtocolFeeAndFinalize(poolId2, poolOperator2);
            // this should go to the delegator
            await payProtocolFeeAndFinalize(poolId1, poolOperator1, rewardForDelegator);
            await payProtocolFeeAndFinalize(poolId2, poolOperator2, rewardForDelegator);
            // ensure that the staker's final balance was increased by the protocol fees collected.
            const initialStakerBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            const receipt = await stakingApiWrapper.stakingContract.withdrawFromPools.awaitTransactionSuccessAsync(
                [poolId1, poolId2],
                {
                    from: stakers[0].getOwner(),
                    gasPrice: constants.DEFAULT_GAS_PRICE,
                },
            );
            const finalStakerBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            expect(
                finalStakerBalance,
                'staker balance should have increased by the `rewardForDelegator`',
            ).to.bignumber.equal(
                initialStakerBalance
                    .plus(rewardForDelegator)
                    .plus(rewardForDelegator)
                    .minus(constants.DEFAULT_GAS_PRICE * receipt.gasUsed),
            );
            // sanity check final balances
            await validateEndBalances(poolId1, poolOperator1, {
                stakerRewardVaultBalance_1: ZERO,
                stakerEthVaultBalance_1: ZERO,
                operatorEthVaultBalance: ZERO,
                poolRewardVaultBalance: ZERO,
            });
            await validateEndBalances(poolId2, poolOperator2, {
                stakerRewardVaultBalance_1: ZERO,
                stakerEthVaultBalance_1: ZERO,
                operatorEthVaultBalance: ZERO,
                poolRewardVaultBalance: ZERO,
            });
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
