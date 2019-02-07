import { schemas, SchemaValidator } from '@0x/json-schemas';
import { SignedZeroExTransaction, ZeroExTransaction } from '@0x/types';
import { signTypedDataUtils } from '@0x/utils';
import * as _ from 'lodash';

import { assert } from './assert';
import { eip712Utils } from './eip712_utils';

export const transactionHashUtils = {
    /**
     * Checks if the supplied hex encoded 0x transaction hash is valid.
     * Note: Valid means it has the expected format, not that a transaction with the transactionHash exists.
     * Use this method when processing transactionHashes submitted as user input.
     * @param   transactionHash    Hex encoded transactionHash.
     * @return  Whether the supplied transactionHash has the expected format.
     */
    isValidTransactionHash(transactionHash: string): boolean {
        // Since this method can be called to check if any arbitrary string conforms to an transactionHash's
        // format, we only assert that we were indeed passed a string.
        assert.isString('transactionHash', transactionHash);
        const schemaValidator = new SchemaValidator();
        const isValid = schemaValidator.validate(transactionHash, schemas.orderHashSchema).valid;
        return isValid;
    },
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
