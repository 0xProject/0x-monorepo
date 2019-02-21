import { SignedZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { hashUtils, SignedTECApproval, signingUtils, TECSignatureType } from './index';

export class ApprovalFactory {
    private readonly _privateKey: Buffer;
    private readonly _verifyingContractAddress: string;
    constructor(privateKey: Buffer, verifyingContractAddress: string) {
        this._privateKey = privateKey;
        this._verifyingContractAddress = verifyingContractAddress;
    }
    public newSignedApproval(
        transaction: SignedZeroExTransaction,
        approvalExpirationTimeSeconds: BigNumber,
        signatureType: TECSignatureType = TECSignatureType.EthSign,
    ): SignedTECApproval {
        const tecTransaction = {
            ...transaction,
            verifyingContractAddress: this._verifyingContractAddress,
        };
        const approvalHashBuff = hashUtils.getApprovalHashBuffer(tecTransaction, approvalExpirationTimeSeconds);
        const signatureBuff = signingUtils.signMessage(approvalHashBuff, this._privateKey, signatureType);
        const signedApproval = {
            transaction: tecTransaction,
            approvalExpirationTimeSeconds,
            signature: ethUtil.addHexPrefix(signatureBuff.toString('hex')),
        };
        return signedApproval;
    }
}
