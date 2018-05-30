import { Order, OrderWithoutExchangeAddress, SignedOrder, UnsignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { crypto } from './crypto';
import { EIP712Utils } from './eip712_utils';
import { CancelOrder, EIP712Schema, MatchOrder } from './types';

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

export const orderUtils = {
    createFill: (signedOrder: SignedOrder, takerAssetFillAmount?: BigNumber) => {
        const fill = {
            order: orderUtils.getOrderWithoutExchangeAddress(signedOrder),
            takerAssetFillAmount: takerAssetFillAmount || signedOrder.takerAssetAmount,
            signature: signedOrder.signature,
        };
        return fill;
    },
    createCancel(signedOrder: SignedOrder, takerAssetCancelAmount?: BigNumber): CancelOrder {
        const cancel = {
            order: orderUtils.getOrderWithoutExchangeAddress(signedOrder),
            takerAssetCancelAmount: takerAssetCancelAmount || signedOrder.takerAssetAmount,
        };
        return cancel;
    },
    getOrderWithoutExchangeAddress(signedOrder: SignedOrder): OrderWithoutExchangeAddress {
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
    getOrderSchemaBuffer(): Buffer {
        return EIP712Utils.compileSchema(EIP712_ORDER_SCHEMA);
    },
    getOrderHashBuffer(order: SignedOrder | UnsignedOrder): Buffer {
        const makerAssetDataHash = crypto.solSHA3([ethUtil.toBuffer(order.makerAssetData)]);
        const takerAssetDataHash = crypto.solSHA3([ethUtil.toBuffer(order.takerAssetData)]);

        const orderParamsHashBuff = crypto.solSHA3([
            orderUtils.getOrderSchemaBuffer(),
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
        const orderParamsHashHex = `0x${orderParamsHashBuff.toString('hex')}`;
        const orderHashBuff = EIP712Utils.createEIP712Message(orderParamsHashHex, order.exchangeAddress);
        return orderHashBuff;
    },
    getOrderHashHex(order: SignedOrder | UnsignedOrder): string {
        const orderHashBuff = orderUtils.getOrderHashBuffer(order);
        const orderHashHex = `0x${orderHashBuff.toString('hex')}`;
        return orderHashHex;
    },
    createMatchOrders(signedOrderLeft: SignedOrder, signedOrderRight: SignedOrder): MatchOrder {
        const fill = {
            left: orderUtils.getOrderWithoutExchangeAddress(signedOrderLeft),
            right: orderUtils.getOrderWithoutExchangeAddress(signedOrderRight),
            leftSignature: signedOrderLeft.signature,
            rightSignature: signedOrderRight.signature,
        };
        return fill;
    },
};
