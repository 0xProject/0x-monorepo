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
        poolId = await stakingApiWrapper.utils.createStakingPoolAsync(poolOperator, 0, true); // add operator as maker
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
                new BigNumber(0)
            );
            const txReceipt = await testCumulativeRewardTracking.createStakingPool.awaitTransactionSuccessAsync(0, false, {from: poolOperator});
            const expectedLogSequence = [
                {event: 'SetCumulativeReward', epoch: 0},
                {event: 'SetMostRecentCumulativeReward', epoch: 0}
            ];
            assertLogs(expectedLogSequence, txReceipt);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
