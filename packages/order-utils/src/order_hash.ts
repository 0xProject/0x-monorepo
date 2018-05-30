import { schemas, SchemaValidator } from '@0xproject/json-schemas';
import { Order, SignatureType, SignedOrder, SolidityTypes } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import BN = require('bn.js');
import * as ethABI from 'ethereumjs-abi';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { assert } from './assert';
import { crypto } from './crypto';

const INVALID_TAKER_FORMAT = 'instance.takerAddress is not of a type(s) string';

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

        const orderHashBuff = this.getOrderHashBuff(order);
        const orderHashHex = `0x${orderHashBuff.toString('hex')}`;
        return orderHashHex;
    },
    /**
     * Computes the orderHash for a supplied order and returns it as a Buffer
     * @param   order   An object that conforms to the Order or SignedOrder interface definitions.
     * @return  The resulting orderHash from hashing the supplied order as a Buffer
     */
    getOrderHashBuff(order: SignedOrder | Order): Buffer {
        const makerAssetDataHash = crypto.solSHA3([ethUtil.toBuffer(order.makerAssetData)]);
        const takerAssetDataHash = crypto.solSHA3([ethUtil.toBuffer(order.takerAssetData)]);

        const orderParamsHashBuff = crypto.solSHA3([
            order.makerAddress,
            order.takerAddress,
            order.feeRecipientAddress,
            order.senderAddress,
            order.makerAssetAmount,
            order.takerAssetAmount,
            order.makerFee,
            order.takerFee,
            order.expirationTimeSeconds,
            order.salt,
            makerAssetDataHash,
            takerAssetDataHash,
        ]);
        const orderParamsHashHex = `0x${orderParamsHashBuff.toString('hex')}`;
        const orderSchemaHashHex = this._getOrderSchemaHex();
        const domainSeparatorHashHex = this._getDomainSeparatorHashHex(order.exchangeAddress);
        const domainSeparatorSchemaHex = this._getDomainSeparatorSchemaHex();
        const orderHashBuff = crypto.solSHA3([
            new BigNumber(domainSeparatorSchemaHex),
            new BigNumber(domainSeparatorHashHex),
            new BigNumber(orderSchemaHashHex),
            new BigNumber(orderParamsHashHex),
        ]);
        return orderHashBuff;
    },
    _getOrderSchemaHex(): string {
        const orderSchemaHashBuff = crypto.solSHA3([
            'Order(',
            'address makerAddress,',
            'address takerAddress,',
            'address feeRecipientAddress,',
            'address senderAddress,',
            'uint256 makerAssetAmount,',
            'uint256 takerAssetAmount,',
            'uint256 makerFee,',
            'uint256 takerFee,',
            'uint256 expirationTimeSeconds,',
            'uint256 salt,',
            'bytes makerAssetData,',
            'bytes takerAssetData,',
            ')',
        ]);
        const schemaHashHex = `0x${orderSchemaHashBuff.toString('hex')}`;
        return schemaHashHex;
    },
    _getDomainSeparatorSchemaHex(): string {
        const domainSeparatorSchemaHashBuff = crypto.solSHA3(['DomainSeparator(address contract)']);
        const schemaHashHex = `0x${domainSeparatorSchemaHashBuff.toString('hex')}`;
        return schemaHashHex;
    },
    _getDomainSeparatorHashHex(exchangeAddress: string): string {
        const domainSeparatorHashBuff = crypto.solSHA3([exchangeAddress]);
        const domainSeparatorHashHex = `0x${domainSeparatorHashBuff.toString('hex')}`;
        return domainSeparatorHashHex;
    },
};
