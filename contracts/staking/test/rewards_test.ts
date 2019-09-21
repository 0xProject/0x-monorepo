import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, constants, describe, expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
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
    let poolId: string;
    let poolOperator: string;
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
        stakers = [new StakerActor(actors[0], stakingApiWrapper), new StakerActor(actors[1], stakingApiWrapper)];
        // setup pools
        poolOperator = actors[2];
        poolId = await stakingApiWrapper.utils.createStakingPoolAsync(poolOperator, 0, true); // add operator as maker
        // set exchange address
        await stakingApiWrapper.stakingContract.addExchangeAddress.awaitTransactionSuccessAsync(exchangeAddress);
        // associate operators for tracking in Finalizer
        const operatorByPoolId: OperatorByPoolId = {};
        operatorByPoolId[poolId] = poolOperator;
        operatorByPoolId[poolId] = poolOperator;
        // associate actors with pools for tracking in Finalizer
        const membersByPoolId: MembersByPoolId = {};
        membersByPoolId[poolId] = [actors[0], actors[1]];
        membersByPoolId[poolId] = [actors[0], actors[1]];
        // create Finalizer actor
        finalizer = new FinalizerActor(actors[3], stakingApiWrapper, [poolId], operatorByPoolId, membersByPoolId);
    });
    describe('Reward Simulation', () => {
        interface EndBalances {
            // staker 1
            stakerRewardVaultBalance_1?: BigNumber;
            stakerEthBalance_1?: BigNumber;
            // staker 2
            stakerRewardVaultBalance_2?: BigNumber;
            stakerEthBalance_2?: BigNumber;
            // operator
            operatorEthVaultBalance?: BigNumber;
            // undivided balance in reward pool
            poolRewardVaultBalance?: BigNumber;
            membersRewardVaultBalance?: BigNumber;
        }
        const validateEndBalances = async (_expectedEndBalances: EndBalances): Promise<void> => {
            const expectedEndBalances = {
                // staker 1
                stakerRewardVaultBalance_1:
                    _expectedEndBalances.stakerRewardVaultBalance_1 !== undefined
                        ? _expectedEndBalances.stakerRewardVaultBalance_1
                        : constants.ZERO_AMOUNT,
                stakerEthBalance_1:
                    _expectedEndBalances.stakerEthBalance_1 !== undefined
                        ? _expectedEndBalances.stakerEthBalance_1
                        : await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner()),
                // staker 2
                stakerRewardVaultBalance_2:
                    _expectedEndBalances.stakerRewardVaultBalance_2 !== undefined
                        ? _expectedEndBalances.stakerRewardVaultBalance_2
                        : constants.ZERO_AMOUNT,
                stakerEthBalance_2:
                    _expectedEndBalances.stakerEthBalance_2 !== undefined
                        ? _expectedEndBalances.stakerEthBalance_2
                        : await env.web3Wrapper.getBalanceInWeiAsync(stakers[1].getOwner()),
                // operator
                operatorEthVaultBalance:
                    _expectedEndBalances.operatorEthVaultBalance !== undefined
                        ? _expectedEndBalances.operatorEthVaultBalance
                        : constants.ZERO_AMOUNT,
                // undivided balance in reward pool
                poolRewardVaultBalance:
                    _expectedEndBalances.poolRewardVaultBalance !== undefined
                        ? _expectedEndBalances.poolRewardVaultBalance
                        : constants.ZERO_AMOUNT,
            };
            const finalEndBalancesAsArray = await Promise.all([
                // staker 1
                stakingApiWrapper.stakingContract.computeRewardBalanceOfDelegator.callAsync(
                    poolId,
                    stakers[0].getOwner(),
                ),
                env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner()),
                // staker 2
                stakingApiWrapper.stakingContract.computeRewardBalanceOfDelegator.callAsync(
                    poolId,
                    stakers[1].getOwner(),
                ),
                env.web3Wrapper.getBalanceInWeiAsync(stakers[1].getOwner()),
                // operator
                stakingApiWrapper.ethVaultContract.balanceOf.callAsync(poolOperator),
                // undivided balance in reward pool
                stakingApiWrapper.rewardVaultContract.balanceOf.callAsync(poolId),
            ]);
            expect(finalEndBalancesAsArray[0], 'stakerRewardVaultBalance_1').to.be.bignumber.equal(
                expectedEndBalances.stakerRewardVaultBalance_1,
            );
            expect(finalEndBalancesAsArray[1], 'stakerEthBalance_1').to.be.bignumber.equal(
                expectedEndBalances.stakerEthBalance_1,
            );
            expect(finalEndBalancesAsArray[2], 'stakerRewardVaultBalance_2').to.be.bignumber.equal(
                expectedEndBalances.stakerRewardVaultBalance_2,
            );
            expect(finalEndBalancesAsArray[3], 'stakerEthBalance_2').to.be.bignumber.equal(
                expectedEndBalances.stakerEthBalance_2,
            );
            expect(finalEndBalancesAsArray[4], 'operatorEthVaultBalance').to.be.bignumber.equal(
                expectedEndBalances.operatorEthVaultBalance,
            );
            expect(finalEndBalancesAsArray[5], 'poolRewardVaultBalance').to.be.bignumber.equal(
                expectedEndBalances.poolRewardVaultBalance,
            );
        };
        const payProtocolFeeAndFinalize = async (_fee?: BigNumber) => {
            const fee = _fee !== undefined ? _fee : constants.ZERO_AMOUNT;
            if (!fee.eq(constants.ZERO_AMOUNT)) {
                await stakingApiWrapper.stakingContract.payProtocolFee.awaitTransactionSuccessAsync(
                    poolOperator,
                    takerAddress,
                    fee,
                    { from: exchangeAddress, value: fee },
                );
            }
            await finalizer.finalizeAsync([{ reward: fee, poolId }]);
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
                operatorEthVaultBalance: reward,
            });
        });
        it('Operator should receive entire reward if no delegators in their pool (staker joins this epoch but is active next epoch)', async () => {
            // delegate
            const amount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(amount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                amount,
            );
            // finalize
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            // sanity check final balances
            await validateEndBalances({
                operatorEthVaultBalance: reward,
            });
        });
        it('Should give pool reward to delegator', async () => {
            // delegate
            const amount = toBaseUnitAmount(4);
            await stakers[0].stakeAsync(amount);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                amount,
            );
            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // finalize
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            // sanity check final balances
            await validateEndBalances({
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
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmounts[0],
            );
            // second staker delegates
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
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmounts[0],
            );
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // second staker delegates (epoch 1)
            await stakers[1].stakeAsync(stakeAmounts[1]);
            await stakers[1].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmounts[1],
            );
            // only the first staker will get this reward
            const rewardForOnlyFirstDelegator = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(rewardForOnlyFirstDelegator);
            // finalize
            const rewardForBothDelegators = toBaseUnitAmount(20);
            await payProtocolFeeAndFinalize(rewardForBothDelegators);
            // sanity check final balances
            await validateEndBalances({
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
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmounts[0],
            );
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // second staker delegates (epoch 1)
            await stakers[1].stakeAsync(stakeAmounts[1]);
            await stakers[1].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmounts[1],
            );
            // only the first staker will get this reward
            await payProtocolFeeAndFinalize(rewardForOnlyFirstDelegator);
            // earn a bunch of rewards
            for (const reward of sharedRewards) {
                await payProtocolFeeAndFinalize(reward);
            }
            // sanity check final balances
            await validateEndBalances({
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
        it('Should send existing rewards from reward vault to delegator correctly when undelegating stake', async () => {
            // Get initial staker balance
            const initialStakerEthBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            let gasFeePaid = constants.ZERO_AMOUNT;
            let txReceipt: TransactionReceiptWithDecodedLogs;

            // first staker delegates (epoch 0)
            const stakeAmount = toBaseUnitAmount(4);
            txReceipt = await stakers[0].stakeAsync(stakeAmount);
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // earn reward
            const reward = toBaseUnitAmount(10);
            await payProtocolFeeAndFinalize(reward);
            // undelegate (moves delegator's from the transient reward vault into the eth vault)
            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            // sanity check final balances
            await validateEndBalances({
                stakerRewardVaultBalance_1: constants.ZERO_AMOUNT,
                stakerEthBalance_1: initialStakerEthBalance.plus(reward).minus(gasFeePaid),
            });
        });
        it('Should send existing rewards from reward vault to delegator correctly when delegating more stake', async () => {
            // Get initial staker balance
            const initialStakerEthBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            let gasFeePaid = constants.ZERO_AMOUNT;
            let txReceipt: TransactionReceiptWithDecodedLogs;

            // first staker delegates (epoch 0)
            const stakeAmount = toBaseUnitAmount(4);
            txReceipt = await stakers[0].stakeAsync(stakeAmount);
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // earn reward
            const reward = toBaseUnitAmount(1);
            await payProtocolFeeAndFinalize(reward);
            // add more stake
            txReceipt = await stakers[0].stakeAsync(stakeAmount);
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            // sanity check final balances
            await validateEndBalances({
                stakerRewardVaultBalance_1: constants.ZERO_AMOUNT,
                stakerEthBalance_1: initialStakerEthBalance.plus(reward).minus(gasFeePaid),
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
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmounts[0],
            );
            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // second staker delegates (epoch 1)
            await stakers[0].stakeAsync(stakeAmounts[1]);
            await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmounts[1],
            );
            // only the first staker will get this reward
            await payProtocolFeeAndFinalize(rewardBeforeAddingMoreStake);
            // earn a bunch of rewards
            for (const reward of rewardsAfterAddingMoreStake) {
                await payProtocolFeeAndFinalize(reward);
            }
            // sanity check final balances
            await validateEndBalances({
                stakerRewardVaultBalance_1: rewardBeforeAddingMoreStake.plus(totalRewardsAfterAddingMoreStake),
                poolRewardVaultBalance: rewardBeforeAddingMoreStake.plus(totalRewardsAfterAddingMoreStake),
                membersRewardVaultBalance: rewardBeforeAddingMoreStake.plus(totalRewardsAfterAddingMoreStake),
            });
        });
        it('Should stop collecting rewards after undelegating', async () => {
            // Get initial staker balance
            const initialStakerEthBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            let gasFeePaid = constants.ZERO_AMOUNT;
            let txReceipt: TransactionReceiptWithDecodedLogs;

            // first staker delegates (epoch 0)
            const rewardForDelegator = toBaseUnitAmount(10);
            const rewardNotForDelegator = toBaseUnitAmount(7);
            const stakeAmount = toBaseUnitAmount(4);
            txReceipt = await stakers[0].stakeAsync(stakeAmount);
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // earn reward
            await payProtocolFeeAndFinalize(rewardForDelegator);

            // undelegate stake and finalize epoch
            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            await payProtocolFeeAndFinalize();

            // this should not go do the delegator
            await payProtocolFeeAndFinalize(rewardNotForDelegator);

            // sanity check final balances
            await validateEndBalances({
                stakerEthBalance_1: initialStakerEthBalance.plus(rewardForDelegator).minus(gasFeePaid),
                operatorEthVaultBalance: rewardNotForDelegator,
            });
        });
        it('Should stop collecting rewards after undelegating, after several epochs', async () => {
            // Get initial staker balance
            const initialStakerEthBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            let gasFeePaid = constants.ZERO_AMOUNT;
            let txReceipt: TransactionReceiptWithDecodedLogs;

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
            txReceipt = await stakers[0].stakeAsync(stakeAmount);
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // earn reward
            await payProtocolFeeAndFinalize(rewardForDelegator);
            // undelegate stake and finalize epoch
            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            await payProtocolFeeAndFinalize();
            // this should not go do the delegator
            for (const reward of rewardsNotForDelegator) {
                await payProtocolFeeAndFinalize(reward);
            }
            // sanity check final balances
            await validateEndBalances({
                stakerEthBalance_1: initialStakerEthBalance.plus(rewardForDelegator).minus(gasFeePaid),
                operatorEthVaultBalance: totalRewardsNotForDelegator,
            });
        });
        it('Should collect fees correctly when leaving and returning to a pool', async () => {
            // Get initial staker balance
            const initialStakerEthBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            let gasFeePaid = constants.ZERO_AMOUNT;
            let txReceipt: TransactionReceiptWithDecodedLogs;

            // first staker delegates (epoch 0)
            const rewardsForDelegator = [toBaseUnitAmount(10), toBaseUnitAmount(15)];
            const rewardNotForDelegator = toBaseUnitAmount(7);
            const stakeAmount = toBaseUnitAmount(4);
            txReceipt = await stakers[0].stakeAsync(stakeAmount);
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            // skip epoch, so first staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // earn reward
            await payProtocolFeeAndFinalize(rewardsForDelegator[0]);
            // undelegate stake and finalize epoch
            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            await payProtocolFeeAndFinalize();
            // this should not go do the delegator
            await payProtocolFeeAndFinalize(rewardNotForDelegator);
            // delegate stake and go to next epoch
            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            await payProtocolFeeAndFinalize();
            // this reward should go to delegator
            await payProtocolFeeAndFinalize(rewardsForDelegator[1]);
            // sanity check final balances
            await validateEndBalances({
                stakerRewardVaultBalance_1: rewardsForDelegator[1],
                stakerEthBalance_1: initialStakerEthBalance.plus(rewardsForDelegator[0]).minus(gasFeePaid),
                operatorEthVaultBalance: rewardNotForDelegator,
                poolRewardVaultBalance: rewardsForDelegator[1],
            });
        });
        it('Should collect fees correctly when re-delegating after un-delegating', async () => {
            // Get initial staker balance
            const initialStakerEthBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            let gasFeePaid = constants.ZERO_AMOUNT;
            let txReceipt: TransactionReceiptWithDecodedLogs;

            // Note - there are two ranges over which payouts are computed (see _computeRewardBalanceOfDelegator).
            // This triggers the first range (rewards for `delegatedStake.currentEpoch`), but not the second.
            // first staker delegates (epoch 0)
            const rewardForDelegator = toBaseUnitAmount(10);
            const stakeAmount = toBaseUnitAmount(4);
            txReceipt = await stakers[0].stakeAsync(stakeAmount);
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // undelegate stake and finalize epoch
            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolId),
                new StakeInfo(StakeStatus.Active),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            // this should go to the delegator
            await payProtocolFeeAndFinalize(rewardForDelegator);
            // delegate stake ~ this will result in a payout where rewards are computed on
            // the balance's `currentEpochBalance` field but not the `nextEpochBalance` field.
            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            // sanity check final balances
            await validateEndBalances({
                stakerRewardVaultBalance_1: constants.ZERO_AMOUNT,
                stakerEthBalance_1: initialStakerEthBalance.plus(rewardForDelegator).minus(gasFeePaid),
                operatorEthVaultBalance: constants.ZERO_AMOUNT,
                poolRewardVaultBalance: constants.ZERO_AMOUNT,
            });
        });
        it('Should withdraw delegator rewards to eth vault when calling `syncDelegatorRewards`', async () => {
            // Get initial staker balance
            const initialStakerEthBalance = await env.web3Wrapper.getBalanceInWeiAsync(stakers[0].getOwner());
            let gasFeePaid = constants.ZERO_AMOUNT;
            let txReceipt: TransactionReceiptWithDecodedLogs;

            // first staker delegates (epoch 0)
            const rewardForDelegator = toBaseUnitAmount(10);
            const stakeAmount = toBaseUnitAmount(4);
            txReceipt = await stakers[0].stakeAsync(stakeAmount);
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            txReceipt = await stakers[0].moveStakeAsync(
                new StakeInfo(StakeStatus.Active),
                new StakeInfo(StakeStatus.Delegated, poolId),
                stakeAmount,
            );
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            // skip epoch, so staker can start earning rewards
            await payProtocolFeeAndFinalize();
            // this should go to the delegator
            await payProtocolFeeAndFinalize(rewardForDelegator);
            txReceipt = await stakingApiWrapper.stakingContract.withdrawFromPool.awaitTransactionSuccessAsync(poolId, {
                from: stakers[0].getOwner(),
            });
            gasFeePaid = gasFeePaid.plus(txReceipt.gasUsed * constants.DEFAULT_GAS_PRICE);

            // sanity check final balances
            await validateEndBalances({
                stakerRewardVaultBalance_1: constants.ZERO_AMOUNT,
                stakerEthBalance_1: initialStakerEthBalance.plus(rewardForDelegator).minus(gasFeePaid),
                operatorEthVaultBalance: constants.ZERO_AMOUNT,
                poolRewardVaultBalance: constants.ZERO_AMOUNT,
            });
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
