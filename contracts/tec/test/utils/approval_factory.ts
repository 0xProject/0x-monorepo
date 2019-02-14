import { SignedZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { hashUtils, SignedTECApproval, signingUtils, TECSignatureType } from './index';

export class ApprovalFactory {
    private readonly _privateKey: Buffer;
    constructor(privateKey: Buffer) {
        this._privateKey = privateKey;
    }
    public newSignedApproval(
        transaction: SignedZeroExTransaction,
        approvalExpirationTimeSeconds: BigNumber,
        signatureType: TECSignatureType = TECSignatureType.EthSign,
    ): SignedTECApproval {
        const approvalHashBuff = hashUtils.getApprovalHashBuffer(transaction, approvalExpirationTimeSeconds);
        const signatureBuff = signingUtils.signMessage(approvalHashBuff, this._privateKey, signatureType);
        const transactionHash = hashUtils.getTransactionHashHex(transaction);
        const signedApproval = {
            transactionHash,
            approvalExpirationTimeSeconds,
            transactionSignature: transaction.signature,
            approvalSignature: ethUtil.addHexPrefix(signatureBuff.toString('hex')),
        };
        return signedApproval;
    }
}
