import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, describe, expect, txDefaults } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
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
    let testCumulativeRewardTracking: TestCumulativeRewardTrackingContract;
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
        stakingApiWrapper = await deployAndConfigureContractsAsync(env, owner, erc20Wrapper, artifacts.TestCumulativeRewardTracking);
        testCumulativeRewardTracking = new TestCumulativeRewardTrackingContract(
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
        poolId = await stakingApiWrapper.utils.createStakingPoolAsync(poolOperator, 50, true); // add operator as maker
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

    const getTestLogs = (txReceipt: TransactionReceiptWithDecodedLogs): {event: string, args: TestCumulativeRewardTrackingEventArgs}[] => {
        const logs = [];
        for (const log of txReceipt.logs) {
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

    const assertLogs = (expectedSequence: {event: string, epoch: number}[], txReceipt: TransactionReceiptWithDecodedLogs) => {
        const logs = getTestLogs(txReceipt);
        // console.log(JSON.stringify(txReceipt.logs, null ,4));
        expect(logs.length).to.be.equal(expectedSequence.length);
        for (let i = 0; i < expectedSequence.length; i++) {
            const expectedLog = expectedSequence[i];
            const actualLog = logs[i];
            expect(expectedLog.event, `testing event name of ${JSON.stringify(expectedLog)}`).to.be.equal(actualLog.event);
            expect(expectedLog.epoch, `testing epoch of ${JSON.stringify(expectedLog)}`).to.be.equal(actualLog.args.epoch.toNumber());
        }
    }

    describe('Cumulative Reward Tracking', () => {
        it('should set cumulative reward when a pool is created', async () => {
            await testCumulativeRewardTracking.initializeTest.awaitTransactionSuccessAsync(
                stakers[0].getOwner(),
                poolId,
                {
                    isInitialized: false,
                    currentEpoch: ZERO,
                    currentEpochBalance: ZERO,
                    nextEpochBalance: ZERO,
                },
                [],
                ZERO,
                ZERO
            );
            const txReceipt = await testCumulativeRewardTracking.createStakingPool.awaitTransactionSuccessAsync(0, false, {from: poolOperator});
            const expectedLogSequence = [
                {event: 'SetCumulativeReward', epoch: 0},
                {event: 'SetMostRecentCumulativeReward', epoch: 0}
            ];
            assertLogs(expectedLogSequence, txReceipt);
        });

        it('should record a cumulative reward and shift the most recent cumulative reward when a reward is earned', async () => {
            await testCumulativeRewardTracking.initializeTest.awaitTransactionSuccessAsync(
                stakers[0].getOwner(),
                poolId,
                {
                    isInitialized: true,
                    currentEpoch: 1,
                    currentEpochBalance: toBaseUnitAmount(100),
                    nextEpochBalance: toBaseUnitAmount(100),
                },
                [],
                ZERO,
                new BigNumber(1)
            );
            const reward = toBaseUnitAmount(10);
            const txReceipt =  await payProtocolFeeAndFinalize(reward);
            const expectedLogSequence = [
                {event: 'SetCumulativeReward', epoch: 1},
                {event: 'SetMostRecentCumulativeReward', epoch: 1}
            ];
            assertLogs(expectedLogSequence, txReceipt);
        });

        it('should not record a cumulative reward when one already exists', async () => {
            await testCumulativeRewardTracking.initializeTest.awaitTransactionSuccessAsync(
                stakers[0].getOwner(),
                poolId,
                {
                    isInitialized: false,
                    currentEpoch: 0,
                    currentEpochBalance: toBaseUnitAmount(0),
                    nextEpochBalance: toBaseUnitAmount(0),
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
                new BigNumber(0) // currently epoch 0, so no need to record the reward
            );
            const amountToStake = toBaseUnitAmount(100);
            await testCumulativeRewardTracking.stake.awaitTransactionSuccessAsync(amountToStake, {from: stakers[0].getOwner()});
            const txReceipt =  await testCumulativeRewardTracking.moveStake.awaitTransactionSuccessAsync(new StakeInfo(StakeStatus.Active), {status: StakeStatus.Delegated, poolId}, amountToStake, {from: stakers[0].getOwner()});
            const expectedLogSequence: any[] = [];
            assertLogs(expectedLogSequence, txReceipt);
        });

        it('should record a cumulative reward when adding stake ', async () => {
            await testCumulativeRewardTracking.initializeTest.awaitTransactionSuccessAsync(
                stakers[0].getOwner(),
                poolId,
                {
                    isInitialized: false,
                    currentEpoch: 0,
                    currentEpochBalance: toBaseUnitAmount(0),
                    nextEpochBalance: toBaseUnitAmount(0),
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
            const txReceipt =  await testCumulativeRewardTracking.moveStake.awaitTransactionSuccessAsync(new StakeInfo(StakeStatus.Active), {status: StakeStatus.Delegated, poolId}, amountToStake, {from: stakers[0].getOwner()});
            console.log(JSON.stringify(txReceipt, null, 4));
            const expectedLogSequence = [
                {event: 'SetCumulativeReward', epoch: 1},
                {event: 'SetMostRecentCumulativeReward', epoch: 1}
            ];
            assertLogs(expectedLogSequence, txReceipt);
        });

        it('should record and unrecord a cumulative reward when adding stake for the second time in the same epoch', async () => {
            // delegated for the first time in epoch 1 (so current epoch balance is zero).
            // then we delegated again in epoch 1.
            // since we're not staked right now, we don't have a dependency on epoch 0,
            // so we only set a cumulative reward for the current epoch.

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



        it.only('should record and unrecord a cumulative reward when adding stake for the second time in the same epoch', async () => {
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
    });
});
// tslint:enable:no-unnecessary-type-assertion
