import { BigNumber } from '@0x/utils';

export interface TECApproval {
    transactionHash: string;
    transactionSignature: string;
    approvalExpirationTimeSeconds: BigNumber;
}

export enum TECSignatureType {
    Illegal,
    EIP712,
    EthSign,
    NSignatureTypes,
}
