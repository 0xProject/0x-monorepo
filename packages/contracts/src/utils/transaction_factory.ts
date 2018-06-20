import { EIP712Schema, EIP712Types, EIP712Utils, generatePseudoRandomSalt } from '@0xproject/order-utils';
import { SignatureType } from '@0xproject/types';
import * as ethUtil from 'ethereumjs-util';

import { signingUtils } from './signing_utils';
import { SignedTransaction } from './types';

const EIP712_ZEROEX_TRANSACTION_SCHEMA: EIP712Schema = {
    name: 'ZeroExTransaction',
    parameters: [
        { name: 'salt', type: EIP712Types.Uint256 },
        { name: 'signer', type: EIP712Types.Address },
        { name: 'data', type: EIP712Types.Bytes },
    ],
};

export class TransactionFactory {
    private _signerBuff: Buffer;
    private _exchangeAddress: string;
    private _privateKey: Buffer;
    constructor(privateKey: Buffer, exchangeAddress: string) {
        this._privateKey = privateKey;
        this._exchangeAddress = exchangeAddress;
        this._signerBuff = ethUtil.privateToAddress(this._privateKey);
    }
    public newSignedTransaction(data: string, signatureType: SignatureType = SignatureType.EthSign): SignedTransaction {
        const salt = generatePseudoRandomSalt();
        const signer = `0x${this._signerBuff.toString('hex')}`;
        const executeTransactionData = {
            salt,
            signer,
            data,
        };
        const executeTransactionHashBuff = EIP712Utils.structHash(
            EIP712_ZEROEX_TRANSACTION_SCHEMA,
            executeTransactionData,
        );
        const txHash = EIP712Utils.createEIP712Message(executeTransactionHashBuff, this._exchangeAddress);
        const signature = signingUtils.signMessage(txHash, this._privateKey, signatureType);
        const signedTx = {
            exchangeAddress: this._exchangeAddress,
            signature: `0x${signature.toString('hex')}`,
            ...executeTransactionData,
        };
        return signedTx;
    }
}
