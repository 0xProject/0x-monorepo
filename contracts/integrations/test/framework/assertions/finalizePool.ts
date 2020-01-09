import { WETH9Events, WETH9TransferEventArgs } from '@0x/contracts-erc20';
import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    AggregatedStats,
    constants as stakingConstants,
    PoolStats,
    StakingEpochFinalizedEventArgs,
    StakingEvents,
    StakingRewardsPaidEventArgs,
} from '@0x/contracts-staking';
import {
    assertRoughlyEquals,
    constants,
    expect,
    filterLogsToArguments,
    toDecimal,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';

import { FunctionAssertion, FunctionResult } from './function_assertion';

const PRECISION = 15;
const COBB_DOUGLAS_ALPHA = toDecimal(stakingConstants.DEFAULT_PARAMS.cobbDouglasAlphaNumerator).dividedBy(
    toDecimal(stakingConstants.DEFAULT_PARAMS.cobbDouglasAlphaDenominator),
);

// Reference function for Cobb-Douglas
function cobbDouglas(poolStats: PoolStats, aggregatedStats: AggregatedStats): BigNumber {
    const { feesCollected, weightedStake } = poolStats;
    const { rewardsAvailable, totalFeesCollected, totalWeightedStake } = aggregatedStats;

    const feeRatio = toDecimal(feesCollected).dividedBy(toDecimal(totalFeesCollected));
    const stakeRatio = toDecimal(weightedStake).dividedBy(toDecimal(totalWeightedStake));
    // totalRewards * feeRatio ^ alpha * stakeRatio ^ (1-alpha)
    return new BigNumber(
        feeRatio
            .pow(COBB_DOUGLAS_ALPHA)
            .times(stakeRatio.pow(toDecimal(1).minus(COBB_DOUGLAS_ALPHA)))
            .times(toDecimal(rewardsAvailable))
            .toFixed(0, BigNumber.ROUND_FLOOR),
    );
}

interface FinalizePoolBeforeInfo {
    poolStats: PoolStats;
    aggregatedStats: AggregatedStats;
    poolRewards: BigNumber;
    cumulativeRewardsLastStored: BigNumber;
    mostRecentCumulativeRewards: {
        numerator: BigNumber;
        denominator: BigNumber;
    };
}

/**
 * Returns a FunctionAssertion for `finalizePool` which assumes valid input is provided. The `after`
 * callback below is annotated with the solidity source of `finalizePool`.
 */
/* tslint:disable:no-unnecessary-type-assertion */
export function validFinalizePoolAssertion(
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
): FunctionAssertion<[string], FinalizePoolBeforeInfo, void> {
    const { stakingWrapper } = deployment.staking;

    return new FunctionAssertion<[string], FinalizePoolBeforeInfo, void>(stakingWrapper, 'finalizePool', {
        before: async (args: [string]) => {
            const [poolId] = args;
            const { currentEpoch } = simulationEnvironment;
            const prevEpoch = currentEpoch.minus(1);

            const poolStats = PoolStats.fromArray(await stakingWrapper.poolStatsByEpoch(poolId, prevEpoch).callAsync());
            const aggregatedStats = AggregatedStats.fromArray(
                await stakingWrapper.aggregatedStatsByEpoch(prevEpoch).callAsync(),
            );
            const poolRewards = await stakingWrapper.rewardsByPoolId(poolId).callAsync();
            const [
                mostRecentCumulativeRewards,
                cumulativeRewardsLastStored,
            ] = await stakingWrapper.getMostRecentCumulativeReward(poolId).callAsync();
            return {
                poolStats,
                aggregatedStats,
                poolRewards,
                cumulativeRewardsLastStored,
                mostRecentCumulativeRewards,
            };
        },
        after: async (beforeInfo: FinalizePoolBeforeInfo, result: FunctionResult, args: [string]) => {
            // Ensure that the tx succeeded.
            expect(result.success, `Error: ${result.data}`).to.be.true();

            const logs = result.receipt!.logs; // tslint:disable-line:no-non-null-assertion
            const { stakingPools, currentEpoch } = simulationEnvironment;
            const prevEpoch = currentEpoch.minus(1);
            const [poolId] = args;
            const pool = stakingPools[poolId];

            // finalizePool noops if there are no pools to finalize or
            // the pool did not earn rewards or already finalized (has no fees).
            if (beforeInfo.aggregatedStats.numPoolsToFinalize.isZero() || beforeInfo.poolStats.feesCollected.isZero()) {
                expect(logs.length, 'Expect no events to be emitted').to.equal(0);
                return;
            }

            // It should have cleared the pool stats for prevEpoch
            const poolStats = PoolStats.fromArray(await stakingWrapper.poolStatsByEpoch(poolId, prevEpoch).callAsync());
            expect(poolStats).to.deep.equal({
                feesCollected: constants.ZERO_AMOUNT,
                weightedStake: constants.ZERO_AMOUNT,
                membersStake: constants.ZERO_AMOUNT,
            });

            // uint256 rewards = _getUnfinalizedPoolRewardsFromPoolStats(poolStats, aggregatedStats);
            const rewards = BigNumber.min(
                cobbDouglas(beforeInfo.poolStats, beforeInfo.aggregatedStats),
                beforeInfo.aggregatedStats.rewardsAvailable.minus(beforeInfo.aggregatedStats.totalRewardsFinalized),
            );

            // Check that a RewardsPaid event was emitted
            const events = filterLogsToArguments<StakingRewardsPaidEventArgs>(logs, StakingEvents.RewardsPaid);
            expect(events.length, 'Number of RewardsPaid events emitted').to.equal(1);
            const [rewardsPaidEvent] = events;
            expect(rewardsPaidEvent.poolId, 'RewardsPaid event: poolId').to.equal(poolId);
            expect(rewardsPaidEvent.epoch, 'RewardsPaid event: currentEpoch_').to.bignumber.equal(currentEpoch);

            // Pull the operator and members' reward from the event
            const { operatorReward, membersReward } = rewardsPaidEvent;
            const totalReward = operatorReward.plus(membersReward);
            // Should be approximately equal to the rewards compute using the Cobb-Douglas reference function
            assertRoughlyEquals(totalReward, rewards, PRECISION);

            // Operator takes their share of the rewards
            if (beforeInfo.poolStats.membersStake.isZero()) {
                expect(
                    operatorReward,
                    "operatorReward should equal totalReward if pool's membersStake is 0",
                ).to.bignumber.equal(totalReward);
            } else {
                expect(operatorReward).to.bignumber.equal(
                    ReferenceFunctions.getPartialAmountCeil(
                        new BigNumber(pool.operatorShare),
                        new BigNumber(stakingConstants.PPM),
                        totalReward,
                    ),
                );
            }

            // Pays the operator in WETH if the operator's reward is non-zero
            const expectedTransferEvents = operatorReward.isGreaterThan(0)
                ? [
                      {
                          _from: deployment.staking.stakingProxy.address,
                          _to: pool.operator,
                          _value: operatorReward,
                      },
                  ]
                : [];

            // Check for WETH transfer event emitted when paying out operator's reward.
            verifyEventsFromLogs<WETH9TransferEventArgs>(logs, expectedTransferEvents, WETH9Events.Transfer);
            // Check that pool rewards have increased.
            const poolRewards = await stakingWrapper.rewardsByPoolId(poolId).callAsync();
            expect(poolRewards).to.bignumber.equal(beforeInfo.poolRewards.plus(membersReward));

            if (membersReward.isGreaterThan(0)) {
                // Check that cumulative rewards have increased.
                const [
                    mostRecentCumulativeRewards,
                    cumulativeRewardsLastStored,
                ] = await stakingWrapper.getMostRecentCumulativeReward(poolId).callAsync();
                expect(cumulativeRewardsLastStored).to.bignumber.equal(currentEpoch);

                let [numerator, denominator] = ReferenceFunctions.LibFractions.add(
                    beforeInfo.mostRecentCumulativeRewards.numerator,
                    beforeInfo.mostRecentCumulativeRewards.denominator,
                    membersReward,
                    beforeInfo.poolStats.membersStake,
                );
                [numerator, denominator] = ReferenceFunctions.LibFractions.normalize(numerator, denominator);
                expect(mostRecentCumulativeRewards).to.deep.equal({ numerator, denominator });
            }

            // Check that aggregated stats have been updated
            const aggregatedStats = AggregatedStats.fromArray(
                await stakingWrapper.aggregatedStatsByEpoch(prevEpoch).callAsync(),
            );
            expect(aggregatedStats).to.deep.equal({
                ...beforeInfo.aggregatedStats,
                totalRewardsFinalized: beforeInfo.aggregatedStats.totalRewardsFinalized.plus(totalReward),
                numPoolsToFinalize: beforeInfo.aggregatedStats.numPoolsToFinalize.minus(1),
            });

            // If there are no more unfinalized pools remaining, the epoch is finalized.
            const expectedEpochFinalizedEvents = aggregatedStats.numPoolsToFinalize.isZero()
                ? [
                      {
                          epoch: prevEpoch,
                          rewardsPaid: aggregatedStats.totalRewardsFinalized,
                          rewardsRemaining: aggregatedStats.rewardsAvailable.minus(
                              aggregatedStats.totalRewardsFinalized,
                          ),
                      },
                  ]
                : [];
            verifyEventsFromLogs<StakingEpochFinalizedEventArgs>(
                logs,
                expectedEpochFinalizedEvents,
                StakingEvents.EpochFinalized,
            );

            // Update local state
            pool.lastFinalized = prevEpoch;
        },
    });
}
/* tslint:enable:no-unnecessary-type-assertion */
