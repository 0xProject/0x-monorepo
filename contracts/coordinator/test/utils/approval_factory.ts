import { signingUtils } from '@0x/contracts-test-utils';
import { SignatureType, SignedZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { hashUtils, SignedCoordinatorApproval } from './index';

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
        approvalExpirationTimeSeconds: BigNumber,
        signatureType: SignatureType = SignatureType.EthSign,
    ): SignedCoordinatorApproval {
        const approvalHashBuff = hashUtils.getApprovalHashBuffer(
            transaction,
            this._verifyingContractAddress,
            txOrigin,
            approvalExpirationTimeSeconds,
        );
        const signatureBuff = signingUtils.signMessage(approvalHashBuff, this._privateKey, signatureType);
        const signedApproval = {
            txOrigin,
            transaction,
            approvalExpirationTimeSeconds,
            signature: ethUtil.addHexPrefix(signatureBuff.toString('hex')),
        };
        return signedApproval;
    }
}
