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
        //testCumulativeRewardTracking = stakingApiWrapper.stakingContract as any as TestCumulativeRewardTrackingContract;

        // setup stakers
        stakers = [new StakerActor(actors[0], stakingApiWrapper), new StakerActor(actors[1], stakingApiWrapper)];
        // setup pools
        poolOperator = actors[2];
        //poolId = await stakingApiWrapper.utils.createStakingPoolAsync(poolOperator, 50, true); // add operator as maker
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

    const payProtocolFeeAndFinalize = async (_fee?: BigNumber): Promise<TransactionReceiptWithDecodedLogs> => {
        const fee = _fee !== undefined ? _fee : ZERO;
        if (!fee.eq(ZERO)) {
            await stakingApiWrapper.stakingContract.payProtocolFee.awaitTransactionSuccessAsync(
                poolOperator,
                takerAddress,
                fee,
                { from: exchangeAddress, value: fee },
            );
        }

        return await stakingApiWrapper.utils.skipToNextEpochAsync();
    };

    const getTestLogs = (txReceiptLogs: DecodedLogArgs[]): {event: string, args: TestCumulativeRewardTrackingEventArgs}[] => {
        const logs = [];
        for (const log of txReceiptLogs) {
            console.log(`LOG TO MAYBE ASSERT - ${JSON.stringify(log, null, 4)}`);

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

        console.log(`LOGS TO ASSERT = ${JSON.stringify(logs, null ,4)}`);
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
    interface TestParams {
        shouldDelegate: Boolean;
    }

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
        console.log(JSON.stringify(testLogs, null, 4));
        assertLogs(expectedTestLogs, testLogs);
    }

    describe('Cumulative Reward Tracking', () => {
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

        it('should record a cumulative reward and shift the most recent cumulative reward when a reward is earned', async () => {
            await runTest(
                // initialize with one pool with delegators that will earn a protocol fee on next finalization.
                [
                    TestAction.CreatePool,
                    TestAction.Delegate,
                    TestAction.Finalize,
                    TestAction.PayProtocolFee
                ],
                // finalize and observe an update to the cumulative reward
                [TestAction.Finalize],
                [
                    {event: 'SetCumulativeReward', epoch: 1},
                    {event: 'SetMostRecentCumulativeReward', epoch: 1}
                ]
            );
        });

        it('should not record a cumulative reward when one already exists', async () => {
            await runTest(
                // the test pool was created in epoch 0, so there is already a cumulative reward.
                [TestAction.CreatePool],
                // delegating would usually record the cumulative reward for this epoch, but
                // it already exists from creating the pool.
                [TestAction.Delegate],
                []
            );
        });


        it('should record a cumulative reward when delegating', async () => {
            await runTest(
                [TestAction.CreatePool,
                TestAction.Finalize
                ],
                [TestAction.Delegate],
                [
                    {event: 'SetCumulativeReward', epoch: 1},
                    {event: 'SetMostRecentCumulativeReward', epoch: 1}
                ]
            );
        });

        it.only('should record and unrecord a cumulative reward when adding stake for the second time in the same epoch', async () => {
            // delegated for the first time in epoch 1 (so current epoch balance is zero).
            // then we delegated again in epoch 1.
            // since we're not staked right now, we don't have a dependency on epoch 0,
            // so we only set a cumulative reward for the current epoch.
            await runTest(
                [
                    TestAction.CreatePool,
                    TestAction.Finalize
                ],
                [
                    TestAction.Delegate,
                    TestAction.Undelegate,
                ],
                [
                    {event: 'SetCumulativeReward', epoch: 1},
                    {event: 'SetMostRecentCumulativeReward', epoch: 1}
                ]
            );
        });
/*



        it('should record and unrecord a cumulative reward when adding stake for the second time in the same epoch', async () => {


            await testCumulativeRewardTracking.initializeTest.awaitTransactionSuccessAsync(
                stakers[0].getOwner(),
                poolId,
                {
                    isInitialized: true,
                    currentEpoch: 1,
                    currentEpochBalance: toBaseUnitAmount(0),
                    nextEpochBalance: toBaseUnitAmount(4),
                },
                [
                    { // cumulative reward at epoch 0
                        poolId,
                        epoch: ZERO,
                        value: {
                            numerator: ZERO,
                            denominator: toBaseUnitAmount(1)
                        }
                    }
                ],
                ZERO,
                new BigNumber(1) // now it's epoch 1, so we need to set the reward
            );
            const amountToStake = toBaseUnitAmount(100);
            await testCumulativeRewardTracking.stake.awaitTransactionSuccessAsync(amountToStake, {from: stakers[0].getOwner()});
            // it will be created
            const txReceipt =  await testCumulativeRewardTracking.moveStake.awaitTransactionSuccessAsync(new StakeInfo(StakeStatus.Active), {status: StakeStatus.Delegated, poolId}, amountToStake, {from: stakers[0].getOwner()});
            console.log(JSON.stringify(txReceipt, null, 4));
            const expectedLogSequence = [
                {event: 'SetCumulativeReward', epoch: 1},
                {event: 'SetMostRecentCumulativeReward', epoch: 1},
            ];
            assertLogs(expectedLogSequence, txReceipt);
        });



        it.skip('should record and unrecord a cumulative reward when adding stake for the second time in the same epoch', async () => {
            // delegated for the in epoch 0 and epoch 1.
            // it is currently epoch 1 and we are adding stake.
            //
            await testCumulativeRewardTracking.initializeTest.awaitTransactionSuccessAsync(
                stakers[0].getOwner(),
                poolId,
                {
                    isInitialized: true,
                    currentEpoch: 1,
                    currentEpochBalance: toBaseUnitAmount(4),
                    nextEpochBalance: toBaseUnitAmount(4),
                },
                [
                    { // cumulative reward at epoch 0
                        poolId,
                        epoch: ZERO,
                        value: {
                            numerator: ZERO,
                            denominator: toBaseUnitAmount(1)
                        }
                    }
                ],
                ZERO,
                new BigNumber(1) // now it's epoch 1, so we need to set the reward
            );
            const amountToStake = toBaseUnitAmount(100);
            await testCumulativeRewardTracking.stake.awaitTransactionSuccessAsync(amountToStake, {from: stakers[0].getOwner()});
            // it will be created
            const txReceipt =  await testCumulativeRewardTracking.moveStake.awaitTransactionSuccessAsync(new StakeInfo(StakeStatus.Active), {status: StakeStatus.Delegated, poolId}, amountToStake, {from: stakers[0].getOwner()});
            console.log(JSON.stringify(txReceipt, null, 4));
            const expectedLogSequence = [
                {event: 'SetCumulativeReward', epoch: 1},
                {event: 'SetMostRecentCumulativeReward', epoch: 1},
                {event: 'UnsetCumulativeReward', epoch: 0},
            ];
            assertLogs(expectedLogSequence, txReceipt);
        });
        */
    });
});
// tslint:enable:no-unnecessary-type-assertion
