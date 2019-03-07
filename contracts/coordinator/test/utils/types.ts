import { SignedZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';

export interface CoordinatorApproval {
    transaction: SignedZeroExTransaction;
    approvalExpirationTimeSeconds: BigNumber;
}

export interface SignedCoordinatorApproval extends CoordinatorApproval {
    signature: string;
}

export enum CoordinatorSignatureType {
    Illegal,
    EIP712,
    EthSign,
    NSignatureTypes,
}
