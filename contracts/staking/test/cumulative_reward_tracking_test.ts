import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, describe } from '@0x/contracts-test-utils';
import * as _ from 'lodash';

import { artifacts } from '../src';

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
        stakingApiWrapper = await deployAndConfigureContractsAsync(env, owner, erc20Wrapper, artifacts.TestStaking);
        simulation = new CumulativeRewardTrackingSimulation(stakingApiWrapper, actors);
        await simulation.deployAndConfigureTestContractsAsync(env);
    });

    describe('Tracking Cumulative Rewards (CR)', () => {
        it('should set CR when a pool is created at epoch 0', async () => {
            await simulation.runTestAsync([], [TestAction.CreatePool], [{ event: 'SetCumulativeReward', epoch: 0 }]);
        });
        it('should set CR and Most Recent CR when a pool is created in epoch >0', async () => {
            await simulation.runTestAsync(
                [TestAction.Finalize],
                [TestAction.CreatePool],
                [{ event: 'SetCumulativeReward', epoch: 1 }, { event: 'SetMostRecentCumulativeReward', epoch: 1 }],
            );
        });
        it('should not set CR or Most Recent CR when values already exist for the current epoch', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                ],

                [
                    TestAction.Delegate, // does nothing wrt CR, as there is alread a CR set for this epoch.
                ],
                [],
            );
        });
        it('should not set CR or Most Recent CR when user re-delegates and values already exist for the current epoch', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Delegate, // does nothing wrt CR, as there is alread a CR set for this epoch.
                ],
                [
                    TestAction.Delegate, // does nothing wrt CR, as there is alread a CR set for this epoch.
                ],
                [],
            );
        });
        it('should not set CR or Most Recent CR when user undelegagtes and values already exist for the current epoch', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Delegate, // does nothing wrt CR, as there is alread a CR set for this epoch.
                ],
                [
                    TestAction.Undelegate, // does nothing wrt CR, as there is alread a CR set for this epoch.
                ],
                [],
            );
        });
        it('should (i) set CR and Most Recent CR when delegating, and (ii) unset previous Most Recent CR if there are no dependencies', async () => {
            // since there was no delegation in epoch 0 there is no longer a dependency on the CR for epoch 0
            await simulation.runTestAsync(
                [TestAction.CreatePool, TestAction.Finalize],
                [TestAction.Delegate],
                [
                    { event: 'SetCumulativeReward', epoch: 1 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 1 },
                    { event: 'UnsetCumulativeReward', epoch: 0 },
                ],
            );
        });
        it('should (i) set CR and Most Recent CR when delegating, and (ii) NOT unset previous Most Recent CR if there are dependencies', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Delegate, // does nothing wrt CR, as there is alread a CR set for this epoch.
                    TestAction.Finalize, // moves to epoch 1
                ],
                [
                    TestAction.Delegate, // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                ],
                [{ event: 'SetCumulativeReward', epoch: 1 }, { event: 'SetMostRecentCumulativeReward', epoch: 1 }],
            );
        });
        it('should not unset the current Most Recent CR, even if there are no dependencies', async () => {
            // note - we never unset the current Most Recent CR; only ever a previous value - given there are no depencies from delegators.
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                ],
                [
                    TestAction.Undelegate, // does nothing. This delegator no longer has dependency, but the most recent CR is 1 so we don't remove.
                ],
                [],
            );
        });
        it('should set CR and update Most Recent CR when delegating more stake', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                    TestAction.Finalize, // moves to epoch 2
                ],
                [
                    TestAction.Delegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [{ event: 'SetCumulativeReward', epoch: 2 }, { event: 'SetMostRecentCumulativeReward', epoch: 2 }],
            );
        });
        it('should set CR and update Most Recent CR when undelegating', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                    TestAction.Finalize, // moves to epoch 2
                ],
                [
                    TestAction.Undelegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [{ event: 'SetCumulativeReward', epoch: 2 }, { event: 'SetMostRecentCumulativeReward', epoch: 2 }],
            );
        });
        it('should set CR and update Most Recent CR when undelegating, plus remove the CR that is no longer depends on.', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Delegate,
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                    TestAction.Finalize, // moves to epoch 2
                ],
                [
                    TestAction.Undelegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [
                    { event: 'SetCumulativeReward', epoch: 2 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 2 },
                    { event: 'UnsetCumulativeReward', epoch: 0 },
                ],
            );
        });
        it('should set CR and update Most Recent CR when redelegating, plus remove the CR that it no longer depends on.', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Delegate, // does nothing wrt CR
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                    TestAction.Finalize, // moves to epoch 2
                ],
                [
                    TestAction.Delegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [
                    { event: 'SetCumulativeReward', epoch: 2 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 2 },
                    { event: 'UnsetCumulativeReward', epoch: 0 },
                ],
            );
        });
        it('should set CR and Most Recent CR when a reward is earned', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Delegate, // does nothing wrt CR, as there is alread a CR set for this epoch.
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.PayProtocolFee,
                ],
                [
                    TestAction.Finalize, // adds a CR for epoch 1, plus updates most recent CR
                ],
                [{ event: 'SetCumulativeReward', epoch: 1 }, { event: 'SetMostRecentCumulativeReward', epoch: 1 }],
            );
        });
        it('should set/unset CR and update Most Recent CR when redelegating, the epoch following a reward was earned', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Delegate, // does nothing wrt CR
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                    TestAction.Finalize, // moves to epoch 2
                    TestAction.PayProtocolFee, // this means a CR will be available upon finalization
                    TestAction.Finalize, // creates new CR for epoch 2; moves to epoch 3
                ],
                [
                    TestAction.Delegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [
                    { event: 'SetCumulativeReward', epoch: 3 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 3 },
                    { event: 'UnsetCumulativeReward', epoch: 0 },
                    { event: 'UnsetCumulativeReward', epoch: 1 },
                ],
            );
        });
        it('should set/unset CR and update Most Recent CR when redelegating, the epoch following a reward was earned', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Delegate, // does nothing wrt CR
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                    TestAction.Finalize, // moves to epoch 2
                    TestAction.PayProtocolFee, // this means a CR will be available upon finalization
                    TestAction.Finalize, // creates new CR for epoch 2; moves to epoch 3
                ],
                [
                    TestAction.Undelegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [
                    { event: 'SetCumulativeReward', epoch: 3 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 3 },
                    { event: 'UnsetCumulativeReward', epoch: 0 },
                    { event: 'UnsetCumulativeReward', epoch: 1 },
                ],
            );
        });
        it('should set/unset CR and update Most Recent CR when redelegating, one full epoch after a reward was earned', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Delegate, // does nothing wrt CR
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                    TestAction.Finalize, // moves to epoch 2
                    TestAction.PayProtocolFee, // this means a CR will be available upon finalization
                    TestAction.Finalize, // creates new CR for epoch 2; moves to epoch 3
                    TestAction.Finalize, // moves to epoch 4
                ],
                [
                    TestAction.Delegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [
                    { event: 'SetCumulativeReward', epoch: 3 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 3 },
                    { event: 'UnsetCumulativeReward', epoch: 2 },
                    { event: 'SetCumulativeReward', epoch: 4 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 4 },
                    { event: 'UnsetCumulativeReward', epoch: 0 },
                    { event: 'UnsetCumulativeReward', epoch: 1 },
                ],
            );
        });
        it('should set/unset CR and update Most Recent CR when redelegating, one full epoch after a reward was earned', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Delegate, // does nothing wrt CR
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                    TestAction.Finalize, // moves to epoch 2
                    TestAction.PayProtocolFee, // this means a CR will be available upon finalization
                    TestAction.Finalize, // creates new CR for epoch 2; moves to epoch 3
                ],
                [
                    TestAction.Undelegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [
                    { event: 'SetCumulativeReward', epoch: 3 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 3 },
                    { event: 'UnsetCumulativeReward', epoch: 0 },
                    { event: 'UnsetCumulativeReward', epoch: 1 },
                ],
            );
        });
        it('should set/unset CR and update Most Recent CR when delegating for the first time in an epoch with no CR', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.PayProtocolFee, // this means a CR will be available upon finalization
                    TestAction.Finalize, // creates new CR for epoch 0; moves to epoch 1
                ],
                [
                    TestAction.Delegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [
                    { event: 'SetCumulativeReward', epoch: 1 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 1 },
                    { event: 'UnsetCumulativeReward', epoch: 0 },
                ],
            );
        });
        it('should set/unset CR and update Most Recent CR when delegating for the first time in an epoch with no CR, after an epoch where a reward was earned', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Finalize, // creates new CR for epoch 0; moves to epoch 1
                ],
                [
                    TestAction.Delegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [
                    { event: 'SetCumulativeReward', epoch: 1 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 1 },
                    { event: 'UnsetCumulativeReward', epoch: 0 },
                ],
            );
        });
        it('should set CR and update Most Recent CR when delegating in two subsequent epochs', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 0 to epoch 1.
                    TestAction.Finalize, // moves to epoch 1
                ],
                [
                    TestAction.Delegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [{ event: 'SetCumulativeReward', epoch: 2 }, { event: 'SetMostRecentCumulativeReward', epoch: 2 }],
            );
        });
        it('should set/unset CR and update Most Recent CR when delegating in two subsequent epochs, when there is an old CR to clear', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                    TestAction.Finalize, //  moves to epoch 2
                    TestAction.Finalize, // moves to epoch 3
                    TestAction.Delegate, // copies CR from epoch 1 to epoch 3. Sets most recent CR to epoch 3.
                    TestAction.Finalize, // moves to epoch 4
                ],
                [
                    TestAction.Delegate, // copies CR from epoch 1 to epoch 3. Sets most recent CR to epoch 3.
                ],
                [
                    { event: 'SetCumulativeReward', epoch: 4 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 4 },
                    { event: 'UnsetCumulativeReward', epoch: 2 },
                ],
            );
        });
        it('should set/unset CR and update Most Recent CR re-delegating after one full epoch', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                    TestAction.Finalize, //  moves to epoch 2
                    TestAction.Finalize, // moves to epoch 3
                ],
                [
                    TestAction.Delegate, // copies CR from epoch 1 to epoch 3. Sets most recent CR to epoch 3.
                ],
                [
                    { event: 'SetCumulativeReward', epoch: 2 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 2 },
                    { event: 'SetCumulativeReward', epoch: 3 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 3 },
                    { event: 'UnsetCumulativeReward', epoch: 1 },
                ],
            );
        });
        it('should set/unset CR and update Most Recent CR when redelegating after receiving a reward', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool, // creates CR in epoch 0
                    TestAction.Delegate, // does nothing wrt CR
                    TestAction.Finalize, // moves to epoch 1
                    TestAction.Delegate, // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                    TestAction.Finalize, // moves to epoch 2
                    TestAction.PayProtocolFee, // this means a CR will be available upon finalization
                    TestAction.Finalize, // creates new CR for epoch 2; moves to epoch 3
                ],
                [
                    TestAction.Undelegate, // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [
                    { event: 'SetCumulativeReward', epoch: 3 },
                    { event: 'SetMostRecentCumulativeReward', epoch: 3 },
                    { event: 'UnsetCumulativeReward', epoch: 0 },
                    { event: 'UnsetCumulativeReward', epoch: 1 },
                ],
            );
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
