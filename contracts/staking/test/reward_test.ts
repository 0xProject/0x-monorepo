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
                const txData = testWrapper.testFinalizeFees.getABIEncodedTransactionData([{poolId, reward}]);
                await stakingWrapper.testFinalizefees([{reward, poolId}]);
            }
            // Check reward balance
            expect(await stakingWrapper.getTotalRewardBalanceOfStakingPoolAsync(poolId)).to.be.bignumber.equal(reward);
            expect(await stakingWrapper.getRewardBalanceOfStakingPoolOperatorAsync(poolId)).to.be.bignumber.equal(operatorReward);
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
            expect(await stakingWrapper.getTotalRewardBalanceOfStakingPoolAsync(poolId), 'whole pool').to.be.bignumber.equal(reward);
            expect(await stakingWrapper.getRewardBalanceOfStakingPoolOperatorAsync(poolId), 'opertaor').to.be.bignumber.equal(operatorReward);
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
            expect(await stakingWrapper.getTotalRewardBalanceOfStakingPoolAsync(poolId), 'whole pool').to.be.bignumber.equal(reward);
            expect(await stakingWrapper.getRewardBalanceOfStakingPoolOperatorAsync(poolId), 'opertaor').to.be.bignumber.equal(operatorReward);
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
            expect(await stakingWrapper.getTotalRewardBalanceOfStakingPoolAsync(poolId), 'whole pool').to.be.bignumber.equal(reward);
            expect(await stakingWrapper.getRewardBalanceOfStakingPoolOperatorAsync(poolId), 'opertaor').to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, stakers[0]), 'delegator 1').to.be.bignumber.equal(delegatorRewards[0]);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, stakers[1]), 'delegator 2').to.be.bignumber.equal(delegatorRewards[1]);
        });

        const computeReward = (r: BigNumber, d: BigNumber, t: BigNumber): BigNumber => {
            console.log(`r=${r}, d=${d}, t=${t}, result=${r.times(d).dividedToIntegerBy(t)}`);
            return r.times(d.dividedBy(t));
        }

        it.only('Should attribute rewards to delegators only for the epochs they were present for', async () => {
            const operator = stakers[6];
            const operatorShare = 0;
            const poolId = await stakingWrapper.createStakingPoolAsync(operator, operatorShare);
            const amountToStake = StakingWrapper.toBaseUnitAmount(1000);
            const amountsToDelegate = [StakingWrapper.toBaseUnitAmount(23), StakingWrapper.toBaseUnitAmount(77)];
            const totalDelegatedByEpoch = [StakingWrapper.toBaseUnitAmount(23), StakingWrapper.toBaseUnitAmount(100)];
            const rewards = [StakingWrapper.toBaseUnitAmount(10), StakingWrapper.toBaseUnitAmount(50)];
            const operatorReward = ZERO;
            const delegatorRewards = [
                computeReward(rewards[0], amountsToDelegate[0], totalDelegatedByEpoch[0]).plus(
                    computeReward(rewards[1], amountsToDelegate[0], totalDelegatedByEpoch[1])
                ),
                computeReward(rewards[1], amountsToDelegate[1], totalDelegatedByEpoch[1])
        ];
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

            console.log(`delegator rwards: ${delegatorRewards}`);

            expect(await stakingWrapper.getTotalRewardBalanceOfStakingPoolAsync(poolId), 'whole pool').to.be.bignumber.equal(rewards[0].plus(rewards[1]));
            expect(await stakingWrapper.getRewardBalanceOfStakingPoolOperatorAsync(poolId), 'operator').to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, stakers[0]), 'delegator 1').to.be.bignumber.equal(delegatorRewards[0]);
            expect(await stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, stakers[1]), 'delegator 2').to.be.bignumber.equal(delegatorRewards[1]);
        });


        // Should compute running average correctly

        // should flush when adding / removing stake

        // should carry over balances beteween epochs



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
            expect(await stakingWrapper.getTotalRewardBalanceOfStakingPoolAsync(poolId)).to.be.bignumber.equal(reward);
            expect(await stakingWrapper.getRewardBalanceOfStakingPoolOperatorAsync(poolId)).to.be.bignumber.equal(operatorReward);
            expect(await stakingWrapper.getRewardBalanceOfStakingPoolOperatorAsync(poolId)).to.be.bignumber.equal(delegatorReward);
            // Assign zero rewards and wrap-up epoch
            await stakingWrapper.testFinalizefees([{ZERO, poolId}]);
            // Check reward balance
            expect(await stakingWrapper.getTotalRewardBalanceOfStakingPoolAsync(poolId), 'pool balance 2').to.be.bignumber.equal(reward);
            expect(await stakingWrapper.getRewardBalanceOfStakingPoolOperatorAsync(poolId), 'operator balance 2').to.be.bignumber.equal(operatorReward);
           // expect(await stakingWrapper.getRewardBalanceOfStakingPoolOperatorAsync(poolId)).to.be.bignumber.equal(delegatorReward);
        });
        */
    });
});
// tslint:enable:no-unnecessary-type-assertion
