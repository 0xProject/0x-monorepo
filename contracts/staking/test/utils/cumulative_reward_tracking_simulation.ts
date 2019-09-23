import { BlockchainTestsEnvironment, expect, txDefaults } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { DecodedLogEntry, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts, TestCumulativeRewardTrackingContract, TestCumulativeRewardTrackingEvents } from '../../src';

import { StakingApiWrapper } from './api_wrapper';
import { toBaseUnitAmount } from './number_utils';
import { DecodedLogs, StakeInfo, StakeStatus } from './types';

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

    private static _extractTestLogs(txReceiptLogs: DecodedLogs): TestLog[] {
        const logs = [];
        for (const log of txReceiptLogs) {
            if (log.event === TestCumulativeRewardTrackingEvents.SetMostRecentCumulativeReward) {
                logs.push({
                    event: log.event,
                    epoch: log.args.epoch.toNumber(),
                });
            } else if (log.event === TestCumulativeRewardTrackingEvents.SetCumulativeReward) {
                logs.push({
                    event: log.event,
                    epoch: log.args.epoch.toNumber(),
                });
            } else if (log.event === TestCumulativeRewardTrackingEvents.UnsetCumulativeReward) {
                logs.push({
                    event: log.event,
                    epoch: log.args.epoch.toNumber(),
                });
            }
        }
        return logs;
    }

    private static _assertTestLogs(expectedSequence: TestLog[], txReceiptLogs: DecodedLogs): void {
        const logs = CumulativeRewardTrackingSimulation._extractTestLogs(txReceiptLogs);
        expect(logs.length).to.be.equal(expectedSequence.length);
        for (let i = 0; i < expectedSequence.length; i++) {
            const expectedLog = expectedSequence[i];
            const actualLog = logs[i];
            expect(expectedLog.event).to.exist('');
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
            this._stakingApiWrapper.wethContract.address,
            this._stakingApiWrapper.zrxVaultContract.address,
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

    private async _executeActionsAsync(actions: TestAction[]): Promise<DecodedLogs> {
        const combinedLogs = [] as DecodedLogs;
        for (const action of actions) {
            let receipt: TransactionReceiptWithDecodedLogs | undefined;
            let logs = [] as DecodedLogs;
            switch (action) {
                case TestAction.Finalize:
                    logs = await this._stakingApiWrapper.utils.skipToNextEpochAndFinalizeAsync();
                    break;

                case TestAction.Delegate:
                    await this._stakingApiWrapper.stakingContract.stake.sendTransactionAsync(this._amountToStake, {
                        from: this._staker,
                    });
                    receipt = await this._stakingApiWrapper.stakingContract.moveStake.awaitTransactionSuccessAsync(
                        new StakeInfo(StakeStatus.Active),
                        new StakeInfo(StakeStatus.Delegated, this._poolId),
                        this._amountToStake,
                        { from: this._staker },
                    );
                    break;

                case TestAction.Undelegate:
                    receipt = await this._stakingApiWrapper.stakingContract.moveStake.awaitTransactionSuccessAsync(
                        new StakeInfo(StakeStatus.Delegated, this._poolId),
                        new StakeInfo(StakeStatus.Active),
                        this._amountToStake,
                        { from: this._staker },
                    );
                    break;

                case TestAction.PayProtocolFee:
                    receipt = await this._stakingApiWrapper.stakingContract.payProtocolFee.awaitTransactionSuccessAsync(
                        this._poolOperator,
                        this._takerAddress,
                        this._protocolFeeAmount,
                        { from: this._exchangeAddress, value: this._protocolFeeAmount },
                    );
                    break;

                case TestAction.CreatePool:
                    receipt = await this._stakingApiWrapper.stakingContract.createStakingPool.awaitTransactionSuccessAsync(
                        0,
                        true,
                        { from: this._poolOperator },
                    );
                    const createStakingPoolLog = receipt.logs[0];
                    // tslint:disable-next-line no-unnecessary-type-assertion
                    this._poolId = (createStakingPoolLog as DecodedLogEntry<any>).args.poolId;
                    break;

                default:
                    throw new Error('Unrecognized test action');
            }
            if (receipt !== undefined) {
                logs = receipt.logs as DecodedLogs;
            }
            combinedLogs.splice(combinedLogs.length, 0, ...logs);
        }
        return combinedLogs;
    }
}
