import { WETH9DepositEventArgs, WETH9Events } from '@0x/contracts-erc20';
import {
    AggregatedStats,
    StakingEvents,
    StakingEpochEndedEventArgs,
    StakingEpochFinalizedEventArgs,
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
 * Returns a FunctionAssertion for `stake` which assumes valid input is provided. The
 * FunctionAssertion checks that the staker and zrxVault's balances of ZRX decrease and increase,
 * respectively, by the input amount.
 */
/* tslint:disable:no-unnecessary-type-assertion */
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

            // Check WETH deposit event
            const previousEthBalance = balanceStore.balances.eth[stakingWrapper.address] || constants.ZERO_AMOUNT;
            if (previousEthBalance.isGreaterThan(0)) {
                verifyEventsFromLogs<WETH9DepositEventArgs>(
                    result.receipt!.logs,
                    [
                        {
                            _owner: deployment.staking.stakingProxy.address,
                            _value: previousEthBalance,
                        },
                    ],
                    WETH9Events.Deposit,
                );
            }

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

            verifyEventsFromLogs<StakingEpochEndedEventArgs>(
                result.receipt!.logs,
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
                result.receipt!.logs,
                expectedEpochFinalizedEvents,
                StakingEvents.EpochFinalized,
            );

            expect(result.data, 'endEpoch should return the number of unfinalized pools').to.bignumber.equal(
                aggregatedStatsAfter.numPoolsToFinalize,
            );

            simulationEnvironment.currentEpoch = currentEpoch.plus(1);
        },
    });
}
/* tslint:enable:no-unnecessary-type-assertion */
