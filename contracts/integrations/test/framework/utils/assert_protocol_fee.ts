import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    AggregatedStats,
    constants as stakingConstants,
    PoolStats,
    StakingEvents,
    StakingStakingPoolEarnedRewardsInEpochEventArgs,
} from '@0x/contracts-staking';
import { expect, verifyEvents } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { Maker } from '../actors/maker';
import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';

import { FunctionResult } from '../assertions/function_assertion';

export interface PoolInfo {
    poolStats: PoolStats;
    aggregatedStats: AggregatedStats;
    poolStake: BigNumber;
    operatorStake: BigNumber;
    poolId: string;
}

/**
 * Gets info for a given maker's pool.
 */
export async function getPoolInfoAsync(
    maker: Maker,
    simulationEnvironment: SimulationEnvironment,
    deployment: DeploymentManager,
): Promise<PoolInfo | undefined> {
    const { stakingWrapper } = deployment.staking;
    // tslint:disable-next-line no-non-null-assertion no-unnecessary-type-assertion
    const poolId = maker.makerPoolId;
    const { currentEpoch } = simulationEnvironment;
    if (poolId === undefined) {
        return;
    } else {
        const poolStats = PoolStats.fromArray(await stakingWrapper.poolStatsByEpoch(poolId, currentEpoch).callAsync());
        const aggregatedStats = AggregatedStats.fromArray(
            await stakingWrapper.aggregatedStatsByEpoch(currentEpoch).callAsync(),
        );
        const { currentEpochBalance: poolStake } = await stakingWrapper
            .getTotalStakeDelegatedToPool(poolId)
            .callAsync();
        const { currentEpochBalance: operatorStake } = await stakingWrapper
            .getStakeDelegatedToPoolByOwner(simulationEnvironment.stakingPools[poolId].operator, poolId)
            .callAsync();
        return { poolStats, aggregatedStats, poolStake, poolId, operatorStake };
    }
}

/**
 * Asserts that a protocol fee was paid.
 */
export async function assertProtocolFeePaidAsync(
    poolInfo: PoolInfo,
    result: FunctionResult,
    simulationEnvironment: SimulationEnvironment,
    deployment: DeploymentManager,
    expectedProtocolFee: BigNumber,
): Promise<void> {
    const { currentEpoch } = simulationEnvironment;
    const { stakingWrapper } = deployment.staking;
    const expectedPoolStats = { ...poolInfo.poolStats };
    const expectedAggregatedStats = { ...poolInfo.aggregatedStats };
    const expectedEvents = [];

    // Refer to `payProtocolFee`
    if (poolInfo.poolStake.isGreaterThanOrEqualTo(stakingConstants.DEFAULT_PARAMS.minimumPoolStake)) {
        if (poolInfo.poolStats.feesCollected.isZero()) {
            const membersStakeInPool = poolInfo.poolStake.minus(poolInfo.operatorStake);
            const weightedStakeInPool = poolInfo.operatorStake.plus(
                ReferenceFunctions.getPartialAmountFloor(
                    stakingConstants.DEFAULT_PARAMS.rewardDelegatedStakeWeight,
                    new BigNumber(stakingConstants.PPM),
                    membersStakeInPool,
                ),
            );
            expectedPoolStats.membersStake = membersStakeInPool;
            expectedPoolStats.weightedStake = weightedStakeInPool;
            expectedAggregatedStats.totalWeightedStake = poolInfo.aggregatedStats.totalWeightedStake.plus(
                weightedStakeInPool,
            );
            expectedAggregatedStats.numPoolsToFinalize = poolInfo.aggregatedStats.numPoolsToFinalize.plus(1);
            // StakingPoolEarnedRewardsInEpoch event emitted
            expectedEvents.push({
                epoch: currentEpoch,
                poolId: poolInfo.poolId,
            });
        }
        // Credit a protocol fee to the maker's staking pool
        expectedPoolStats.feesCollected = poolInfo.poolStats.feesCollected.plus(expectedProtocolFee);
        // Update aggregated stats
        expectedAggregatedStats.totalFeesCollected = poolInfo.aggregatedStats.totalFeesCollected.plus(
            expectedProtocolFee,
        );
    }

    // Check for updated stats and event
    const poolStats = PoolStats.fromArray(
        await stakingWrapper.poolStatsByEpoch(poolInfo.poolId, currentEpoch).callAsync(),
    );
    const aggregatedStats = AggregatedStats.fromArray(
        await stakingWrapper.aggregatedStatsByEpoch(currentEpoch).callAsync(),
    );
    expect(poolStats).to.deep.equal(expectedPoolStats);
    expect(aggregatedStats).to.deep.equal(expectedAggregatedStats);
    verifyEvents<StakingStakingPoolEarnedRewardsInEpochEventArgs>(
        // tslint:disable-next-line no-non-null-assertion no-unnecessary-type-assertion
        result.receipt!,
        expectedEvents,
        StakingEvents.StakingPoolEarnedRewardsInEpoch,
    );
}
