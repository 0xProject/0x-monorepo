import { assert } from '@0x/assert';
import { schemas } from '@0x/json-schemas';
import { EIP712Object, EIP712TypedData, EIP712Types, Order, ZeroExTransaction } from '@0x/types';
import * as _ from 'lodash';

import { constants } from './constants';

export const eip712Utils = {
    /**
     * Creates a EIP712TypedData object specific to the 0x protocol for use with signTypedData.
     * @param   primaryType The primary type found in message
     * @param   types The additional types for the data in message
     * @param   message The contents of the message
     * @param   exchangeAddress The address of the exchange contract
     * @return  A typed data object
     */
    createTypedData: (
        primaryType: string,
        types: EIP712Types,
        message: EIP712Object,
        exchangeAddress: string,
    ): EIP712TypedData => {
        assert.isETHAddressHex('exchangeAddress', exchangeAddress);
        assert.isString('primaryType', primaryType);
        const typedData = {
            types: {
                EIP712Domain: constants.EIP712_DOMAIN_SCHEMA.parameters,
                ...types,
            },
            domain: {
                name: constants.EIP712_DOMAIN_NAME,
                version: constants.EIP712_DOMAIN_VERSION,
                verifyingContract: exchangeAddress,
            },
            message,
            primaryType,
        };
        assert.doesConformToSchema('typedData', typedData, schemas.eip712TypedDataSchema);
        return typedData;
    },
    /**
     * Creates an Order EIP712TypedData object for use with signTypedData.
     * @param   Order the order
     * @return  A typed data object
     */
    createOrderTypedData: (order: Order): EIP712TypedData => {
        assert.doesConformToSchema('order', order, schemas.orderSchema, [schemas.hexSchema]);
        const normalizedOrder = _.mapValues(order, value => {
            return !_.isString(value) ? value.toString() : value;
        });
        const typedData = eip712Utils.createTypedData(
            constants.EIP712_ORDER_SCHEMA.name,
            { Order: constants.EIP712_ORDER_SCHEMA.parameters },
            normalizedOrder,
            order.exchangeAddress,
        );
        return typedData;
    },
    /**
     * Creates an ExecuteTransaction EIP712TypedData object for use with signTypedData and
     * 0x Exchange executeTransaction.
     * @param   ZeroExTransaction the 0x transaction
     * @param   exchangeAddress The address of the exchange contract
     * @return  A typed data object
     */
    createZeroExTransactionTypedData: (
        zeroExTransaction: ZeroExTransaction,
        exchangeAddress: string,
    ): EIP712TypedData => {
        assert.isETHAddressHex('exchangeAddress', exchangeAddress);
        assert.doesConformToSchema('zeroExTransaction', zeroExTransaction, schemas.zeroExTransactionSchema);
        const normalizedTransaction = _.mapValues(zeroExTransaction, value => {
            return !_.isString(value) ? value.toString() : value;
        });
        const typedData = eip712Utils.createTypedData(
            constants.EIP712_ZEROEX_TRANSACTION_SCHEMA.name,
            { ZeroExTransaction: constants.EIP712_ZEROEX_TRANSACTION_SCHEMA.parameters },
            normalizedTransaction,
            exchangeAddress,
        );
        return typedData;
    },
};
