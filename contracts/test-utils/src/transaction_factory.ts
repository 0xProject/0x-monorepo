import { generatePseudoRandomSalt, transactionHashUtils } from '@0x/order-utils';
import { SignatureType, SignedZeroExTransaction } from '@0x/types';
import * as ethUtil from 'ethereumjs-util';

import { signingUtils } from './signing_utils';

export class TransactionFactory {
    private readonly _signerBuff: Buffer;
    private readonly _exchangeAddress: string;
    private readonly _privateKey: Buffer;
    private readonly _chainId: number;

    constructor(privateKey: Buffer, exchangeAddress: string, chainId: number) {
        this._privateKey = privateKey;
        this._exchangeAddress = exchangeAddress;
        this._chainId = chainId;
        this._signerBuff = ethUtil.privateToAddress(this._privateKey);
    }
    public newSignedTransaction(
        data: string,
        signatureType: SignatureType = SignatureType.EthSign,
    ): SignedZeroExTransaction {
        const salt = generatePseudoRandomSalt();
        const signerAddress = `0x${this._signerBuff.toString('hex')}`;
        const transaction = {
            salt,
            signerAddress,
            data,
            verifyingContractAddress: this._exchangeAddress,
            chainId: this._chainId,
        };

        const transactionHashBuffer = transactionHashUtils.getTransactionHashBuffer(transaction);
        const signature = signingUtils.signMessage(transactionHashBuffer, this._privateKey, signatureType);
        const signedTransaction = {
            ...transaction,
            signature: `0x${signature.toString('hex')}`,
        };
        return signedTransaction;
    }
}
