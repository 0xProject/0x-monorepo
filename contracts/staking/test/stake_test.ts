import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import {
    blockchainTests,
    describe,
    provider,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BigNumber, StringRevertError } from '@0x/utils';
import * as _ from 'lodash';

import { StakerActor } from './actors/staker_actor';
import { StakingWrapper } from './utils/staking_wrapper';
import { StakeState, StakeStateInfo } from './utils/types';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets.skip('Stake States', () => {
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
    let erc20Wrapper: ERC20Wrapper;
    // stake actor
    let staker: StakerActor;
    let poolIds: string[];
    let poolOperator: string;
    // tests
    before(async () => {
        // create accounts
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        actors = accounts.slice(2, 5);
        // deploy erc20 proxy
        erc20Wrapper = new ERC20Wrapper(provider, accounts, owner);
        erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        // deploy zrx token
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, ZRX_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(provider, owner, erc20ProxyContract, zrxTokenContract, accounts);
        await stakingWrapper.deployAndConfigureContractsAsync();
        // setup new staker
        staker = new StakerActor(actors[0], stakingWrapper);
        // setup pools
        poolOperator = actors[1];
        poolIds = await Promise.all([
            await stakingWrapper.createStakingPoolAsync(poolOperator, 4),
            await stakingWrapper.createStakingPoolAsync(poolOperator, 5),
        ]);
    });
    describe('Stake', () => {
        it('should successfully stake zero ZRX', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(0);
            await staker.stakeAsync(amount);
        });
        it('should successfully stake non-zero ZRX', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
        });
        it('should retain stake balance across 1 epoch', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.goToNextEpochAsync();
        });
        it('should retain stake balance across 2 epochs', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.goToNextEpochAsync();
            await staker.goToNextEpochAsync();
        });
    });
    describe('Move Stake', () => {
        it('should be able to rebalance next epoch\'s stake', async () => {
            // epoch 1
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, amount);
            // still epoch 1 ~ should be able to move stake again
            await staker.moveStakeAsync({state: StakeState.INACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, amount);
        });
        it('should fail to move the same stake more than once', async () => {
            // epoch 1
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, amount);
            // stake is now inactive, should not be able to move it out of active state again
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, amount, new StringRevertError('Insufficient Balance'));
        });
        it('should fail to reassign stake', async () => {
            // epoch 1
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, amount);
            // still epoch 1 ~ should be able to move stake again
            await staker.moveStakeAsync({state: StakeState.INACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, amount);
            // stake is now delegated; should fail to re-assign it from inactive back to active
            await staker.moveStakeAsync({state: StakeState.INACTIVE}, {state: StakeState.ACTIVE}, amount, new StringRevertError('Insufficient Balance'));
        });
    });
    describe('Move Zero Stake', () => {
        it('active -> active', async () => {
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.ACTIVE}, ZERO);
        });
        it('active -> inactive', async () => {
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, ZERO);
        });
        it('active -> delegated', async () => {
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, ZERO);
        });
        it('inactive -> active', async () => {
            await staker.moveStakeAsync({state: StakeState.INACTIVE}, {state: StakeState.ACTIVE}, ZERO);
        });
        it('inactive -> inactive', async () => {
            await staker.moveStakeAsync({state: StakeState.INACTIVE}, {state: StakeState.INACTIVE}, ZERO);
        });
        it('inactive -> delegated', async () => {
            await staker.moveStakeAsync({state: StakeState.INACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, ZERO);
        });
        it('delegated -> active', async () => {
            await staker.moveStakeAsync({state: StakeState.DELEGATED, poolId: poolIds[0]}, {state: StakeState.ACTIVE}, ZERO);
        });
        it('delegated -> inactive', async () => {
            await staker.moveStakeAsync({state: StakeState.DELEGATED, poolId: poolIds[0]}, {state: StakeState.INACTIVE}, ZERO);
        });
        it('delegated -> delegated (same pool)', async () => {
            await staker.moveStakeAsync({state: StakeState.DELEGATED, poolId: poolIds[0]}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, ZERO);
        });
        it('delegated -> delegated (other pool)', async () => {
            await staker.moveStakeAsync({state: StakeState.DELEGATED, poolId: poolIds[0]}, {state: StakeState.DELEGATED, poolId: poolIds[1]}, ZERO);
        });
    });
    describe('Move Non-Zero Stake', () => {
        const testMovePartialStake = async (from: StakeStateInfo, to: StakeStateInfo) => {
            // setup
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            if (from.state !== StakeState.ACTIVE) {
                await staker.moveStakeAsync({state: StakeState.ACTIVE}, from, amount);
            }
            // run test, checking balances in epochs [n .. n + 2]
            // in epoch `n` - `next` is set
            // in epoch `n+1` - `current` is set
            // in epoch `n+2` - only withdrawable balance should change.
            await staker.moveStakeAsync(from, to, amount.div(2));
            await staker.goToNextEpochAsync();
            await staker.goToNextEpochAsync();
        }
        it('active -> active', async () => {
            await testMovePartialStake({state: StakeState.ACTIVE}, {state: StakeState.ACTIVE});
        });
        it('active -> inactive', async () => {
            await testMovePartialStake({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE});
        });
        it('active -> delegated', async () => {
            await testMovePartialStake({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]});
        });
        it('inactive -> active', async () => {
            await testMovePartialStake({state: StakeState.INACTIVE}, {state: StakeState.ACTIVE});
        });
        it('inactive -> inactive', async () => {
            await testMovePartialStake({state: StakeState.INACTIVE}, {state: StakeState.INACTIVE});
        });
        it('inactive -> delegated', async () => {
            await testMovePartialStake({state: StakeState.INACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]});
        });
        it('delegated -> active', async () => {
            await testMovePartialStake({state: StakeState.DELEGATED, poolId: poolIds[0]}, {state: StakeState.ACTIVE});
        });
        it('delegated -> inactive', async () => {
            await testMovePartialStake({state: StakeState.DELEGATED, poolId: poolIds[0]}, {state: StakeState.INACTIVE});
        });
        it('delegated -> delegated (same pool)', async () => {
            await testMovePartialStake({state: StakeState.DELEGATED, poolId: poolIds[0]}, {state: StakeState.DELEGATED, poolId: poolIds[0]});
        });
        it('delegated -> delegated (other pool)', async () => {
            await testMovePartialStake({state: StakeState.DELEGATED, poolId: poolIds[0]}, {state: StakeState.DELEGATED, poolId: poolIds[1]});
        });
    });
    describe('Unstake', () => {
        it('should successfully unstake zero ZRX', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(0);
            await staker.unstakeAsync(amount);
        });
        it('should successfully unstake after being inactive for 1 epoch', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, amount);
            await staker.goToNextEpochAsync(); // stake is now inactive
            await staker.goToNextEpochAsync(); // stake is now withdrawable
            await staker.unstakeAsync(amount);
        });
        it('should fail to unstake with insufficient balance', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.unstakeAsync(amount, new StringRevertError('INSUFFICIENT_FUNDS'));
        });
        it('should fail to unstake in the same epoch as stake was set to inactive', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, amount);
            await staker.unstakeAsync(amount, new StringRevertError('INSUFFICIENT_FUNDS'));
        });
        it('should fail to unstake after being inactive for <1 epoch', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, amount);
            await staker.goToNextEpochAsync();
            await staker.unstakeAsync(amount, new StringRevertError('INSUFFICIENT_FUNDS'));
        });
        it('should fail to unstake in same epoch that inactive/withdrawable stake has been reactivated', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, amount);
            await staker.goToNextEpochAsync(); // stake is now inactive
            await staker.goToNextEpochAsync(); // stake is now withdrawable
            await staker.moveStakeAsync({state: StakeState.INACTIVE}, {state: StakeState.ACTIVE}, amount);
            await staker.unstakeAsync(amount, new StringRevertError('INSUFFICIENT_FUNDS'));
        });
        it('should fail to unstake one epoch after inactive/withdrawable stake has been reactivated', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, amount);
            await staker.goToNextEpochAsync(); // stake is now inactive
            await staker.goToNextEpochAsync(); // stake is now withdrawable
            await staker.moveStakeAsync({state: StakeState.INACTIVE}, {state: StakeState.ACTIVE}, amount);
            await staker.goToNextEpochAsync(); // stake is active and not withdrawable
            await staker.unstakeAsync(amount, new StringRevertError('INSUFFICIENT_FUNDS'));
        });
        it('should fail to unstake >1 epoch after inactive/withdrawable stake has been reactivated', async () => {
            const amount = StakingWrapper.toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, amount);
            await staker.goToNextEpochAsync(); // stake is now inactive
            await staker.goToNextEpochAsync(); // stake is now withdrawable
            await staker.moveStakeAsync({state: StakeState.INACTIVE}, {state: StakeState.ACTIVE}, amount);
            await staker.goToNextEpochAsync(); // stake is active and not withdrawable
            await staker.goToNextEpochAsync(); // stake is active and not withdrawable
            await staker.unstakeAsync(amount, new StringRevertError('INSUFFICIENT_FUNDS'));
        });
    });
    describe('Simulations', () => {
        it('Simulation from Staking Spec', async () => {
            // Epoch 1: Stake some ZRX
            await staker.stakeAsync(StakingWrapper.toBaseUnitAmount(4));
            // Later in Epoch 1: User delegates and deactivates some stake
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, StakingWrapper.toBaseUnitAmount(1));
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.DELEGATED, poolId: poolIds[0]}, StakingWrapper.toBaseUnitAmount(2));
            // Epoch 2: State updates (no user intervention required)
            await staker.goToNextEpochAsync();
            // Epoch 3: Stake that has been inactive for an epoch can be withdrawn (no user intervention required)
            await staker.goToNextEpochAsync();
            // Later in Epoch 3: User reactivates half of their inactive stake; this becomes Active next epoch
            await staker.moveStakeAsync({state: StakeState.INACTIVE}, {state: StakeState.ACTIVE}, StakingWrapper.toBaseUnitAmount(0.5));
            // Later in Epoch 3: User re-delegates half of their stake from Pool 1 to Pool 2
            await staker.moveStakeAsync({state: StakeState.DELEGATED, poolId: poolIds[0]}, {state: StakeState.DELEGATED, poolId: poolIds[1]}, StakingWrapper.toBaseUnitAmount(1));
            // Epoch 4: State updates (no user intervention required)
            await staker.goToNextEpochAsync();
            // Later in Epoch 4: User deactivates all active stake
            await staker.moveStakeAsync({state: StakeState.ACTIVE}, {state: StakeState.INACTIVE}, StakingWrapper.toBaseUnitAmount(1.5));
            // Later in Epoch 4: User withdraws all available inactive stake
            await staker.unstakeAsync(StakingWrapper.toBaseUnitAmount(0.5));
            // Epoch 5: State updates (no user intervention required)
            await staker.goToNextEpochAsync();
            // Later in Epoch 5: User reactivates a portion of their stake
            await staker.moveStakeAsync({state: StakeState.INACTIVE}, {state: StakeState.ACTIVE}, StakingWrapper.toBaseUnitAmount(1));
            // Epoch 6: State updates (no user intervention required)
            await staker.goToNextEpochAsync();
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion