import { ERC20TokenEvents, ERC20TokenTransferEventArgs } from '@0x/contracts-erc20';
import { ExchangeEvents, ExchangeFillEventArgs } from '@0x/contracts-exchange';
import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    AggregatedStats,
    constants as stakingConstants,
    PoolStats,
    StakingEvents,
    StakingStakingPoolEarnedRewardsInEpochEventArgs,
} from '@0x/contracts-staking';
import { expect, orderHashUtils, verifyEvents } from '@0x/contracts-test-utils';
import { FillResults, Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { Maker } from '../actors/maker';
import { filterActorsByRole } from '../actors/utils';
import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';

import { FunctionAssertion, FunctionResult } from './function_assertion';

function verifyFillEvents(
    txData: Partial<TxData>,
    order: Order,
    receipt: TransactionReceiptWithDecodedLogs,
    deployment: DeploymentManager,
    takerAssetFillAmount: BigNumber,
): void {
    const fillResults = ReferenceFunctions.calculateFillResults(
        order,
        takerAssetFillAmount,
        DeploymentManager.protocolFeeMultiplier,
        DeploymentManager.gasPrice,
    );
    const takerAddress = txData.from as string;
    const value = new BigNumber(txData.value || 0);
    // Ensure that the fill event was correct.
    verifyEvents<ExchangeFillEventArgs>(
        receipt,
        [
            {
                makerAddress: order.makerAddress,
                feeRecipientAddress: order.feeRecipientAddress,
                makerAssetData: order.makerAssetData,
                takerAssetData: order.takerAssetData,
                makerFeeAssetData: order.makerFeeAssetData,
                takerFeeAssetData: order.takerFeeAssetData,
                orderHash: orderHashUtils.getOrderHashHex(order),
                takerAddress,
                senderAddress: takerAddress,
                ...fillResults,
            },
        ],
        ExchangeEvents.Fill,
    );

    const expectedTransferEvents = [
        {
            _from: takerAddress,
            _to: order.makerAddress,
            _value: fillResults.takerAssetFilledAmount,
        },
        {
            _from: order.makerAddress,
            _to: takerAddress,
            _value: fillResults.makerAssetFilledAmount,
        },
        {
            _from: takerAddress,
            _to: order.feeRecipientAddress,
            _value: fillResults.takerFeePaid,
        },
        {
            _from: order.makerAddress,
            _to: order.feeRecipientAddress,
            _value: fillResults.makerFeePaid,
        },
    ].filter(event => event._value.isGreaterThan(0));

    // If not enough wei is sent to cover the protocol fee, there will be an additional WETH transfer event
    if (value.isLessThan(DeploymentManager.protocolFee)) {
        expectedTransferEvents.push({
            _from: takerAddress,
            _to: deployment.staking.stakingProxy.address,
            _value: DeploymentManager.protocolFee,
        });
    }

    // Ensure that the transfer events were correctly emitted.
    verifyEvents<ERC20TokenTransferEventArgs>(receipt, expectedTransferEvents, ERC20TokenEvents.Transfer);
}

interface FillOrderBeforeInfo {
    poolStats: PoolStats;
    aggregatedStats: AggregatedStats;
    poolStake: BigNumber;
    operatorStake: BigNumber;
    poolId: string;
}

/**
 * A function assertion that verifies that a complete and valid fill succeeded and emitted the correct logs.
 */
/* tslint:disable:no-unnecessary-type-assertion */
/* tslint:disable:no-non-null-assertion */
export function validFillOrderAssertion(
    deployment: DeploymentManager,
    simulationEnvironment: SimulationEnvironment,
): FunctionAssertion<[Order, BigNumber, string], FillOrderBeforeInfo | void, FillResults> {
    const { stakingWrapper } = deployment.staking;
    const { actors } = simulationEnvironment;

    return new FunctionAssertion<[Order, BigNumber, string], FillOrderBeforeInfo | void, FillResults>(
        deployment.exchange,
        'fillOrder',
        {
            before: async (args: [Order, BigNumber, string]) => {
                const [order] = args;
                const { currentEpoch } = simulationEnvironment;
                const maker = filterActorsByRole(actors, Maker).find(actor => actor.address === order.makerAddress);

                const poolId = maker!.makerPoolId;
                if (poolId === undefined) {
                    return;
                } else {
                    const poolStats = PoolStats.fromArray(
                        await stakingWrapper.poolStatsByEpoch(poolId, currentEpoch).callAsync(),
                    );
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
            },
            after: async (
                beforeInfo: FillOrderBeforeInfo | void,
                result: FunctionResult,
                args: [Order, BigNumber, string],
                txData: Partial<TxData>,
            ) => {
                // Ensure that the tx succeeded.
                expect(result.success, `Error: ${result.data}`).to.be.true();

                const [order, fillAmount] = args;
                const { currentEpoch } = simulationEnvironment;

                // Ensure that the correct events were emitted.
                verifyFillEvents(txData, order, result.receipt!, deployment, fillAmount);

                // If the maker is not in a staking pool, there's nothing to check
                if (beforeInfo === undefined) {
                    return;
                }

                const expectedPoolStats = { ...beforeInfo.poolStats };
                const expectedAggregatedStats = { ...beforeInfo.aggregatedStats };
                const expectedEvents = [];

                // Refer to `payProtocolFee`
                if (beforeInfo.poolStake.isGreaterThanOrEqualTo(stakingConstants.DEFAULT_PARAMS.minimumPoolStake)) {
                    if (beforeInfo.poolStats.feesCollected.isZero()) {
                        const membersStakeInPool = beforeInfo.poolStake.minus(beforeInfo.operatorStake);
                        const weightedStakeInPool = beforeInfo.operatorStake.plus(
                            ReferenceFunctions.getPartialAmountFloor(
                                stakingConstants.DEFAULT_PARAMS.rewardDelegatedStakeWeight,
                                new BigNumber(stakingConstants.PPM),
                                membersStakeInPool,
                            ),
                        );
                        expectedPoolStats.membersStake = membersStakeInPool;
                        expectedPoolStats.weightedStake = weightedStakeInPool;
                        expectedAggregatedStats.totalWeightedStake = beforeInfo.aggregatedStats.totalWeightedStake.plus(
                            weightedStakeInPool,
                        );
                        expectedAggregatedStats.numPoolsToFinalize = beforeInfo.aggregatedStats.numPoolsToFinalize.plus(
                            1,
                        );
                        // StakingPoolEarnedRewardsInEpoch event emitted
                        expectedEvents.push({
                            epoch: currentEpoch,
                            poolId: beforeInfo.poolId,
                        });
                    }
                    // Credit a protocol fee to the maker's staking pool
                    expectedPoolStats.feesCollected = beforeInfo.poolStats.feesCollected.plus(
                        DeploymentManager.protocolFee,
                    );
                    // Update aggregated stats
                    expectedAggregatedStats.totalFeesCollected = beforeInfo.aggregatedStats.totalFeesCollected.plus(
                        DeploymentManager.protocolFee,
                    );
                }

                // Check for updated stats and event
                const poolStats = PoolStats.fromArray(
                    await stakingWrapper.poolStatsByEpoch(beforeInfo.poolId, currentEpoch).callAsync(),
                );
                const aggregatedStats = AggregatedStats.fromArray(
                    await stakingWrapper.aggregatedStatsByEpoch(currentEpoch).callAsync(),
                );
                expect(poolStats).to.deep.equal(expectedPoolStats);
                expect(aggregatedStats).to.deep.equal(expectedAggregatedStats);
                verifyEvents<StakingStakingPoolEarnedRewardsInEpochEventArgs>(
                    result.receipt!,
                    expectedEvents,
                    StakingEvents.StakingPoolEarnedRewardsInEpoch,
                );
            },
        },
    );
}
/* tslint:enable:no-non-null-assertion */
/* tslint:enable:no-unnecessary-type-assertion */
