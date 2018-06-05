import { schemas, SchemaValidator } from '@0xproject/json-schemas';
import { Order, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import BN = require('bn.js');
import { SolidityTypes } from 'ethereum-types';
import * as ethABI from 'ethereumjs-abi';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { assert } from './assert';
import { crypto } from './crypto';
import { EIP712Utils } from './eip712_utils';
import { EIP712Schema } from './types';

const INVALID_TAKER_FORMAT = 'instance.takerAddress is not of a type(s) string';

const EIP712_ORDER_SCHEMA: EIP712Schema = {
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
        const makerAssetDataHash = crypto.solSHA3([ethUtil.toBuffer(order.makerAssetData)]);
        const takerAssetDataHash = crypto.solSHA3([ethUtil.toBuffer(order.takerAssetData)]);

        const orderParamsHashBuff = crypto.solSHA3([
            orderHashUtils._getOrderSchemaBuffer(),
            EIP712Utils.pad32Address(order.makerAddress),
            EIP712Utils.pad32Address(order.takerAddress),
            EIP712Utils.pad32Address(order.feeRecipientAddress),
            EIP712Utils.pad32Address(order.senderAddress),
            order.makerAssetAmount,
            order.takerAssetAmount,
            order.makerFee,
            order.takerFee,
            order.expirationTimeSeconds,
            order.salt,
            makerAssetDataHash,
            takerAssetDataHash,
        ]);
        const orderHashBuff = EIP712Utils.createEIP712Message(orderParamsHashBuff, order.exchangeAddress);
        return orderHashBuff;
    },
    _getOrderSchemaBuffer(): Buffer {
        return EIP712Utils.compileSchema(EIP712_ORDER_SCHEMA);
    },
};
