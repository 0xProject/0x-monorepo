import { BigNumber } from '@0xproject/utils';
import ethUtil = require('ethereumjs-util');

import { crypto } from './crypto';
import { CancelOrder, MatchOrder, OrderStruct, SignedOrder, UnsignedOrder } from './types';

export const orderUtils = {
    createFill: (signedOrder: SignedOrder, takerAssetFillAmount?: BigNumber) => {
        const fill = {
            order: orderUtils.getOrderStruct(signedOrder),
            takerAssetFillAmount: takerAssetFillAmount || signedOrder.takerAssetAmount,
            signature: signedOrder.signature,
        };
        return fill;
    },
    createCancel(signedOrder: SignedOrder, takerAssetCancelAmount?: BigNumber): CancelOrder {
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
    getDomainSeparatorSchemaHex(): string {
        const domainSeparatorSchemaHashBuff = crypto.solSHA3(['DomainSeparator(address contract)']);
        const schemaHashHex = `0x${domainSeparatorSchemaHashBuff.toString('hex')}`;
        return schemaHashHex;
    },
    getDomainSeparatorHashHex(exchangeAddress: string): string {
        const domainSeparatorHashBuff = crypto.solSHA3([exchangeAddress]);
        const domainSeparatorHashHex = `0x${domainSeparatorHashBuff.toString('hex')}`;
        return domainSeparatorHashHex;
    },
    getOrderSchemaHex(): string {
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
    getOrderHashBuff(order: SignedOrder | UnsignedOrder): Buffer {
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
        const orderSchemaHashHex = orderUtils.getOrderSchemaHex();
        const domainSeparatorHashHex = this.getDomainSeparatorHashHex(order.exchangeAddress);
        const domainSeparatorSchemaHex = this.getDomainSeparatorSchemaHex();
        const orderHashBuff = crypto.solSHA3([
            new BigNumber(domainSeparatorSchemaHex),
            new BigNumber(domainSeparatorHashHex),
            new BigNumber(orderSchemaHashHex),
            new BigNumber(orderParamsHashHex),
        ]);
        return orderHashBuff;
    },
    getOrderHashHex(order: SignedOrder | UnsignedOrder): string {
        const orderHashBuff = orderUtils.getOrderHashBuff(order);
        const orderHashHex = `0x${orderHashBuff.toString('hex')}`;
        return orderHashHex;
    },
    createMatchOrders(signedOrderLeft: SignedOrder, signedOrderRight: SignedOrder): MatchOrder {
        const fill = {
            left: orderUtils.getOrderStruct(signedOrderLeft),
            right: orderUtils.getOrderStruct(signedOrderRight),
            leftSignature: signedOrderLeft.signature,
            rightSignature: signedOrderRight.signature,
        };
        return fill;
    },
};
