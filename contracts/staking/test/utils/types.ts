import { BigNumber } from '@0x/utils';

import { constants } from './constants';

export interface StakingParams {
    epochDurationInSeconds: BigNumber;
    rewardDelegatedStakeWeight: number | BigNumber;
    minimumPoolStake: BigNumber;
    maximumMakersInPool: BigNumber;
    cobbDouglasAlphaNumerator: number | BigNumber;
    cobbDouglasAlphaDenominator: number | BigNumber;
    wethProxyAddress: string;
    ethVaultAddress: string;
    rewardVaultAddress: string;
    zrxVaultAddress: string;
}

export interface StakerBalances {
    zrxBalance: BigNumber;
    stakeBalance: BigNumber;
    stakeBalanceInVault: BigNumber;
    withdrawableStakeBalance: BigNumber;
    activatableStakeBalance: BigNumber;
    activatedStakeBalance: BigNumber;
    deactivatedStakeBalance: BigNumber;
    timeLockedStakeBalance: BigNumber;
}

export interface DelegatorBalances extends StakerBalances {
    delegatedStakeBalance: BigNumber;
    stakeDelegatedToPoolByOwner: BigNumber[];
    stakeDelegatedToPool: BigNumber[];
}

export interface SimulationParams {
    users: string[];
    numberOfPools: number;
    poolOperatorShares: number[];
    stakeByPoolOperator: BigNumber[];
    numberOfMakers: number;
    numberOfMakersPerPool: number[];
    protocolFeesByMaker: BigNumber[];
    numberOfDelegators: number;
    numberOfDelegatorsPerPool: number[];
    stakeByDelegator: BigNumber[];
    expectedFeesByPool: BigNumber[];
    expectedPayoutByPool: BigNumber[];
    expectedPayoutByPoolOperator: BigNumber[];
    expectedMembersPayoutByPool: BigNumber[];
    expectedPayoutByDelegator: BigNumber[];
    exchangeAddress: string;
    delegateInNextEpoch: boolean;
    withdrawByUndelegating: boolean;
}

export interface EndOfEpochInfo {
    closingEpoch: BigNumber;
    activePoolIds: string[];
    rewardsAvailable: BigNumber;
    totalFeesCollected: BigNumber;
    totalWeightedStake: BigNumber;
}

export interface StakeBalance {
    currentEpochBalance: BigNumber;
    nextEpochBalance: BigNumber;
}

export interface StakeBalanceByPool {
    [key: string]: StakeBalance;
}

export enum StakeStatus {
    Active,
    Inactive,
    Delegated,
}

export class StakeInfo {
    public status: StakeStatus;
    public poolId: string;

    constructor(status: StakeStatus, poolId?: string) {
        this.status = status;
        this.poolId = poolId !== undefined ? poolId : constants.NIL_POOL_ID;
    }
}

export interface StakeBalances {
    zrxBalance: BigNumber;
    stakeBalance: BigNumber;
    stakeBalanceInVault: BigNumber;
    withdrawableStakeBalance: BigNumber;
    activeStakeBalance: StakeBalance;
    inactiveStakeBalance: StakeBalance;
    delegatedStakeBalance: StakeBalance;
    globalActiveStakeBalance: StakeBalance;
    globalInactiveStakeBalance: StakeBalance;
    globalDelegatedStakeBalance: StakeBalance;
    delegatedStakeByPool: StakeBalanceByPool;
    totalDelegatedStakeByPool: StakeBalanceByPool;
}

export interface RewardVaultBalanceByPoolId {
    [key: string]: BigNumber;
}

export interface OperatorShareByPoolId {
    [key: string]: BigNumber;
}

export interface OperatorBalanceByPoolId {
    [key: string]: BigNumber;
}

export interface BalanceByOwner {
    [key: string]: BigNumber;
}

export interface RewardByPoolId {
    [key: string]: BigNumber;
}

export interface MemberBalancesByPoolId {
    [key: string]: BalanceByOwner;
}

export interface OperatorByPoolId {
    [key: string]: string;
}

export interface MembersByPoolId {
    [key: string]: string[];
}
