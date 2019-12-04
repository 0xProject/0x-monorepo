import { WETH9DepositEventArgs, WETH9Events } from '@0x/contracts-erc20';
import { AggregatedStats, StakingEvents, StakingEpochEndedEventArgs } from '@0x/contracts-staking';
import { expect, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';

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
    const { balanceStore, currentEpoch } = simulationEnvironment;

    return new FunctionAssertion(stakingWrapper, 'endEpoch', {
        before: async () => {
            await balanceStore.updateEthBalancesAsync();
            const aggregatedStatsBefore = AggregatedStats.fromArray(
                await stakingWrapper.aggregatedStatsByEpoch(currentEpoch).callAsync(),
            );
            const wethReservedForPoolRewards = await stakingWrapper.wethReservedForPoolRewards().callAsync();
            return { wethReservedForPoolRewards, aggregatedStatsBefore };
        },
        after: async (beforeInfo: EndEpochBeforeInfo, result: FunctionResult, _args: [], _txData: Partial<TxData>) => {
            // Check WETH deposit event
            const previousEthBalance = balanceStore.balances.eth[stakingWrapper.address];
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
                rewardsAvailable: balanceStore.balances.erc20[stakingWrapper.address][
                    deployment.tokens.weth.address
                ].minus(wethReservedForPoolRewards),
            };

            const aggregatedStatsAfter = AggregatedStats.fromArray(
                await stakingWrapper.aggregatedStatsByEpoch(currentEpoch).callAsync(),
            );
            expect(aggregatedStatsAfter).to.deep.equal(expectedAggregatedStats);

            const expectedEpochEndedEvents = aggregatedStatsAfter.numPoolsToFinalize.isZero()
                ? [
                      {
                          epoch: currentEpoch,
                          numPoolsToFinalize: aggregatedStatsAfter.numPoolsToFinalize,
                          rewardsAvailable: aggregatedStatsAfter.rewardsAvailable,
                          totalFeesCollected: aggregatedStatsAfter.totalFeesCollected,
                          totalWeightedStake: aggregatedStatsAfter.totalWeightedStake,
                      },
                  ]
                : [];
            verifyEventsFromLogs<StakingEpochEndedEventArgs>(
                result.receipt!.logs,
                expectedEpochEndedEvents,
                StakingEvents.EpochEnded,
            );
            expect(result.data, 'endEpoch should return the number of unfinalized pools').to.bignumber.equal(
                aggregatedStatsAfter.numPoolsToFinalize,
            );

            simulationEnvironment.currentEpoch = currentEpoch.plus(1);
        },
    });
}
/* tslint:enable:no-unnecessary-type-assertion */
