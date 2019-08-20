import { generatePseudoRandomSalt, transactionHashUtils } from '@0x/order-utils';
import { SignatureType, SignedZeroExTransaction, ZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';

import { getLatestBlockTimestampAsync } from './block_timestamp';
import { constants } from './constants';
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
        customTransactionParams: Partial<ZeroExTransaction>,
        signatureType: SignatureType = SignatureType.EthSign,
    ): Promise<SignedZeroExTransaction> {
        if (customTransactionParams.data === undefined) {
            throw new Error('Error: ZeroExTransaction data field must be supplied');
        }
        const tenMinutesInSeconds = 10 * 60;
        const currentBlockTimestamp = await getLatestBlockTimestampAsync();
        const salt = generatePseudoRandomSalt();
        const signerAddress = `0x${this._signerBuff.toString('hex')}`;
        const transaction = {
            salt,
            signerAddress,
            data: customTransactionParams.data,
            expirationTimeSeconds: new BigNumber(currentBlockTimestamp).plus(tenMinutesInSeconds),
            gasPrice: new BigNumber(constants.DEFAULT_GAS_PRICE),
            domain: {
                verifyingContractAddress: this._exchangeAddress,
                chainId: this._chainId,
            },
            ...customTransactionParams,
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
