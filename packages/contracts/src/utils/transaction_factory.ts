import { ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as ethUtil from 'ethereumjs-util';

import { crypto } from './crypto';
import { signingUtils } from './signing_utils';
import { SignatureType, SignedTransaction } from './types';

export class TransactionFactory {
    private _signer: string;
    private _privateKey: Buffer;
    constructor(privateKey: Buffer) {
        this._privateKey = privateKey;
        const signerBuff = ethUtil.privateToAddress(this._privateKey);
        this._signer = `0x${signerBuff.toString('hex')}`;
    }
    public newSignedTransaction(
        data: string,
        signatureType: SignatureType = SignatureType.Ecrecover,
    ): SignedTransaction {
        const salt = ZeroEx.generatePseudoRandomSalt();
        const txHash = crypto.solSHA3([salt, data]);
        const signature = signingUtils.signMessage(txHash, this._privateKey, signatureType);
        const signedTx = {
            salt,
            signer: this._signer,
            data,
            signature: `0x${signature.toString('hex')}`,
        };
        return signedTx;
    }
}
