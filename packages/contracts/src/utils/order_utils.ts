import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { crypto } from './crypto';
import { OrderStruct, SignatureType, SignedOrder, UnsignedOrder } from './types';

export const orderUtils = {
    createFill: (signedOrder: SignedOrder, takerTokenFillAmount?: BigNumber) => {
        const fill = {
            order: orderUtils.getOrderStruct(signedOrder),
            takerTokenFillAmount: takerTokenFillAmount || signedOrder.takerTokenAmount,
            signature: signedOrder.signature,
        };
        return fill;
    },
    createCancel(signedOrder: SignedOrder, takerTokenCancelAmount?: BigNumber) {
        const cancel = {
            order: orderUtils.getOrderStruct(signedOrder),
            takerTokenCancelAmount: takerTokenCancelAmount || signedOrder.takerTokenAmount,
        };
        return cancel;
    },
    getOrderStruct(signedOrder: SignedOrder): OrderStruct {
        const orderStruct = {
            senderAddress: signedOrder.senderAddress,
            makerAddress: signedOrder.makerAddress,
            takerAddress: signedOrder.takerAddress,
            makerTokenAddress: signedOrder.makerTokenAddress,
            takerTokenAddress: signedOrder.takerTokenAddress,
            feeRecipientAddress: signedOrder.feeRecipientAddress,
            makerTokenAmount: signedOrder.makerTokenAmount,
            takerTokenAmount: signedOrder.takerTokenAmount,
            makerFeeAmount: signedOrder.makerFeeAmount,
            takerFeeAmount: signedOrder.takerFeeAmount,
            expirationTimeSeconds: signedOrder.expirationTimeSeconds,
            salt: signedOrder.salt,
        };
        return orderStruct;
    },
    getOrderHashBuff(order: SignedOrder | UnsignedOrder): Buffer {
        const orderSchemaHashBuff = crypto.solSHA3([
            'address exchangeAddress',
            'address senderAddress',
            'address makerAddress',
            'address takerAddress',
            'address makerTokenAddress',
            'address takerTokenAddress',
            'address feeRecipientAddress',
            'uint256 makerTokenAmount',
            'uint256 takerTokenAmount',
            'uint256 makerFeeAmount',
            'uint256 takerFeeAmount',
            'uint256 expirationTimeSeconds',
            'uint256 salt',
        ]);
        const orderParamsHashBuff = crypto.solSHA3([
            order.exchangeAddress,
            order.senderAddress,
            order.makerAddress,
            order.takerAddress,
            order.makerTokenAddress,
            order.takerTokenAddress,
            order.feeRecipientAddress,
            order.makerTokenAmount,
            order.takerTokenAmount,
            order.makerFeeAmount,
            order.takerFeeAmount,
            order.expirationTimeSeconds,
            order.salt,
        ]);
        const orderSchemaHashHex = `0x${orderSchemaHashBuff.toString('hex')}`;
        const orderParamsHashHex = `0x${orderParamsHashBuff.toString('hex')}`;
        const orderHashBuff = crypto.solSHA3([new BigNumber(orderSchemaHashHex), new BigNumber(orderParamsHashHex)]);
        return orderHashBuff;
    },
    getOrderHashHex(order: SignedOrder | UnsignedOrder): string {
        const orderHashBuff = orderUtils.getOrderHashBuff(order);
        const orderHashHex = `0x${orderHashBuff.toString('hex')}`;
        return orderHashHex;
    },
};
