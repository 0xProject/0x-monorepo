import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { constants as stakingConstants } from './utils/constants';

import { StakingWrapper } from './utils/staking_wrapper';

import { ERC20Wrapper, ERC20ProxyContract } from '@0x/contracts-asset-proxy';
import { StakingContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('Staking Core', () => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    // tokens & addresses
    let owner: string;
    let exchange: string;
    let stakers: string[];
    let makers: string[];
    let delegators: string[];
    let zrxTokenContract: DummyERC20TokenContract;
    let erc20ProxyContract: ERC20ProxyContract;
    // wrappers
    let stakingWrapper: StakingWrapper;
    let erc20Wrapper: ERC20Wrapper;
    // tests
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        // create accounts
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        exchange = accounts[1];
        stakers = accounts.slice(2, 5);
        makers = accounts.slice(4, 10);
        // deploy erc20 proxy
        erc20Wrapper = new ERC20Wrapper(provider, stakers, owner);
        erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        // deploy zrx token
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, ZRX_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(provider, owner, erc20ProxyContract, zrxTokenContract);
        await stakingWrapper.deployAndConfigureContracts();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('end-to-end tests', () => {
        it('epochs & timelock periods', async () => {
            ///// 0/3 Validate Assumptions /////
            expect(await stakingWrapper.getEpochPeriodInSecondsAsync()).to.be.bignumber.equal(stakingConstants.EPOCH_PERIOD_IN_SECONDS);
            expect(await stakingWrapper.getTimelockPeriodInEpochsAsync()).to.be.bignumber.equal(stakingConstants.TIMELOCK_PERIOD_IN_EPOCHS);
            
            ///// 1/3 Validate Initial Epoch & Timelock Period /////
            {
                // epoch
                const currentEpoch = await stakingWrapper.getCurrentEpochAsync();
                expect(currentEpoch).to.be.bignumber.equal(stakingConstants.INITIAL_EPOCH);
                // timelock period
                const currentTimelockPeriod = await stakingWrapper.getCurrentTimelockPeriodAsync();
                expect(currentTimelockPeriod).to.be.bignumber.equal(stakingConstants.INITIAL_TIMELOCK_PERIOD);
            }
            ///// 2/3 Increment Epoch (Timelock Should Not Increment) /////
            await stakingWrapper.skipToNextEpochAsync();
            {
                // epoch
                const currentEpoch = await stakingWrapper.getCurrentEpochAsync();
                expect(currentEpoch).to.be.bignumber.equal(stakingConstants.INITIAL_EPOCH.plus(1));
                // timelock period
                const currentTimelockPeriod = await stakingWrapper.getCurrentTimelockPeriodAsync();
                expect(currentTimelockPeriod).to.be.bignumber.equal(stakingConstants.INITIAL_TIMELOCK_PERIOD);
            }
            ///// 3/3 Increment Epoch (Timelock Should Increment) /////
            await stakingWrapper.skipToNextTimelockPeriodAsync();
            {
                // timelock period
                const currentTimelockPeriod = await stakingWrapper.getCurrentTimelockPeriodAsync();
                expect(currentTimelockPeriod).to.be.bignumber.equal(stakingConstants.INITIAL_TIMELOCK_PERIOD.plus(1));
            }
        });
        it('staking/unstaking', async () => {
            ///// 1 SETUP TEST PARAMETERS /////
            const amountToStake = stakingWrapper.toBaseUnitAmount(10);
            const amountToDeactivate = stakingWrapper.toBaseUnitAmount(4);
            const amountToReactivate = stakingWrapper.toBaseUnitAmount(1);
            const amountToWithdraw = stakingWrapper.toBaseUnitAmount(1.5);
            const owner = stakers[0];
            // check zrx token balances before minting stake
            const zrxTokenBalanceOfVaultBeforeStaking = await stakingWrapper.getZrxTokenBalanceOfZrxVault();
            expect(zrxTokenBalanceOfVaultBeforeStaking).to.be.bignumber.equal(new BigNumber(0));
            const zrxTokenBalanceOfStakerBeforeStaking = await stakingWrapper.getZrxTokenBalance(owner);
            expect(zrxTokenBalanceOfStakerBeforeStaking).to.be.bignumber.gte(amountToStake);
            ///// 2 STAKE ZRX /////
            // mint stake
            await stakingWrapper.depositAndStakeAsync(owner, amountToStake);
            {
                // check stake balance after minting
                const stakeBalance = await stakingWrapper.getTotalStakeAsync(owner);
                expect(stakeBalance).to.be.bignumber.equal(amountToStake);
                // check zrx vault balance
                const vaultBalance = await stakingWrapper.getZrxVaultBalance(owner);
                expect(vaultBalance).to.be.bignumber.equal(amountToStake);
                // check zrx token balances
                const zrxTokenBalanceOfVaultAfterStaking = await stakingWrapper.getZrxTokenBalanceOfZrxVault();
                expect(zrxTokenBalanceOfVaultAfterStaking).to.be.bignumber.equal(amountToStake);
                const zrxTokenBalanceOfStakerAfterStaking = await stakingWrapper.getZrxTokenBalance(owner);
                expect(zrxTokenBalanceOfStakerAfterStaking).to.be.bignumber.equal(zrxTokenBalanceOfStakerBeforeStaking.minus(amountToStake));
            }
            ///// 3 DEACTIVATE AND TIMELOCK STAKE /////
            // unstake
            await stakingWrapper.deactivateAndTimelockStakeAsync(owner, amountToDeactivate);
           {
                // check total stake balance didn't change
                const totalStake = await stakingWrapper.getTotalStakeAsync(owner);
                expect(totalStake).to.be.bignumber.equal(amountToStake); 
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToStake.minus(amountToDeactivate)); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(amountToDeactivate); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(amountToDeactivate);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(0);
            }
            ///// 4 SKIP TO NEXT TIMELOCK PERIOD - NOTHING SHOULD HAVE CHANGED /////
            await stakingWrapper.skipToNextTimelockPeriodAsync();
            {
                // check total stake balance didn't change
                const totalStake = await stakingWrapper.getTotalStakeAsync(owner);
                expect(totalStake).to.be.bignumber.equal(amountToStake); 
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToStake.minus(amountToDeactivate)); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(amountToDeactivate); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(amountToDeactivate);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(0);
            }
            ///// 5 SKIP TO NEXT TIMELOCK PEIOD - SHOULD BE ABLE TO REACTIVATE/WITHDRAW TIMELOCKED STAKE /////
            await stakingWrapper.skipToNextTimelockPeriodAsync();
            {
                // check total stake balance didn't change
                const totalStake = await stakingWrapper.getTotalStakeAsync(owner);
                expect(totalStake).to.be.bignumber.equal(amountToStake); 
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToStake.minus(amountToDeactivate)); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(amountToDeactivate); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(amountToDeactivate);
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(amountToDeactivate);
            }
            ///// 6 FORCE A SYNC - BALANCES SHOULD NOT CHANGE
            await stakingWrapper.forceTimelockSyncAsync(owner);
            {
                // check total stake balance didn't change
                const totalStake = await stakingWrapper.getTotalStakeAsync(owner);
                expect(totalStake).to.be.bignumber.equal(amountToStake); 
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToStake.minus(amountToDeactivate)); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(amountToDeactivate); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(amountToDeactivate);
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(amountToDeactivate);
            }
            ///// 7 REACTIVATE SOME STAKE /////
            await stakingWrapper.activateStakeAsync(owner, amountToReactivate);
            {
                // check total stake balance didn't change
                const totalStake = await stakingWrapper.getTotalStakeAsync(owner);
                expect(totalStake).to.be.bignumber.equal(amountToStake); 
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToStake.minus(amountToDeactivate).plus(amountToReactivate)); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(amountToDeactivate.minus(amountToReactivate)); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(amountToDeactivate.minus(amountToReactivate));
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(amountToDeactivate.minus(amountToReactivate));
            }
            ///// 8 WITHDRAW SOME STAKE /////
            await stakingWrapper.withdrawAsync(owner, amountToWithdraw);
            {
                // check total stake balance didn't change
                const totalStake = await stakingWrapper.getTotalStakeAsync(owner);
                expect(totalStake).to.be.bignumber.equal(amountToStake.minus(amountToWithdraw)); 
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToStake.minus(amountToDeactivate).plus(amountToReactivate)); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(amountToDeactivate.minus(amountToReactivate).minus(amountToWithdraw)); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(amountToDeactivate.minus(amountToReactivate).minus(amountToWithdraw));
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(amountToDeactivate.minus(amountToReactivate).minus(amountToWithdraw));
                // check zrx vault balance
                const vaultBalance = await stakingWrapper.getZrxVaultBalance(owner);
                expect(vaultBalance).to.be.bignumber.equal(amountToStake.minus(amountToWithdraw));
                // check zrx token balances
                const zrxTokenBalanceOfVaultAfterStaking = await stakingWrapper.getZrxTokenBalanceOfZrxVault();
                expect(zrxTokenBalanceOfVaultAfterStaking).to.be.bignumber.equal(amountToStake.minus(amountToWithdraw));
                const zrxTokenBalanceOfStakerAfterStaking = await stakingWrapper.getZrxTokenBalance(owner);
                expect(zrxTokenBalanceOfStakerAfterStaking).to.be.bignumber.equal(zrxTokenBalanceOfStakerBeforeStaking.minus(amountToStake).plus(amountToWithdraw));
            }
        });

        it('delegating/undelegating', async () => {
            ///// 1 SETUP TEST PARAMETERS /////
            const amountToDelegate = stakingWrapper.toBaseUnitAmount(10);
            const amountToDeactivate = stakingWrapper.toBaseUnitAmount(4);
            const amountToReactivate = stakingWrapper.toBaseUnitAmount(1);
            const amountToWithdraw = stakingWrapper.toBaseUnitAmount(1.5);
            const owner = stakers[0];
            const poolOperator = stakers[1];
            const operatorShare = 39;
            const poolId = await stakingWrapper.createPoolAsync(poolOperator, operatorShare);
            // check zrx token balances before minting stake
            const zrxTokenBalanceOfVaultBeforeStaking = await stakingWrapper.getZrxTokenBalanceOfZrxVault();
            expect(zrxTokenBalanceOfVaultBeforeStaking).to.be.bignumber.equal(new BigNumber(0));
            const zrxTokenBalanceOfStakerBeforeStaking = await stakingWrapper.getZrxTokenBalance(owner);
            expect(zrxTokenBalanceOfStakerBeforeStaking).to.be.bignumber.gte(amountToDelegate);
            ///// 2 DELEGATE ZRX /////
            // mint stake
            await stakingWrapper.depositAndDelegateAsync(owner, poolId, amountToDelegate);
            {
                // check zrx vault balance
                const vaultBalance = await stakingWrapper.getZrxVaultBalance(owner);
                expect(vaultBalance).to.be.bignumber.equal(amountToDelegate);
                // check zrx token balances
                const zrxTokenBalanceOfVaultAfterStaking = await stakingWrapper.getZrxTokenBalanceOfZrxVault();
                expect(zrxTokenBalanceOfVaultAfterStaking).to.be.bignumber.equal(amountToDelegate);
                const zrxTokenBalanceOfStakerAfterStaking = await stakingWrapper.getZrxTokenBalance(owner);
                expect(zrxTokenBalanceOfStakerAfterStaking).to.be.bignumber.equal(zrxTokenBalanceOfStakerBeforeStaking.minus(amountToDelegate));
                // check stake balance after minting
                const stakeBalance = await stakingWrapper.getTotalStakeAsync(owner);
                expect(stakeBalance).to.be.bignumber.equal(amountToDelegate);
                // check delegated stake balance for owner
                const stakeDelegatedByOwner = await stakingWrapper.getStakeDelegatedByOwnerAsync(owner);
                expect(stakeDelegatedByOwner).to.be.bignumber.equal(amountToDelegate);
                // check delegated balance to pool by owner
                const stakeDelegatedToPoolByOwner = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolId, owner);
                expect(stakeDelegatedToPoolByOwner).to.be.bignumber.equal(amountToDelegate);
                // checktotal amount delegated to pool
                const stakeDelegatedToPool = await stakingWrapper.getStakeDelegatedToPoolAsync(poolId);
                expect(stakeDelegatedToPool).to.be.bignumber.equal(amountToDelegate);
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToDelegate); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(0); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(0);
            }
            ///// 3 DEACTIVATE AND TIMELOCK DELEGATED STAKE /////
            // unstake
            await stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(owner, poolId, amountToDeactivate);
           {
                // check total stake balance didn't change
                const totalStake = await stakingWrapper.getTotalStakeAsync(owner);
                expect(totalStake).to.be.bignumber.equal(amountToDelegate); 
                // check delegated stake balance for owner
                const stakeDelegatedByOwner = await stakingWrapper.getStakeDelegatedByOwnerAsync(owner);
                expect(stakeDelegatedByOwner).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate));
                // check delegated balance to pool by owner
                const stakeDelegatedToPoolByOwner = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolId, owner);
                expect(stakeDelegatedToPoolByOwner).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate));
                // checktotal amount delegated to pool
                const stakeDelegatedToPool = await stakingWrapper.getStakeDelegatedToPoolAsync(poolId);
                expect(stakeDelegatedToPool).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate));
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate)); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(amountToDeactivate); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(amountToDeactivate);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(0);
            }
            ///// 4 SKIP TO NEXT TIMELOCK PERIOD - NOTHING SHOULD HAVE CHANGED /////
            await stakingWrapper.skipToNextTimelockPeriodAsync();
            {
                // check total stake balance didn't change
                const totalStake = await stakingWrapper.getTotalStakeAsync(owner);
                expect(totalStake).to.be.bignumber.equal(amountToDelegate); 
                // check delegated stake balance for owner
                const stakeDelegatedByOwner = await stakingWrapper.getStakeDelegatedByOwnerAsync(owner);
                expect(stakeDelegatedByOwner).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate));
                // check delegated balance to pool by owner
                const stakeDelegatedToPoolByOwner = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolId, owner);
                expect(stakeDelegatedToPoolByOwner).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate));
                // checktotal amount delegated to pool
                const stakeDelegatedToPool = await stakingWrapper.getStakeDelegatedToPoolAsync(poolId);
                expect(stakeDelegatedToPool).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate));
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate)); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(amountToDeactivate); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(amountToDeactivate);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(0);
            }
            ///// 5 SKIP TO NEXT TIMELOCK PEIOD - SHOULD BE ABLE TO REACTIVATE/WITHDRAW TIMELOCKED STAKE /////
            await stakingWrapper.skipToNextTimelockPeriodAsync();
            {
                // check total stake balance didn't change
                const totalStake = await stakingWrapper.getTotalStakeAsync(owner);
                expect(totalStake).to.be.bignumber.equal(amountToDelegate); 
                // check delegated stake balance for owner
                const stakeDelegatedByOwner = await stakingWrapper.getStakeDelegatedByOwnerAsync(owner);
                expect(stakeDelegatedByOwner).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate));
                // check delegated balance to pool by owner
                const stakeDelegatedToPoolByOwner = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolId, owner);
                expect(stakeDelegatedToPoolByOwner).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate));
                // checktotal amount delegated to pool
                const stakeDelegatedToPool = await stakingWrapper.getStakeDelegatedToPoolAsync(poolId);
                expect(stakeDelegatedToPool).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate));
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate)); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(amountToDeactivate); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(amountToDeactivate);
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(amountToDeactivate);
            }
            ///// 6 FORCE A SYNC - BALANCES SHOULD NOT CHANGE
            await stakingWrapper.forceTimelockSyncAsync(owner);
            {
                // check total stake balance didn't change
                const totalStake = await stakingWrapper.getTotalStakeAsync(owner);
                expect(totalStake).to.be.bignumber.equal(amountToDelegate); 
                // check delegated stake balance for owner
                const stakeDelegatedByOwner = await stakingWrapper.getStakeDelegatedByOwnerAsync(owner);
                expect(stakeDelegatedByOwner).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate));
                // check delegated balance to pool by owner
                const stakeDelegatedToPoolByOwner = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolId, owner);
                expect(stakeDelegatedToPoolByOwner).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate));
                // checktotal amount delegated to pool
                const stakeDelegatedToPool = await stakingWrapper.getStakeDelegatedToPoolAsync(poolId);
                expect(stakeDelegatedToPool).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate));
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate)); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(amountToDeactivate); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(amountToDeactivate);
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(amountToDeactivate);
            }
            ///// 7 REACTIVATE SOME STAKE /////
            await stakingWrapper.activateAndDelegateStakeAsync(owner, poolId, amountToReactivate);
            {
                // check total stake balance didn't change
                const totalStake = await stakingWrapper.getTotalStakeAsync(owner);
                expect(totalStake).to.be.bignumber.equal(amountToDelegate); 
                // check delegated stake balance for owner
                const stakeDelegatedByOwner = await stakingWrapper.getStakeDelegatedByOwnerAsync(owner);
                expect(stakeDelegatedByOwner).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate).plus(amountToReactivate));
                // check delegated balance to pool by owner
                const stakeDelegatedToPoolByOwner = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolId, owner);
                expect(stakeDelegatedToPoolByOwner).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate).plus(amountToReactivate));
                // checktotal amount delegated to pool
                const stakeDelegatedToPool = await stakingWrapper.getStakeDelegatedToPoolAsync(poolId);
                expect(stakeDelegatedToPool).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate).plus(amountToReactivate));
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate).plus(amountToReactivate)); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(amountToDeactivate.minus(amountToReactivate)); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(amountToDeactivate.minus(amountToReactivate));
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(amountToDeactivate.minus(amountToReactivate));
            }
            ///// 8 WITHDRAW SOME STAKE /////
            await stakingWrapper.withdrawAsync(owner, amountToWithdraw);
            {
                // check total stake balance didn't change
                const totalStake = await stakingWrapper.getTotalStakeAsync(owner);
                expect(totalStake).to.be.bignumber.equal(amountToDelegate.minus(amountToWithdraw)); 
                // check delegated stake balance for owner
                const stakeDelegatedByOwner = await stakingWrapper.getStakeDelegatedByOwnerAsync(owner);
                expect(stakeDelegatedByOwner).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate).plus(amountToReactivate));
                // check delegated balance to pool by owner
                const stakeDelegatedToPoolByOwner = await stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolId, owner);
                expect(stakeDelegatedToPoolByOwner).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate).plus(amountToReactivate));
                // checktotal amount delegated to pool
                const stakeDelegatedToPool = await stakingWrapper.getStakeDelegatedToPoolAsync(poolId);
                expect(stakeDelegatedToPool).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate).plus(amountToReactivate));
                // check timelocked stake is no longer activated
                const activatedStakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(activatedStakeBalance).to.be.bignumber.equal(amountToDelegate.minus(amountToDeactivate).plus(amountToReactivate)); 
                // check that timelocked stake is deactivated
                const deactivatedStakeBalance = await stakingWrapper.getDeactivatedStakeAsync(owner);
                expect(deactivatedStakeBalance).to.be.bignumber.equal(amountToDeactivate.minus(amountToReactivate).minus(amountToWithdraw)); 
                // check amount that is timelocked
                const timelockedStakeBalance = await stakingWrapper.getTimelockedStakeAsync(owner);
                expect(timelockedStakeBalance).to.be.bignumber.equal(0);
                // check that timelocked stake cannot be withdrawn
                const withdrawableStakeBalance = await stakingWrapper.getWithdrawableStakeAsync(owner);
                expect(withdrawableStakeBalance).to.be.bignumber.equal(amountToDeactivate.minus(amountToReactivate).minus(amountToWithdraw));
                // check that timelocked stake cannot be reactivated
                const activatableStakeBalance = await stakingWrapper.getActivatableStakeAsync(owner);
                expect(activatableStakeBalance).to.be.bignumber.equal(amountToDeactivate.minus(amountToReactivate).minus(amountToWithdraw));
                // check zrx vault balance
                const vaultBalance = await stakingWrapper.getZrxVaultBalance(owner);
                expect(vaultBalance).to.be.bignumber.equal(amountToDelegate.minus(amountToWithdraw));
                // check zrx token balances
                const zrxTokenBalanceOfVaultAfterStaking = await stakingWrapper.getZrxTokenBalanceOfZrxVault();
                expect(zrxTokenBalanceOfVaultAfterStaking).to.be.bignumber.equal(amountToDelegate.minus(amountToWithdraw));
                const zrxTokenBalanceOfStakerAfterStaking = await stakingWrapper.getZrxTokenBalance(owner);
                expect(zrxTokenBalanceOfStakerAfterStaking).to.be.bignumber.equal(zrxTokenBalanceOfStakerBeforeStaking.minus(amountToDelegate).plus(amountToWithdraw));
            }
        });

        it('Exchange Tracking', async () => {
            // 1 try querying an invalid addresses
            const invalidAddress = "0x0000000000000000000000000000000000000001";
            const isInvalidAddressValid = await stakingWrapper.isValidExchangeAddressAsync(invalidAddress);
            expect(isInvalidAddressValid).to.be.false();
            // 2 add valid address
            await stakingWrapper.addExchangeAddressAsync(exchange);
            const isValidAddressValid = await stakingWrapper.isValidExchangeAddressAsync(exchange);
            expect(isValidAddressValid).to.be.true();
            // 3 try adding valid address again
            await expectTransactionFailedAsync(
                stakingWrapper.addExchangeAddressAsync(exchange),
                RevertReason.ExchangeAddressAlreadyRegistered
            );
            // 4 remove valid address
            await stakingWrapper.removeExchangeAddressAsync(exchange);
            const isValidAddressStillValid = await stakingWrapper.isValidExchangeAddressAsync(exchange);
            expect(isValidAddressStillValid).to.be.false();
            // 5 try removing valid address again
            await expectTransactionFailedAsync(
                stakingWrapper.removeExchangeAddressAsync(exchange),
                RevertReason.ExchangeAddressNotRegistered
            );
        });

        it.only('Reward Vault', async () => {
            /*
            // 1 setup test parameters
            const poolOperator = stakers[1];
            const operatorShare = 39;
            const poolId = await stakingWrapper.createPoolAsync(poolOperator, operatorShare);
            const stakingContractAddress = stakingWrapper.getStakingContract().address;
            const notStakingContractAddress = poolOperator;
            const initialPoolDeposit = stakingWrapper.toBaseUnitAmount(19);
            // create pool in vault
            await stakingWrapper.rewardVaultCreatePoolAsync(poolId, poolOperator, initialPoolDeposit, stakingContractAddress);
            */
            /*
            // should fail to create pool if it already exists
            await expectTransactionFailedAsync(
                stakingWrapper.rewardVaultCreatePoolAsync(poolId, poolOperator, initialPoolDeposit, stakingContractAddress),
                RevertReason.PoolAlreadyExists
            );
            // should fail to create a pool from an address other than the staking contract
            await expectTransactionFailedAsync(
                stakingWrapper.rewardVaultCreatePoolAsync(poolId, poolOperator, initialPoolDeposit, notStakingContractAddress),
                RevertReason.OnlyCallableByStakingContract
            );
            */
        });

        it.only('Staking Contract / Reward Vault Integration', async () => {
            //
            //const poolId = await stakingWrapper.createPoolAsync();
            //await stakingWrapper.depositForAsync()            
        });

        it('Protocol Fees', async () => {
            ///// 0 DEPLOY EXCHANGE /////
            await stakingWrapper.addExchangeAddressAsync(exchange);
            ///// 1 SETUP POOLS /////
            const poolOperators = stakers.slice(0, 3);
            const operatorShares = [39, 59, 43];
            const poolIds = await Promise.all([
                stakingWrapper.createPoolAsync(poolOperators[0], operatorShares[0]),
                stakingWrapper.createPoolAsync(poolOperators[1], operatorShares[1]),
                stakingWrapper.createPoolAsync(poolOperators[2], operatorShares[2]),
            ]);
            const makersByPoolId = [
                [
                    makers[0],
                ],
                [
                    makers[1],
                    makers[2]
                ],
                [
                    makers[3],
                    makers[4],
                    makers[5]
                ],
            ];
            const protocolFeesByMaker = [
                // pool 1 - adds up to protocolFeesByPoolId[0]
                stakingWrapper.toBaseUnitAmount(0.304958),
                // pool 2 - adds up to protocolFeesByPoolId[1]
                stakingWrapper.toBaseUnitAmount(3.2),
                stakingWrapper.toBaseUnitAmount(12.123258),
                // pool 3 - adds up to protocolFeesByPoolId[2]
                stakingWrapper.toBaseUnitAmount(23.577),
                stakingWrapper.toBaseUnitAmount(4.54522236),
                stakingWrapper.toBaseUnitAmount(0)
            ];
            await Promise.all([
                // pool 0
                stakingWrapper.addMakerToPoolAsync(poolIds[0], makersByPoolId[0][0], "0x00", poolOperators[0]),
                // pool 1
                stakingWrapper.addMakerToPoolAsync(poolIds[1], makersByPoolId[1][0], "0x00", poolOperators[1]),
                stakingWrapper.addMakerToPoolAsync(poolIds[1], makersByPoolId[1][1], "0x00", poolOperators[1]),
                // pool 2
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][0], "0x00", poolOperators[2]),
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][1], "0x00", poolOperators[2]),
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][2], "0x00", poolOperators[2]),
            ]);
            ///// 2 PAY FEES /////
            await Promise.all([
                // pool 0 - split into two payments
                stakingWrapper.payProtocolFeeAsync(makers[0], protocolFeesByMaker[0].div(2), exchange),
                stakingWrapper.payProtocolFeeAsync(makers[0], protocolFeesByMaker[0].div(2), exchange),
                // pool 1 - pay full amounts
                stakingWrapper.payProtocolFeeAsync(makers[1], protocolFeesByMaker[1], exchange),
                stakingWrapper.payProtocolFeeAsync(makers[2], protocolFeesByMaker[2], exchange),
                // pool 2 -- pay full amounts
                stakingWrapper.payProtocolFeeAsync(makers[3], protocolFeesByMaker[3], exchange),
                stakingWrapper.payProtocolFeeAsync(makers[4], protocolFeesByMaker[4], exchange),
                // maker 5 doesn't pay anything
            ]);
            ///// 3 VALIDATE FEES RECORDED FOR EACH POOL /////
            const recordedProtocolFeesByPool = await Promise.all([
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[0]),
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[1]),
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[2]),
            ]);
            expect(recordedProtocolFeesByPool[0]).to.be.bignumber.equal(protocolFeesByMaker[0]);
            expect(recordedProtocolFeesByPool[1]).to.be.bignumber.equal(protocolFeesByMaker[1].plus(protocolFeesByMaker[2]));
            expect(recordedProtocolFeesByPool[2]).to.be.bignumber.equal(protocolFeesByMaker[3].plus(protocolFeesByMaker[4]));
            ///// 4 VALIDATE TOTAL FEES /////
            const recordedTotalProtocolFees = await stakingWrapper.getTotalProtocolFeesThisEpochAsync();
            const totalProtocolFeesAsNumber = _.sumBy(protocolFeesByMaker, (value: BigNumber) => {return value.toNumber()});
            const totalProtocolFees = new BigNumber(totalProtocolFeesAsNumber);
            expect(recordedTotalProtocolFees).to.be.bignumber.equal(totalProtocolFees);
            ///// 5 TRY TO RECORD FEE FROM ADDRESS OTHER THAN 0x EXCHANGE /////
            await expectTransactionFailedAsync(
                stakingWrapper.payProtocolFeeAsync(makers[4], protocolFeesByMaker[4], owner),
                RevertReason.OnlyCallableByExchange
            );
        });

        it('nth root', async () => {
            const base = new BigNumber(1419857);
            const n = new BigNumber(5);
            const root = await stakingWrapper.nthRoot(base, n);
            expect(root).to.be.bignumber.equal(17);
        });

        it('nth root #2', async () => {
            const base = new BigNumber(3375);
            const n = new BigNumber(3);
            const root = await stakingWrapper.nthRoot(base, n);
            expect(root).to.be.bignumber.equal(15);
        });

        it('nth root #3 with fixed point', async () => {
            const decimals = 6;
            const base = stakingWrapper.toFixedPoint(4.234, decimals);
            const n = new BigNumber(2);
            const decimalsAsBn = new BigNumber(decimals);
            const root = await stakingWrapper.nthRootFixedPoint(base, n, decimalsAsBn);
            const rootAsFloatingPoint = stakingWrapper.toFloatingPoint(root, decimals);
            const expectedResult = new BigNumber(2.057);
            expect(rootAsFloatingPoint).to.be.bignumber.equal(expectedResult);
        });

        it('nth root #3 with fixed point (integer nth root would fail here)', async () => {
            const decimals = 18;
            const base = stakingWrapper.toFixedPoint(5429503678976, decimals);
            console.log(base);
            const n = new BigNumber(9);
            const decimalsAsBn = new BigNumber(decimals);
            const root = await stakingWrapper.nthRootFixedPoint(base, n, decimalsAsBn);
            const rootAsFloatingPoint = stakingWrapper.toFloatingPoint(root, decimals);
            const expectedResult = new BigNumber(26);
            expect(rootAsFloatingPoint).to.be.bignumber.equal(expectedResult);
        });

        it.skip('nth root #4 with fixed point (integer nth root would fail here) (max number of decimals - currently does not retain)', async () => {
            const decimals = 18;
            const base = stakingWrapper.toFixedPoint(new BigNumber('5429503678976.295036789761543678', 10), decimals);
            console.log(base);
            const n = new BigNumber(9);
            const decimalsAsBn = new BigNumber(decimals);
            const root = await stakingWrapper.nthRootFixedPoint(base, n, decimalsAsBn);
            console.log(`root - ${root}`);
            const rootAsFloatingPoint = stakingWrapper.toFloatingPoint(root, decimals);
            const expectedResult = new BigNumber(26);
            expect(rootAsFloatingPoint).to.be.bignumber.equal(expectedResult);
        });

        it('cobb douglas - approximate', async() => {
            const totalRewards = stakingWrapper.toBaseUnitAmount(57.154398);
            const ownerFees = stakingWrapper.toBaseUnitAmount(5.64375);
            const totalFees = stakingWrapper.toBaseUnitAmount(29.00679);
            const ownerStake = stakingWrapper.toBaseUnitAmount(56);
            const totalStake = stakingWrapper.toBaseUnitAmount(10906);
            const alphaNumerator = new BigNumber(3);
            const alphaDenominator = new BigNumber(7);
            // create expected output
            // https://www.wolframalpha.com/input/?i=57.154398+*+(5.64375%2F29.00679)+%5E+(3%2F7)+*+(56+%2F+10906)+%5E+(1+-+3%2F7)
            const expectedOwnerReward = new BigNumber(1.3934);
            // run computation
            const ownerReward = await stakingWrapper.cobbDouglas(
                totalRewards,
                ownerFees,
                totalFees,
                ownerStake,
                totalStake,
                alphaNumerator,
                alphaDenominator
            );
            const ownerRewardFloatingPoint = stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(ownerReward, 18), 4);
            // validation
            expect(ownerRewardFloatingPoint).to.be.bignumber.equal(expectedOwnerReward);
        });

        it('cobb douglas - simplified (alpha = 1/x)', async() => {
            // setup test parameters
            const totalRewards = stakingWrapper.toBaseUnitAmount(57.154398);
            const ownerFees = stakingWrapper.toBaseUnitAmount(5.64375);
            const totalFees = stakingWrapper.toBaseUnitAmount(29.00679);
            const ownerStake = stakingWrapper.toBaseUnitAmount(56);
            const totalStake = stakingWrapper.toBaseUnitAmount(10906);
            const alphaDenominator = new BigNumber(3);
            // create expected output
            // https://www.wolframalpha.com/input/?i=57.154398+*+(5.64375%2F29.00679)+%5E+(1%2F3)+*+(56+%2F+10906)+%5E+(1+-+1%2F3)
            const expectedOwnerReward = new BigNumber(0.98572107681878);
            // run computation
            const ownerReward = await stakingWrapper.cobbDouglasSimplified(
                totalRewards,
                ownerFees,
                totalFees,
                ownerStake,
                totalStake,
                alphaDenominator
            );
            const ownerRewardFloatingPoint = stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(ownerReward, 18), 14);
            // validation
            expect(ownerRewardFloatingPoint).to.be.bignumber.equal(expectedOwnerReward);
        });

        it('cobb douglas - simplified inverse (1 - alpha = 1/x)', async() => {
            const totalRewards = stakingWrapper.toBaseUnitAmount(57.154398);
            const ownerFees = stakingWrapper.toBaseUnitAmount(5.64375);
            const totalFees = stakingWrapper.toBaseUnitAmount(29.00679);
            const ownerStake = stakingWrapper.toBaseUnitAmount(56);
            const totalStake = stakingWrapper.toBaseUnitAmount(10906);
            const inverseAlphaDenominator = new BigNumber(3);
            // create expected output
            // https://www.wolframalpha.com/input/?i=57.154398+*+(5.64375%2F29.00679)+%5E+(2%2F3)+*+(56+%2F+10906)+%5E+(1+-+2%2F3)
            const expectedOwnerReward = new BigNumber(3.310822494188);
            // run computation
            const ownerReward = await stakingWrapper.cobbDouglasSimplifiedInverse(
                totalRewards,
                ownerFees,
                totalFees,
                ownerStake,
                totalStake,
                inverseAlphaDenominator
            );
            const ownerRewardFloatingPoint = stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(ownerReward, 18), 12);
            // validation
            expect(ownerRewardFloatingPoint).to.be.bignumber.equal(expectedOwnerReward);
        });

        it('pool management', async() => {
            // create first pool
            const operatorAddress = stakers[0];
            const operatorShare = 39;
            const poolId = await stakingWrapper.createPoolAsync(operatorAddress, operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // check that the next pool id was incremented
            const expectedNextPoolId = "0x0000000000000000000000000000000200000000000000000000000000000000";
            const nextPoolId = await stakingWrapper.getNextPoolIdAsync();
            expect(nextPoolId).to.be.equal(expectedNextPoolId);
            // add maker to pool
            const makerAddress = makers[0];
            const makerSignature = "0x";
            await stakingWrapper.addMakerToPoolAsync(poolId, makerAddress, makerSignature, operatorAddress);
            // check the pool id of the maker
            const poolIdOfMaker = await stakingWrapper.getMakerPoolId(makerAddress);
            expect(poolIdOfMaker).to.be.equal(poolId);
            // check the list of makers for the pool
            const makerAddressesForPool = await stakingWrapper.getMakerAddressesForPool(poolId);
            expect(makerAddressesForPool).to.be.deep.equal([makerAddress]);
            // try to add the same maker address again
            await expectTransactionFailedAsync(
                stakingWrapper.addMakerToPoolAsync(poolId, makerAddress, makerSignature, operatorAddress),
                RevertReason.MakerAddressAlreadyRegistered
            );
            // try to add a new maker address from an address other than the pool operator
            const notOperatorAddress = owner;
            const anotherMakerAddress = makers[1];
            const anotherMakerSignature = "0x";
            await expectTransactionFailedAsync(
                stakingWrapper.addMakerToPoolAsync(poolId, anotherMakerAddress, anotherMakerSignature, notOperatorAddress),
                RevertReason.OnlyCallableByPoolOperator
            );
            // try to remove the maker address from an address other than the operator
            await expectTransactionFailedAsync(
                stakingWrapper.removeMakerFromPoolAsync(poolId, makerAddress, notOperatorAddress),
                RevertReason.OnlyCallableByPoolOperator
            );
            // remove maker from pool
            await stakingWrapper.removeMakerFromPoolAsync(poolId, makerAddress, operatorAddress);
            // check the pool id of the maker
            const poolIdOfMakerAfterRemoving = await stakingWrapper.getMakerPoolId(makerAddress);
            expect(poolIdOfMakerAfterRemoving).to.be.equal(stakingConstants.NIL_POOL_ID);
            // check the list of makers for the pool
            const makerAddressesForPoolAfterRemoving = await stakingWrapper.getMakerAddressesForPool(poolId);
            expect(makerAddressesForPoolAfterRemoving).to.be.deep.equal([]);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
