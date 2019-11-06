import { schemas } from '@0x/json-schemas';
import { Order, SignedOrder } from '@0x/types';
import { signTypedDataUtils } from '@0x/utils';
import * as _ from 'lodash';

import { assert } from './assert';
import { constants } from './constants';
import { eip712Utils } from './eip712_utils';

const INVALID_TAKER_FORMAT = 'instance.takerAddress is not of a type(s) string';

export const orderHashUtils = {
    /**
     * Computes the orderHash for a supplied order.
     * @param   order   An object that conforms to the Order or SignedOrder interface definitions.
     * @return  Hex encoded string orderHash from hashing the supplied order.
     */
    getOrderHashHex(order: SignedOrder | Order): string {
        try {
            assert.doesConformToSchema('order', order, schemas.orderSchema, [schemas.hexSchema]);
        } catch (error) {
            if (_.includes(error.message, INVALID_TAKER_FORMAT)) {
                const errMsg = `Order taker must be of type string. If you want anyone to be able to fill an order - pass ${
                    constants.NULL_ADDRESS
                }`;
                throw new Error(errMsg);
            }
            throw error;
        }

        const orderHashBuff = orderHashUtils.getOrderHashBuffer(order);
        const orderHashHex = `0x${orderHashBuff.toString('hex')}`;
        return orderHashHex;
    },
    /**
     * Computes the orderHash for a supplied order
     * @param   order   An object that conforms to the Order or SignedOrder interface definitions.
     * @return  A Buffer containing the resulting orderHash from hashing the supplied order
     */
    getOrderHashBuffer(order: SignedOrder | Order): Buffer {
        try {
            assert.doesConformToSchema('order', order, schemas.orderSchema, [schemas.hexSchema]);
        } catch (error) {
            if (_.includes(error.message, INVALID_TAKER_FORMAT)) {
                const errMsg = `Order taker must be of type string. If you want anyone to be able to fill an order - pass ${
                    constants.NULL_ADDRESS
                }`;
                throw new Error(errMsg);
            }
            throw error;
        }
        const typedData = eip712Utils.createOrderTypedData(order);
        const orderHashBuff = signTypedDataUtils.generateTypedDataHash(typedData);
        return orderHashBuff;
    },
};
