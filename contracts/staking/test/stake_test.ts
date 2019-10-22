import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, describe } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { StakerActor } from './actors/staker_actor';
import { deployAndConfigureContractsAsync, StakingApiWrapper } from './utils/api_wrapper';
import { toBaseUnitAmount } from './utils/number_utils';
import { StakeInfo, StakeStatus } from './utils/types';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Stake Statuses', env => {
    // constants
    const ZERO = new BigNumber(0);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let actors: string[];
    // wrappers
    let stakingApiWrapper: StakingApiWrapper;
    let erc20Wrapper: ERC20Wrapper;
    // stake actor
    let staker: StakerActor;
    let poolIds: string[];
    let unusedPoolId: string;
    let poolOperator: string;
    // tests
    before(async () => {
        // create accounts
        accounts = await env.getAccountAddressesAsync();
        owner = accounts[0];
        actors = accounts.slice(2, 5);
        // set up ERC20Wrapper
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        // deploy staking contracts
        stakingApiWrapper = await deployAndConfigureContractsAsync(env, owner, erc20Wrapper);

        // setup new staker
        staker = new StakerActor(actors[0], stakingApiWrapper);
        // setup pools
        poolOperator = actors[1];
        poolIds = await Promise.all([
            await stakingApiWrapper.utils.createStakingPoolAsync(poolOperator, 4, false),
            await stakingApiWrapper.utils.createStakingPoolAsync(poolOperator, 5, false),
        ]);
        const lastPoolId = await stakingApiWrapper.stakingContract.lastPoolId.callAsync();
        unusedPoolId = `0x${new BigNumber(lastPoolId)
            .plus(1)
            .toString(16)
            .padStart(64, '0')}`;
    });
    describe('Stake', () => {
        it('should successfully stake zero ZRX', async () => {
            const amount = toBaseUnitAmount(0);
            await staker.stakeAsync(amount);
        });
        it('should successfully stake non-zero ZRX', async () => {
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
        });
        it('should retain stake balance across 1 epoch', async () => {
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.goToNextEpochAsync();
        });
        it('should retain stake balance across 2 epochs', async () => {
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.goToNextEpochAsync();
            await staker.goToNextEpochAsync();
        });
    });
    describe('Move Stake', () => {
        it("should be able to rebalance next epoch's stake", async () => {
            // epoch 2
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                amount,
            );
            // still epoch 2 ~ should be able to move stake again
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                new StakeInfo(StakeStatus.Undelegated),
                amount,
            );
        });
        it("should be able to reassign next epoch's stake", async () => {
            // epoch 2
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                amount,
            );
            // still epoch 2 ~ should be able to move stake again
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                new StakeInfo(StakeStatus.Delegated, poolIds[1]),
                amount,
            );
        });
        it('should fail to move the same stake more than once', async () => {
            // epoch 2
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                amount,
            );
            // stake is now undelegated, should not be able to move it out of active status again
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[1]),
                amount,
                new StakingRevertErrors.InsufficientBalanceError(amount, ZERO),
            );
        });
    });
    describe('Stake and Move', () => {
        it("should be able to rebalance next epoch's stake", async () => {
            // epoch 2
            const amount = toBaseUnitAmount(10);
            await staker.stakeAndMoveAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                amount,
            );
            // still epoch 2 ~ should be able to move stake again
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                new StakeInfo(StakeStatus.Undelegated),
                amount,
            );
        });
        it('should fail to move the same stake more than once', async () => {
            // epoch 2
            const amount = toBaseUnitAmount(10);
            await staker.stakeAndMoveAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                amount,
            );
            // stake is now undelegated, should not be able to move it out of active status again
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[1]),
                amount,
                new StakingRevertErrors.InsufficientBalanceError(amount, ZERO),
            );
        });
    });
    describe('Move Zero Stake', () => {
        it('undelegated -> undelegated', async () => {
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Undelegated),
                ZERO,
            );
        });
        it('undelegated -> delegated', async () => {
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                ZERO,
            );
        });
        it('delegated -> undelegated', async () => {
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                new StakeInfo(StakeStatus.Undelegated),
                ZERO,
            );
        });
        it('delegated -> delegated (same pool)', async () => {
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                ZERO,
            );
        });
        it('delegated -> delegated (other pool)', async () => {
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                new StakeInfo(StakeStatus.Delegated, poolIds[1]),
                ZERO,
            );
        });
    });
    describe('Move Non-Zero Stake', () => {
        const testMovePartialStake = async (from: StakeInfo, to: StakeInfo) => {
            // setup
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            if (from.status !== StakeStatus.Undelegated) {
                await staker.moveStakeAsync(new StakeInfo(StakeStatus.Undelegated), from, amount);
            }
            // run test, checking balances in epochs [n .. n + 2]
            // in epoch `n` - `next` is set
            // in epoch `n+1` - `current` is set
            await staker.moveStakeAsync(from, to, amount.div(2));
            await staker.goToNextEpochAsync();
        };
        it('undelegated -> undelegated', async () => {
            await testMovePartialStake(new StakeInfo(StakeStatus.Undelegated), new StakeInfo(StakeStatus.Undelegated));
        });
        it('undelegated -> delegated', async () => {
            await testMovePartialStake(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
            );
        });
        it('delegated -> undelegated', async () => {
            await testMovePartialStake(
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                new StakeInfo(StakeStatus.Undelegated),
            );
        });
        it('delegated -> delegated (same pool)', async () => {
            await testMovePartialStake(
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
            );
        });
        it('delegated -> delegated (other pool)', async () => {
            await testMovePartialStake(
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                new StakeInfo(StakeStatus.Delegated, poolIds[1]),
            );
        });
        it('undelegated -> delegated (non-existent pool)', async () => {
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, unusedPoolId),
                amount,
                new StakingRevertErrors.PoolExistenceError(unusedPoolId, false),
            );
        });
        it('delegated -> delegated (non-existent pool)', async () => {
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                amount,
            );
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                new StakeInfo(StakeStatus.Delegated, unusedPoolId),
                amount,
                new StakingRevertErrors.PoolExistenceError(unusedPoolId, false),
            );
        });
    });
    describe('Unstake', () => {
        it('should successfully unstake zero ZRX', async () => {
            const amount = toBaseUnitAmount(0);
            await staker.unstakeAsync(amount);
        });
        it('should successfully unstake after becoming undelegated', async () => {
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                amount,
            );
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                new StakeInfo(StakeStatus.Undelegated),
                amount,
            );
            await staker.goToNextEpochAsync(); // stake is now undelegated
            await staker.unstakeAsync(amount);
        });
        it('should fail to unstake in the same epoch as stake was undelegated', async () => {
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                amount,
            );
            await staker.goToNextEpochAsync(); // stake is now delegated
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                new StakeInfo(StakeStatus.Undelegated),
                amount,
            );
            await staker.unstakeAsync(amount, new StakingRevertErrors.InsufficientBalanceError(amount, ZERO));
        });
        it('should fail to unstake in same epoch that undelegated stake has been delegated', async () => {
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                amount,
            );
            await staker.unstakeAsync(amount, new StakingRevertErrors.InsufficientBalanceError(amount, ZERO));
        });
        it('should fail to unstake one epoch after undelegated stake has been delegated', async () => {
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                amount,
            );
            await staker.goToNextEpochAsync(); // stake is now undelegated
            await staker.unstakeAsync(amount, new StakingRevertErrors.InsufficientBalanceError(amount, ZERO));
        });
        it('should fail to unstake >1 epoch after undelegated stake has been delegated', async () => {
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.moveStakeAsync(
                new StakeInfo(StakeStatus.Undelegated),
                new StakeInfo(StakeStatus.Delegated, poolIds[0]),
                amount,
            );
            await staker.goToNextEpochAsync(); // stake is now undelegated
            await staker.goToNextEpochAsync(); // stake is now withdrawable
            await staker.unstakeAsync(amount, new StakingRevertErrors.InsufficientBalanceError(amount, ZERO));
        });
        it('should successfuly unstake freshly deposited stake', async () => {
            const amount = toBaseUnitAmount(10);
            await staker.stakeAsync(amount);
            await staker.unstakeAsync(amount);
        });
    });
    describe('Simulations', () => {
        // it('Simulation from Staking Spec', async () => {
        //     // Epoch 1: Stake some ZRX
        //     await staker.stakeAsync(toBaseUnitAmount(4));
        //     // Later in Epoch 1: User delegates and deactivates some stake
        //     await staker.moveStakeAsync(
        //         new StakeInfo(StakeStatus.Active),
        //         new StakeInfo(StakeStatus.Undelegated),
        //         toBaseUnitAmount(1),
        //     );
        //     await staker.moveStakeAsync(
        //         new StakeInfo(StakeStatus.Active),
        //         new StakeInfo(StakeStatus.Delegated, poolIds[0]),
        //         toBaseUnitAmount(2),
        //     );
        //     // Epoch 2: Status updates (no user intervention required)
        //     await staker.goToNextEpochAsync();
        //     // Epoch 3: Stake that has been undelegated for an epoch can be withdrawn (no user intervention required)
        //     await staker.goToNextEpochAsync();
        //     // Later in Epoch 3: User reactivates half of their undelegated stake; this becomes Active next epoch
        //     await staker.moveStakeAsync(
        //         new StakeInfo(StakeStatus.Undelegated),
        //         new StakeInfo(StakeStatus.Active),
        //         toBaseUnitAmount(0.5),
        //     );
        //     // Later in Epoch 3: User re-delegates half of their stake from Pool 1 to Pool 2
        //     await staker.moveStakeAsync(
        //         new StakeInfo(StakeStatus.Delegated, poolIds[0]),
        //         new StakeInfo(StakeStatus.Delegated, poolIds[1]),
        //         toBaseUnitAmount(1),
        //     );
        //     // Epoch 4: Status updates (no user intervention required)
        //     await staker.goToNextEpochAsync();
        //     // Later in Epoch 4: User deactivates all active stake
        //     await staker.moveStakeAsync(
        //         new StakeInfo(StakeStatus.Active),
        //         new StakeInfo(StakeStatus.Undelegated),
        //         toBaseUnitAmount(1.5),
        //     );
        //     // Later in Epoch 4: User withdraws all available undelegated stake
        //     await staker.unstakeAsync(toBaseUnitAmount(0.5));
        //     // Epoch 5: Status updates (no user intervention required)
        //     await staker.goToNextEpochAsync();
        //     // Later in Epoch 5: User reactivates a portion of their stake
        //     await staker.moveStakeAsync(
        //         new StakeInfo(StakeStatus.Undelegated),
        //         new StakeInfo(StakeStatus.Active),
        //         toBaseUnitAmount(1),
        //     );
        //     // Epoch 6: Status updates (no user intervention required)
        //     await staker.goToNextEpochAsync();
        // });
    });
});
// tslint:enable:no-unnecessary-type-assertion
