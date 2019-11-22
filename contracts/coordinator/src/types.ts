import { SignedZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';

export interface CoordinatorApproval {
    transaction: SignedZeroExTransaction;
    txOrigin: string;
}

export interface SignedCoordinatorApproval extends CoordinatorApproval {
    signature: string;
}

export interface CoordinatorTransaction {
    salt: BigNumber;
    signerAddress: string;
    data: string;
}
