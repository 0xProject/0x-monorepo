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

// tslint:disable:no-unnecessary-type-assertion
// tslint:disable:max-file-line-count
blockchainTests.resets.only('Cumulative Reward Tracking', env => {
    // constants
    const ZERO = new BigNumber(0);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let actors: string[];
    let exchangeAddress: string;
    let takerAddress: string;
    // wrappers
    let testCumulativeRewardTrackingContract: TestCumulativeRewardTrackingContract;
    let testStakingProxy: TestCumulativeRewardTrackingContract;
    let stakingApiWrapper: StakingApiWrapper;
    // let testWrapper: TestRewardBalancesContract;
    let erc20Wrapper: ERC20Wrapper;
    // test parameters
    let stakers: StakerActor[];
    let poolId: string;
    let poolOperator: string;
    let finalizer: FinalizerActor;
    // tests
    before(async () => {
        // create accounts
        accounts = await env.getAccountAddressesAsync();
        owner = accounts[0];
        exchangeAddress = accounts[1];
        takerAddress = accounts[2];
        actors = accounts.slice(3);
        // set up ERC20Wrapper
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        // deploy staking contracts
        stakingApiWrapper = await deployAndConfigureContractsAsync(env, owner, erc20Wrapper, artifacts.TestStaking);

        testCumulativeRewardTrackingContract = await TestCumulativeRewardTrackingContract.deployFrom0xArtifactAsync(
            artifacts.TestCumulativeRewardTracking,
            env.provider,
            txDefaults,
            artifacts
        );

        testStakingProxy = new TestCumulativeRewardTrackingContract(
            stakingApiWrapper.stakingProxyContract.address,
            env.provider,
            txDefaults,
            { "name": artifacts.TestCumulativeRewardTracking.compilerOutput.abi }
        );

        // setup stakers
        stakers = [new StakerActor(actors[0], stakingApiWrapper), new StakerActor(actors[1], stakingApiWrapper)];
        // setup pools
        poolOperator = actors[2];
        // set exchange address
        await stakingApiWrapper.stakingContract.addExchangeAddress.awaitTransactionSuccessAsync(exchangeAddress);
        // associate operators for tracking in Finalizer
        const operatorByPoolId: OperatorByPoolId = {};
        operatorByPoolId[poolId] = poolOperator;
        operatorByPoolId[poolId] = poolOperator;
        // associate actors with pools for tracking in Finalizer
        const membersByPoolId: MembersByPoolId = {};
        membersByPoolId[poolId] = [actors[0], actors[1]];
        membersByPoolId[poolId] = [actors[0], actors[1]];
        // create Finalizer actor
        finalizer = new FinalizerActor(actors[3], stakingApiWrapper, [poolId], operatorByPoolId, membersByPoolId);
    });


    const getTestLogs = (txReceiptLogs: DecodedLogArgs[]): {event: string, args: TestCumulativeRewardTrackingEventArgs}[] => {
        const logs = [];
        for (const log of txReceiptLogs) {

            if ((log as any).event === 'SetMostRecentCumulativeReward') {
                logs.push({
                    event: 'SetMostRecentCumulativeReward',
                    args: (log as any).args as TestCumulativeRewardTrackingSetMostRecentCumulativeRewardEventArgs
                });
            } else if ((log as any).event === 'SetCumulativeReward') {
                logs.push({
                    event: 'SetCumulativeReward',
                    args: (log as any).args as TestCumulativeRewardTrackingSetCumulativeRewardEventArgs
                });
            } else if ((log as any).event === 'UnsetCumulativeReward') {
                logs.push({
                    event: 'UnsetCumulativeReward',
                    args: (log as any).args as TestCumulativeRewardTrackingUnsetCumulativeRewardEventArgs
                });
            }
        }

        return logs;
    }

    const assertLogs = (expectedSequence: {event: string, epoch: number}[], txReceiptLogs: DecodedLogArgs[]) => {
        const logs = getTestLogs(txReceiptLogs);
        // console.log(JSON.stringify(txReceipt.logs, null ,4));
        expect(logs.length).to.be.equal(expectedSequence.length);
        for (let i = 0; i < expectedSequence.length; i++) {
            const expectedLog = expectedSequence[i];
            const actualLog = logs[i];
            expect(expectedLog.event, `testing event name of ${JSON.stringify(expectedLog)}`).to.be.equal(actualLog.event);
            expect(expectedLog.epoch, `testing epoch of ${JSON.stringify(expectedLog)}`).to.be.equal(actualLog.args.epoch.toNumber());
        }
    }

    enum TestAction {
        Finalize,
        Delegate,
        Undelegate,
        PayProtocolFee,
        CreatePool
    };

    const executeActions = async (actions: TestAction[]): Promise<DecodedLogArgs[]> => {
        const staker = stakers[0].getOwner();
        const amountToStake = toBaseUnitAmount(100);
        const protocolFeeAmount = new BigNumber(10);

        let logs: DecodedLogArgs[] = [];
        for (const action of actions) {
            let txReceipt: TransactionReceiptWithDecodedLogs;
            switch (action) {
                case TestAction.Finalize:
                    txReceipt = await stakingApiWrapper.utils.skipToNextEpochAsync();
                    break;

                case TestAction.Delegate:
                    await stakingApiWrapper.stakingContract.stake.sendTransactionAsync(amountToStake, {from: staker});
                    txReceipt = await stakingApiWrapper.stakingContract.moveStake.awaitTransactionSuccessAsync(new StakeInfo(StakeStatus.Active), new StakeInfo(StakeStatus.Delegated, poolId), amountToStake, {from: staker});
                    break;

                case TestAction.Undelegate:
                    txReceipt = await stakingApiWrapper.stakingContract.moveStake.awaitTransactionSuccessAsync(new StakeInfo(StakeStatus.Delegated, poolId), new StakeInfo(StakeStatus.Active), amountToStake, {from: staker});
                    break;

                case TestAction.PayProtocolFee:
                    txReceipt = await stakingApiWrapper.stakingContract.payProtocolFee.awaitTransactionSuccessAsync(poolOperator, takerAddress, protocolFeeAmount, {from: exchangeAddress, value: protocolFeeAmount});
                    break;

                case TestAction.CreatePool:
                    txReceipt = await stakingApiWrapper.stakingContract.createStakingPool.awaitTransactionSuccessAsync(0, true, {from: poolOperator});
                    const createStakingPoolLog = txReceipt.logs[0];
                    poolId = (createStakingPoolLog as any).args.poolId;
                    break;

                default:
                    throw new Error('Unrecognized test action');
            }
            logs = logs.concat(txReceipt.logs);
        }

        return logs;
    }

    const runTest = async (initActions: TestAction[], testActions: TestAction[], expectedTestLogs: {event: string, epoch: number}[]) => {
        await executeActions(initActions);
        await stakingApiWrapper.stakingProxyContract.attachStakingContract.sendTransactionAsync(testCumulativeRewardTrackingContract.address);
        const testLogs = await executeActions(testActions);
        console.log(testLogs);
        assertLogs(expectedTestLogs, testLogs);
    }

    describe('Tracking Cumulative Rewards (CR)', () => {
        it('should set cumulative reward when a pool is created', async () => {
            await runTest(
                [],
                [TestAction.CreatePool],
                [
                    {event: 'SetCumulativeReward', epoch: 0},
                    {event: 'SetMostRecentCumulativeReward', epoch: 0}
                ]
            );
        });
        it('should record a CR and shift the most recent CR when a reward is earned', async () => {
            await runTest(
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
            await runTest(
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
            await runTest(
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
            await runTest(
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
            await runTest(
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
            await runTest(
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
            await runTest(
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
