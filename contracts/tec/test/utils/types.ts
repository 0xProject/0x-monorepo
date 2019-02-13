import { BigNumber } from '@0x/utils';

export interface TECApproval {
    transactionHash: string;
    transactionSignature: string;
    approvalExpirationTimeSeconds: BigNumber;
}
