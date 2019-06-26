import { BigNumber } from '@0x/utils';

export interface StakingPoolApproval {
    makerAddress: string,
    poolId: string,
    verifyingContractAddress: string,
    chainId: number
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
    timelockedStakeBalance: BigNumber;
}

export interface DelegatorBalances extends StakerBalances {
    delegatedStakeBalance: BigNumber;
    stakeDelegatedToPoolByOwner: BigNumber[];
    stakeDelegatedToPool: BigNumber[];
}