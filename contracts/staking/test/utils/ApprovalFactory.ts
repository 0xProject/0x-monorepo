import { signingUtils } from '@0x/contracts-test-utils';
import { SignatureType } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { hashUtils } from './hash_utils';
import { SignedStakingPoolApproval } from './types';

export class ApprovalFactory {
    private readonly _privateKey: Buffer;
    private readonly _verifyingContractAddress: string;
    private readonly _chainId: number;

    constructor(privateKey: Buffer, verifyingContractAddress: string, chainId: number) {
        this._privateKey = privateKey;
        this._verifyingContractAddress = verifyingContractAddress;
        this._chainId = chainId;
    }

    public newSignedApproval(
        poolId: string,
        makerAddress: string,
        signatureType: SignatureType = SignatureType.EthSign,
    ): SignedStakingPoolApproval {
        const approvalHashBuff = hashUtils.getStakingPoolApprovalHashBuffer(
            poolId,
            makerAddress,
            this._verifyingContractAddress,
            this._chainId,
        );
        const signatureBuff = signingUtils.signMessage(approvalHashBuff, this._privateKey, signatureType);
        const signedApproval = {
            makerAddress,
            poolId,
            verifyingContractAddress: this._verifyingContractAddress,
            chainId: this._chainId,
            signature: ethUtil.addHexPrefix(signatureBuff.toString('hex')),
        };
        return signedApproval;
    }
}
