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

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets.skip('Stake States', () => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let stakers: string[];
    let zrxTokenContract: DummyERC20TokenContract;
    let erc20ProxyContract: ERC20ProxyContract;
    // wrappers
    let stakingWrapper: StakingWrapper;
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
        await stakingWrapper.deployAndConfigureContractsAsync();
    });
    describe('Active Stake', () => {
        it('should return zero as initial stake', async () => {
            const staker = stakers[0];
            const balance = await stakingWrapper.getActiveStakeAsync(staker);
            expect(balance.current).to.be.bignumber.equal(new BigNumber(0));
            expect(balance.next).to.be.bignumber.equal(new BigNumber(0));
        });
        it('should successfully stake zero ZRX', async () => {
            const staker = stakers[0];
            const amount = StakingWrapper.toBaseUnitAmount(0);
            await stakingWrapper.stakeAsync(staker, amount);
            const balance = await stakingWrapper.getActiveStakeAsync(staker);
            expect(balance.current).to.be.bignumber.equal(amount);
            expect(balance.next).to.be.bignumber.equal(amount);
        });
        it('should successfully stake non-zero ZRX', async () => {
            const staker = stakers[0];
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await stakingWrapper.stakeAsync(staker, amount);
            const balance = await stakingWrapper.getActiveStakeAsync(staker);
            expect(balance.current, 'current').to.be.bignumber.equal(amount);
            expect(balance.next, 'next').to.be.bignumber.equal(amount);
        });
        it('should retain active stake balance across epochs', async () => {
            const staker = stakers[0];
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await stakingWrapper.stakeAsync(staker, amount);
            const initEpoch = await stakingWrapper.getCurrentEpochAsync();
            expect(initEpoch).to.be.bignumber.equal(new BigNumber(0));
            await stakingWrapper.goToNextEpochAsync();
            const finalEpoch = await stakingWrapper.getCurrentEpochAsync();
            expect(finalEpoch).to.be.bignumber.equal(new BigNumber(1));
            const balance = await stakingWrapper.getActiveStakeAsync(staker);
            expect(balance.current, 'current').to.be.bignumber.equal(amount);
            expect(balance.next, 'next').to.be.bignumber.equal(amount);
        });
    });
    describe('Inactive Stake', () => {
        it('should return zero as initial inactive', async () => {
            const staker = stakers[0];
            const balance = await stakingWrapper.getInactiveStakeAsync(staker);
            expect(balance.current).to.be.bignumber.equal(new BigNumber(0));
            expect(balance.next).to.be.bignumber.equal(new BigNumber(0));
        });
        it('should successfully deactivate zero stake', async () => {
            const staker = stakers[0];
            const amount = new BigNumber(0);
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, amount);
            const balance = await stakingWrapper.getInactiveStakeAsync(staker);
            expect(balance.current).to.be.bignumber.equal(new BigNumber(0));
            expect(balance.next).to.be.bignumber.equal(new BigNumber(0));
        });
        it('should successfully deactivate non-zero stake', async () => {
            const staker = stakers[0];
            const amountToStake = new BigNumber(10);
            const amountToDeactivate = new BigNumber(6);
            await stakingWrapper.stakeAsync(staker, amountToStake);
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, amountToDeactivate);
            // check active balance
            const activeBalance = await stakingWrapper.getActiveStakeAsync(staker);
            expect(activeBalance.current, 'active current').to.be.bignumber.equal(amountToStake);
            expect(activeBalance.next, 'active next').to.be.bignumber.equal(amountToStake.minus(amountToDeactivate));
            // check inactive balance
            const inactiveBalance = await stakingWrapper.getInactiveStakeAsync(staker);
            expect(inactiveBalance.current, 'inactive current').to.be.bignumber.equal(new BigNumber(0));
            expect(inactiveBalance.next, 'inactive next').to.be.bignumber.equal(amountToDeactivate);
        });
        it('should retain inactivate stake across epochs', async () => {
            const staker = stakers[0];
            const amountToStake = new BigNumber(10);
            const amountToDeactivate = new BigNumber(6);
            await stakingWrapper.stakeAsync(staker, amountToStake);
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, amountToDeactivate);
            // skip to next epoch
            await stakingWrapper.goToNextEpochAsync();
            // check active balance
            const activeBalance = await stakingWrapper.getActiveStakeAsync(staker);
            expect(activeBalance.current, 'active current').to.be.bignumber.equal(amountToStake.minus(amountToDeactivate));
            expect(activeBalance.next, 'active next').to.be.bignumber.equal(amountToStake.minus(amountToDeactivate));
            // check inactive balance
            const inactiveBalance = await stakingWrapper.getInactiveStakeAsync(staker);
            expect(inactiveBalance.current, 'inactive current').to.be.bignumber.equal(amountToDeactivate);
            expect(inactiveBalance.next, 'inactive next').to.be.bignumber.equal(amountToDeactivate);
        });
    });
    describe('Withdrawable Stake', () => {
        it('should return zero as initial withdrawable stake', async () => {
            const staker = stakers[0];
            const balance = await stakingWrapper.getWithdrawableStakeAsync(staker);
            expect(balance).to.be.bignumber.equal(new BigNumber(0));
        });
        it('should reflect stake as withdrawable after one epoch of being inactive', async () => {
            const staker = stakers[0];
            const amountToStake = new BigNumber(10);
            const amountToDeactivate = new BigNumber(6);
            await stakingWrapper.stakeAsync(staker, amountToStake);
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, amountToDeactivate);
            // check withdrawable balance (not yet inactive)
            {
                const balance = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(balance).to.be.bignumber.equal(new BigNumber(0));
            }
            // check balance again after one epoch (now inactive)
            await stakingWrapper.skipToNextEpochAsync();
            {
                const balance = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(balance).to.be.bignumber.equal(new BigNumber(0));
            }
            // check balance again after one epoch (now withdrawable)
            await stakingWrapper.skipToNextEpochAsync();
            {
                const balance = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(balance).to.be.bignumber.equal(amountToDeactivate);
            }
        });
        it('should reflect correct withdrawable stake after withdrawing stake ', async () => {
            const staker = stakers[0];
            const amountToStake = new BigNumber(10);
            const amountToDeactivate = new BigNumber(6);
            const amountToUnstake = new BigNumber(5);
            await stakingWrapper.stakeAsync(staker, amountToStake);
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, amountToDeactivate);
            // skip until we can withdraw this stake
            await stakingWrapper.skipToNextEpochAsync();
            await stakingWrapper.skipToNextEpochAsync();
            // perform withdrawal
            await stakingWrapper.unstakeAsync(staker, amountToUnstake);
            {
                const balance = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(balance).to.be.bignumber.equal(amountToDeactivate.minus(amountToUnstake));
            }
            {
                const balance = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(balance.current).to.be.bignumber.equal(amountToDeactivate.minus(amountToUnstake));
                expect(balance.next).to.be.bignumber.equal(amountToDeactivate.minus(amountToUnstake));
            }
        });
        it('should reflect correct withdrawable stake one epoch after withdrawingstake ', async () => {
            const staker = stakers[0];
            const amountToStake = new BigNumber(10);
            const amountToDeactivate = new BigNumber(6);
            const amountToUnstake = new BigNumber(5);
            await stakingWrapper.stakeAsync(staker, amountToStake);
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, amountToDeactivate);
            // skip until we can withdraw this stake
            await stakingWrapper.skipToNextEpochAsync();
            await stakingWrapper.skipToNextEpochAsync();
            // perform withdrawal
            await stakingWrapper.unstakeAsync(staker, amountToUnstake);
            // check inactive stake afte next epoch
            await stakingWrapper.skipToNextEpochAsync();
            {
                const balance = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(balance).to.be.bignumber.equal(amountToDeactivate.minus(amountToUnstake));
            }
            {
                const balance = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(balance.current).to.be.bignumber.equal(amountToDeactivate.minus(amountToUnstake));
                expect(balance.next).to.be.bignumber.equal(amountToDeactivate.minus(amountToUnstake));
            }
        });
        it('should reflect correct withdrawable stake two epochs after withdrawingstake ', async () => {
            const staker = stakers[0];
            const amountToStake = new BigNumber(10);
            const amountToDeactivate = new BigNumber(6);
            const amountToUnstake = new BigNumber(5);
            await stakingWrapper.stakeAsync(staker, amountToStake);
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, amountToDeactivate);
            // skip until we can withdraw this stake
            await stakingWrapper.skipToNextEpochAsync();
            await stakingWrapper.skipToNextEpochAsync();
            // perform withdrawal
            await stakingWrapper.unstakeAsync(staker, amountToUnstake);
            // check inactive stake afte next epoch
            await stakingWrapper.skipToNextEpochAsync();
            await stakingWrapper.skipToNextEpochAsync();
            {
                const balance = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(balance).to.be.bignumber.equal(amountToDeactivate.minus(amountToUnstake));
            }
            {
                const balance = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(balance.current).to.be.bignumber.equal(amountToDeactivate.minus(amountToUnstake));
                expect(balance.next).to.be.bignumber.equal(amountToDeactivate.minus(amountToUnstake));
            }
        });
    });
    describe('Delegated Stake', () => {
    });
    describe('Total Stake', () => {
        it('should return zero as initial total stake', async () => {
            const staker = stakers[0];
            const balance = await stakingWrapper.getTotalStakeAsync(staker);
            expect(balance).to.be.bignumber.equal(new BigNumber(0));
        });
        it('should return correct value after staking', async () => {
            const staker = stakers[0];
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await stakingWrapper.stakeAsync(staker, amount);
            const balance = await stakingWrapper.getTotalStakeAsync(staker);
            expect(balance).to.be.bignumber.equal(amount);
        });
        it('should return correct value after unstaking', async () => {
            const staker = stakers[0];
            const amountToStake = StakingWrapper.toBaseUnitAmount(10);
            const amountToUnstake = new BigNumber(8);
            await stakingWrapper.stakeAsync(staker, amountToStake);
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, amountToUnstake);
            // skip until we can withdraw this stake
            await stakingWrapper.skipToNextEpochAsync();
            await stakingWrapper.skipToNextEpochAsync();
            // perform withdrawal
            await stakingWrapper.unstakeAsync(staker, amountToUnstake);
            const balance = await stakingWrapper.getTotalStakeAsync(staker);
            expect(balance).to.be.bignumber.equal(amountToStake.minus(amountToUnstake));
        });
    });
    describe('Move Stake', () => {
        it('active -> active', async () => {});
        it('active -> inactive', async () => {});
        it('active -> delegated', async () => {});
        it('inactive -> active', async () => {});
        it('inactive -> inactive', async () => {});
        it('inactive -> delegated', async () => {});
        it('delegated -> active', async () => {});
        it('delegated -> inactive', async () => {});
        it('delegated -> delegated', async () => {});
    });


    describe('Stake Simulation', () => {
        it('Simulation (I)', async () => {
            const staker = stakers[0];
            const operator = stakers[1];
            const poolIds = await Promise.all([
                stakingWrapper.createStakingPoolAsync(operator, 4),
                stakingWrapper.createStakingPoolAsync(operator, 5),
            ]);
            console.log(poolIds);
            const amountToStake = StakingWrapper.toBaseUnitAmount(4);
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(2);
            { // Epoch 1: Stake some ZRX
                await stakingWrapper.stakeAsync(staker, amountToStake);
                const balance = await stakingWrapper.getActiveStakeAsync(staker);
                expect(balance.current).to.be.bignumber.equal(amountToStake);
                expect(balance.next).to.be.bignumber.equal(amountToStake);
            }
            // Later in Epoch 1: User delegates and deactivates some stake
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, StakingWrapper.toBaseUnitAmount(1));
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.DELEGATED, poolId: poolIds[0]}, StakingWrapper.toBaseUnitAmount(2));
            {
                const totalBalance = await stakingWrapper.getTotalStakeAsync(staker);
                expect(totalBalance).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(4));

                const amountActive = await stakingWrapper.getActiveStakeAsync(staker);
                expect(amountActive.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(4));
                expect(amountActive.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const amountInactivate = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(amountInactivate.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(amountInactivate.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const amountWithdrawable = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(amountWithdrawable).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));

                const amountDelegated = await stakingWrapper.getStakeDelegatedByOwnerAsync(staker);
                expect(amountDelegated.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(amountDelegated.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(totalBalanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(totalBalanceDelegatedToPool_1.next).to.be.bignumber.equal(amountToDelegate);
                const balanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(balanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(balanceDelegatedToPool_1.next).to.be.bignumber.equal(amountToDelegate);

                const totalBalanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(totalBalanceDelegatedToPool_2.current, '2c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(totalBalanceDelegatedToPool_2.next, '2n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                const balanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(balanceDelegatedToPool_2.current, '22c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(balanceDelegatedToPool_2.next, '22n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
            }



            // Epoch 2: State updates (no user intervention required)
            await stakingWrapper.skipToNextEpochAsync();
            {
                const totalBalance = await stakingWrapper.getTotalStakeAsync(staker);
                expect(totalBalance).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(4));

                const amountActive = await stakingWrapper.getActiveStakeAsync(staker);
                expect(amountActive.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(amountActive.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const amountInactivate = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(amountInactivate.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(amountInactivate.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const amountWithdrawable = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(amountWithdrawable).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));

                const amountDelegated = await stakingWrapper.getStakeDelegatedByOwnerAsync(staker);
                expect(amountDelegated.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(amountDelegated.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(totalBalanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(totalBalanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                const balanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(balanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(balanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(totalBalanceDelegatedToPool_2.current, '2c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(totalBalanceDelegatedToPool_2.next, '2n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                const balanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(balanceDelegatedToPool_2.current, '22c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(balanceDelegatedToPool_2.next, '22n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
            }

            // Epoch 3: Stake that has been inactive for an epoch can be withdrawn (no user intervention required)
            await stakingWrapper.skipToNextEpochAsync();
            {
                const totalBalance = await stakingWrapper.getTotalStakeAsync(staker);
                expect(totalBalance).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(4));

                const amountActive = await stakingWrapper.getActiveStakeAsync(staker);
                expect(amountActive.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(amountActive.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const amountInactivate = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(amountInactivate.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(amountInactivate.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const amountWithdrawable = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(amountWithdrawable).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const amountDelegated = await stakingWrapper.getStakeDelegatedByOwnerAsync(staker);
                expect(amountDelegated.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(amountDelegated.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(totalBalanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(totalBalanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                const balanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(balanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(balanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(totalBalanceDelegatedToPool_2.current, '2c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(totalBalanceDelegatedToPool_2.next, '2n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                const balanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(balanceDelegatedToPool_2.current, '22c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(balanceDelegatedToPool_2.next, '22n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
            }



            // Later in Epoch 3: User reactivates half of their inactive stake; this becomes Active next epoch
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.INACTIVE}, {id: StakeStateId.ACTIVE}, StakingWrapper.toBaseUnitAmount(0.5));
            {
                const totalBalance = await stakingWrapper.getTotalStakeAsync(staker);
                expect(totalBalance).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(4));

                const amountActive = await stakingWrapper.getActiveStakeAsync(staker);
                expect(amountActive.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(amountActive.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1.5));

                const amountInactivate = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(amountInactivate.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(amountInactivate.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));
                const amountWithdrawable = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(amountWithdrawable).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));

                const amountDelegated = await stakingWrapper.getStakeDelegatedByOwnerAsync(staker);
                expect(amountDelegated.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(amountDelegated.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(totalBalanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(totalBalanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                const balanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(balanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(balanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(totalBalanceDelegatedToPool_2.current, '2c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(totalBalanceDelegatedToPool_2.next, '2n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                const balanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(balanceDelegatedToPool_2.current, '22c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(balanceDelegatedToPool_2.next, '22n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
            }
// WORKS HERE

            // Later in Epoch 3: User re-delegates half of their stake from Pool 1 to Pool 2
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.DELEGATED, poolId: poolIds[0]}, {id: StakeStateId.DELEGATED, poolId: poolIds[1]}, StakingWrapper.toBaseUnitAmount(1));
            {
                const totalBalance = await stakingWrapper.getTotalStakeAsync(staker);
                expect(totalBalance).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(4));

                const amountActive = await stakingWrapper.getActiveStakeAsync(staker);
                expect(amountActive.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(amountActive.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1.5));

                const amountInactivate = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(amountInactivate.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(amountInactivate.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));
                const amountWithdrawable = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(amountWithdrawable).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));

                const amountDelegated = await stakingWrapper.getStakeDelegatedByOwnerAsync(staker);
                expect(amountDelegated.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(amountDelegated.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(totalBalanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(totalBalanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(balanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(balanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const totalBalanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(totalBalanceDelegatedToPool_2.current, '2c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(totalBalanceDelegatedToPool_2.next, '2n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(balanceDelegatedToPool_2.current, '22c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(balanceDelegatedToPool_2.next, '22n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
            }

/** GOT TO HERE */

// FAILS HERE

            // Epoch 4: State updates (no user intervention required)
            await stakingWrapper.skipToNextEpochAsync();
            {
                const totalBalance = await stakingWrapper.getTotalStakeAsync(staker);
                expect(totalBalance).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(4));

                const amountActive = await stakingWrapper.getActiveStakeAsync(staker);
                expect(amountActive.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1.5));
                expect(amountActive.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1.5));

                const amountInactivate = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(amountInactivate.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));
                expect(amountInactivate.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));
                const amountWithdrawable = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(amountWithdrawable).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));

                const amountDelegated = await stakingWrapper.getStakeDelegatedByOwnerAsync(staker);
                expect(amountDelegated.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(amountDelegated.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(totalBalanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(totalBalanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(balanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(balanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const totalBalanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(totalBalanceDelegatedToPool_2.current, '2c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(totalBalanceDelegatedToPool_2.next, '2n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(balanceDelegatedToPool_2.current, '22c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(balanceDelegatedToPool_2.next, '22n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
            }



            // Later in Epoch 4: User deactivates all active stake
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, StakingWrapper.toBaseUnitAmount(1.5));
            {
                const totalBalance = await stakingWrapper.getTotalStakeAsync(staker);
                expect(totalBalance).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(4));

                const amountActive = await stakingWrapper.getActiveStakeAsync(staker);
                expect(amountActive.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1.5));
                expect(amountActive.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));

                const amountInactivate = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(amountInactivate.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));
                expect(amountInactivate.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                const amountWithdrawable = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(amountWithdrawable).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));

                const amountDelegated = await stakingWrapper.getStakeDelegatedByOwnerAsync(staker);
                expect(amountDelegated.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(amountDelegated.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(totalBalanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(totalBalanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(balanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(balanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const totalBalanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(totalBalanceDelegatedToPool_2.current, '2c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(totalBalanceDelegatedToPool_2.next, '2n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(balanceDelegatedToPool_2.current, '22c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(balanceDelegatedToPool_2.next, '22n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
            }

            // Later in Epoch 4: User withdraws all available inactive stake
            await stakingWrapper.unstakeAsync(staker, StakingWrapper.toBaseUnitAmount(0.5));
            {
                const totalBalance = await stakingWrapper.getTotalStakeAsync(staker);
                expect(totalBalance).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(3.5));

                const amountActive = await stakingWrapper.getActiveStakeAsync(staker);
                expect(amountActive.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1.5));
                expect(amountActive.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));

                const amountInactivate = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(amountInactivate.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(amountInactivate.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1.5));
                const amountWithdrawable = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(amountWithdrawable).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));

                const amountDelegated = await stakingWrapper.getStakeDelegatedByOwnerAsync(staker);
                expect(amountDelegated.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(amountDelegated.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(totalBalanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(totalBalanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(balanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(balanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const totalBalanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(totalBalanceDelegatedToPool_2.current, '2c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(totalBalanceDelegatedToPool_2.next, '2n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(balanceDelegatedToPool_2.current, '22c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(balanceDelegatedToPool_2.next, '22n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
            }


                 /// FAILS

            // Epoch 5: State updates (no user intervention required)
            await stakingWrapper.skipToNextEpochAsync();
            {
                const totalBalance = await stakingWrapper.getTotalStakeAsync(staker);
                expect(totalBalance).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(3.5));

                const amountActive = await stakingWrapper.getActiveStakeAsync(staker);
                expect(amountActive.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(amountActive.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));

                const amountInactivate = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(amountInactivate.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1.5));
                expect(amountInactivate.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1.5));
                const amountWithdrawable = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(amountWithdrawable).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));

                const amountDelegated = await stakingWrapper.getStakeDelegatedByOwnerAsync(staker);
                expect(amountDelegated.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(amountDelegated.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(totalBalanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(totalBalanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(balanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(balanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const totalBalanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(totalBalanceDelegatedToPool_2.current, '2c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(totalBalanceDelegatedToPool_2.next, '2n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(balanceDelegatedToPool_2.current, '22c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(balanceDelegatedToPool_2.next, '22n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
            }

            // Later in Epoch 5: User reactivates a portion of their stake
            console.log('asdasd');
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.INACTIVE}, {id: StakeStateId.ACTIVE}, StakingWrapper.toBaseUnitAmount(1));
            console.log('done asdasd');
            {
                const totalBalance = await stakingWrapper.getTotalStakeAsync(staker);
                expect(totalBalance).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(3.5));

                const amountActive = await stakingWrapper.getActiveStakeAsync(staker);
                expect(amountActive.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));
                expect(amountActive.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const amountInactivate = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(amountInactivate.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1.5));
                expect(amountInactivate.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));
                const amountWithdrawable = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(amountWithdrawable).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0));

                const amountDelegated = await stakingWrapper.getStakeDelegatedByOwnerAsync(staker);
                expect(amountDelegated.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(amountDelegated.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(totalBalanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(totalBalanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(balanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(balanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const totalBalanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(totalBalanceDelegatedToPool_2.current, '2c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(totalBalanceDelegatedToPool_2.next, '2n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(balanceDelegatedToPool_2.current, '22c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(balanceDelegatedToPool_2.next, '22n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
            }

            // Epoch 6: State updates (no user intervention required)
            await stakingWrapper.skipToNextEpochAsync();
            {
                const totalBalance = await stakingWrapper.getTotalStakeAsync(staker);
                expect(totalBalance).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(3.5));

                const amountActive = await stakingWrapper.getActiveStakeAsync(staker);
                expect(amountActive.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(amountActive.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const amountInactivate = await stakingWrapper.getInactiveStakeAsync(staker);
                expect(amountInactivate.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));
                expect(amountInactivate.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));
                const amountWithdrawable = await stakingWrapper.getWithdrawableStakeAsync(staker);
                expect(amountWithdrawable).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(0.5));

                const amountDelegated = await stakingWrapper.getStakeDelegatedByOwnerAsync(staker);
                expect(amountDelegated.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));
                expect(amountDelegated.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(2));

                const totalBalanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(totalBalanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(totalBalanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_1 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[0], staker);
                expect(balanceDelegatedToPool_1.current).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(balanceDelegatedToPool_1.next).to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));

                const totalBalanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(totalBalanceDelegatedToPool_2.current, '2c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(totalBalanceDelegatedToPool_2.next, '2n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                const balanceDelegatedToPool_2 = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolIds[1], staker);
                expect(balanceDelegatedToPool_2.current, '22c').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
                expect(balanceDelegatedToPool_2.next, '22n').to.be.bignumber.equal(StakingWrapper.toBaseUnitAmount(1));
            }
        });
    });



        /*

        it('should successfully deactivate non-zero stake', async () => {
            const staker = stakers[0];
            const amountToStake = StakingWrapper.toBaseUnitAmount(10);
            const amountToDeactivate = new BigNumber(6);
            await stakingWrapper.stakeAsync(staker, amountToStake);
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, amountToDeactivate);
            // check active balance
            const activeBalance = await stakingWrapper.getActiveStakeAsync(staker);
            expect(activeBalance.current, 'active current').to.be.bignumber.equal(amountToStake);
            expect(activeBalance.next, 'active next').to.be.bignumber.equal(amountToStake.minus(amountToDeactivate));
            // check inactive balance
            const inactiveBalance = await stakingWrapper.getInactiveStakeAsync(staker);
            expect(inactiveBalance.current, 'inactive current').to.be.bignumber.equal(new BigNumber(0));
            expect(inactiveBalance.next, 'inactive next').to.be.bignumber.equal(amountToDeactivate);
        });
        it('should retain inactivate stake across epochs', async () => {
            const staker = stakers[0];
            const amountToStake = new BigNumber(10);
            const amountToDeactivate = new BigNumber(6);
            await stakingWrapper.stakeAsync(staker, amountToStake);
            await stakingWrapper.moveStakeAsync(staker, {id: StakeStateId.ACTIVE}, {id: StakeStateId.INACTIVE}, amountToDeactivate);
            // skip to next epoch
            await stakingWrapper.goToNextEpochAsync();
            // check active balance
            const activeBalance = await stakingWrapper.getActiveStakeAsync(staker);
            expect(activeBalance.current, 'active current').to.be.bignumber.equal(amountToStake.minus(amountToDeactivate));
            expect(activeBalance.next, 'active next').to.be.bignumber.equal(amountToStake.minus(amountToDeactivate));
            // check inactive balance
            const inactiveBalance = await stakingWrapper.getInactiveStakeAsync(staker);
            expect(inactiveBalance.current, 'inactive current').to.be.bignumber.equal(amountToDeactivate);
            expect(inactiveBalance.next, 'inactive next').to.be.bignumber.equal(amountToDeactivate);
        });
        */


    /*
    describe('Unstake', () => {
        it('should successfully unstake zero ZRX', async () => {
            const staker = stakers[0];
            const amount = StakingWrapper.toBaseUnitAmount(0);
            await stakingWrapper.unstakeAsync(staker, amount);
            const balance = await stakingWrapper.getActiveStakeAsync(staker);
            expect(balance.current).to.be.bignumber.equal(amount);
            expect(balance.next).to.be.bignumber.equal(amount);
        });

        it('should successfully unstake non-zero ZRX', async () => {
            const staker = stakers[0];
            const amountToStake = StakingWrapper.toBaseUnitAmount(10);
            const amountToUnstake = StakingWrapper.toBaseUnitAmount(6);
            await stakingWrapper.stakeAsync(staker, amountToStake);
            await stakingWrapper.unstakeAsync(staker, amountToStake);
            // assert active stake
            const balance = await stakingWrapper.getActiveStakeAsync(staker);
            expect(balance.current, 'current').to.be.bignumber.equal(amount);
            expect(balance.next, 'next').to.be.bignumber.equal(amount);
            // assert
        });
        it('should retain active stake balance across epochs', async () => {
            const staker = stakers[0];
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await stakingWrapper.stakeAsync(staker, amount);
            const initEpoch = await stakingWrapper.getCurrentEpochAsync();
            expect(initEpoch).to.be.bignumber.equal(new BigNumber(0));
            await stakingWrapper.goToNextEpochAsync();
            const finalEpoch = await stakingWrapper.getCurrentEpochAsync();
            expect(finalEpoch).to.be.bignumber.equal(new BigNumber(1));
            const balance = await stakingWrapper.getActiveStakeAsync(staker);
            expect(balance.current, 'current').to.be.bignumber.equal(amount);
            expect(balance.next, 'next').to.be.bignumber.equal(amount);
        });

    });
    */
});
// tslint:enable:no-unnecessary-type-assertion
