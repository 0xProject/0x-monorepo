import { SignedZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { hashUtils, SignedCoordinatorApproval, signingUtils, CoordinatorSignatureType } from './index';

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
        signatureType: CoordinatorSignatureType = CoordinatorSignatureType.EthSign,
    ): SignedCoordinatorApproval {
        const coordinatorTransaction = {
            ...transaction,
            verifyingContractAddress: this._verifyingContractAddress,
        };
        const approvalHashBuff = hashUtils.getApprovalHashBuffer(coordinatorTransaction, approvalExpirationTimeSeconds);
        const signatureBuff = signingUtils.signMessage(approvalHashBuff, this._privateKey, signatureType);
        const signedApproval = {
            transaction: coordinatorTransaction,
            approvalExpirationTimeSeconds,
            signature: ethUtil.addHexPrefix(signatureBuff.toString('hex')),
        };
        return signedApproval;
    }
}
