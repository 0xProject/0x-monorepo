import { generatePseudoRandomSalt } from '@0x/order-utils';
import { SignedZeroExTransaction } from '@0x/types';
import * as ethUtil from 'ethereumjs-util';

import { hashUtils, signingUtils, TECSignatureType } from './index';

export class TECTransactionFactory {
    private readonly _signerBuff: Buffer;
    private readonly _verifyingContractAddress: string;
    private readonly _privateKey: Buffer;
    constructor(privateKey: Buffer, verifyingContractAddress: string) {
        this._privateKey = privateKey;
        this._verifyingContractAddress = verifyingContractAddress;
        this._signerBuff = ethUtil.privateToAddress(this._privateKey);
    }
    public newSignedTECTransaction(
        data: string,
        signatureType: TECSignatureType = TECSignatureType.EthSign,
    ): SignedZeroExTransaction {
        const transaction = {
            verifyingContractAddress: this._verifyingContractAddress,
            signerAddress: ethUtil.addHexPrefix(this._signerBuff.toString('hex')),
            salt: generatePseudoRandomSalt(),
            data,
        };
        const transactionHashBuff = hashUtils.getTransactionHashBuffer(transaction);
        const signatureBuff = signingUtils.signMessage(transactionHashBuff, this._privateKey, signatureType);
        const signedTransaction = {
            ...transaction,
            signature: ethUtil.addHexPrefix(signatureBuff.toString('hex')),
        };
        return signedTransaction;
    }
}
