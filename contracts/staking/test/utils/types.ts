import { Numberish } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { DecodedLogArgs, LogWithDecodedArgs } from 'ethereum-types';

import { constants } from './constants';

export interface StakingParams {
    epochDurationInSeconds: Numberish;
    rewardDelegatedStakeWeight: Numberish;
    minimumPoolStake: Numberish;
    cobbDouglasAlphaNumerator: Numberish;
    cobbDouglasAlphaDenominator: Numberish;
}

export interface StakerBalances {
    zrxBalance: BigNumber;
    stakeBalance: BigNumber;
    stakeBalanceInVault: BigNumber;
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

export interface StoredBalance {
    currentEpoch: number | BigNumber;
    currentEpochBalance: BigNumber;
    nextEpochBalance: BigNumber;
}

export interface StakeBalanceByPool {
    [key: string]: StoredBalance;
}

export enum StakeStatus {
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
    currentEpoch: BigNumber;
    zrxBalance: BigNumber;
    stakeBalance: BigNumber;
    stakeBalanceInVault: BigNumber;
    inactiveStakeBalance: StoredBalance;
    delegatedStakeBalance: StoredBalance;
    globalInactiveStakeBalance: StoredBalance;
    globalDelegatedStakeBalance: StoredBalance;
    delegatedStakeByPool: StakeBalanceByPool;
    totalDelegatedStakeByPool: StakeBalanceByPool;
}

export interface RewardBalanceByPoolId {
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

export interface DelegatorBalancesByPoolId {
    [key: string]: BalanceByOwner;
}

export interface OperatorByPoolId {
    [key: string]: string;
}

export interface DelegatorsByPoolId {
    [key: string]: string[];
}

export type DecodedLogs = Array<LogWithDecodedArgs<DecodedLogArgs>>;
