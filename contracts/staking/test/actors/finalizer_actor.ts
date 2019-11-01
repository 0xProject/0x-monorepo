import { constants, expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { StakingApiWrapper } from '../utils/api_wrapper';
import {
    BalanceByOwner,
    DelegatorBalancesByPoolId,
    DelegatorsByPoolId,
    OperatorBalanceByPoolId,
    OperatorByPoolId,
    OperatorShareByPoolId,
    RewardBalanceByPoolId,
    RewardByPoolId,
} from '../utils/types';

import { BaseActor } from './base_actor';

const { PPM_100_PERCENT } = constants;

// tslint:disable: prefer-conditional-expression
export class FinalizerActor extends BaseActor {
    private readonly _poolIds: string[];
    private readonly _operatorByPoolId: OperatorByPoolId;
    private readonly _delegatorsByPoolId: DelegatorsByPoolId;

    constructor(
        owner: string,
        stakingApiWrapper: StakingApiWrapper,
        poolIds: string[],
        operatorByPoolId: OperatorByPoolId,
        delegatorsByPoolId: DelegatorsByPoolId,
    ) {
        super(owner, stakingApiWrapper);
        this._poolIds = _.cloneDeep(poolIds);
        this._operatorByPoolId = _.cloneDeep(operatorByPoolId);
        this._delegatorsByPoolId = _.cloneDeep(delegatorsByPoolId);
    }

    public async finalizeAsync(): Promise<void> {
        // cache initial info and balances
        const operatorShareByPoolId = await this._getOperatorShareByPoolIdAsync(this._poolIds);
        const rewardBalanceByPoolId = await this._getRewardBalanceByPoolIdAsync(this._poolIds);
        const delegatorBalancesByPoolId = await this._getDelegatorBalancesByPoolIdAsync(this._delegatorsByPoolId);
        const delegatorStakesByPoolId = await this._getDelegatorStakesByPoolIdAsync(this._delegatorsByPoolId);
        const operatorBalanceByPoolId = await this._getOperatorBalanceByPoolIdAsync(this._operatorByPoolId);
        const rewardByPoolId = await this._getRewardByPoolIdAsync(this._poolIds);
        // compute expected changes
        const [
            expectedOperatorBalanceByPoolId,
            expectedRewardBalanceByPoolId,
        ] = this._computeExpectedRewardBalanceByPoolId(
            rewardByPoolId,
            operatorBalanceByPoolId,
            rewardBalanceByPoolId,
            delegatorStakesByPoolId,
            operatorShareByPoolId,
        );
        const expectedDelegatorBalancesByPoolId = await this._computeExpectedDelegatorBalancesByPoolIdAsync(
            this._delegatorsByPoolId,
            delegatorBalancesByPoolId,
            delegatorStakesByPoolId,
            operatorShareByPoolId,
            rewardByPoolId,
        );
        // finalize
        await this._stakingApiWrapper.utils.skipToNextEpochAndFinalizeAsync();
        // assert reward changes
        const finalRewardBalanceByPoolId = await this._getRewardBalanceByPoolIdAsync(this._poolIds);
        expect(finalRewardBalanceByPoolId, 'final pool reward balances').to.be.deep.equal(
            expectedRewardBalanceByPoolId,
        );
        // assert delegator balances
        const finalDelegatorBalancesByPoolId = await this._getDelegatorBalancesByPoolIdAsync(this._delegatorsByPoolId);
        expect(finalDelegatorBalancesByPoolId, 'final delegator reward balances').to.be.deep.equal(
            expectedDelegatorBalancesByPoolId,
        );
        // assert operator balances
        const finalOperatorBalanceByPoolId = await this._getOperatorBalanceByPoolIdAsync(this._operatorByPoolId);
        expect(finalOperatorBalanceByPoolId, 'final operator weth balance').to.be.deep.equal(
            expectedOperatorBalanceByPoolId,
        );
    }

    private async _computeExpectedDelegatorBalancesByPoolIdAsync(
        delegatorsByPoolId: DelegatorsByPoolId,
        delegatorBalancesByPoolId: DelegatorBalancesByPoolId,
        delegatorStakesByPoolId: DelegatorBalancesByPoolId,
        operatorShareByPoolId: OperatorShareByPoolId,
        rewardByPoolId: RewardByPoolId,
    ): Promise<DelegatorBalancesByPoolId> {
        const expectedDelegatorBalancesByPoolId = _.cloneDeep(delegatorBalancesByPoolId);
        for (const poolId of Object.keys(delegatorsByPoolId)) {
            const operator = this._operatorByPoolId[poolId];
            const totalStakeInPool = BigNumber.sum(...Object.values(delegatorStakesByPoolId[poolId]));
            const operatorStakeInPool = delegatorStakesByPoolId[poolId][operator];
            const membersStakeInPool = totalStakeInPool.minus(operatorStakeInPool);
            const operatorShare = operatorShareByPoolId[poolId];
            const totalReward = rewardByPoolId[poolId];
            const operatorReward = membersStakeInPool.eq(0)
                ? totalReward
                : totalReward.times(operatorShare).dividedToIntegerBy(PPM_100_PERCENT);
            const membersTotalReward = totalReward.minus(operatorReward);

            for (const delegator of delegatorsByPoolId[poolId]) {
                let delegatorReward = new BigNumber(0);
                if (delegator !== operator && membersStakeInPool.gt(0)) {
                    const delegatorStake = delegatorStakesByPoolId[poolId][delegator];
                    delegatorReward = delegatorStake.times(membersTotalReward).dividedToIntegerBy(membersStakeInPool);
                }
                const currentBalance = expectedDelegatorBalancesByPoolId[poolId][delegator] || 0;
                expectedDelegatorBalancesByPoolId[poolId][delegator] = delegatorReward.plus(currentBalance);
            }
        }
        return expectedDelegatorBalancesByPoolId;
    }

    private async _getDelegatorBalancesByPoolIdAsync(
        delegatorsByPoolId: DelegatorsByPoolId,
    ): Promise<DelegatorBalancesByPoolId> {
        const {
            computeRewardBalanceOfDelegator,
            computeRewardBalanceOfOperator,
        } = this._stakingApiWrapper.stakingContract;
        const delegatorBalancesByPoolId: DelegatorBalancesByPoolId = {};

        for (const poolId of Object.keys(delegatorsByPoolId)) {
            const operator = this._operatorByPoolId[poolId];
            const delegators = delegatorsByPoolId[poolId];
            delegatorBalancesByPoolId[poolId] = {};
            for (const delegator of delegators) {
                let balance = new BigNumber(delegatorBalancesByPoolId[poolId][delegator] || 0);
                if (delegator === operator) {
                    balance = balance.plus(await computeRewardBalanceOfOperator.callAsync(poolId));
                } else {
                    balance = balance.plus(await computeRewardBalanceOfDelegator.callAsync(poolId, delegator));
                }
                delegatorBalancesByPoolId[poolId][delegator] = balance;
            }
        }
        return delegatorBalancesByPoolId;
    }

    private async _getDelegatorStakesByPoolIdAsync(
        delegatorsByPoolId: DelegatorsByPoolId,
    ): Promise<DelegatorBalancesByPoolId> {
        const { getStakeDelegatedToPoolByOwner } = this._stakingApiWrapper.stakingContract;
        const delegatorBalancesByPoolId: DelegatorBalancesByPoolId = {};
        for (const poolId of Object.keys(delegatorsByPoolId)) {
            const delegators = delegatorsByPoolId[poolId];
            delegatorBalancesByPoolId[poolId] = {};
            for (const delegator of delegators) {
                delegatorBalancesByPoolId[poolId][delegator] = (await getStakeDelegatedToPoolByOwner.callAsync(
                    delegator,
                    poolId,
                )).currentEpochBalance;
            }
        }
        return delegatorBalancesByPoolId;
    }

    private _computeExpectedRewardBalanceByPoolId(
        rewardByPoolId: RewardByPoolId,
        operatorBalanceByPoolId: OperatorBalanceByPoolId,
        rewardBalanceByPoolId: RewardBalanceByPoolId,
        delegatorStakesByPoolId: DelegatorBalancesByPoolId,
        operatorShareByPoolId: OperatorShareByPoolId,
    ): [RewardBalanceByPoolId, OperatorBalanceByPoolId] {
        const expectedOperatorBalanceByPoolId = _.cloneDeep(operatorBalanceByPoolId);
        const expectedRewardBalanceByPoolId = _.cloneDeep(rewardBalanceByPoolId);
        for (const poolId of Object.keys(rewardByPoolId)) {
            const operatorShare = operatorShareByPoolId[poolId];
            [
                expectedOperatorBalanceByPoolId[poolId],
                expectedRewardBalanceByPoolId[poolId],
            ] = this._computeExpectedRewardBalance(
                poolId,
                rewardByPoolId[poolId],
                expectedOperatorBalanceByPoolId[poolId],
                expectedRewardBalanceByPoolId[poolId],
                delegatorStakesByPoolId[poolId],
                operatorShare,
            );
        }
        return [expectedOperatorBalanceByPoolId, expectedRewardBalanceByPoolId];
    }

    private _computeExpectedRewardBalance(
        poolId: string,
        reward: BigNumber,
        operatorBalance: BigNumber,
        rewardBalance: BigNumber,
        stakeBalances: BalanceByOwner,
        operatorShare: BigNumber,
    ): [BigNumber, BigNumber] {
        const totalStakeDelegatedToPool = BigNumber.sum(...Object.values(stakeBalances));
        const stakeDelegatedToPoolByOperator = stakeBalances[this._operatorByPoolId[poolId]];
        const membersStakeDelegatedToPool = totalStakeDelegatedToPool.minus(stakeDelegatedToPoolByOperator);
        const operatorPortion = membersStakeDelegatedToPool.eq(0)
            ? reward
            : reward.times(operatorShare).dividedToIntegerBy(PPM_100_PERCENT);
        const membersPortion = reward.minus(operatorPortion);
        return [operatorBalance.plus(operatorPortion), rewardBalance.plus(membersPortion)];
    }

    private async _getOperatorBalanceByPoolIdAsync(
        operatorByPoolId: OperatorByPoolId,
    ): Promise<OperatorBalanceByPoolId> {
        const operatorBalanceByPoolId: OperatorBalanceByPoolId = {};
        for (const poolId of Object.keys(operatorByPoolId)) {
            operatorBalanceByPoolId[poolId] = await this._stakingApiWrapper.wethContract.balanceOf.callAsync(
                operatorByPoolId[poolId],
            );
        }
        return operatorBalanceByPoolId;
    }

    private async _getOperatorShareByPoolIdAsync(poolIds: string[]): Promise<OperatorShareByPoolId> {
        const operatorShareByPoolId: OperatorShareByPoolId = {};
        for (const poolId of poolIds) {
            operatorShareByPoolId[poolId] = new BigNumber(
                (await this._stakingApiWrapper.stakingContract.getStakingPool.callAsync(poolId)).operatorShare,
            );
        }
        return operatorShareByPoolId;
    }

    private async _getRewardBalanceByPoolIdAsync(poolIds: string[]): Promise<RewardBalanceByPoolId> {
        const rewardBalanceByPoolId: RewardBalanceByPoolId = {};
        for (const poolId of poolIds) {
            rewardBalanceByPoolId[poolId] = await this._stakingApiWrapper.stakingContract.rewardsByPoolId.callAsync(
                poolId,
            );
        }
        return rewardBalanceByPoolId;
    }

    private async _getRewardByPoolIdAsync(poolIds: string[]): Promise<RewardByPoolId> {
        const activePools = await Promise.all(
            poolIds.map(async poolId =>
                this._stakingApiWrapper.stakingContract.getStakingPoolStatsThisEpoch.callAsync(poolId),
            ),
        );
        const totalRewards = await this._stakingApiWrapper.utils.getAvailableRewardsBalanceAsync();
        const totalFeesCollected = BigNumber.sum(...activePools.map(p => p.feesCollected));
        const totalWeightedStake = BigNumber.sum(...activePools.map(p => p.weightedStake));
        if (totalRewards.eq(0) || totalFeesCollected.eq(0) || totalWeightedStake.eq(0)) {
            return _.zipObject(poolIds, _.times(poolIds.length, () => new BigNumber(0)));
        }
        const rewards = await Promise.all(
            activePools.map(async pool =>
                this._stakingApiWrapper.utils.cobbDouglasAsync(
                    totalRewards,
                    pool.feesCollected,
                    totalFeesCollected,
                    pool.weightedStake,
                    totalWeightedStake,
                ),
            ),
        );
        return _.zipObject(poolIds, rewards);
    }
}
