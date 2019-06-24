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