
import { BlockchainTestsEnvironment, expect, txDefaults } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs, DecodedLogArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts, TestCumulativeRewardTrackingEventArgs , TestCumulativeRewardTrackingSetMostRecentCumulativeRewardEventArgs, TestCumulativeRewardTrackingSetCumulativeRewardEventArgs, TestCumulativeRewardTrackingUnsetCumulativeRewardEventArgs} from '../../src';

import { StakeInfo, StakeStatus } from './types';

import { toBaseUnitAmount } from './number_utils';
import { TestCumulativeRewardTrackingContract } from '../../generated-wrappers/test_cumulative_reward_tracking';
import { StakingApiWrapper } from './api_wrapper';

export enum TestAction {
    Finalize,
    Delegate,
    Undelegate,
    PayProtocolFee,
    CreatePool
};

export class CumulativeRewardTrackingSimulation {
    private readonly _amountToStake = toBaseUnitAmount(100);
    private readonly _protocolFeeAmount = new BigNumber(10);
    private _stakingApiWrapper: StakingApiWrapper;
    private _testCumulativeRewardTrackingContract?: TestCumulativeRewardTrackingContract;
    private _staker: string;
    private _poolOperator: string;
    private _takerAddress: string;
    private _exchangeAddress: string;
    private _poolId: string;

    constructor(stakingApiWrapper: StakingApiWrapper, actors: string[]) {
        this._stakingApiWrapper = stakingApiWrapper;
        // setup actors
        this._staker = actors[0];
        this._poolOperator = actors[1];
        this._takerAddress = actors[2];
        this._exchangeAddress=  actors[3];
        this._poolId = "";
    }

    public async deployAndConfigureTestContractsAsync(env: BlockchainTestsEnvironment): Promise<void> {
        // set exchange address
        await this._stakingApiWrapper.stakingContract.addExchangeAddress.awaitTransactionSuccessAsync(this._exchangeAddress);
        this._testCumulativeRewardTrackingContract = await TestCumulativeRewardTrackingContract.deployFrom0xArtifactAsync(
            artifacts.TestCumulativeRewardTracking,
            env.provider,
            txDefaults,
            artifacts
        );
    }

    public getTestCumulativeRewardTrackingContract(): TestCumulativeRewardTrackingContract {
        if (this._testCumulativeRewardTrackingContract === undefined) {
            throw new Error(`Contract has not been deployed. Run 'deployAndConfigureTestContractsAsync'.`)
        }
        return this._testCumulativeRewardTrackingContract;
    }

    public async runTestAsync(initActions: TestAction[], testActions: TestAction[], expectedTestLogs: {event: string, epoch: number}[]): Promise<void> {
        await this._executeActionsAsync(initActions);
        await this._stakingApiWrapper.stakingProxyContract.attachStakingContract.awaitTransactionSuccessAsync(this.getTestCumulativeRewardTrackingContract().address);
        const testLogs = await this._executeActionsAsync(testActions);
        this._assertLogs(expectedTestLogs, testLogs);
    }

    private async _executeActionsAsync(actions: TestAction[]): Promise<DecodedLogArgs[]> {
        let logs: DecodedLogArgs[] = [];
        for (const action of actions) {
            let txReceipt: TransactionReceiptWithDecodedLogs;
            switch (action) {
                case TestAction.Finalize:
                    txReceipt = await this._stakingApiWrapper.utils.skipToNextEpochAsync();
                    break;

                case TestAction.Delegate:
                    await this._stakingApiWrapper.stakingContract.stake.sendTransactionAsync(this._amountToStake, {from: this._staker});
                    txReceipt = await this._stakingApiWrapper.stakingContract.moveStake.awaitTransactionSuccessAsync(new StakeInfo(StakeStatus.Active), new StakeInfo(StakeStatus.Delegated, this._poolId), this._amountToStake, {from: this._staker});
                    break;

                case TestAction.Undelegate:
                    txReceipt = await this._stakingApiWrapper.stakingContract.moveStake.awaitTransactionSuccessAsync(new StakeInfo(StakeStatus.Delegated, this._poolId), new StakeInfo(StakeStatus.Active), this._amountToStake, {from: this._staker});
                    break;

                case TestAction.PayProtocolFee:
                    txReceipt = await this._stakingApiWrapper.stakingContract.payProtocolFee.awaitTransactionSuccessAsync(this._poolOperator, this._takerAddress, this._protocolFeeAmount, {from: this._exchangeAddress, value: this._protocolFeeAmount});
                    break;

                case TestAction.CreatePool:
                    txReceipt = await this._stakingApiWrapper.stakingContract.createStakingPool.awaitTransactionSuccessAsync(0, true, {from: this._poolOperator});
                    const createStakingPoolLog = txReceipt.logs[0];
                    this._poolId = (createStakingPoolLog as any).args.poolId;
                    break;

                default:
                    throw new Error('Unrecognized test action');
            }
            logs = logs.concat(txReceipt.logs);
        }
        return logs;
    }

    private _extractTestLogs(txReceiptLogs: DecodedLogArgs[]): {event: string, args: TestCumulativeRewardTrackingEventArgs}[] {
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

    private _assertLogs(expectedSequence: {event: string, epoch: number}[], txReceiptLogs: DecodedLogArgs[]) {
        const logs = this._extractTestLogs(txReceiptLogs);
        expect(logs.length).to.be.equal(expectedSequence.length);
        for (let i = 0; i < expectedSequence.length; i++) {
            const expectedLog = expectedSequence[i];
            const actualLog = logs[i];
            expect(expectedLog.event, `testing event name of ${JSON.stringify(expectedLog)}`).to.be.equal(actualLog.event);
            expect(expectedLog.epoch, `testing epoch of ${JSON.stringify(expectedLog)}`).to.be.equal(actualLog.args.epoch.toNumber());
        }
    }
}