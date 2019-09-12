import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, describe, expect, txDefaults } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs, DecodedLogArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts, TestCumulativeRewardTrackingEventArgs , TestCumulativeRewardTrackingSetMostRecentCumulativeRewardEventArgs, TestCumulativeRewardTrackingSetCumulativeRewardEventArgs, TestCumulativeRewardTrackingUnsetCumulativeRewardEventArgs} from '../src';

import { FinalizerActor } from './actors/finalizer_actor';
import { StakerActor } from './actors/staker_actor';
import { deployAndConfigureContractsAsync, StakingApiWrapper } from './utils/api_wrapper';
import { toBaseUnitAmount } from './utils/number_utils';
import { MembersByPoolId, OperatorByPoolId, StakeInfo, StakeStatus } from './utils/types';
import { TestCumulativeRewardTrackingContract } from '../generated-wrappers/test_cumulative_reward_tracking';
import { CumulativeRewardTrackingSimulation,  TestAction} from './utils/cumulative_reward_tracking_simulation';

// tslint:disable:no-unnecessary-type-assertion
// tslint:disable:max-file-line-count
blockchainTests.resets.only('Cumulative Reward Tracking', env => {
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
        it('should set cumulative reward when a pool is created', async () => {
            await simulation.runTestAsync(
                [],
                [
                    TestAction.CreatePool
                ],
                [
                    {event: 'SetCumulativeReward', epoch: 0},
                    {event: 'SetMostRecentCumulativeReward', epoch: 0}
                ]
            );
        });
        it('should record a CR and shift the most recent CR when a reward is earned', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool,      // creates CR in epoch 0
                    TestAction.Delegate,        // does nothing wrt CR, as there is alread a CR set for this epoch.
                    TestAction.Finalize,        // moves to epoch 1
                    TestAction.PayProtocolFee
                ],
                [
                    TestAction.Finalize         // adds a CR for epoch 1, plus updates most recent CR
                ],
                [
                    {event: 'SetCumulativeReward', epoch: 1},
                    {event: 'SetMostRecentCumulativeReward', epoch: 1}
                ]
            );
        });
        it('should not record a CR when one already exists', async () => {
            // A CR is recorded when we create the pool. A staker then delegates in the same epoch,
            // Ddelegating would usually record the cumulative reward for this epoch, but
            // it already exists from creating the pool.
            return await simulation.runTestAsync(
                [
                    TestAction.CreatePool   // creates CR in epoch 0
                ],

                [
                    TestAction.Delegate     // does nothign wrt CR, as there is alread a CR set for this epoch.
                ],
                []
            );
        });
        it('should (i) record cumulative reward when delegating for first time, and (ii) unset most recent cumulative reward given it has no dependents', async () => {
            // since there was no delegation in epoch 0 there is no longer a dependency on the CR for epoch 0
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool,
                    TestAction.Finalize
                ],
                [
                    TestAction.Delegate
                ],
                [
                    {event: 'SetCumulativeReward', epoch: 1},
                    {event: 'SetMostRecentCumulativeReward', epoch: 1},
                    {event: 'UnsetCumulativeReward', epoch: 0}
                ]
            );
        });
        it('should (i) record CR when delegating for first time, and (ii) NOT unset most recent CR given it has dependents', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool,  // creates CR in epoch 0
                    TestAction.Delegate,    // does nothign wrt CR, as there is alread a CR set for this epoch.
                    TestAction.Finalize     // moves to epoch 1
                ],
                [
                    TestAction.Delegate     // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                ],
                [
                    {event: 'SetCumulativeReward', epoch: 1},
                    {event: 'SetMostRecentCumulativeReward', epoch: 1},
                ]
            );
        });
        it('should not unset the most recent CR, even if there are no delegators dependent on it', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool,  // creates CR in epoch 0
                    TestAction.Finalize,    // moves to epoch 1
                    TestAction.Delegate,    // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                ],
                [
                    TestAction.Undelegate,  // does nothing. This delegator no longer has dependency, but the most recent CR is 1 so we don't remove.
                ],
                []
            );
        });
        it('should update most recent CR and set dependencies for CR when undelegating.', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool,  // creates CR in epoch 0
                    TestAction.Finalize,    // moves to epoch 1
                    TestAction.Delegate,    // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                    TestAction.Finalize,    // moves to epoch 2
                ],
                [
                    TestAction.Undelegate,  // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [
                    {event: 'SetCumulativeReward', epoch: 2},
                    {event: 'SetMostRecentCumulativeReward', epoch: 2},
                ]
            );
        });
        it('should update most recent CR and set dependencies for CR when delegating.', async () => {
            await simulation.runTestAsync(
                [
                    TestAction.CreatePool,  // creates CR in epoch 0
                    TestAction.Finalize,    // moves to epoch 1
                    TestAction.Delegate,    // copies CR from epoch 0 to epoch 1. Sets most recent CR to epoch 1.
                    TestAction.Finalize,    // moves to epoch 2
                ],
                [
                    TestAction.Delegate,  // copies CR from epoch 1 to epoch 2. Sets most recent CR to epoch 2.
                ],
                [
                    {event: 'SetCumulativeReward', epoch: 2},
                    {event: 'SetMostRecentCumulativeReward', epoch: 2},
                ]
            );
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
