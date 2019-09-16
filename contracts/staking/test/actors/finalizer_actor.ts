import { constants, expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { StakingApiWrapper } from '../utils/api_wrapper';
import {
    DelegatorBalancesByPoolId,
    DelegatorsByPoolId,
    OperatorByPoolId,
    OperatorShareByPoolId,
    RewardByPoolId,
    RewardVaultBalance,
    RewardVaultBalanceByPoolId,
} from '../utils/types';

import { BaseActor } from './base_actor';

interface Reward {
    reward: BigNumber;
    poolId: string;
}

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

    public async finalizeAsync(rewards: Reward[] = []): Promise<void> {
        // cache initial info and balances
        const operatorShareByPoolId =
            await this._getOperatorShareByPoolIdAsync(this._poolIds);
        const rewardVaultBalanceByPoolId =
            await this._getRewardVaultBalanceByPoolIdAsync(this._poolIds);
        const delegatorBalancesByPoolId =
            await this._getDelegatorBalancesByPoolIdAsync(this._delegatorsByPoolId);
        const delegatorStakesByPoolId =
            await this._getDelegatorStakesByPoolIdAsync(this._delegatorsByPoolId);
        // compute expected changes
        const expectedRewardVaultBalanceByPoolId =
            await this._computeExpectedRewardVaultBalanceAsyncByPoolIdAsync(
                rewards,
                rewardVaultBalanceByPoolId,
                operatorShareByPoolId,
            );
        const totalRewardsByPoolId =
            _.zipObject(_.map(rewards, 'poolId'), _.map(rewards, 'reward'));
        const expectedDelegatorBalancesByPoolId =
            await this._computeExpectedDelegatorBalancesByPoolIdAsync(
                this._delegatorsByPoolId,
                delegatorBalancesByPoolId,
                delegatorStakesByPoolId,
                operatorShareByPoolId,
                totalRewardsByPoolId,
            );
        // finalize
        await this._stakingApiWrapper.utils.skipToNextEpochAndFinalizeAsync();
        // assert reward vault changes
        const finalRewardVaultBalanceByPoolId =
            await this._getRewardVaultBalanceByPoolIdAsync(this._poolIds);
        expect(finalRewardVaultBalanceByPoolId, 'final pool balances in reward vault').to.be.deep.equal(
            expectedRewardVaultBalanceByPoolId,
        );
        // assert delegator balances
        const finalDelegatorBalancesByPoolId =
            await this._getDelegatorBalancesByPoolIdAsync(this._delegatorsByPoolId);
        expect(finalDelegatorBalancesByPoolId, 'final delegator balances in reward vault').to.be.deep.equal(
            expectedDelegatorBalancesByPoolId,
        );
        // assert operator balances
        const finalOperatorBalanceByPoolId = await this._getOperatorBalanceByPoolIdAsync(this._operatorByPoolId);
        expect(finalOperatorBalanceByPoolId, 'final operator balances in eth vault').to.be.deep.equal(
            expectedOperatorBalanceByPoolId,
        );
    }

    private async _computeExpectedDelegatorBalancesByPoolIdAsync(
        delegatorsByPoolId: DelegatorsByPoolId,
        delegatorBalancesByPoolId: DelegatorBalancesByPoolId,
        delegatorStakesByPoolId: DelegatorBalancesByPoolId,
        operatorShareByPoolId: OperatorShareByPoolId,
        totalRewardByPoolId: RewardByPoolId,
    ): Promise<DelegatorBalancesByPoolId> {
        const expectedDelegatorBalancesByPoolId = _.cloneDeep(delegatorBalancesByPoolId);
        for (const poolId of Object.keys(delegatorsByPoolId)) {
            if (totalRewardByPoolId[poolId] === undefined) {
                continue;
            }

            const operator = this._operatorByPoolId[poolId];
            const [, membersStakeInPool] =
                await this._getOperatorAndDelegatorsStakeInPoolAsync(poolId);
            const operatorShare = operatorShareByPoolId[poolId].dividedBy(PPM_100_PERCENT);
            const totalReward = totalRewardByPoolId[poolId];
            const operatorReward = membersStakeInPool.eq(0) ?
                totalReward :
                totalReward.times(operatorShare).integerValue(BigNumber.ROUND_DOWN);
            const membersTotalReward = totalReward.minus(operatorReward);

            for (const delegator of delegatorsByPoolId[poolId]) {
                let delegatorReward = new BigNumber(0);
                if (delegator === operator) {
                    delegatorReward = operatorReward;
                } else if (membersStakeInPool.gt(0)) {
                    const delegatorStake = delegatorStakesByPoolId[poolId][delegator];
                    delegatorReward = delegatorStake
                        .times(membersTotalReward)
                        .dividedBy(membersStakeInPool)
                        .integerValue(BigNumber.ROUND_DOWN);
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
        const computeRewardBalanceOfDelegator =
            this._stakingApiWrapper.stakingContract.computeRewardBalanceOfDelegator;
        const rewardVaultBalanceOfOperator =
            this._stakingApiWrapper.rewardVaultContract.balanceOfOperator;
        const delegatorBalancesByPoolId: DelegatorBalancesByPoolId = {};

        for (const poolId of Object.keys(delegatorsByPoolId)) {
            const operator = this._operatorByPoolId[poolId];
            const delegators = delegatorsByPoolId[poolId];
            delegatorBalancesByPoolId[poolId] = {};
            for (const delegator of delegators) {
                let balance =
                    new BigNumber(delegatorBalancesByPoolId[poolId][delegator] || 0);
                if (delegator === operator) {
                    balance = balance.plus(
                        await rewardVaultBalanceOfOperator.callAsync(poolId),
                    );
                } else {
                    balance = balance.plus(
                        await computeRewardBalanceOfDelegator.callAsync(
                            poolId,
                            delegator,
                        ),
                    );
                }
                delegatorBalancesByPoolId[poolId][delegator] = balance;
            }
        }
        return delegatorBalancesByPoolId;
    }

    private async _getDelegatorStakesByPoolIdAsync(
        delegatorsByPoolId: DelegatorsByPoolId,
    ): Promise<DelegatorBalancesByPoolId> {
        const getStakeDelegatedToPoolByOwner =
            this._stakingApiWrapper.stakingContract.getStakeDelegatedToPoolByOwner;
        const delegatorBalancesByPoolId: DelegatorBalancesByPoolId = {};
        for (const poolId of Object.keys(delegatorsByPoolId)) {
            const delegators = delegatorsByPoolId[poolId];
            delegatorBalancesByPoolId[poolId] = {};
            for (const delegator of delegators) {
                delegatorBalancesByPoolId[poolId][
                    delegator
                ] = (await getStakeDelegatedToPoolByOwner.callAsync(
                    delegator,
                    poolId,
                )).currentEpochBalance;
            }
        }
        return delegatorBalancesByPoolId;
    }

    private async _computeExpectedRewardVaultBalanceAsyncByPoolIdAsync(
        rewards: Reward[],
        operatorBalanceByPoolId: OperatorBalanceByPoolId,
        rewardVaultBalanceByPoolId: RewardVaultBalanceByPoolId,
        operatorShareByPoolId: OperatorShareByPoolId,
    ): Promise<[RewardVaultBalanceByPoolId, OperatorBalanceByPoolId]> {
        const expectedOperatorBalanceByPoolId = _.cloneDeep(operatorBalanceByPoolId);
        const expectedRewardVaultBalanceByPoolId = _.cloneDeep(rewardVaultBalanceByPoolId);
        for (const reward of rewards) {
            const operatorShare = operatorShareByPoolId[reward.poolId];
            expectedRewardVaultBalanceByPoolId[reward.poolId] =
                await this._computeExpectedRewardVaultBalanceAsync(
                    reward.poolId,
                    reward.reward,
                    expectedRewardVaultBalanceByPoolId[reward.poolId],
                    operatorShare,
                );
        }
        return [expectedOperatorBalanceByPoolId, expectedRewardVaultBalanceByPoolId];
    }

    private async _computeExpectedRewardVaultBalanceAsync(
        poolId: string,
        reward: BigNumber,
        operatorBalance: BigNumber,
        rewardVaultBalance: BigNumber,
        operatorShare: BigNumber,
    ): Promise<RewardVaultBalance> {
        const [, membersStakeInPool] = await this._getOperatorAndDelegatorsStakeInPoolAsync(poolId);
        const operatorPortion = membersStakeInPool.eq(0)
            ? reward
            : reward.times(operatorShare).dividedToIntegerBy(PPM_100_PERCENT);
        const membersPortion = reward.minus(operatorPortion);
        return [operatorBalance.plus(operatorPortion), rewardVaultBalance.plus(membersPortion)];
    }

    private async _getOperatorBalanceByPoolIdAsync(
        operatorByPoolId: OperatorByPoolId,
    ): Promise<OperatorBalanceByPoolId> {
        const operatorBalanceByPoolId: OperatorBalanceByPoolId = {};
        for (const poolId of Object.keys(operatorByPoolId)) {
            operatorBalanceByPoolId[poolId] = await this._stakingApiWrapper.ethVaultContract.balanceOf.callAsync(
                operatorByPoolId[poolId],
            );
        }
        return operatorBalanceByPoolId;
    }

    private async _getOperatorAndDelegatorsStakeInPoolAsync(
        poolId: string,
    ): Promise<[BigNumber, BigNumber]> {
        const stakingContract = this._stakingApiWrapper.stakingContract;
        const operator = await stakingContract.getPoolOperator.callAsync(poolId);
        const totalStakeInPool = (await stakingContract.getTotalStakeDelegatedToPool.callAsync(
            poolId,
        )).currentEpochBalance;
        const operatorStakeInPool = (await stakingContract.getStakeDelegatedToPoolByOwner.callAsync(
            operator,
            poolId,
        )).currentEpochBalance;
        const membersStakeInPool = totalStakeInPool.minus(operatorStakeInPool);
        return [operatorStakeInPool, membersStakeInPool];
    }

    private async _getOperatorShareByPoolIdAsync(poolIds: string[]): Promise<OperatorShareByPoolId> {
        const operatorShareByPoolId: OperatorShareByPoolId = {};
        for (const poolId of poolIds) {
            const pool = await this._stakingApiWrapper.stakingContract.getStakingPool.callAsync(poolId);
            operatorShareByPoolId[poolId] = new BigNumber(pool.operatorShare);
        }
        return operatorShareByPoolId;
    }

    private async _getRewardVaultBalanceByPoolIdAsync(poolIds: string[]): Promise<RewardVaultBalanceByPoolId> {
        const rewardVaultBalanceByPoolId: RewardVaultBalanceByPoolId = {};
        for (const poolId of poolIds) {
            rewardVaultBalanceByPoolId[poolId] = await this._stakingApiWrapper.rewardVaultContract.balanceOf.callAsync(
                poolId,
            );
        }
        return rewardVaultBalanceByPoolId;
    }
}
