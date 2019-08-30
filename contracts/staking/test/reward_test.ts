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
import { StakeStateId } from './utils/types';
import { constants as stakingConstants } from './utils/constants';
import { TestRewardBalancesContract } from '../src';

import { artifacts } from '../src';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets.only('Testing Rewards', () => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    const ZERO = new BigNumber(0);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let stakers: string[];
    let zrxTokenContract: DummyERC20TokenContract;
    let erc20ProxyContract: ERC20ProxyContract;
    // wrappers
    let stakingWrapper: StakingWrapper;
    let testWrapper: TestRewardBalancesContract;
    let erc20Wrapper: ERC20Wrapper;
    // tests
    before(async () => {
        // create accounts
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        stakers = accounts.slice(2, 5);
        // deploy erc20 proxy
        erc20Wrapper = new ERC20Wrapper(provider, accounts, owner);
        erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        // deploy zrx token
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, ZRX_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(provider, owner, erc20ProxyContract, zrxTokenContract, accounts);
        await stakingWrapper.deployAndConfigureContractsAsync(artifacts.TestRewardBalances);
        testWrapper = new TestRewardBalancesContract(constants.NULL_ADDRESS, provider);
    });

    describe.only('Reward Simulation', () => {
        const ZERO = new BigNumber(0);
        it('Reward balance should be zero in same epoch as delegation', async () => {
            const staker = stakers[0];
            const operator = stakers[1];
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, 4);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            { // Epoch 1: Stake some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                const balance = await stakingWrapper.getActiveStakeAsync(staker);
                expect(balance.current).to.be.bignumber.equal(amountToStake);
                expect(balance.next).to.be.bignumber.equal(amountToStake);
            }
            // Later in Epoch 1: User delegates and deactivates some stake
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, amountToDelegate);
            // Check reward balance
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker)).to.be.bignumber.equal(ZERO);
        });

        it('Delegator should not receive rewards for epochs before they delegated', async () => {
            const staker = stakers[0];
            const operator = stakers[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = new BigNumber(0);
            const delegatorReward = new BigNumber(0);
            { // Epoch 1: Stake some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                const balance = await stakingWrapper.getActiveStakeAsync(staker);
                expect(balance.current).to.be.bignumber.equal(amountToStake);
                expect(balance.next).to.be.bignumber.equal(amountToStake);
            }
            { // Pay a fee
                await stakingWrapper.testFinalizefees([{reward, poolId}]);
            }
            // Check reward balance
            expect(await stakingWrapper.rewardVaultBalanceOfAsync(poolId)).to.be.bignumber.equal(reward);
            expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId)).to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker)).to.be.bignumber.equal(delegatorReward);
        });

        it('Reward from first epoch should roll over', async () => {
            const staker = stakers[0];
            const operator = stakers[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = new BigNumber(0);
            const delegatorReward = new BigNumber(0);
            { // Epoch 1: Stake some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                const balance = await stakingWrapper.getActiveStakeAsync(staker);
                expect(balance.current).to.be.bignumber.equal(amountToStake);
                expect(balance.next).to.be.bignumber.equal(amountToStake);
            }
            { // Pay a fee
                await stakingWrapper.testFinalizefees([{reward, poolId}]);
            }
            { // Finish epoch, fees from previous epoch are rolled over
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            // Check reward balance
            expect(await stakingWrapper.rewardVaultBalanceOfAsync(poolId)).to.be.bignumber.equal(reward);
            expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId)).to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker)).to.be.bignumber.equal(delegatorReward);
        });

        it('Unclaimed rewards should carry over until we reach an epoch with delegators', async () => {
            const staker = stakers[0];
            const operator = stakers[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = new BigNumber(0);
            const delegatorReward = new BigNumber(0);
            { // Skip over first epoch (it's handled differently)
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Pay a fee
                await stakingWrapper.testFinalizefees([{reward, poolId}]);
            }
            { // Finish epoch, fees from previous epoch are rolled over
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Finish epoch, fees from previous epoch are rolled over
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Epoch 1: Stake some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                const balance = await stakingWrapper.getActiveStakeAsync(staker);
                expect(balance.current).to.be.bignumber.equal(amountToStake);
                expect(balance.next).to.be.bignumber.equal(amountToStake);
            }
            { // Finish epoch, fees from previous epoch are rolled over
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            // Check reward balance
            expect(await stakingWrapper.rewardVaultBalanceOfAsync(poolId)).to.be.bignumber.equal(reward);
            expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId)).to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker)).to.be.bignumber.equal(delegatorReward);
        });

        it('Rewards from first epoch should roll over until we reach an epoch with delegators', async () => {
            const staker = stakers[0];
            const operator = stakers[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = new BigNumber(0);
            const delegatorReward = new BigNumber(0);
            { // Pay a fee
                await stakingWrapper.testFinalizefees([{reward, poolId}]);
            }
            { // Finish epoch, fees from previous epoch are rolled over
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Finish epoch, fees from previous epoch are rolled over
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Epoch 1: Stake some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                const balance = await stakingWrapper.getActiveStakeAsync(staker);
                expect(balance.current).to.be.bignumber.equal(amountToStake);
                expect(balance.next).to.be.bignumber.equal(amountToStake);
            }
            { // Finish epoch, fees from previous epoch are rolled over
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            // Check reward balance
            expect(await stakingWrapper.rewardVaultBalanceOfAsync(poolId)).to.be.bignumber.equal(reward);
            expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId)).to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker)).to.be.bignumber.equal(delegatorReward);
        });

        it('Single delegator should receive entire pot if no other delegators', async () => {
            const staker = stakers[0];
            const operator = stakers[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = ZERO;
            const delegatorReward = reward;
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountToDelegate);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([{reward: reward, poolId}]);
            }
            // Check reward balance
            expect(await stakingWrapper.rewardVaultBalanceOfAsync(poolId), 'whole pool').to.be.bignumber.equal(reward);
            expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId), 'opertaor').to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker), 'delegator').to.be.bignumber.equal(delegatorReward);
        });

        it('Should split reward between delegators correctly', async () => {
            const operator = stakers[6];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(1000);
            const amountsToDelegate = [StakingWrapper.toBaseUnitAmount(23), StakingWrapper.toBaseUnitAmount(77)];
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = ZERO;
            const delegatorRewards = [reward.times(0.23), reward.times(0.77)];
            { // Epoch 0: Stake & delegate some ZRX
                // first staker delegates
                await stakingWrapper.stakeAsync(stakers[0], amountToStake);
                await stakingWrapper.moveStakeAsync(stakers[0], {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountsToDelegate[0]);
                // second staker delegates
                await stakingWrapper.stakeAsync(stakers[1], amountToStake);
                await stakingWrapper.moveStakeAsync(stakers[1], {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountsToDelegate[1]);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([{reward: reward, poolId}]);
            }
            // Check reward balance
            expect(await stakingWrapper.rewardVaultBalanceOfAsync(poolId), 'whole pool').to.be.bignumber.equal(reward);
            expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId), 'opertaor').to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, stakers[0]), 'delegator 1').to.be.bignumber.equal(delegatorRewards[0]);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, stakers[1]), 'delegator 2').to.be.bignumber.equal(delegatorRewards[1]);
        });

        it('Should split reward between delegators correctly, when the epochs they joined in are offset', async () => {
            const operator = stakers[6];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(1000);
            const amountsToDelegate = [StakingWrapper.toBaseUnitAmount(23), StakingWrapper.toBaseUnitAmount(77)];
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = ZERO;
            const delegatorRewards = [reward.times(0.23), reward.times(0.77)];
            { // Epoch 0: Stake & delegate some ZRX
                // second staker delegates
                await stakingWrapper.stakeAsync(stakers[0], amountToStake);
                await stakingWrapper.moveStakeAsync(stakers[0], {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountsToDelegate[0]);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Epoch 1: Stake & delegate some ZRX
                // second staker delegates
                await stakingWrapper.stakeAsync(stakers[1], amountToStake);
                await stakingWrapper.moveStakeAsync(stakers[1], {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountsToDelegate[1]);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([{reward: reward, poolId}]);
            }
            // Check reward balance
            expect(await stakingWrapper.rewardVaultBalanceOfAsync(poolId), 'whole pool').to.be.bignumber.equal(reward);
            expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId), 'opertaor').to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, stakers[0]), 'delegator 1').to.be.bignumber.equal(delegatorRewards[0]);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, stakers[1]), 'delegator 2').to.be.bignumber.equal(delegatorRewards[1]);
        });

        it('Should attribute rewards to delegators only for the epochs they were present for', async () => {
            const operator = stakers[6];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(1000);
            const amountsToDelegate = [StakingWrapper.toBaseUnitAmount(23), StakingWrapper.toBaseUnitAmount(77)];
            const totalDelegatedByEpoch = [StakingWrapper.toBaseUnitAmount(23), StakingWrapper.toBaseUnitAmount(100)];
            const rewards = [StakingWrapper.toBaseUnitAmount(10), StakingWrapper.toBaseUnitAmount(50)];
            const operatorReward = ZERO;
            const delegatorRewards = [rewards[0].plus(rewards[1].times(0.23)), rewards[1].times(0.77)];
            { // Epoch 0: Stake & delegate some ZRX
                // second staker delegates
                await stakingWrapper.stakeAsync(stakers[0], amountToStake);
                await stakingWrapper.moveStakeAsync(stakers[0], {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountsToDelegate[0]);
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Epoch 1: A reward was earned
                await stakingWrapper.testFinalizefees([{reward: rewards[0], poolId}]);
            }
            { // Epoch 2: No rewards but
                // second staker delegates
                await stakingWrapper.stakeAsync(stakers[1], amountToStake);
                await stakingWrapper.moveStakeAsync(stakers[1], {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountsToDelegate[1]);
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([{reward: rewards[1], poolId}]);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            // Check reward balance
            expect(await stakingWrapper.rewardVaultBalanceOfAsync(poolId), 'whole pool').to.be.bignumber.equal(rewards[0].plus(rewards[1]));
            expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId), 'operator').to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, stakers[0]), 'delegator 1').to.be.bignumber.equal(delegatorRewards[0]);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, stakers[1]), 'delegator 2').to.be.bignumber.equal(delegatorRewards[1]);
        });

        it('Should work across many epochs', async () => {
            const operator = stakers[6];
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
                await stakingWrapper.stakeAsync(stakers[0], amountToStake);
                await stakingWrapper.moveStakeAsync(stakers[0], {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountsToDelegate[0]);
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Epoch 1: A reward was earned
                await stakingWrapper.testFinalizefees([{reward: rewards[0], poolId}]);
            }
            { // Epoch 2: No rewards but
                // second staker delegates
                await stakingWrapper.stakeAsync(stakers[1], amountToStake);
                await stakingWrapper.moveStakeAsync(stakers[1], {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountsToDelegate[1]);
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([{reward: rewards[1], poolId}]);
            }
            { // Skip an epoch so that delegator can start earning rewards
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
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
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, stakers[0]), 'delegator 1').to.be.bignumber.equal(delegatorRewards[0]);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, stakers[1]), 'delegator 2').to.be.bignumber.equal(delegatorRewards[1]);
        });

        it('Should sync correctly when undelegating stake', async () => {
            const staker = stakers[0];
            const operator = stakers[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = ZERO;
            const delegatorReward = reward;
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([{reward: reward, poolId}]); // carry over
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]); // available
            }
            { // Undelegate stake and check balance
                await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.DELEGATED, poolId}, {id: StakeStateId.ACTIVE}, amountToDelegate);
            }
            // Check reward & vault balances
            const delegatorComputedBalance = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker);
            expect(delegatorComputedBalance).to.be.bignumber.equal(ZERO);
            const delegatorEthVaultBalance = await stakingWrapper.getEthVaultContract().balanceOf.callAsync(staker);
            expect(delegatorEthVaultBalance).to.be.bignumber.equal(delegatorReward);
        });

        it('Should sync correctly when adding more stake', async () => {
            const staker = stakers[0];
            const operator = stakers[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = ZERO;
            const delegatorReward = reward;
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([{reward: reward, poolId}]); // carry over
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]); // available
            }
            { // Undelegate stake and check balance
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountToDelegate);
            }
            // Check reward & vault balances
            const delegatorComputedBalance = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker);
            expect(delegatorComputedBalance).to.be.bignumber.equal(ZERO);
            const delegatorEthVaultBalance = await stakingWrapper.getEthVaultContract().balanceOf.callAsync(staker);
            expect(delegatorEthVaultBalance).to.be.bignumber.equal(delegatorReward);
        });

        it('Should have correct value after adding more stake and moving to next epoch', async () => {
            const staker = stakers[0];
            const operator = stakers[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = ZERO;
            const delegatorReward = reward;
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([{reward: reward, poolId}]); // carry over
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]); // available
            }
            { // Undelegate stake and check balance
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]);
            }
            // Check reward & vault balances
            const delegatorComputedBalance = await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, staker);
            expect(delegatorComputedBalance, 'computed').to.be.bignumber.equal(ZERO);
            const delegatorEthVaultBalance = await stakingWrapper.getEthVaultContract().balanceOf.callAsync(staker);
            expect(delegatorEthVaultBalance, 'actual').to.be.bignumber.equal(delegatorReward);
        });

        it('Should continue collecting stake after withdrawing a portion', async () => {
            const staker = stakers[0];
            const operator = stakers[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const rewards = [StakingWrapper.toBaseUnitAmount(10), StakingWrapper.toBaseUnitAmount(7)];
            { // Epoch 0: Stake & delegate some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountToDelegate);
            }
            { // Send some rewards
                await stakingWrapper.testFinalizefees([{reward: rewards[0], poolId}]); // carry over
                await stakingWrapper.testFinalizefees([{reward: ZERO, poolId}]); // available
            }
            { // Undelegate stake and check balance
                await stakingWrapper.stakeAsync(staker, StakingWrapper.toBaseUnitAmount(123));
                await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId}, amountToDelegate);
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

        // Should have correct value after moving stake and before moving to next epoch


        // it.only('Should continue collecting stake after withdrawing a portion', async () => {

        // Should continue collecting stake after withdrawing a portion for several epochs after

        // Should stop collecting stake after undelegating

        // Should continue appropriating fees correctly after one delegator withdraws

        // reference counters

        // test with operator


        /*
        it.only('Delegator reward should remain unchanged across epochs', async () => {
            const staker = stakers[0];
            const operator = stakers[1];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            const reward = StakingWrapper.toBaseUnitAmount(10);
            const operatorReward = new BigNumber(0);
            const delegatorReward = new BigNumber(0);
            { // Epoch 1: Stake some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                const balance = await stakingWrapper.getActiveStakeAsync(staker);
                expect(balance.current).to.be.bignumber.equal(amountToStake);
                expect(balance.next).to.be.bignumber.equal(amountToStake);
            }
            // Assign rewards and wrap-up epoch
            await stakingWrapper.testFinalizefees([{reward, poolId}]);
            // Check reward balance
            expect(await stakingWrapper.rewardVaultBalanceOfAsync(poolId)).to.be.bignumber.equal(reward);
            expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId)).to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId)).to.be.bignumber.equal(delegatorReward);
            // Assign zero rewards and wrap-up epoch
            await stakingWrapper.testFinalizefees([{ZERO, poolId}]);
            // Check reward balance
            expect(await stakingWrapper.rewardVaultBalanceOfAsync(poolId), 'pool balance 2').to.be.bignumber.equal(reward);
            expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId), 'operator balance 2').to.be.bignumber.equal(operatorReward);
           // expect(await stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId)).to.be.bignumber.equal(delegatorReward);
        });
        */
    });
});
// tslint:enable:no-unnecessary-type-assertion
