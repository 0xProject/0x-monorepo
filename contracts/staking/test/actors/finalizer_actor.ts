import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { StakingWrapper } from '../utils/staking_wrapper';
import {
    MemberBalancesByPoolId,
    MembersByPoolId,
    OperatorByPoolId,
    OperatorShareByPoolId,
    RewardVaultBalance,
    RewardVaultBalanceByPoolId,
} from '../utils/types';

import { BaseActor } from './base_actor';

interface Reward {
    reward: BigNumber;
    poolId: string;
}

export class FinalizerActor extends BaseActor {
    private readonly _poolIds: string[];
    // @TODO (hysz): this will be used later to liquidate the reward vault.
    // tslint:disable-next-line no-unused-variable
    private readonly _operatorByPoolId: OperatorByPoolId;
    private readonly _membersByPoolId: MembersByPoolId;

    constructor(
        owner: string,
        stakingWrapper: StakingWrapper,
        poolIds: string[],
        operatorByPoolId: OperatorByPoolId,
        membersByPoolId: MembersByPoolId,
    ) {
        super(owner, stakingWrapper);
        this._poolIds = _.cloneDeep(poolIds);
        this._operatorByPoolId = _.cloneDeep(operatorByPoolId);
        this._membersByPoolId = _.cloneDeep(membersByPoolId);
    }

    public async finalizeAsync(rewards: Reward[] = []): Promise<void> {
        // cache initial info and balances
        const operatorShareByPoolId = await this._getOperatorShareByPoolIdAsync(this._poolIds);
        const rewardVaultBalanceByPoolId = await this._getRewardVaultBalanceByPoolIdAsync(this._poolIds);
        const memberBalancesByPoolId = await this._getMemberBalancesByPoolIdAsync(this._membersByPoolId);
        // compute expected changes
        const expectedRewardVaultBalanceByPoolId = await this._computeExpectedRewardVaultBalanceAsyncByPoolIdAsync(
            rewards,
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
        await this._stakingWrapper.skipToNextEpochAsync();
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
            const totalStakeDelegatedToPool = (await this._stakingWrapper.getTotalStakeDelegatedToPoolAsync(poolId))
                .currentEpochBalance;
            for (const member of membersByPoolId[poolId]) {
                if (totalStakeDelegatedToPool.eq(0)) {
                    expectedMemberBalancesByPoolId[poolId][member] = new BigNumber(0);
                } else {
                    const stakeDelegatedToPoolByMember = (await this._stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(
                        poolId,
                        member,
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
                ] = await this._stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, member);
            }
        }
        return memberBalancesByPoolId;
    }

    private async _computeExpectedRewardVaultBalanceAsyncByPoolIdAsync(
        rewards: Reward[],
        rewardVaultBalanceByPoolId: RewardVaultBalanceByPoolId,
        operatorShareByPoolId: OperatorShareByPoolId,
    ): Promise<RewardVaultBalanceByPoolId> {
        const expectedRewardVaultBalanceByPoolId = _.cloneDeep(rewardVaultBalanceByPoolId);
        for (const reward of rewards) {
            const operatorShare = operatorShareByPoolId[reward.poolId];
            expectedRewardVaultBalanceByPoolId[reward.poolId] = await this._computeExpectedRewardVaultBalanceAsync(
                reward.poolId,
                reward.reward,
                expectedRewardVaultBalanceByPoolId[reward.poolId],
                operatorShare,
            );
        }
        return expectedRewardVaultBalanceByPoolId;
    }

    private async _computeExpectedRewardVaultBalanceAsync(
        poolId: string,
        reward: BigNumber,
        rewardVaultBalance: RewardVaultBalance,
        operatorShare: BigNumber,
    ): Promise<RewardVaultBalance> {
        const totalStakeDelegatedToPool = (await this._stakingWrapper.getTotalStakeDelegatedToPoolAsync(poolId))
            .currentEpochBalance;
        const operatorPortion = totalStakeDelegatedToPool.eq(0)
            ? reward
            : reward.times(operatorShare).dividedToIntegerBy(100);
        const membersPortion = reward.minus(operatorPortion);
        return {
            poolBalance: rewardVaultBalance.poolBalance.plus(reward),
            operatorBalance: rewardVaultBalance.operatorBalance.plus(operatorPortion),
            membersBalance: rewardVaultBalance.membersBalance.plus(membersPortion),
        };
    }

    private async _getOperatorShareByPoolIdAsync(poolIds: string[]): Promise<OperatorShareByPoolId> {
        const operatorShareByPoolId: OperatorShareByPoolId = {};
        for (const poolId of poolIds) {
            const operatorShare = await this._stakingWrapper
                .getStakingPoolRewardVaultContract()
                .getOperatorShare.callAsync(poolId);
            operatorShareByPoolId[poolId] = operatorShare;
        }
        return operatorShareByPoolId;
    }

    private async _getRewardVaultBalanceByPoolIdAsync(poolIds: string[]): Promise<RewardVaultBalanceByPoolId> {
        const rewardVaultBalanceByPoolId: RewardVaultBalanceByPoolId = {};
        for (const poolId of poolIds) {
            rewardVaultBalanceByPoolId[poolId] = await this._getRewardVaultBalanceAsync(poolId);
        }
        return rewardVaultBalanceByPoolId;
    }

    private async _getRewardVaultBalanceAsync(poolId: string): Promise<RewardVaultBalance> {
        const balances = await Promise.all([
            this._stakingWrapper.rewardVaultBalanceOfAsync(poolId),
            this._stakingWrapper.rewardVaultBalanceOfOperatorAsync(poolId),
            this._stakingWrapper.rewardVaultBalanceOfMembersAsync(poolId),
        ]);
        return {
            poolBalance: balances[0],
            operatorBalance: balances[1],
            membersBalance: balances[2],
        };
    }
}
