import { WETH9Events, WETH9TransferEventArgs } from '@0x/contracts-erc20';
import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    AggregatedStats,
    constants as stakingConstants,
    PoolStats,
    StakingEvents,
    StakingEpochFinalizedEventArgs,
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

const COBB_DOUGLAS_PRECISION = 15;
const ALPHA_NUMERATOR = 1;
const ALPHA_DENOMINATOR = 3;
const COBB_DOUGLAS_ALPHA = toDecimal(ALPHA_NUMERATOR).dividedBy(toDecimal(ALPHA_DENOMINATOR));

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
 * Returns a FunctionAssertion for `moveStake` which assumes valid input is provided. The
 * FunctionAssertion checks that the staker's
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

            // // Compute relevant epochs
            // uint256 currentEpoch_ = currentEpoch;
            // uint256 prevEpoch = currentEpoch_.safeSub(1);
            const { stakingPools, currentEpoch } = simulationEnvironment;
            const prevEpoch = currentEpoch.minus(1);
            const [poolId] = args;
            const pool = stakingPools[poolId];

            // // Load the aggregated stats into memory; noop if no pools to finalize.
            // IStructs.AggregatedStats memory aggregatedStats = aggregatedStatsByEpoch[prevEpoch];
            // if (aggregatedStats.numPoolsToFinalize == 0) {
            //     return;
            // }
            //
            // // Noop if the pool did not earn rewards or already finalized (has no fees).
            // IStructs.PoolStats memory poolStats = poolStatsByEpoch[poolId][prevEpoch];
            // if (poolStats.feesCollected == 0) {
            //     return;
            // }
            if (beforeInfo.aggregatedStats.numPoolsToFinalize.isZero() || beforeInfo.poolStats.feesCollected.isZero()) {
                expect(result.receipt!.logs.length, 'Expect no events to be emitted').to.equal(0);
                return;
            }

            // // Clear the pool stats so we don't finalize it again, and to recoup
            // // some gas.
            // delete poolStatsByEpoch[poolId][prevEpoch];
            const poolStats = PoolStats.fromArray(await stakingWrapper.poolStatsByEpoch(poolId, prevEpoch).callAsync());
            expect(poolStats).to.deep.equal({
                feesCollected: constants.ZERO_AMOUNT,
                weightedStake: constants.ZERO_AMOUNT,
                membersStake: constants.ZERO_AMOUNT,
            });

            // // Compute the rewards.
            // uint256 rewards = _getUnfinalizedPoolRewardsFromPoolStats(poolStats, aggregatedStats);
            const rewards = BigNumber.min(
                cobbDouglas(beforeInfo.poolStats, beforeInfo.aggregatedStats),
                beforeInfo.aggregatedStats.rewardsAvailable.minus(beforeInfo.aggregatedStats.totalRewardsFinalized),
            );

            // // Pay the operator and update rewards for the pool.
            // // Note that we credit at the CURRENT epoch even though these rewards
            // // were earned in the previous epoch.
            // (uint256 operatorReward, uint256 membersReward) = _syncPoolRewards(
            //     poolId,
            //     rewards,
            //     poolStats.membersStake
            // );
            //
            // // Emit an event.
            // emit RewardsPaid(
            //     currentEpoch_,
            //     poolId,
            //     operatorReward,
            //     membersReward
            // );
            //
            // uint256 totalReward = operatorReward.safeAdd(membersReward);
            const events = filterLogsToArguments<StakingRewardsPaidEventArgs>(
                result.receipt!.logs,
                StakingEvents.RewardsPaid,
            );
            expect(events.length, 'Number of RewardsPaid events emitted').to.equal(1);
            const [rewardsPaidEvent] = events;

            expect(rewardsPaidEvent.poolId, 'RewardsPaid event: poolId').to.equal(poolId);
            expect(rewardsPaidEvent.epoch, 'RewardsPaid event: currentEpoch_').to.bignumber.equal(currentEpoch);

            const { operatorReward, membersReward } = rewardsPaidEvent;
            const totalReward = operatorReward.plus(membersReward);
            assertRoughlyEquals(totalReward, rewards, COBB_DOUGLAS_PRECISION);

            // See _computePoolRewardsSplit
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

            // See _syncPoolRewards
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
            verifyEventsFromLogs<WETH9TransferEventArgs>(
                result.receipt!.logs,
                expectedTransferEvents,
                WETH9Events.Transfer,
            );
            // Check that pool rewards have increased.
            const poolRewards = await stakingWrapper.rewardsByPoolId(poolId).callAsync();
            expect(poolRewards).to.bignumber.equal(beforeInfo.poolRewards.plus(membersReward));
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
            expect(mostRecentCumulativeRewards).to.deep.equal({
                numerator,
                denominator,
            });

            // // Increase `totalRewardsFinalized`.
            // aggregatedStatsByEpoch[prevEpoch].totalRewardsFinalized =
            //     aggregatedStats.totalRewardsFinalized =
            //     aggregatedStats.totalRewardsFinalized.safeAdd(totalReward);
            //
            // // Decrease the number of unfinalized pools left.
            // aggregatedStatsByEpoch[prevEpoch].numPoolsToFinalize =
            //     aggregatedStats.numPoolsToFinalize =
            //     aggregatedStats.numPoolsToFinalize.safeSub(1);
            const aggregatedStats = AggregatedStats.fromArray(
                await stakingWrapper.aggregatedStatsByEpoch(prevEpoch).callAsync(),
            );
            expect(aggregatedStats).to.deep.equal({
                ...beforeInfo.aggregatedStats,
                totalRewardsFinalized: beforeInfo.aggregatedStats.totalRewardsFinalized.plus(totalReward),
                numPoolsToFinalize: beforeInfo.aggregatedStats.numPoolsToFinalize.minus(1),
            });

            // // If there are no more unfinalized pools remaining, the epoch is
            // // finalized.
            // if (aggregatedStats.numPoolsToFinalize == 0) {
            //     emit EpochFinalized(
            //         prevEpoch,
            //         aggregatedStats.totalRewardsFinalized,
            //         aggregatedStats.rewardsAvailable.safeSub(aggregatedStats.totalRewardsFinalized)
            //     );
            // }
            const expectedEpochFinalizedEvents = aggregatedStats.numPoolsToFinalize.isZero()
                ? [
                      {
                          epoch: currentEpoch.minus(1),
                          rewardsPaid: aggregatedStats.totalRewardsFinalized,
                          rewardsRemaining: aggregatedStats.rewardsAvailable.minus(
                              aggregatedStats.totalRewardsFinalized,
                          ),
                      },
                  ]
                : [];
            verifyEventsFromLogs<StakingEpochFinalizedEventArgs>(
                result.receipt!.logs,
                expectedEpochFinalizedEvents,
                StakingEvents.EpochFinalized,
            );

            pool.lastFinalized = currentEpoch;
        },
    });
}
/* tslint:enable:no-unnecessary-type-assertion */
