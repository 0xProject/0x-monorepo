import { BigNumber } from '@0x/utils';

export interface StakingPoolApproval {
    makerAddress: string;
    poolId: string;
    verifyingContractAddress: string;
    chainId: number;
}

export interface SignedStakingPoolApproval extends StakingPoolApproval {
    signature: string;
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

export interface StakeBalance {
    currentEpochBalance: BigNumber,
    nextEpochBalance: BigNumber,
}

export interface StakeBalanceByPool {
    [key: string]: StakeBalance;
}


export enum StakeStatus {
    Active,
    Inactive,
    Delegated,
}

export interface StakeInfo {
    Status: StakeStatus;
    poolId?: string;
}

export interface StakeBalances {
    zrxBalance: BigNumber;
    stakeBalance: BigNumber;
    stakeBalanceInVault: BigNumber;
    withdrawableStakeBalance: BigNumber;
    activeStakeBalance: StakeBalance;
    inactiveStakeBalance: StakeBalance;
    delegatedStakeBalance: StakeBalance;
    delegatedStakeByPool: StakeBalanceByPool;
    totalDelegatedStakeByPool: StakeBalanceByPool;
}

export interface RewardVaultBalance {
    poolBalance: BigNumber;
    operatorBalance: BigNumber;
    membersBalance: BigNumber;
}

export interface RewardVaultBalanceByPoolId {
    [key: string]: RewardVaultBalance;
}

export interface OperatorShareByPoolId {
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
