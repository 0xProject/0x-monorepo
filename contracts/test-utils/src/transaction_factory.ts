import { generatePseudoRandomSalt, transactionHashUtils } from '@0x/order-utils';
import { SignatureType, SignedZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { getLatestBlockTimestampAsync } from './block_timestamp';
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
    public async newSignedTransactionAsync(
        data: string,
        signatureType: SignatureType = SignatureType.EthSign,
    ): Promise<SignedZeroExTransaction> {
        const tenMinutesInSeconds = 10 * 60;
        const currentBlockTimestamp = await getLatestBlockTimestampAsync();
        const salt = generatePseudoRandomSalt();
        const signerAddress = `0x${this._signerBuff.toString('hex')}`;
        const transaction = {
            salt,
            signerAddress,
            data,
            expirationTimeSeconds: new BigNumber(currentBlockTimestamp).plus(tenMinutesInSeconds),
            domain: {
                verifyingContractAddress: this._exchangeAddress,
                chainId: this._chainId,
            },
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
