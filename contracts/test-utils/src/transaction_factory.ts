import { eip712Utils, generatePseudoRandomSalt } from '@0x/order-utils';
import { SignatureType } from '@0x/types';
import { signTypedDataUtils } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { signingUtils } from './signing_utils';
import { SignedTransaction } from './types';

export class TransactionFactory {
    private readonly _signerBuff: Buffer;
    private readonly _exchangeAddress: string;
    private readonly _privateKey: Buffer;
    constructor(privateKey: Buffer, exchangeAddress: string) {
        this._privateKey = privateKey;
        this._exchangeAddress = exchangeAddress;
        this._signerBuff = ethUtil.privateToAddress(this._privateKey);
    }
    public newSignedTransaction(data: string, signatureType: SignatureType = SignatureType.EthSign): SignedTransaction {
        const salt = generatePseudoRandomSalt();
        const signerAddress = `0x${this._signerBuff.toString('hex')}`;
        const executeTransactionData = {
            salt,
            signerAddress,
            data,
        };

        const typedData = eip712Utils.createZeroExTransactionTypedData(executeTransactionData, this._exchangeAddress);
        const eip712MessageBuffer = signTypedDataUtils.generateTypedDataHash(typedData);
        const signature = signingUtils.signMessage(eip712MessageBuffer, this._privateKey, signatureType);
        const signedTx = {
            exchangeAddress: this._exchangeAddress,
            signature: `0x${signature.toString('hex')}`,
            ...executeTransactionData,
        };
        return signedTx;
    }
}
