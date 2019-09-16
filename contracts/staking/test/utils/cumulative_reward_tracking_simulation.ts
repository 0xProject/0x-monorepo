import { BlockchainTestsEnvironment, expect, txDefaults } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { DecodedLogArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { TestCumulativeRewardTrackingContract } from '../../generated-wrappers/test_cumulative_reward_tracking';
import { artifacts } from '../../src';

import { StakingApiWrapper } from './api_wrapper';
import { toBaseUnitAmount } from './number_utils';
import { StakeInfo, StakeStatus } from './types';

export enum TestAction {
    Finalize,
    Delegate,
    Undelegate,
    PayProtocolFee,
    CreatePool,
}

interface TestLog {
    event: string;
    epoch: number;
}

export class CumulativeRewardTrackingSimulation {
    private readonly _amountToStake = toBaseUnitAmount(100);
    private readonly _protocolFeeAmount = new BigNumber(10);
    private readonly _stakingApiWrapper: StakingApiWrapper;
    private readonly _staker: string;
    private readonly _poolOperator: string;
    private readonly _takerAddress: string;
    private readonly _exchangeAddress: string;
    private _testCumulativeRewardTrackingContract?: TestCumulativeRewardTrackingContract;
    private _poolId: string;

    private static _extractTestLogs(txReceiptLogs: DecodedLogArgs[]): TestLog[] {
        const logs = [];
        for (const log of txReceiptLogs) {
            if ((log as DecodedLogArgs).event === 'SetMostRecentCumulativeReward') {
                logs.push({
                    event: 'SetMostRecentCumulativeReward',
                    epoch: (log as DecodedLogArgs).args.epoch.toNumber(),
                });
            } else if ((log as DecodedLogArgs).event === 'SetCumulativeReward') {
                logs.push({
                    event: 'SetCumulativeReward',
                    epoch: (log as DecodedLogArgs).args.epoch.toNumber(),
                });
            } else if ((log as DecodedLogArgs).event === 'UnsetCumulativeReward') {
                logs.push({
                    event: 'UnsetCumulativeReward',
                    epoch: (log as DecodedLogArgs).args.epoch.toNumber(),
                });
            }
        }
        return logs;
    }

    private static _assertTestLogs(expectedSequence: TestLog[], txReceiptLogs: DecodedLogArgs[]): void {
        const logs = CumulativeRewardTrackingSimulation._extractTestLogs(txReceiptLogs);
        expect(logs.length).to.be.equal(expectedSequence.length);
        for (let i = 0; i < expectedSequence.length; i++) {
            const expectedLog = expectedSequence[i];
            const actualLog = logs[i];
            expect(expectedLog.event, `testing event name of ${JSON.stringify(expectedLog)}`).to.be.equal(
                actualLog.event,
            );
            expect(expectedLog.epoch, `testing epoch of ${JSON.stringify(expectedLog)}`).to.be.equal(actualLog.epoch);
        }
    }

    constructor(stakingApiWrapper: StakingApiWrapper, actors: string[]) {
        this._stakingApiWrapper = stakingApiWrapper;
        // setup actors
        this._staker = actors[0];
        this._poolOperator = actors[1];
        this._takerAddress = actors[2];
        this._exchangeAddress = actors[3];
        this._poolId = '';
    }

    public async deployAndConfigureTestContractsAsync(env: BlockchainTestsEnvironment): Promise<void> {
        // set exchange address
        await this._stakingApiWrapper.stakingContract.addExchangeAddress.awaitTransactionSuccessAsync(
            this._exchangeAddress,
        );
        this._testCumulativeRewardTrackingContract = await TestCumulativeRewardTrackingContract.deployFrom0xArtifactAsync(
            artifacts.TestCumulativeRewardTracking,
            env.provider,
            txDefaults,
            artifacts,
        );
    }

    public getTestCumulativeRewardTrackingContract(): TestCumulativeRewardTrackingContract {
        if (this._testCumulativeRewardTrackingContract === undefined) {
            throw new Error(`Contract has not been deployed. Run 'deployAndConfigureTestContractsAsync'.`);
        }
        return this._testCumulativeRewardTrackingContract;
    }

    public async runTestAsync(
        initActions: TestAction[],
        testActions: TestAction[],
        expectedTestLogs: TestLog[],
    ): Promise<void> {
        await this._executeActionsAsync(initActions);
        await this._stakingApiWrapper.stakingProxyContract.attachStakingContract.awaitTransactionSuccessAsync(
            this.getTestCumulativeRewardTrackingContract().address,
        );
        const testLogs = await this._executeActionsAsync(testActions);
        CumulativeRewardTrackingSimulation._assertTestLogs(expectedTestLogs, testLogs);
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
                    await this._stakingApiWrapper.stakingContract.stake.sendTransactionAsync(this._amountToStake, {
                        from: this._staker,
                    });
                    txReceipt = await this._stakingApiWrapper.stakingContract.moveStake.awaitTransactionSuccessAsync(
                        new StakeInfo(StakeStatus.Active),
                        new StakeInfo(StakeStatus.Delegated, this._poolId),
                        this._amountToStake,
                        { from: this._staker },
                    );
                    break;

                case TestAction.Undelegate:
                    txReceipt = await this._stakingApiWrapper.stakingContract.moveStake.awaitTransactionSuccessAsync(
                        new StakeInfo(StakeStatus.Delegated, this._poolId),
                        new StakeInfo(StakeStatus.Active),
                        this._amountToStake,
                        { from: this._staker },
                    );
                    break;

                case TestAction.PayProtocolFee:
                    txReceipt = await this._stakingApiWrapper.stakingContract.payProtocolFee.awaitTransactionSuccessAsync(
                        this._poolOperator,
                        this._takerAddress,
                        this._protocolFeeAmount,
                        { from: this._exchangeAddress, value: this._protocolFeeAmount },
                    );
                    break;

                case TestAction.CreatePool:
                    txReceipt = await this._stakingApiWrapper.stakingContract.createStakingPool.awaitTransactionSuccessAsync(
                        0,
                        true,
                        { from: this._poolOperator },
                    );
                    const createStakingPoolLog = txReceipt.logs[0];
                    this._poolId = (createStakingPoolLog as DecodedLogArgs).args.poolId;
                    break;

                default:
                    throw new Error('Unrecognized test action');
            }
            logs = logs.concat(txReceipt.logs);
        }
        return logs;
    }
}
