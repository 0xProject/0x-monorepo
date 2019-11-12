import { schemas } from '@0x/json-schemas';
import { SignedZeroExTransaction, ZeroExTransaction } from '@0x/types';
import { signTypedDataUtils } from '@0x/utils';
import * as _ from 'lodash';

import { assert } from './assert';
import { eip712Utils } from './eip712_utils';

export const transactionHashUtils = {
    /**
     * Computes the transactionHash for a supplied 0x transaction.
     * @param   transaction   An object that conforms to the ZeroExTransaction or SignedZeroExTransaction interface definitions.
     * @return  Hex encoded string transactionHash from hashing the supplied order.
     */
    getTransactionHashHex(transaction: ZeroExTransaction | SignedZeroExTransaction): string {
        assert.doesConformToSchema('transaction', transaction, schemas.zeroExTransactionSchema, [schemas.hexSchema]);
        const transactionHashBuff = transactionHashUtils.getTransactionHashBuffer(transaction);
        const transactionHashHex = `0x${transactionHashBuff.toString('hex')}`;
        return transactionHashHex;
    },
    /**
     * Computes the transactionHash for a supplied 0x transaction.
     * @param   transaction   An object that conforms to the ZeroExTransaction or SignedZeroExTransaction interface definitions.
     * @return  A Buffer containing the resulting transactionHash from hashing the supplied 0x transaction.
     */
    getTransactionHashBuffer(transaction: ZeroExTransaction | SignedZeroExTransaction): Buffer {
        const typedData = eip712Utils.createZeroExTransactionTypedData(transaction);
        const transactionHashBuff = signTypedDataUtils.generateTypedDataHash(typedData);
        return transactionHashBuff;
    },
};
