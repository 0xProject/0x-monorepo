import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import {
    blockchainTests,
    constants,
    describe,
    ERC20BalancesByOwner,
    expect,
    getLatestBlockTimestampAsync,
    hexConcat,
    increaseTimeAndMineBlockAsync,
    OrderFactory,
    OrderStatus,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { DelegatorActor } from './actors/delegator_actor';
import { StakerActor } from './actors/staker_actor';
import { StakingWrapper } from './utils/staking_wrapper';
import { StakeState } from './utils/types';
import { constants as stakingConstants } from './utils/constants';
// import { TestRewardBalancesContract } from '../src';

import { artifacts } from '../src';
import { FinalizerActor, OperatorByPoolId, MembersByPoolId } from './actors/finalizer_actor';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets.only('Testing Rewards', () => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    const ZERO = new BigNumber(0);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let actors: string[];
    let zrxTokenContract: DummyERC20TokenContract;
    let erc20ProxyContract: ERC20ProxyContract;
    // wrappers
    let stakingWrapper: StakingWrapper;
    // let testWrapper: TestRewardBalancesContract;
    let erc20Wrapper: ERC20Wrapper;
    // test parameters
    let stakers: StakerActor[];
    let poolIds: string[];
    let poolOperator: string;
    let finalizer: FinalizerActor;
    // tests
    before(async () => {
        // create accounts
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        actors = accounts.slice(2, 5);
        // deploy erƒsc20 proxy
        erc20Wrapper = new ERC20Wrapper(provider, accounts, owner);
        erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        // deploy zrx token
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, ZRX_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(provider, owner, erc20ProxyContract, zrxTokenContract, accounts);
        await stakingWrapper.deployAndConfigureContractsAsync(/*artifacts.TestRewardBalances*/);
       //  testWrapper = new TestRewardBalancesContract(constants.NULL_ADDRESS, provider);
       // setup stakers
       stakers = [
           new StakerActor(actors[0], stakingWrapper),
           new StakerActor(actors[1], stakingWrapper),
       ];
       // setup pools
       poolOperator = actors[2];
       poolIds = await Promise.all([
           await stakingWrapper.createStakingPoolAsync(poolOperator, 4),
           await stakingWrapper.createStakingPoolAsync(poolOperator, 5),
       ]);
       // associate operators for tracking in Finalizer
       let operatorByPoolId: OperatorByPoolId = {};
       operatorByPoolId[poolIds[0]] = poolOperator;
       operatorByPoolId[poolIds[1]] = poolOperator;
       // associate actors with pools for tracking in Finalizer
       let membersByPoolId: MembersByPoolId = {};
       membersByPoolId[poolIds[0]] = [actors[0], actors[1]];
       membersByPoolId[poolIds[1]] = [actors[0], actors[1]];
       // create Finalizer actor
       finalizer = new FinalizerActor(actors[3], stakingWrapper, poolIds, operatorByPoolId, membersByPoolId);
    });

    describe.only('Reward Simulation', () => {
        const ZERO = new BigNumber(0);
        it('Reward balance should be zero in same epoch as delegation', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(4);
            await stakers[0].stakeAsync(amount);
            await stakers[0].moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, amount);
            await finalizer.finalizeAsync();
        });

        it('Operator should receive entire reward if delegators in their pool', async () => {
            const reward = StakingWrapper.toBaseUnitAmount(10);
            await finalizer.finalizeAsync([{reward, poolId: poolIds[0]}]);
        });
        it('Operator should receive entire reward if delegators in their pool (staker joins this epoch but is active next epoch)', async () => {
            // delegate
            const amount = StakingWrapper.toBaseUnitAmount(4);
            await stakers[0].stakeAsync(amount);
            await stakers[0].moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, amount);
            // finalize
            const reward = StakingWrapper.toBaseUnitAmount(10);
            await finalizer.finalizeAsync([{reward, poolId: poolIds[0]}]);
        });
        it('Should give pool reward to delegator', async () => {
            // delegate
            const amount = StakingWrapper.toBaseUnitAmount(4);
            await stakers[0].stakeAsync(amount);
            await stakers[0].moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, amount);
            // skip epoch, so staker can start earning rewards
            await finalizer.finalizeAsync();
            // finalize
            const reward = StakingWrapper.toBaseUnitAmount(10);
            await finalizer.finalizeAsync([{reward, poolId: poolIds[0]}]);
        });
        it('Should split pool reward between delegators', async () => {
            // first staker delegates
            const stakeAmounts = [
                StakingWrapper.toBaseUnitAmount(4),
                StakingWrapper.toBaseUnitAmount(6),
            ];
            await stakers[0].stakeAsync(stakeAmounts[0]);
            await stakers[0].moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, stakeAmounts[0]);
            // second staker delegates
            await stakers[1].stakeAsync(stakeAmounts[1]);
            await stakers[1].moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, stakeAmounts[1]);
            // skip epoch, so staker can start earning rewards
            await finalizer.finalizeAsync();
            // finalize
            const reward = StakingWrapper.toBaseUnitAmount(10);
            await finalizer.finalizeAsync([{reward, poolId: poolIds[0]}]);
        });
        it('Should split pool reward between delegators, when they join in different epochs', async () => {
            // first staker delegates (epoch 0)
            const stakeAmounts = [
                StakingWrapper.toBaseUnitAmount(4),
                StakingWrapper.toBaseUnitAmount(6),
            ];
            await stakers[0].stakeAsync(stakeAmounts[0]);
            await stakers[0].moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, stakeAmounts[0]);
            // skip epoch, so staker can start earning rewards
            await finalizer.finalizeAsync();
            // second staker delegates (epoch 1)
            await stakers[1].stakeAsync(stakeAmounts[1]);
            await stakers[1].moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, stakeAmounts[1]);
            // skip epoch, so staker can start earning rewards
            await finalizer.finalizeAsync();
            // finalize
            const reward = StakingWrapper.toBaseUnitAmount(10);
            await finalizer.finalizeAsync([{reward, poolId: poolIds[0]}]);
        });
        it('Should give pool reward to delegators only for the epoch during which they delegated', async () => {
            // first staker delegates (epoch 0)
            const stakeAmounts = [
                StakingWrapper.toBaseUnitAmount(4),
                StakingWrapper.toBaseUnitAmount(6),
            ];
            await stakers[0].stakeAsync(stakeAmounts[0]);
            await stakers[0].moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, stakeAmounts[0]);
            // skip epoch, so first staker can start earning rewards
            await finalizer.finalizeAsync();
            // second staker delegates (epoch 1)
            await stakers[1].stakeAsync(stakeAmounts[1]);
            await stakers[1].moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, stakeAmounts[1]);
            // only the first staker will get this reward
            const rewardForOnlyFirstDelegator = StakingWrapper.toBaseUnitAmount(10);
            await finalizer.finalizeAsync([{reward: rewardForOnlyFirstDelegator, poolId: poolIds[0]}]);
            // finalize
            const rewardForBothDelegators = StakingWrapper.toBaseUnitAmount(20);
            await finalizer.finalizeAsync([{reward: rewardForBothDelegators, poolId: poolIds[0]}]);
        });


        it.only('Should split pool reward between delegators, over several consecutive epochs', async () => {
            const rewardForOnlyFirstDelegator = StakingWrapper.toBaseUnitAmount(10);
            const sharedRewards = [
                StakingWrapper.toBaseUnitAmount(20),
                StakingWrapper.toBaseUnitAmount(16),
                StakingWrapper.toBaseUnitAmount(24),
                StakingWrapper.toBaseUnitAmount(5),
                StakingWrapper.toBaseUnitAmount(0),
                StakingWrapper.toBaseUnitAmount(17)
            ];
             // first staker delegates (epoch 0)
             const stakeAmounts = [
                StakingWrapper.toBaseUnitAmount(4),
                StakingWrapper.toBaseUnitAmount(6),
            ];
            await stakers[0].stakeAsync(stakeAmounts[0]);
            await stakers[0].moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, stakeAmounts[0]);
            // skip epoch, so first staker can start earning rewards
            await finalizer.finalizeAsync();
            // second staker delegates (epoch 1)
            await stakers[1].stakeAsync(stakeAmounts[1]);
            await stakers[1].moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, stakeAmounts[1]);
            // only the first staker will get this reward
            await finalizer.finalizeAsync([{reward: rewardForOnlyFirstDelegator, poolId: poolIds[0]}]);
            // earn a bunch of rewards
            for (const reward of sharedRewards) {
                await finalizer.finalizeAsync([{reward, poolId: poolIds[0]}]);
            }
        });


        /*
        it('Should work across many epochs', async () => {
            const operator = actors[6];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(1000);
            const amountsToDelegate = [StakingWrapper.toBaseUnitAmount(23), StakingWrapper.toBaseUnitAmount(77)];
            const totalDelegatedByEpoch = [StakingWrapper.toBaseUnitAmount(23), StakingWrapper.toBaseUnitAmount(100)];
            const rewards = [
                StakingWrapper.toBaseUnitAmount(10),
                StakingWrapper.toBaseUnitAmount(20),
                StakingWrapper.toBaseUnitAmount(16),
                StakingWrapper.toBaseUnitAmount(24),
                StakingWrapper.toBaseUnitAmount(5),
                StakingWrapper.toBaseUnitAmount(0),
                StakingWrapper.toBaseUnitAmount(17)
            ];
            const sharedRewards = StakingWrapper.toBaseUnitAmount(82);
            const operatorReward = ZERO;
            const delegatorRewards = [rewards[0].plus(sharedRewards.times(0.23)), sharedRewards.times(0.77)];
            { // Epoch 0: Stake & delegate some ZRX
                // second staker delegates
                await stakingWrapper.stakeAsync(actors[0], amountToStake);
                await stakingWrapper.moveStakeAsync(actors[0], {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountsToDelegate[0]);
                await stakingWrapper.testFinalizefees([]);
            }
            { // Epoch 1: A reward was earned
                await stakingWrapper.testFinalizefees([{reward: rewards[0], poolId}]);
            }
            { // Epoch 2: No rewards but
                // second staker delegates
                await stakingWrapper.stakeAsync(actors[1], amountToStake);
                await stakingWrapper.moveStakeAsync(actors[1], {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountsToDelegate[1]);
                await stakingWrapper.testFinalizefees([]);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([{reward: rewards[1], poolId}]);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([]);
            }
            { // Earn a bunch of rewards
                await stakingWrapper.testFinalizefees([{reward: rewards[2], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[3], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[4], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[5], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[6], poolId}]);
            }
            // Check reward balance
            //expect(await stakingWrapper.rewardVaultBalanceOfAsync(poolId), 'whole pool').to.be.bignumber.equal(rewards[0].plus(rewards[1]));
            //expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId), 'operator').to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, actors[0]), 'delegator 1').to.be.bignumber.equal(delegatorRewards[0]);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, actors[1]), 'delegator 2').to.be.bignumber.equal(delegatorRewards[1]);
        });
        */




         /*






        it('Should sync correctly when undelegating stake', async () => {
            const staker = actors[0];
            const operator = actors[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = ZERO;
            const delegatorReward = reward;
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([]); // available
                await stakingWrapper.testFinalizefees([{reward: reward, poolId}]); // carry over
                await stakingWrapper.testFinalizefees([]); // available
            }
            { // Undelegate stake and check balance
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.DELEGATED, poolId}, {state: StakeState.ACTIVE}, amountToDelegate);
            }
            // Check reward & vault balances
            const delegatorComputedBalance = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker);
            expect(delegatorComputedBalance).to.be.bignumber.equal(ZERO);
            const delegatorEthVaultBalance = await stakingWrapper.getEthVaultContract().balanceOf.callAsync(staker);
            expect(delegatorEthVaultBalance).to.be.bignumber.equal(delegatorReward);
        });

        it('Should sync correctly when adding more stake', async () => {
            const staker = actors[0];
            const operator = actors[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = ZERO;
            const delegatorReward = reward;
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([]); // available
                await stakingWrapper.testFinalizefees([{reward: reward, poolId}]); // carry over
                await stakingWrapper.testFinalizefees([]); // available
            }
            { // Undelegate stake and check balance
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            // Check reward & vault balances
            const delegatorComputedBalance = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker);
            expect(delegatorComputedBalance).to.be.bignumber.equal(ZERO);
            const delegatorEthVaultBalance = await stakingWrapper.getEthVaultContract().balanceOf.callAsync(staker);
            expect(delegatorEthVaultBalance).to.be.bignumber.equal(delegatorReward);
        });

        it('Should have correct value after adding more stake and moving to next epoch', async () => {
            const staker = actors[0];
            const operator = actors[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = ZERO;
            const delegatorReward = reward;
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([]); // available
                await stakingWrapper.testFinalizefees([{reward: reward, poolId}]); // carry over
                await stakingWrapper.testFinalizefees([]); // available
            }
            { // Undelegate stake and check balance
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([]);
            }
            // Check reward & vault balances
            const delegatorComputedBalance = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker);
            expect(delegatorComputedBalance, 'computed').to.be.bignumber.equal(ZERO);
            const delegatorEthVaultBalance = await stakingWrapper.getEthVaultContract().balanceOf.callAsync(staker);
            expect(delegatorEthVaultBalance, 'actual').to.be.bignumber.equal(delegatorReward);
        });

        it('Should continue collecting stake after withdrawing a portion', async () => {
            const staker = actors[0];
            const operator = actors[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const rewards = [StakingWrapper.toBaseUnitAmount(10), StakingWrapper.toBaseUnitAmount(7)];
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([]); // available
                await stakingWrapper.testFinalizefees([{reward: rewards[0], poolId}]); // carry over
                await stakingWrapper.testFinalizefees([]); // available
            }
            { // Undelegate stake and check balance
                await stakingWrapper.stakeAsync(staker, StakingWrapper.toBaseUnitAmount(123));
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([{reward: rewards[1], poolId}]);
            }
            // Check reward & vault balances
            const delegatorComputedBalance = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker);
            expect(delegatorComputedBalance, 'computed').to.be.bignumber.equal(rewards[1]);
            const delegatorEthVaultBalance = await stakingWrapper.getEthVaultContract().balanceOf.callAsync(staker);
            expect(delegatorEthVaultBalance, 'actual').to.be.bignumber.equal(rewards[0]);
        });

        it('Should have correct value after moving stake and before moving to next epoch', async () => {
            const staker = actors[0];
            const operator = actors[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const rewards = [StakingWrapper.toBaseUnitAmount(10), StakingWrapper.toBaseUnitAmount(7)];
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([]); // available
                await stakingWrapper.testFinalizefees([{reward: rewards[0], poolId}]); // carry over
                await stakingWrapper.testFinalizefees([]); // available
            }
            { // Undelegate stake and check balance
                await stakingWrapper.stakeAsync(staker, StakingWrapper.toBaseUnitAmount(123));
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            // Check reward & vault balances
            const delegatorComputedBalance = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker);
            expect(delegatorComputedBalance, 'computed').to.be.bignumber.equal(ZERO);
            const delegatorEthVaultBalance = await stakingWrapper.getEthVaultContract().balanceOf.callAsync(staker);
            expect(delegatorEthVaultBalance, 'actual').to.be.bignumber.equal(rewards[0]);
        });

        it('Should continue collecting stake after withdrawing a portion for several epochs after', async () => {
            const staker = actors[0];
            const operator = actors[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const rewards = [
                StakingWrapper.toBaseUnitAmount(10),
                StakingWrapper.toBaseUnitAmount(20),
                StakingWrapper.toBaseUnitAmount(16),
                StakingWrapper.toBaseUnitAmount(24),
                StakingWrapper.toBaseUnitAmount(5),
                StakingWrapper.toBaseUnitAmount(0),
                StakingWrapper.toBaseUnitAmount(17)
            ];
            const totalRewards = new BigNumber(_.sumBy(rewards, (n) => {return n.toNumber()}));
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([]); // available
                await stakingWrapper.testFinalizefees([{reward: rewards[0], poolId}]); // carry over
                await stakingWrapper.testFinalizefees([]); // available
            }
            { // Undelegate stake and check balance
                await stakingWrapper.stakeAsync(staker, StakingWrapper.toBaseUnitAmount(123));
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            { // Earn a bunch of rewards
                await stakingWrapper.testFinalizefees([{reward: rewards[1], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[2], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[3], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[4], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[5], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[6], poolId}]);
            }
            // Check reward & vault balances
            const delegatorComputedBalance = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker);
            expect(delegatorComputedBalance, 'computed').to.be.bignumber.equal(totalRewards.minus(rewards[0]));
            const delegatorEthVaultBalance = await stakingWrapper.getEthVaultContract().balanceOf.callAsync(staker);
            expect(delegatorEthVaultBalance, 'actual').to.be.bignumber.equal(rewards[0]);
        });




        it('Should stop collecting rewards after undelegating', async () => {
            const staker = actors[0];
            const operator = actors[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const rewards = [StakingWrapper.toBaseUnitAmount(10), StakingWrapper.toBaseUnitAmount(7)];
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([]); // available
                await stakingWrapper.testFinalizefees([{reward: rewards[0], poolId}]); // carry over
                await stakingWrapper.testFinalizefees([]); // available
            }
            { // Undelegate stake and check balance
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.DELEGATED, poolId},  {state: StakeState.ACTIVE}, amountToDelegate);
                // skip to next epoch so no rewards for this epoch
                await stakingWrapper.testFinalizefees([]); // available
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([{reward: rewards[1], poolId}]); // carry over
            }
            // Check reward & vault balances
            const delegatorComputedBalance = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker);
            expect(delegatorComputedBalance, 'computed').to.be.bignumber.equal(ZERO);
            const delegatorEthVaultBalance = await stakingWrapper.getEthVaultContract().balanceOf.callAsync(staker);
            expect(delegatorEthVaultBalance, 'actual').to.be.bignumber.equal(rewards[0]);
        });

        it('Should stop collecting stake after withdrawing a portion for several epochs after', async () => {
            const staker = actors[0];
            const operator = actors[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const rewards = [
                StakingWrapper.toBaseUnitAmount(10),
                StakingWrapper.toBaseUnitAmount(20),
                StakingWrapper.toBaseUnitAmount(16),
                StakingWrapper.toBaseUnitAmount(24),
                StakingWrapper.toBaseUnitAmount(5),
                StakingWrapper.toBaseUnitAmount(0),
                StakingWrapper.toBaseUnitAmount(17)
            ];
            const totalRewards = new BigNumber(_.sumBy(rewards, (n) => {return n.toNumber()}));
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([]); // available
                await stakingWrapper.testFinalizefees([{reward: rewards[0], poolId}]); // carry over
            }
            { // Undelegate stake and check balance
                await stakingWrapper.moveStakeAsync(staker, {state: StakeState.DELEGATED, poolId},  {state: StakeState.ACTIVE}, amountToDelegate);
                // skip to next epoch so stop cxollecting rewards
                await stakingWrapper.testFinalizefees([]); // available
            }
            { // Earn a bunch of rewards
                await stakingWrapper.testFinalizefees([{reward: rewards[1], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[2], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[3], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[4], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[5], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[6], poolId}]);
            }
            // Check reward & vault balances
            const delegatorComputedBalance = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker);
            expect(delegatorComputedBalance, 'computed').to.be.bignumber.equal(ZERO);
            const delegatorEthVaultBalance = await stakingWrapper.getEthVaultContract().balanceOf.callAsync(staker);
            expect(delegatorEthVaultBalance, 'actual').to.be.bignumber.equal(rewards[0]);
        });

        it('Should collect fees correctly when leaving and returning', async () => {
            const operator = actors[5];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const rewards = [
                StakingWrapper.toBaseUnitAmount(10),
                StakingWrapper.toBaseUnitAmount(21),
                StakingWrapper.toBaseUnitAmount(4),
            ];
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(actors[0], amountToStake);
                await stakingWrapper.moveStakeAsync(actors[0], {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([]); // available
                await stakingWrapper.testFinalizefees([{reward: rewards[0], poolId}]); // carry over
            }
            { // Undelegate stake and check balance
                await stakingWrapper.moveStakeAsync(actors[0], {state: StakeState.DELEGATED, poolId},  {state: StakeState.ACTIVE}, amountToDelegate);
                // new dude comes in for next epoch
                await stakingWrapper.stakeAsync(actors[1], amountToStake);
                await stakingWrapper.moveStakeAsync(actors[1], {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
                // skip to next epoch so stop cxollecting rewards
                await stakingWrapper.testFinalizefees([]); // available
            }
            { // Earn a bunch of rewards
                // First guy retursn
                await stakingWrapper.moveStakeAsync(actors[0], {state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId}, amountToDelegate);
                await stakingWrapper.testFinalizefees([{reward: rewards[1], poolId}]);
                await stakingWrapper.testFinalizefees([{reward: rewards[2], poolId}]); // both delegators split this
            }
            // Check reward & vault balances
            const delegatorComputedBalance = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, actors[0]);
            expect(delegatorComputedBalance, 'computed').to.be.bignumber.equal(rewards[2].div(2));
            const delegatorEthVaultBalance = await stakingWrapper.getEthVaultContract().balanceOf.callAsync(actors[0]);
            expect(delegatorEthVaultBalance, 'actual').to.be.bignumber.equal(rewards[0]);

            const delegatorComputedBalance2 = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, actors[1]);
            expect(delegatorComputedBalance2, 'computed 2').to.be.bignumber.equal(rewards[1].plus(rewards[2].div(2)));
        });
*/


    });

});
// tslint:enable:no-unnecessary-type-assertion