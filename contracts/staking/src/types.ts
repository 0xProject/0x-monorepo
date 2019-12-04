import { constants, Numberish } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { DecodedLogArgs, LogWithDecodedArgs } from 'ethereum-types';

import { constants as stakingConstants } from './constants';

// tslint:disable:max-classes-per-file

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

export class StoredBalance {
    constructor(
        public currentEpoch: BigNumber = stakingConstants.INITIAL_EPOCH,
        public currentEpochBalance: BigNumber = constants.ZERO_AMOUNT,
        public nextEpochBalance: BigNumber = constants.ZERO_AMOUNT,
    ) {}
}

export interface StakeBalanceByPool {
    [key: string]: StoredBalance;
}

export enum StakeStatus {
    Undelegated,
    Delegated,
}

export class StakeInfo {
    constructor(public status: StakeStatus, public poolId: string = stakingConstants.NIL_POOL_ID) {}
}

export interface StakeBalances {
    currentEpoch: BigNumber;
    zrxBalance: BigNumber;
    stakeBalance: BigNumber;
    stakeBalanceInVault: BigNumber;
    undelegatedStakeBalance: StoredBalance;
    delegatedStakeBalance: StoredBalance;
    globalUndelegatedStakeBalance: StoredBalance;
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

// mapping (uint8 => IStructs.StoredBalance) internal _globalStakeByStatus;
export interface GlobalStakeByStatus {
    [StakeStatus.Undelegated]: StoredBalance;
    [StakeStatus.Delegated]: StoredBalance;
}

/*
 * A combination of:
 * mapping (uint8 => mapping (address => IStructs.StoredBalance)) internal _ownerStakeByStatus;
 * and
 * mapping (address => mapping (bytes32 => IStructs.StoredBalance)) internal _delegatedStakeToPoolByOwner;
 */
export interface OwnerStakeByStatus {
    [StakeStatus.Undelegated]: StoredBalance;
    [StakeStatus.Delegated]: {
        total: StoredBalance;
        [poolId: string]: StoredBalance;
    };
}

export interface StakingPool {
    operator: string;
    operatorShare: number;
    delegatedStake: StoredBalance;
    lastFinalized: BigNumber; // Epoch during which the pool was most recently finalized
}

export interface StakingPoolById {
    [poolId: string]: StakingPool;
}

export class PoolStats {
    public feesCollected: BigNumber = constants.ZERO_AMOUNT;
    public weightedStake: BigNumber = constants.ZERO_AMOUNT;
    public membersStake: BigNumber = constants.ZERO_AMOUNT;

    public static fromArray(arr: [BigNumber, BigNumber, BigNumber]): PoolStats {
        const poolStats = new PoolStats();
        [poolStats.feesCollected, poolStats.weightedStake, poolStats.membersStake] = arr;
        return poolStats;
    }
}

export class AggregatedStats {
    public rewardsAvailable: BigNumber = constants.ZERO_AMOUNT;
    public numPoolsToFinalize: BigNumber = constants.ZERO_AMOUNT;
    public totalFeesCollected: BigNumber = constants.ZERO_AMOUNT;
    public totalWeightedStake: BigNumber = constants.ZERO_AMOUNT;
    public totalRewardsFinalized: BigNumber = constants.ZERO_AMOUNT;

    public static fromArray(arr: [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber]): AggregatedStats {
        const aggregatedStats = new AggregatedStats();
        [
            aggregatedStats.rewardsAvailable,
            aggregatedStats.numPoolsToFinalize,
            aggregatedStats.totalFeesCollected,
            aggregatedStats.totalWeightedStake,
            aggregatedStats.totalRewardsFinalized,
        ] = arr;
        return aggregatedStats;
    }
}

export interface AggregatedStatsByEpoch {
    [epoch: string]: AggregatedStats;
}
