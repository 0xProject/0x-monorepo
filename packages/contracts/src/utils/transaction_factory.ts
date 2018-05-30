import { crypto, generatePseudoRandomSalt } from '@0xproject/order-utils';
import { SignatureType } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { crypto } from './crypto';
import { EIP712Utils } from './eip712_utils';
import { orderUtils } from './order_utils';
import { signingUtils } from './signing_utils';
import { EIP712Schema, SignatureType, SignedTransaction } from './types';

const EIP712_EXECUTE_TRANSACTION_SCHEMA: EIP712Schema = {
    name: 'ExecuteTransaction',
    parameters: [
        { name: 'salt', type: 'uint256' },
        { name: 'signer', type: 'address' },
        { name: 'data', type: 'bytes' },
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
        const executeTransactionSchemaHashBuff = EIP712Utils.compileSchema(EIP712_EXECUTE_TRANSACTION_SCHEMA);

        const salt = generatePseudoRandomSalt();
        const dataHash = crypto.solSHA3([ethUtil.toBuffer(data)]);

        const executeTransactionDataHash = crypto.solSHA3([
            executeTransactionSchemaHashBuff,
            salt,
            EIP712Utils.pad32Buffer(this._signerBuff),
            dataHash,
        ]);

        const executeTransactionMessageHex = `0x${executeTransactionDataHash.toString('hex')}`;

        const txHash = EIP712Utils.createEIP712Message(executeTransactionMessageHex, this._exchangeAddress);
        const signature = signingUtils.signMessage(txHash, this._privateKey, signatureType);
        const signedTx = {
            exchangeAddress: this._exchangeAddress,
            salt,
            signer: `0x${this._signerBuff.toString('hex')}`,
            data,
            signature: `0x${signature.toString('hex')}`,
        };
        return signedTx;
    }
}
