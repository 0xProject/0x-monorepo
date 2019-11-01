import { SignedZeroExTransaction } from '@0x/types';

export interface CoordinatorApproval {
    transaction: SignedZeroExTransaction;
    txOrigin: string;
}

export interface SignedCoordinatorApproval extends CoordinatorApproval {
    signature: string;
}
