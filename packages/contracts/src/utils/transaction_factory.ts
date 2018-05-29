import { crypto, generatePseudoRandomSalt } from '@0xproject/order-utils';
import { SignatureType } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as ethUtil from 'ethereumjs-util';

import { signingUtils } from './signing_utils';
import { SignedTransaction } from './types';

export class TransactionFactory {
    private _signer: string;
    private _exchangeAddress: string;
    private _privateKey: Buffer;
    constructor(privateKey: Buffer, exchangeAddress: string) {
        this._privateKey = privateKey;
        this._exchangeAddress = exchangeAddress;
        const signerBuff = ethUtil.privateToAddress(this._privateKey);
        this._signer = `0x${signerBuff.toString('hex')}`;
    }
    public newSignedTransaction(
        data: string,
        signatureType: SignatureType = SignatureType.Ecrecover,
    ): SignedTransaction {
        const salt = generatePseudoRandomSalt();
        const txHash = crypto.solSHA3([this._exchangeAddress, salt, ethUtil.toBuffer(data)]);
        const signature = signingUtils.signMessage(txHash, this._privateKey, signatureType);
        const signedTx = {
            exchangeAddress: this._exchangeAddress,
            salt,
            signer: this._signer,
            data,
            signature: `0x${signature.toString('hex')}`,
        };
        return signedTx;
    }
}
