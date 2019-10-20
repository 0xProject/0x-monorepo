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
        it('pool created at epoch 1', async () => {
            await simulation.runTestAsync([], [TestAction.CreatePool], []);
        });
        it('pool created in epoch >1', async () => {
            await simulation.runTestAsync([TestAction.Finalize], [TestAction.CreatePool], []);
        });
        it('delegating in the same epoch pool is created', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 1
                    TestAction.CreatePool,
                ],
                [
                    // Updates CR for epoch 1
                    // Creates CR for epoch 2
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 1 }],
            );
        });
        it('re-delegating in the same epoch', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 1
                    TestAction.CreatePool,
                ],
                [
                    // Updates CR for epoch 1
                    TestAction.Delegate,
                    // Updates CR for epoch 1
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 1 }],
            );
        });
        it('delegating in new epoch', async () => {
            // since there was no delegation in epoch 1 there is no longer a dependency on the CR for epoch 1
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 1
                    TestAction.CreatePool,
                    // Moves to epoch 2
                    TestAction.Finalize,
                ],
                [
                    // Creates a CR for epoch 2
                    // Sets MRCR to epoch 2
                    // Unsets the CR for epoch 1
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 2 }],
            );
        });
        it('re-delegating in a new epoch', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR in epoch 1
                    TestAction.CreatePool,
                    // Updates CR for epoch 1
                    // Creates CR for epoch 2
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 2
                    // Sets MRCR to epoch 2
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 2 }],
            );
        });
        it('delegating in epoch 2 then again in epoch 3', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 1
                    TestAction.CreatePool,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Creates CR for epoch 2
                    // Sets MRCR to epoch 2
                    TestAction.Delegate,
                    // Move to epoch 3
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 3
                    // Sets MRCR to epoch 3
                    // Creates CR for epoch 4
                    // Clears CR for epoch 2
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 3 }],
            );
        });
        it('delegate in epoch 2 then undelegate in epoch 3', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 1
                    TestAction.CreatePool,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Creates CR for epoch 2
                    // Sets MRCR to epoch 1
                    // Clears CR for epoch 1
                    // Creates CR for epoch 3
                    TestAction.Delegate,
                    // Moves to epoch 3
                    TestAction.Finalize,
                ],
                [
                    // Update CR for epoch 3
                    // Set MRCR to epoch 3
                    // Clear CR for epoch 2
                    TestAction.Undelegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 3 }],
            );
        });
        it('delegate in epoch 1 and epoch 2, then undelegate half in epoch 3', async () => {
            await simulation.runTestAsync(
                [
                    // Create CR for epoch 1
                    TestAction.CreatePool,
                    // Updates CR for epoch 1
                    // Sets MRCR to epoch 1
                    // Creates CR for epoch 2
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Updates CR for epoch 2
                    // Sets MRCR to epoch 2
                    // Creates CR for epoch 3
                    // Clears CR for epoch 1
                    TestAction.Delegate,
                    // Moves to epoch 3
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 3
                    // Sets MRCR to epoch 3
                    // Creates CR for epoch 4 (because there will still be stake)
                    // Clears CR for epoch 2
                    TestAction.Undelegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 3 }],
            );
        });
        it('delegate in epoch 2 and 3 then again in 3', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 1
                    TestAction.CreatePool,
                    // Updates CR for epoch 1
                    // Sets MRCR to epoch 1
                    // Creates CR for epoch 2
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Updates CR for epoch 2
                    // Sets MRCR to epoch 2
                    // Creates CR for epoch 3
                    // Clears CR for epoch 1
                    TestAction.Delegate,
                    // Moves to epoch 3
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 3
                    // Sets MRCR to epoch 3
                    // Creates CR for epoch 4
                    // Clears CR for epoch 2
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 3 }],
            );
        });
        it('delegate in epoch 1, earn reward in epoch 2', async () => {
            await simulation.runTestAsync(
                [
                    // Create CR for epoch 1
                    TestAction.CreatePool,
                    // Updates CR for epoch 1
                    // Sets MRCR to epoch 1
                    // Creates CR for epoch 2
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Credits pool with rewards
                    TestAction.PayProtocolFee,
                ],
                [
                    // Moves to epoch 3
                    // Creates CR for epoch 3
                    // Sets MRCR to epoch 3
                    TestAction.Finalize,
                ],
                [{ event: 'SetCumulativeReward', epoch: 3 }],
            );
        });
        it('delegate in epoch 1, epoch 3, earn reward in epoch 4, then delegate', async () => {
            await simulation.runTestAsync(
                [
                    // Create CR for epoch 1
                    TestAction.CreatePool,
                    // Updates CR for epoch 1
                    // Sets MRCR to epoch 1
                    // Creates CR for epoch 2
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Updates CR for epoch 2
                    // Sets MRCR to epoch 2
                    // Creates CR for epoch 3
                    // Clears CR for epoch 1
                    TestAction.Delegate,
                    // Moves to epoch 3
                    TestAction.Finalize,
                    // Credits pool with rewards
                    TestAction.PayProtocolFee,
                    // Moves to epoch 4
                    // Creates CR for epoch 4
                    // Sets MRCR to epoch 4
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 4
                    // Creates CR for epoch 5
                    // Clears CR for epoch 2
                    // Clears CR for epoch 3
                    TestAction.Delegate,
                ],
                [],
            );
        });
        it('delegate in epoch 1 and 2, earn reward in epoch 4, then undelegate half', async () => {
            await simulation.runTestAsync(
                [
                    // Create CR for epoch 1
                    TestAction.CreatePool,
                    // Updates CR for epoch 1
                    // Sets MRCR to epoch 1
                    // Creates CR for epoch 2
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Updates CR for epoch 2
                    // Sets MRCR to epoch 2
                    // Creates CR for epoch 3
                    // Clears CR for epoch 1
                    TestAction.Delegate,
                    // Moves to epoch 3
                    TestAction.Finalize,
                    // Credits pool with rewards
                    TestAction.PayProtocolFee,
                    // Moves to epoch 4
                    // Creates CR for epoch 4
                    // Sets MRCR to epoch 4
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 4
                    // Creates CR for epoch 5 (because there is still stake remaming)
                    // Clears CR for epoch 2
                    // Clears CR for epoch 3
                    TestAction.Undelegate,
                ],
                [],
            );
        });
        it('delegate in epoch 2, 3, earn rewards in epoch 4, skip to epoch 5, then delegate', async () => {
            await simulation.runTestAsync(
                [
                    // Create CR for epoch 1
                    TestAction.CreatePool,
                    // Updates CR for epoch 1
                    // Sets MRCR to epoch 1
                    // Creates CR for epoch 2
                    TestAction.Delegate,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Updates CR for epoch 2
                    // Sets MRCR to epoch 2
                    // Creates CR for epoch 3
                    // Clears CR for epoch 1
                    TestAction.Delegate,
                    // Moves to epoch 3
                    TestAction.Finalize,
                    // Credits pool with rewards
                    TestAction.PayProtocolFee,
                    // Moves to epoch 4
                    // Creates CR for epoch 4
                    // Sets MRCR to epoch 4
                    TestAction.Finalize,
                    // Moves to epoch 5
                    TestAction.Finalize,
                ],
                [
                    // Creates CR for epoch 5
                    // Sets MRCR to epoch 5
                    // Clears CR for epoch 4
                    // Creates CR for epoch 6
                    // Clears CR for epoch 2
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 5 }],
            );
        });
        it('earn reward in epoch 2 with no stake, then delegate', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 1
                    TestAction.CreatePool,
                    // Credit pool with rewards
                    TestAction.PayProtocolFee,
                    // Moves to epoch 2
                    // That's it, because there's no active pools.
                    TestAction.Finalize,
                ],
                [
                    // Updates CR to epoch 2
                    // Sets MRCR to epoch 2
                    // Clears CR for epoch 1
                    // Creates CR for epoch 3
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 2 }],
            );
        });
        it('delegate in epoch 2, 4, then delegate in epoch 5', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 1
                    TestAction.CreatePool,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Creates CR for epoch 2
                    // Sets MRCR to epoch 1
                    // Clears CR for epoch 1
                    // Creates CR for epoch 3
                    TestAction.Delegate,
                    // Moves to epoch 3
                    TestAction.Finalize,
                    // Moves to epoch 4
                    TestAction.Finalize,
                    // Creates CR for epoch 4
                    // Sets MRCR to epoch 4
                    // Clears CR for epoch 2
                    // Creates CR for epoch 5
                    // Clears CR for epoch 3
                    TestAction.Delegate,
                    // Moves to epoch 5
                    TestAction.Finalize,
                ],
                [
                    // Updates CR for epoch 5
                    // Sets MRCR to epoch 5
                    // Clears CR for epoch 4
                    // Creates CR for epoch 6
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 5 }],
            );
        });
        it('delegate in epoch 2, then epoch 4', async () => {
            await simulation.runTestAsync(
                [
                    // Creates CR for epoch 1
                    TestAction.CreatePool,
                    // Moves to epoch 2
                    TestAction.Finalize,
                    // Creates CR for epoch 2
                    // Sets MRCR to epoch 1
                    // Clears CR for epoch 1
                    // Creates CR for epoch 3
                    TestAction.Delegate,
                    // Moves to epoch 3
                    TestAction.Finalize,
                    // Moves to epoch 4
                    TestAction.Finalize,
                ],
                [
                    // Creates CR for epoch 4
                    // Sets MRCR to epoch 4
                    // Clears CR for epoch 2
                    // Creates CR for epoch 5
                    // Clears CR for epoch 3
                    TestAction.Delegate,
                ],
                [{ event: 'SetCumulativeReward', epoch: 4 }],
            );
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
