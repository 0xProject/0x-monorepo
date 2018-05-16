import { schemas, SchemaValidator } from '@0xproject/json-schemas';
import { Order, SignedOrder, SolidityTypes } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import BN = require('bn.js');
import * as ethABI from 'ethereumjs-abi';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { assert } from './assert';

const INVALID_TAKER_FORMAT = 'instance.taker is not of a type(s) string';

/**
 * Converts BigNumber instance to BN
 * The only reason we convert to BN is to remain compatible with `ethABI.soliditySHA3` that
 * expects values of Solidity type `uint` to be passed as type `BN`.
 * We do not use BN anywhere else in the codebase.
 */
function bigNumberToBN(value: BigNumber): BN {
    return new BN(value.toString(), 10);
}

/**
 * Computes the orderHash for a supplied order.
 * @param   order   An object that conforms to the Order or SignedOrder interface definitions.
 * @return  The resulting orderHash from hashing the supplied order.
 */
export function getOrderHashHex(order: Order | SignedOrder): string {
    try {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
    } catch (error) {
        if (_.includes(error.message, INVALID_TAKER_FORMAT)) {
            const errMsg =
                'Order taker must be of type string. If you want anyone to be able to fill an order - pass ZeroEx.NULL_ADDRESS';
            throw new Error(errMsg);
        }
        throw error;
    }
    const orderParts = [
        { value: order.exchangeContractAddress, type: SolidityTypes.Address },
        { value: order.maker, type: SolidityTypes.Address },
        { value: order.taker, type: SolidityTypes.Address },
        { value: order.makerTokenAddress, type: SolidityTypes.Address },
        { value: order.takerTokenAddress, type: SolidityTypes.Address },
        { value: order.feeRecipient, type: SolidityTypes.Address },
        {
            value: bigNumberToBN(order.makerTokenAmount),
            type: SolidityTypes.Uint256,
        },
        {
            value: bigNumberToBN(order.takerTokenAmount),
            type: SolidityTypes.Uint256,
        },
        {
            value: bigNumberToBN(order.makerFee),
            type: SolidityTypes.Uint256,
        },
        {
            value: bigNumberToBN(order.takerFee),
            type: SolidityTypes.Uint256,
        },
        {
            value: bigNumberToBN(order.expirationUnixTimestampSec),
            type: SolidityTypes.Uint256,
        },
        { value: bigNumberToBN(order.salt), type: SolidityTypes.Uint256 },
    ];
    const types = _.map(orderParts, o => o.type);
    const values = _.map(orderParts, o => o.value);
    const hashBuff = ethABI.soliditySHA3(types, values);
    const hashHex = ethUtil.bufferToHex(hashBuff);
    return hashHex;
}

/**
 * Checks if the supplied hex encoded order hash is valid.
 * Note: Valid means it has the expected format, not that an order with the orderHash exists.
 * Use this method when processing orderHashes submitted as user input.
 * @param   orderHash    Hex encoded orderHash.
 * @return  Whether the supplied orderHash has the expected format.
 */
export function isValidOrderHash(orderHash: string): boolean {
    // Since this method can be called to check if any arbitrary string conforms to an orderHash's
    // format, we only assert that we were indeed passed a string.
    assert.isString('orderHash', orderHash);
    const schemaValidator = new SchemaValidator();
    const isValid = schemaValidator.validate(orderHash, schemas.orderHashSchema).valid;
    return isValid;
}
