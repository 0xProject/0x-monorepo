import { expect } from '@0x/contracts-test-utils';
import { RevertError } from '@0x/utils';
import * as _ from 'lodash';

import { constants as stakingConstants } from '../utils/constants';
import { StakingWrapper } from '../utils/staking_wrapper';

import { BaseActor } from './base_actor';
import { BigNumber, StringRevertError } from '@0x/utils';

export interface RewardVaultBalance {
    poolBalance: BigNumber;
    operatorBalance: BigNumber;
    membersBalance: BigNumber;
}

export interface RewardVaultBalanceByPoolId {
    [key:string]: RewardVaultBalance;
}

export interface OperatorShareByPoolId {
    [key:string]: BigNumber;
}

export interface BalanceByOwner {
    [key:string]: BigNumber;
}

export interface RewardByPoolId {
    [key:string]: BigNumber;
}

export interface MemberBalancesByPoolId {
    [key:string]: BalanceByOwner;
}

export interface OperatorByPoolId {
    [key:string]: string;
}

export interface MembersByPoolId {
    [key:string]: string[]
}

export class FinalizerActor extends BaseActor {
    private readonly _poolIds: string[];
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

    public async finalizeAsync(
        rewards: {reward: BigNumber, poolId: string}[] = [],
        revertError?: RevertError
    ): Promise<void> {
        // cache initial info and balances
        const operatorShareByPoolId = await this._getOperatorShareByPoolId(this._poolIds);
        const rewardVaultBalanceByPoolId = await this._getRewardVaultBalanceByPoolId(this._poolIds);
        // compute expecnted changes
        const expectedRewardVaultBalanceByPoolId = await this._computeExpectedRewardVaultBalanceByPoolId(rewards, rewardVaultBalanceByPoolId, operatorShareByPoolId);
        const expectedMemberBalancesByPoolId = await this._computeExpectedMemberBalancesByPoolId(this._membersByPoolId, expectedRewardVaultBalanceByPoolId);
        // finalize
        await this._stakingWrapper.testFinalizefees(rewards); // available
        // assert reward vault changes
        const finalRewardVaultBalanceByPoolId = await this._getRewardVaultBalanceByPoolId(this._poolIds);
        console.log('FINAL\n', JSON.stringify(finalRewardVaultBalanceByPoolId, null, 4));
        console.log('EXP\n',JSON.stringify(expectedRewardVaultBalanceByPoolId, null, 4));
        expect(finalRewardVaultBalanceByPoolId).to.be.deep.equal(expectedRewardVaultBalanceByPoolId);
        // assert member balances
        const finalMemberBalancesByPoolId = await this._getMemberBalancesByPoolId(this._membersByPoolId);
        console.log(JSON.stringify(finalMemberBalancesByPoolId));
        expect(finalMemberBalancesByPoolId).to.be.deep.equal(expectedMemberBalancesByPoolId);

    }

    public async liquidateAsync() {
        const ethVaultBalanceByOwner = await this._getEthVaultBalanceByOwner(this._operatorByPoolId, this._membersByPoolId);
    }

    private async _computeExpectedMemberBalancesByPoolId(membersByPoolId: MembersByPoolId, rewardVaultBalanceByPoolId: RewardVaultBalanceByPoolId): Promise<MemberBalancesByPoolId> {
        const memberBalancesByPoolId: MemberBalancesByPoolId = {};
        for (const poolId in membersByPoolId) {
            const members = membersByPoolId[poolId];
            memberBalancesByPoolId[poolId] = {};
            const totalStakeDelegatedToPool = (await this._stakingWrapper.getTotalStakeDelegatedToPoolAsync(poolId)).current;
            for (const member of members) {
                console.log(`getting member balance for ${poolId}/${member}`);
                const stakeDelegatedToPoolByMember = (await this._stakingWrapper.getStakeDelegatedToPoolByOwnerAsync(poolId, member)).current;
                if (totalStakeDelegatedToPool.eq(0)) {
                    memberBalancesByPoolId[poolId][member] = new BigNumber(0);
                } else {
                    memberBalancesByPoolId[poolId][member] = rewardVaultBalanceByPoolId[poolId].membersBalance.times(stakeDelegatedToPoolByMember).dividedToIntegerBy(totalStakeDelegatedToPool);
                }
            }
        }
        return memberBalancesByPoolId;
    }

    private async _getMemberBalancesByPoolId(membersByPoolId: MembersByPoolId): Promise<MemberBalancesByPoolId> {
        const memberBalancesByPoolId: MemberBalancesByPoolId = {};
        for (const poolId in membersByPoolId) {
            const members = membersByPoolId[poolId];
            memberBalancesByPoolId[poolId] = {};
            for (const member of members) {
                console.log(`getting member balance for ${poolId}/${member}`);
                memberBalancesByPoolId[poolId][member] = await this._stakingWrapper.computeRewardBalanceOfStakingPoolMemberAsync(poolId, member);
            }
        }
        return memberBalancesByPoolId;
    }

    private async _computeExpectedRewardVaultBalanceByPoolId(rewards: {reward: BigNumber, poolId: string}[], rewardVaultBalanceByPoolId: RewardVaultBalanceByPoolId, operatorShareByPoolId: OperatorShareByPoolId): Promise<RewardVaultBalanceByPoolId> {
        const expectedRewardVaultBalanceByPoolId = _.cloneDeep(rewardVaultBalanceByPoolId);
        for (const reward of rewards) {
            const operatorShare = operatorShareByPoolId[reward.poolId];
            expectedRewardVaultBalanceByPoolId[reward.poolId] = await this._computeExpectedRewardVaultBalance(reward.poolId, reward.reward, expectedRewardVaultBalanceByPoolId[reward.poolId], operatorShare);
        }
        return expectedRewardVaultBalanceByPoolId;
    }

    private async _computeExpectedRewardVaultBalance(poolId: string ,reward: BigNumber, rewardVaultBalance: RewardVaultBalance, operatorShare: BigNumber): Promise<RewardVaultBalance> {
        const totalStakeDelegatedToPool = (await this._stakingWrapper.getTotalStakeDelegatedToPoolAsync(poolId)).current;
        const operatorPortion = totalStakeDelegatedToPool.eq(0) ? reward : reward.times(operatorShare).dividedToIntegerBy(100);
        const membersPortion = reward.minus(operatorPortion);
        return {
            poolBalance: rewardVaultBalance.poolBalance.plus(reward),
            operatorBalance: rewardVaultBalance.operatorBalance.plus(operatorPortion),
            membersBalance: rewardVaultBalance.membersBalance.plus(membersPortion)
        };
    }

    private async _getEthVaultBalanceByOwner(
        operatorByPoolId: {[key:string]: string},
        membersByPoolId: MembersByPoolId,
    ): Promise<BalanceByOwner> {
        // operators
        let ethVaultBalancyByOwner: BalanceByOwner = {};
        for (const poolId in operatorByPoolId) {
            const operator = operatorByPoolId[poolId];
            if (operator in ethVaultBalancyByOwner) {
                continue;
            }
            ethVaultBalancyByOwner[operator] = await this._stakingWrapper.getEthVaultContract().balanceOf.callAsync(operator);
        }
        // pool members
        for (const poolId in membersByPoolId) {
            const members = membersByPoolId[poolId];
            for (const member in members) {
                if (member in ethVaultBalancyByOwner) {
                    continue;
                }
                ethVaultBalancyByOwner[member] = await this._stakingWrapper.getEthVaultContract().balanceOf.callAsync(member);
            }
        }
        return ethVaultBalancyByOwner;
    }

    private async _getOperatorShareByPoolId(poolIds: string[]): Promise<OperatorShareByPoolId> {
        let operatorShareByPoolId: OperatorShareByPoolId = {};
        for (const poolId of poolIds) {
            const operatorShare = await this._stakingWrapper.getStakingPoolRewardVaultContract().getOperatorShare.callAsync(poolId);
            operatorShareByPoolId[poolId] = operatorShare;
        }
        return operatorShareByPoolId;
    }

    private async _getRewardVaultBalanceByPoolId(poolIds: string[]): Promise<RewardVaultBalanceByPoolId> {
        let rewardVaultBalanceByPoolId: RewardVaultBalanceByPoolId = {};
        for (const poolId of poolIds) {
            rewardVaultBalanceByPoolId[poolId] = await this._getRewardVaultBalance(poolId);
        }
        return rewardVaultBalanceByPoolId;
    }

    private async _getRewardVaultBalance(poolId: string): Promise<RewardVaultBalance> {
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
