import { WETH9DepositEventArgs, WETH9Events } from '@0x/contracts-erc20';
import {
    AggregatedStats,
    StakingEpochEndedEventArgs,
    StakingEpochFinalizedEventArgs,
    StakingEvents,
    StakingRevertErrors,
} from '@0x/contracts-staking';
import { constants, expect, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';

import { FunctionAssertion, FunctionResult } from './function_assertion';

interface EndEpochBeforeInfo {
    wethReservedForPoolRewards: BigNumber;
    aggregatedStatsBefore: AggregatedStats;
}

/**
 * Returns a FunctionAssertion for `endEpoch` which assumes valid input is provided. It checks
 * that the staking proxy contract wrapped its ETH balance, aggregated stats were updated, and
 * EpochFinalized/EpochEnded events were emitted.
 */
export function validEndEpochAssertion(
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
): FunctionAssertion<[], EndEpochBeforeInfo, void> {
    const { stakingWrapper } = deployment.staking;
    const { balanceStore } = simulationEnvironment;

    return new FunctionAssertion(stakingWrapper, 'endEpoch', {
        before: async () => {
            await balanceStore.updateEthBalancesAsync();
            const aggregatedStatsBefore = AggregatedStats.fromArray(
                await stakingWrapper.aggregatedStatsByEpoch(simulationEnvironment.currentEpoch).callAsync(),
            );
            const wethReservedForPoolRewards = await stakingWrapper.wethReservedForPoolRewards().callAsync();
            return { wethReservedForPoolRewards, aggregatedStatsBefore };
        },
        after: async (beforeInfo: EndEpochBeforeInfo, result: FunctionResult, _args: [], _txData: Partial<TxData>) => {
            // Ensure that the tx succeeded.
            expect(result.success, `Error: ${result.data}`).to.be.true();

            const { currentEpoch } = simulationEnvironment;
            const logs = result.receipt!.logs; // tslint:disable-line

            // Check WETH deposit event
            const previousEthBalance = balanceStore.balances.eth[stakingWrapper.address] || constants.ZERO_AMOUNT;
            const expectedDepositEvents = previousEthBalance.isGreaterThan(0)
                ? [
                      {
                          _owner: deployment.staking.stakingProxy.address,
                          _value: previousEthBalance,
                      },
                  ]
                : [];
            verifyEventsFromLogs<WETH9DepositEventArgs>(logs, expectedDepositEvents, WETH9Events.Deposit);

            // Check that the aggregated stats were updated
            await balanceStore.updateErc20BalancesAsync();
            const { wethReservedForPoolRewards, aggregatedStatsBefore } = beforeInfo;
            const expectedAggregatedStats = {
                ...aggregatedStatsBefore,
                rewardsAvailable: _.get(
                    balanceStore.balances,
                    ['erc20', stakingWrapper.address, deployment.tokens.weth.address],
                    constants.ZERO_AMOUNT,
                ).minus(wethReservedForPoolRewards),
            };
            const aggregatedStatsAfter = AggregatedStats.fromArray(
                await stakingWrapper.aggregatedStatsByEpoch(currentEpoch).callAsync(),
            );
            expect(aggregatedStatsAfter).to.deep.equal(expectedAggregatedStats);

            // Check that an EpochEnded event was emitted
            verifyEventsFromLogs<StakingEpochEndedEventArgs>(
                logs,
                [
                    {
                        epoch: currentEpoch,
                        numPoolsToFinalize: aggregatedStatsAfter.numPoolsToFinalize,
                        rewardsAvailable: aggregatedStatsAfter.rewardsAvailable,
                        totalFeesCollected: aggregatedStatsAfter.totalFeesCollected,
                        totalWeightedStake: aggregatedStatsAfter.totalWeightedStake,
                    },
                ],
                StakingEvents.EpochEnded,
            );

            // If there are no more pools to finalize, an EpochFinalized event should've been emitted
            const expectedEpochFinalizedEvents = aggregatedStatsAfter.numPoolsToFinalize.isZero()
                ? [
                      {
                          epoch: currentEpoch,
                          rewardsPaid: constants.ZERO_AMOUNT,
                          rewardsRemaining: aggregatedStatsAfter.rewardsAvailable,
                      },
                  ]
                : [];
            verifyEventsFromLogs<StakingEpochFinalizedEventArgs>(
                logs,
                expectedEpochFinalizedEvents,
                StakingEvents.EpochFinalized,
            );

            // The function returns the remaining number of unfinalized pools for the epoch
            expect(result.data, 'endEpoch should return the number of unfinalized pools').to.bignumber.equal(
                aggregatedStatsAfter.numPoolsToFinalize,
            );

            // Update currentEpoch locally
            simulationEnvironment.currentEpoch = currentEpoch.plus(1);
        },
    });
}

/**
 * Returns a FunctionAssertion for `endEpoch` which assumes it has been called while the previous
 * epoch hasn't been fully finalized. Checks that the transaction reverts with PreviousEpochNotFinalizedError.
 */
export function endEpochUnfinalizedPoolsAssertion(
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
    numPoolsToFinalizeFromPrevEpoch: BigNumber,
): FunctionAssertion<[], void, void> {
    return new FunctionAssertion(deployment.staking.stakingWrapper, 'endEpoch', {
        after: async (_beforeInfo: void, result: FunctionResult) => {
            // Ensure that the tx reverted.
            expect(result.success).to.be.false();

            // Check revert error
            expect(result.data).to.equal(
                new StakingRevertErrors.PreviousEpochNotFinalizedError(
                    simulationEnvironment.currentEpoch.minus(1),
                    numPoolsToFinalizeFromPrevEpoch,
                ),
            );
        },
    });
}

/**
 * Returns a FunctionAssertion for `endEpoch` which assumes it has been called before the full epoch
 * duration has elapsed. Checks that the transaction reverts with BlockTimestampTooLowError.
 */
export function endEpochTooEarlyAssertion(deployment: DeploymentManager): FunctionAssertion<[], void, void> {
    const { stakingWrapper } = deployment.staking;
    return new FunctionAssertion(stakingWrapper, 'endEpoch', {
        after: async (_beforeInfo: void, result: FunctionResult) => {
            // Ensure that the tx reverted.
            expect(result.success).to.be.false();

            // Check revert error
            const epochEndTime = await stakingWrapper.getCurrentEpochEarliestEndTimeInSeconds().callAsync();
            const lastBlockTime = await deployment.web3Wrapper.getBlockTimestampAsync('latest');
            expect(result.data).to.equal(
                new StakingRevertErrors.BlockTimestampTooLowError(epochEndTime, lastBlockTime),
            );
        },
    });
}
