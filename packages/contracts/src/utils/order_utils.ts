import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { crypto } from './crypto';
import { OrderStruct, SignatureType, SignedOrder, UnsignedOrder } from './types';

export const orderUtils = {
    createFill: (signedOrder: SignedOrder, takerAssetFillAmount?: BigNumber) => {
        const fill = {
            order: orderUtils.getOrderStruct(signedOrder),
            takerAssetFillAmount: takerAssetFillAmount || signedOrder.takerAssetAmount,
            signature: signedOrder.signature,
        };
        return fill;
    },
    createCancel(signedOrder: SignedOrder, takerAssetCancelAmount?: BigNumber) {
        const cancel = {
            order: orderUtils.getOrderStruct(signedOrder),
            takerAssetCancelAmount: takerAssetCancelAmount || signedOrder.takerAssetAmount,
        };
        return cancel;
    },
    getOrderStruct(signedOrder: SignedOrder): OrderStruct {
        const orderStruct = {
            senderAddress: signedOrder.senderAddress,
            makerAddress: signedOrder.makerAddress,
            takerAddress: signedOrder.takerAddress,
            feeRecipientAddress: signedOrder.feeRecipientAddress,
            makerAssetAmount: signedOrder.makerAssetAmount,
            takerAssetAmount: signedOrder.takerAssetAmount,
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
            'address senderAddress',
            'uint256 makerAssetAmount',
            'uint256 takerAssetAmount',
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
            order.senderAddress,
            order.makerAssetAmount,
            order.takerAssetAmount,
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
    createMatchOrders(signedOrderLeft: SignedOrder, signedOrderRight: SignedOrder) {
        const fill = {
            left: orderUtils.getOrderStruct(signedOrderLeft),
            right: orderUtils.getOrderStruct(signedOrderRight),
            leftSignature: signedOrderLeft.signature,
            rightSignature: signedOrderRight.signature,
        };
        return fill;
    },
};
