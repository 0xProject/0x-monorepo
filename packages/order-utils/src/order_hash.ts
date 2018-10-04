import { schemas, SchemaValidator } from '@0xproject/json-schemas';
import { Order, SignedOrder } from '@0xproject/types';
import { signTypedDataUtils } from '@0xproject/utils';
import * as _ from 'lodash';

import { assert } from './assert';
import { EIP712_DOMAIN_NAME, EIP712_DOMAIN_SCHEMA, EIP712_DOMAIN_VERSION } from './constants';

const INVALID_TAKER_FORMAT = 'instance.takerAddress is not of a type(s) string';

export const EIP712_ORDER_SCHEMA = {
    name: 'Order',
    parameters: [
        { name: 'makerAddress', type: 'address' },
        { name: 'takerAddress', type: 'address' },
        { name: 'feeRecipientAddress', type: 'address' },
        { name: 'senderAddress', type: 'address' },
        { name: 'makerAssetAmount', type: 'uint256' },
        { name: 'takerAssetAmount', type: 'uint256' },
        { name: 'makerFee', type: 'uint256' },
        { name: 'takerFee', type: 'uint256' },
        { name: 'expirationTimeSeconds', type: 'uint256' },
        { name: 'salt', type: 'uint256' },
        { name: 'makerAssetData', type: 'bytes' },
        { name: 'takerAssetData', type: 'bytes' },
    ],
};

export const orderHashUtils = {
    /**
     * Checks if the supplied hex encoded order hash is valid.
     * Note: Valid means it has the expected format, not that an order with the orderHash exists.
     * Use this method when processing orderHashes submitted as user input.
     * @param   orderHash    Hex encoded orderHash.
     * @return  Whether the supplied orderHash has the expected format.
     */
    isValidOrderHash(orderHash: string): boolean {
        // Since this method can be called to check if any arbitrary string conforms to an orderHash's
        // format, we only assert that we were indeed passed a string.
        assert.isString('orderHash', orderHash);
        const schemaValidator = new SchemaValidator();
        const isValid = schemaValidator.validate(orderHash, schemas.orderHashSchema).valid;
        return isValid;
    },
    /**
     * Computes the orderHash for a supplied order.
     * @param   order   An object that conforms to the Order or SignedOrder interface definitions.
     * @return  The resulting orderHash from hashing the supplied order.
     */
    getOrderHashHex(order: SignedOrder | Order): string {
        try {
            assert.doesConformToSchema('order', order, schemas.orderSchema, [schemas.hexSchema]);
        } catch (error) {
            if (_.includes(error.message, INVALID_TAKER_FORMAT)) {
                const errMsg =
                    'Order taker must be of type string. If you want anyone to be able to fill an order - pass ZeroEx.NULL_ADDRESS';
                throw new Error(errMsg);
            }
            throw error;
        }

        const orderHashBuff = orderHashUtils.getOrderHashBuffer(order);
        const orderHashHex = `0x${orderHashBuff.toString('hex')}`;
        return orderHashHex;
    },
    /**
     * Computes the orderHash for a supplied order and returns it as a Buffer
     * @param   order   An object that conforms to the Order or SignedOrder interface definitions.
     * @return  The resulting orderHash from hashing the supplied order as a Buffer
     */
    getOrderHashBuffer(order: SignedOrder | Order): Buffer {
        const normalizedOrder = _.mapValues(order, value => {
            return _.isObject(value) ? value.toString() : value;
        });
        const typedData = {
            types: {
                EIP712Domain: EIP712_DOMAIN_SCHEMA.parameters,
                Order: EIP712_ORDER_SCHEMA.parameters,
            },
            domain: {
                name: EIP712_DOMAIN_NAME,
                version: EIP712_DOMAIN_VERSION,
                verifyingContract: order.exchangeAddress,
            },
            message: normalizedOrder,
            primaryType: EIP712_ORDER_SCHEMA.name,
        };
        const orderHashBuff = signTypedDataUtils.signTypedDataHash(typedData);
        return orderHashBuff;
    },
};
