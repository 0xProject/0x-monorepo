import {
    EIP712_DOMAIN_NAME,
    EIP712_DOMAIN_SCHEMA,
    EIP712_DOMAIN_VERSION,
    generatePseudoRandomSalt,
} from '@0xproject/order-utils';
import { SignatureType } from '@0xproject/types';
import { signTypedDataUtils } from '@0xproject/utils';
import * as ethUtil from 'ethereumjs-util';

import { signingUtils } from './signing_utils';
import { SignedTransaction } from './types';

const EIP712_ZEROEX_TRANSACTION_SCHEMA = {
    name: 'ZeroExTransaction',
    parameters: [
        { name: 'salt', type: 'uint256' },
        { name: 'signerAddress', type: 'address' },
        { name: 'data', type: 'bytes' },
    ],
};

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
            salt: salt.toString(),
            signerAddress,
            data,
        };
        const typedData = {
            types: {
                EIP712Domain: EIP712_DOMAIN_SCHEMA.parameters,
                ZeroExTransaction: EIP712_ZEROEX_TRANSACTION_SCHEMA.parameters,
            },
            domain: {
                name: EIP712_DOMAIN_NAME,
                version: EIP712_DOMAIN_VERSION,
                verifyingContract: this._exchangeAddress,
            },
            message: executeTransactionData,
            primaryType: EIP712_ZEROEX_TRANSACTION_SCHEMA.name,
        };
        const eip712MessageBuffer = signTypedDataUtils.signTypedDataHash(typedData);
        const signature = signingUtils.signMessage(eip712MessageBuffer, this._privateKey, signatureType);
        const signedTx = {
            exchangeAddress: this._exchangeAddress,
            signature: `0x${signature.toString('hex')}`,
            ...executeTransactionData,
            salt,
        };
        return signedTx;
    }
}
