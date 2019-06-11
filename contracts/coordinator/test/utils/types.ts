import { SignedZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';

export interface CoordinatorApproval {
    transaction: SignedZeroExTransaction;
    txOrigin: string;
    approvalExpirationTimeSeconds: BigNumber;
}

export interface SignedCoordinatorApproval extends CoordinatorApproval {
    signature: string;
}
