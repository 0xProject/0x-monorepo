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
            makerAddress: signedOrder.makerAddress,
            takerAddress: signedOrder.takerAddress,
            feeRecipientAddress: signedOrder.feeRecipientAddress,
            makerTokenAmount: signedOrder.makerTokenAmount,
            takerTokenAmount: signedOrder.takerTokenAmount,
            makerFee: signedOrder.makerFee,
            takerFee: signedOrder.takerFee,
            expirationTimeSeconds: signedOrder.expirationTimeSeconds,
            salt: signedOrder.salt,
            makerAssetData: signedOrder.makerAssetData,
            takerAssetData: signedOrder.takerAssetData,
        };
        return orderStruct;
    },
    getOrderHashBuff(order: SignedOrder | UnsignedOrder): Buffer {
        const orderSchemaHashBuff = crypto.solSHA3([
            'address exchangeAddress',
            'address makerAddress',
            'address takerAddress',
            'address feeRecipientAddress',
            'uint256 makerTokenAmount',
            'uint256 takerTokenAmount',
            'uint256 makerFee',
            'uint256 takerFee',
            'uint256 expirationTimeSeconds',
            'uint256 salt',
            'bytes makerAssetData',
            'bytes takerAssetData',
        ]);
        const orderParamsHashBuff = crypto.solSHA3([
            order.exchangeAddress,
            order.makerAddress,
            order.takerAddress,
            order.feeRecipientAddress,
            order.makerTokenAmount,
            order.takerTokenAmount,
            order.makerFee,
            order.takerFee,
            order.expirationTimeSeconds,
            order.salt,
            ethUtil.toBuffer(order.makerAssetData),
            ethUtil.toBuffer(order.takerAssetData),
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
