import { SignedZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';

export interface TECApproval {
    transaction: SignedZeroExTransaction;
    approvalExpirationTimeSeconds: BigNumber;
}

export interface SignedTECApproval extends TECApproval {
    signature: string;
}

export enum TECSignatureType {
    Illegal,
    EIP712,
    EthSign,
    NSignatureTypes,
}
