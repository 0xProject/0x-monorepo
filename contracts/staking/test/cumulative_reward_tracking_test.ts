import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, describe } from '@0x/contracts-test-utils';
import * as _ from 'lodash';

import { deployAndConfigureContractsAsync, StakingApiWrapper } from './utils/api_wrapper';
import { CumulativeRewardTrackingSimulation, TestAction } from './utils/cumulative_reward_tracking_simulation';

// tslint:disable:no-unnecessary-type-assertion
// tslint:disable:max-file-line-count
blockchainTests.resets('Cumulative Reward Tracking', env => {
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    // wrappers
    let stakingApiWrapper: StakingApiWrapper;
    let simulation: CumulativeRewardTrackingSimulation;
    // let testWrapper: TestRewardBalancesContract;
    let erc20Wrapper: ERC20Wrapper;

    // tests
    before(async () => {
        // create accounts
        accounts = await env.getAccountAddressesAsync();
        owner = accounts[0];
        const actors = accounts.slice(1);
        // set up ERC20Wrapper
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        // deploy staking contracts
        stakingApiWrapper = await deployAndConfigureContractsAsync(env, owner, erc20Wrapper);
        simulation = new CumulativeRewardTrackingSimulation(stakingApiWrapper, actors);
        await simulation.deployAndConfigureTestContractsAsync(env);
    });

    describe('Tracking Cumulative Rewards (CR)', () => {
        it('pool created at epoch 0', async () => {
            await simulation.runTestAsync([], [TestAction.CreatePool], [{ event: 'SetCumulativeReward', epoch: 0 }]);
        });
        it('pool created in epoch >0', async () => {
            await simulation.runTestAsync(
                [TestAction.Finalize],
                [TestAction.CreatePool],
                [{ event: 'SetCumulativeReward', epoch: 1 }],
            );
        });
        it('delegating in the same epoch pool is created', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 0
                    TestAction.CreatePool,
                ],
                [
                    // Updates CR for epoch 0
                    // Creates CR for epoch 1
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 0 }],
            );
        });
        it('re-delegating in the same epoch', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 0
                    TestAction.CreatePool,
                ],
                [
                    // Updates CR for epoch 0
                    TestAction.Delegate,
                    // Updates CR for epoch 0
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 0 }, { event: 'SetCumulativeReward', epoch: 0 }],
            );
        });
        it('delegating in new epoch', async () => {
            // since there was no delegation in epoch 0 there is no longer a dependency on the CR for epoch 0
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 0
                    TestAction.CreatePool,
                    // Moves to epoch 1
                    TestAction.Finalize,
                ],
                [
                    // Creates a CR for epoch 1
                    // Sets MRCR to epoch 1
                    // Unsets the CR for epoch 0
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 1 }],
            );
        });
        it('re-delegating in a new epoch', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR in epoch 0
                    TestAction.CreatePool,
                    // Updates CR for epoch 0
                    // Creates CR for epoch 1
                    TestAction.Delegate,
                    // Moves to epoch 1
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 1
                    // Sets MRCR to epoch 1
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 1 }],
            );
        });
        it('delegating in epoch 1 then again in epoch 2', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 0
                    TestAction.CreatePool,
                    // Moves to epoch 1
                    TestAction.Finalize,
                    // Creates CR for epoch 1
                    // Sets MRCR to epoch 1
                    TestAction.Delegate,
                    // Move to epoch 2
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 2
                    // Sets MRCR to epoch 2
                    // Creates CR for epoch 3
                    // Clears CR for epoch 1
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 2 }],
            );
        });
        it('delegate in epoch 1 then undelegate in epoch 2', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 0
                    TestAction.CreatePool,
                    // Moves to epoch 1
                    TestAction.Finalize,
                    // Creates CR for epoch 1
                    // Sets MRCR to epoch 0
                    // Clears CR for epoch 0
                    // Creates CR for epoch 2
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                ],
                [
                    // Update CR for epoch 2
                    // Set MRCR to epoch 2
                    // Clear CR for epoch 1
                    TestAction.Undelegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 2 }],
            );
        });
        it('delegate in epoch 0 and epoch 1, then undelegate half in epoch 2', async () => {
            await simulation.runTestAsync(
                [
                    // Create CR for epoch 0
                    TestAction.CreatePool,
                    // Updates CR for epoch 0
                    // Sets MRCR to epoch 0
                    // Creates CR for epoch 1
                    TestAction.Delegate,
                    // Moves to epoch 1
                    TestAction.Finalize,
                    // Updates CR for epoch 1
                    // Sets MRCR to epoch 1
                    // Creates CR for epoch 2
                    // Clears CR for epoch 0
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 2
                    // Sets MRCR to epoch 2
                    // Creates CR for epoch 3 (because there will still be stake)
                    // Clears CR for epoch 1
                    TestAction.Undelegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 2 }],
            );
        });
        it('delegate in epoch 1 and 2 then again in 3', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 0
                    TestAction.CreatePool,
                    // Updates CR for epoch 0
                    // Sets MRCR to epoch 0
                    // Creates CR for epoch 1
                    TestAction.Delegate,
                    // Moves to epoch 1
                    TestAction.Finalize,
                    // Updates CR for epoch 1
                    // Sets MRCR to epoch 1
                    // Creates CR for epoch 2
                    // Clears CR for epoch 0
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 2
                    // Sets MRCR to epoch 2
                    // Creates CR for epoch 3
                    // Clears CR for epoch 1
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 2 }],
            );
        });
        it('delegate in epoch 0, earn reward in epoch 1', async () => {
            await simulation.runTestAsync(
                [
                    // Create CR for epoch 0
                    TestAction.CreatePool,
                    // Updates CR for epoch 0
                    // Sets MRCR to epoch 0
                    // Creates CR for epoch 1
                    TestAction.Delegate,
                    // Moves to epoch 1
                    TestAction.Finalize,
                    // Credits pool with rewards
                    TestAction.PayProtocolFee,
                ],
                [
                    // Moves to epoch 2
                    // Creates CR for epoch 2
                    // Sets MRCR to epoch 2
                    TestAction.Finalize,
                ],
                [{ event: 'SetCumulativeReward', epoch: 2 }],
            );
        });
        it('delegate in epoch 0, epoch 2, earn reward in epoch 3, then delegate', async () => {
            await simulation.runTestAsync(
                [
                    // Create CR for epoch 0
                    TestAction.CreatePool,
                    // Updates CR for epoch 0
                    // Sets MRCR to epoch 0
                    // Creates CR for epoch 1
                    TestAction.Delegate,
                    // Moves to epoch 1
                    TestAction.Finalize,
                    // Updates CR for epoch 1
                    // Sets MRCR to epoch 1
                    // Creates CR for epoch 2
                    // Clears CR for epoch 0
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Credits pool with rewards
                    TestAction.PayProtocolFee,
                    // Moves to epoch 3
                    // Creates CR for epoch 3
                    // Sets MRCR to epoch 3
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 3
                    // Creates CR for epoch 4
                    // Clears CR for epoch 1
                    // Clears CR for epoch 2
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 3 }],
            );
        });
        it('delegate in epoch 0 and 1, earn reward in epoch 3, then undelegate half', async () => {
            await simulation.runTestAsync(
                [
                    // Create CR for epoch 0
                    TestAction.CreatePool,
                    // Updates CR for epoch 0
                    // Sets MRCR to epoch 0
                    // Creates CR for epoch 1
                    TestAction.Delegate,
                    // Moves to epoch 1
                    TestAction.Finalize,
                    // Updates CR for epoch 1
                    // Sets MRCR to epoch 1
                    // Creates CR for epoch 2
                    // Clears CR for epoch 0
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Credits pool with rewards
                    TestAction.PayProtocolFee,
                    // Moves to epoch 3
                    // Creates CR for epoch 3
                    // Sets MRCR to epoch 3
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 3
                    // Creates CR for epoch 4 (because there is still stake remaming)
                    // Clears CR for epoch 1
                    // Clears CR for epoch 2
                    TestAction.Undelegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 3 }],
            );
        });
        it('delegate in epoch 1, 2, earn rewards in epoch 3, skip to epoch 4, then delegate', async () => {
            await simulation.runTestAsync(
                [
                    // Create CR for epoch 0
                    TestAction.CreatePool,
                    // Updates CR for epoch 0
                    // Sets MRCR to epoch 0
                    // Creates CR for epoch 1
                    TestAction.Delegate,
                    // Moves to epoch 1
                    TestAction.Finalize,
                    // Updates CR for epoch 1
                    // Sets MRCR to epoch 1
                    // Creates CR for epoch 2
                    // Clears CR for epoch 0
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Credits pool with rewards
                    TestAction.PayProtocolFee,
                    // Moves to epoch 3
                    // Creates CR for epoch 3
                    // Sets MRCR to epoch 3
                    TestAction.Finalize,
                    // Moves to epoch 4
                    TestAction.Finalize,
                ],
                [
                    // Creates CR for epoch 4
                    // Sets MRCR to epoch 4
                    // Clears CR for epoch 3
                    // Creates CR for epoch 5
                    // Clears CR for epoch 1
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 4 }],
            );
        });
        it('earn reward in epoch 1 with no stake, then delegate', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 0
                    TestAction.CreatePool,
                    // Credit pool with rewards
                    TestAction.PayProtocolFee,
                    // Moves to epoch 1
                    // That's it, because there's no active pools.
                    TestAction.Finalize,
                ],
                [
                    // Updates CR to epoch 1
                    // Sets MRCR to epoch 1
                    // Clears CR for epoch 0
                    // Creates CR for epoch 2
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 1 }],
            );
        });
        it('delegate in epoch 1, 3, then delegate in epoch 4', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 0
                    TestAction.CreatePool,
                    // Moves to epoch 1
                    TestAction.Finalize,
                    // Creates CR for epoch 1
                    // Sets MRCR to epoch 0
                    // Clears CR for epoch 0
                    // Creates CR for epoch 2
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Moves to epoch 3
                    TestAction.Finalize,
                    // Creates CR for epoch 3
                    // Sets MRCR to epoch 3
                    // Clears CR for epoch 1
                    // Creates CR for epoch 4
                    // Clears CR for epoch 2
                    TestAction.Delegate,
                    // Moves to epoch 4
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 4
                    // Sets MRCR to epoch 4
                    // Clears CR for epoch 3
                    // Creates CR for epoch 5
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 4 }],
            );
        });
        it('delegate in epoch 1, then epoch 3', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 0
                    TestAction.CreatePool,
                    // Moves to epoch 1
                    TestAction.Finalize,
                    // Creates CR for epoch 1
                    // Sets MRCR to epoch 0
                    // Clears CR for epoch 0
                    // Creates CR for epoch 2
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Moves to epoch 3
                    TestAction.Finalize,
                ],
                [
                    // Creates CR for epoch 3
                    // Sets MRCR to epoch 3
                    // Clears CR for epoch 1
                    // Creates CR for epoch 4
                    // Clears CR for epoch 2
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 3 }],
            );
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
