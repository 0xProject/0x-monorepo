import { hexConcat, signingUtils } from '@0x/contracts-test-utils';
import { SignatureType, SignedZeroExTransaction } from '@0x/types';

import { hashUtils } from './hash_utils';
import { SignedCoordinatorApproval } from './types';

export class ApprovalFactory {
    private readonly _privateKey: Buffer;
    private readonly _verifyingContractAddress: string;

    constructor(privateKey: Buffer, verifyingContract: string) {
        this._privateKey = privateKey;
        this._verifyingContractAddress = verifyingContract;
    }

    public newSignedApproval(
        transaction: SignedZeroExTransaction,
        txOrigin: string,
        signatureType: SignatureType = SignatureType.EthSign,
    ): SignedCoordinatorApproval {
        const approvalHashBuff = hashUtils.getApprovalHashBuffer(transaction, this._verifyingContractAddress, txOrigin);
        const signatureBuff = signingUtils.signMessage(approvalHashBuff, this._privateKey, signatureType);
        const signedApproval = {
            txOrigin,
            transaction,
            signature: hexConcat(signatureBuff),
        };
        return signedApproval;
    }
}
