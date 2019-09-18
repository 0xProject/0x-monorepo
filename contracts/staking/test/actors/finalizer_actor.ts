import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { StakingApiWrapper } from '../utils/api_wrapper';
import {
    MemberBalancesByPoolId,
    MembersByPoolId,
    OperatorBalanceByPoolId,
    OperatorByPoolId,
    OperatorShareByPoolId,
    RewardVaultBalanceByPoolId,
} from '../utils/types';

import { BaseActor } from './base_actor';

interface Reward {
    reward: BigNumber;
    poolId: string;
}

export class FinalizerActor extends BaseActor {
    private readonly _poolIds: string[];
    private readonly _operatorByPoolId: OperatorByPoolId;
    private readonly _membersByPoolId: MembersByPoolId;

    constructor(
        owner: string,
        stakingApiWrapper: StakingApiWrapper,
        poolIds: string[],
        operatorByPoolId: OperatorByPoolId,
        membersByPoolId: MembersByPoolId,
    ) {
        super(owner, stakingApiWrapper);
        this._poolIds = _.cloneDeep(poolIds);
        this._operatorByPoolId = _.cloneDeep(operatorByPoolId);
        this._membersByPoolId = _.cloneDeep(membersByPoolId);
    }

    public async finalizeAsync(rewards: Reward[] = []): Promise<void> {
        // cache initial info and balances
        const operatorShareByPoolId = await this._getOperatorShareByPoolIdAsync(this._poolIds);
        const rewardVaultBalanceByPoolId = await this._getRewardVaultBalanceByPoolIdAsync(this._poolIds);
        const memberBalancesByPoolId = await this._getMemberBalancesByPoolIdAsync(this._membersByPoolId);
        const operatorBalanceByPoolId = await this._getOperatorBalanceByPoolIdAsync(this._operatorByPoolId);
        // compute expected changes
        const [
            expectedOperatorBalanceByPoolId,
            expectedRewardVaultBalanceByPoolId,
        ] = await this._computeExpectedRewardVaultBalanceAsyncByPoolIdAsync(
            rewards,
            operatorBalanceByPoolId,
            rewardVaultBalanceByPoolId,
            operatorShareByPoolId,
        );
        const memberRewardByPoolId = _.mapValues(_.keyBy(rewards, 'poolId'), r => {
            return r.reward.minus(r.reward.times(operatorShareByPoolId[r.poolId]).dividedToIntegerBy(100));
        });
        const expectedMemberBalancesByPoolId = await this._computeExpectedMemberBalancesByPoolIdAsync(
            this._membersByPoolId,
            memberBalancesByPoolId,
            memberRewardByPoolId,
        );
        // finalize
        await this._stakingApiWrapper.utils.skipToNextEpochAsync();
        // assert reward vault changes
        const finalRewardVaultBalanceByPoolId = await this._getRewardVaultBalanceByPoolIdAsync(this._poolIds);
        expect(finalRewardVaultBalanceByPoolId, 'final pool balances in reward vault').to.be.deep.equal(
            expectedRewardVaultBalanceByPoolId,
        );
        // assert member balances
        const finalMemberBalancesByPoolId = await this._getMemberBalancesByPoolIdAsync(this._membersByPoolId);
        expect(finalMemberBalancesByPoolId, 'final delegator balances in reward vault').to.be.deep.equal(
            expectedMemberBalancesByPoolId,
        );
        // assert operator balances
        const finalOperatorBalanceByPoolId = await this._getOperatorBalanceByPoolIdAsync(this._operatorByPoolId);
        expect(finalOperatorBalanceByPoolId, 'final operator balances in eth vault').to.be.deep.equal(
            expectedOperatorBalanceByPoolId,
        );
    }

    private async _computeExpectedMemberBalancesByPoolIdAsync(
        membersByPoolId: MembersByPoolId,
        memberBalancesByPoolId: MemberBalancesByPoolId,
        rewardByPoolId: { [key: string]: BigNumber },
    ): Promise<MemberBalancesByPoolId> {
        const expectedMemberBalancesByPoolId = _.cloneDeep(memberBalancesByPoolId);
        for (const poolId of Object.keys(membersByPoolId)) {
            if (rewardByPoolId[poolId] === undefined) {
                continue;
            }
            const totalStakeDelegatedToPool = (await this._stakingApiWrapper.stakingContract.getTotalStakeDelegatedToPool.callAsync(
                poolId,
            )).currentEpochBalance;
            for (const member of membersByPoolId[poolId]) {
                if (totalStakeDelegatedToPool.eq(0)) {
                    expectedMemberBalancesByPoolId[poolId][member] = new BigNumber(0);
                } else {
                    const stakeDelegatedToPoolByMember = (await this._stakingApiWrapper.stakingContract.getStakeDelegatedToPoolByOwner.callAsync(
                        member,
                        poolId,
                    )).currentEpochBalance;
                    const rewardThisEpoch = rewardByPoolId[poolId]
                        .times(stakeDelegatedToPoolByMember)
                        .dividedToIntegerBy(totalStakeDelegatedToPool);
                    expectedMemberBalancesByPoolId[poolId][member] =
                        memberBalancesByPoolId[poolId][member] === undefined
                            ? rewardThisEpoch
                            : memberBalancesByPoolId[poolId][member].plus(rewardThisEpoch);
                }
            }
        }
        return expectedMemberBalancesByPoolId;
    }

    private async _getMemberBalancesByPoolIdAsync(membersByPoolId: MembersByPoolId): Promise<MemberBalancesByPoolId> {
        const memberBalancesByPoolId: MemberBalancesByPoolId = {};
        for (const poolId of Object.keys(membersByPoolId)) {
            const members = membersByPoolId[poolId];
            memberBalancesByPoolId[poolId] = {};
            for (const member of members) {
                memberBalancesByPoolId[poolId][
                    member
                ] = await this._stakingApiWrapper.stakingContract.computeRewardBalanceOfDelegator.callAsync(
                    poolId,
                    member,
                );
            }
        }
        return memberBalancesByPoolId;
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
            [
                expectedOperatorBalanceByPoolId[reward.poolId],
                expectedRewardVaultBalanceByPoolId[reward.poolId],
            ] = await this._computeExpectedRewardVaultBalanceAsync(
                reward.poolId,
                reward.reward,
                expectedOperatorBalanceByPoolId[reward.poolId],
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
    ): Promise<[BigNumber, BigNumber]> {
        const totalStakeDelegatedToPool = (await this._stakingApiWrapper.stakingContract.getTotalStakeDelegatedToPool.callAsync(
            poolId,
        )).currentEpochBalance;
        const operatorPortion = totalStakeDelegatedToPool.eq(0)
            ? reward
            : reward.times(operatorShare).dividedToIntegerBy(100);
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
