import { TransactionFactory } from '@0x/contracts-test-utils';
import { SignatureType, SignedZeroExTransaction } from '@0x/types';
import * as ethUtil from 'ethereumjs-util';

import { TECSignatureType } from './types';

export class TECTransactionFactory extends TransactionFactory {
    constructor(privateKey: Buffer, exchangeAddress: string) {
        super(privateKey, exchangeAddress);
    }
    public newSignedTECTransaction(
        data: string,
        signatureType: TECSignatureType = TECSignatureType.EthSign,
    ): SignedZeroExTransaction {
        let exchangeSignatureType;
        if (signatureType === TECSignatureType.EthSign) {
            exchangeSignatureType = SignatureType.EthSign;
        } else if (signatureType === TECSignatureType.EIP712) {
            exchangeSignatureType = SignatureType.EIP712;
        } else {
            throw new Error(`Error: ${signatureType} not a valid signature type`);
        }
        const signedTransaction = super.newSignedTransaction(data, exchangeSignatureType);
        const tecSignatureTypeByte = ethUtil.toBuffer(signatureType).toString('hex');
        signedTransaction.signature = `${signedTransaction.signature.slice(
            0,
            signedTransaction.signature.length - 2,
        )}${tecSignatureTypeByte}`;
        return signedTransaction;
    }
}
