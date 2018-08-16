import { schemas } from '@0xproject/json-schemas';
import { EIP712Schema, EIP712Types, EIP712Utils } from '@0xproject/order-utils';
import { Order, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import _ = require('lodash');

import { ExchangeContract } from '../contract_wrappers/generated/exchange';

import { assert } from './assert';

const EIP712_ZEROEX_TRANSACTION_SCHEMA: EIP712Schema = {
    name: 'ZeroExTransaction',
    parameters: [
        { name: 'salt', type: EIP712Types.Uint256 },
        { name: 'signerAddress', type: EIP712Types.Address },
        { name: 'data', type: EIP712Types.Bytes },
    ],
};

export class ExecuteTransactionEncoder {
    private _exchangeInstance: ExchangeContract;
    constructor(exchangeInstance: ExchangeContract) {
        this._exchangeInstance = exchangeInstance;
    }
    public getExecuteTransactionHex(data: string, salt: BigNumber, signerAddress: string): string {
        const exchangeAddress = this._exchangeInstance.address;
        const executeTransactionData = {
            salt,
            signerAddress,
            data,
        };
        const executeTransactionHashBuff = EIP712Utils.structHash(
            EIP712_ZEROEX_TRANSACTION_SCHEMA,
            executeTransactionData,
        );
        const eip721MessageBuffer = EIP712Utils.createEIP712Message(executeTransactionHashBuff, exchangeAddress);
        const messageHex = `0x${eip721MessageBuffer.toString('hex')}`;
        return messageHex;
    }
    public fillOrder(signedOrder: SignedOrder, takerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('takerAssetFillAmount', takerAssetFillAmount);
        const abiEncodedData = this._exchangeInstance.fillOrder.getABIEncodedTransactionData(
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
        );
        return abiEncodedData;
    }
    public fillOrderNoThrow(signedOrder: SignedOrder, takerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('takerAssetFillAmount', takerAssetFillAmount);
        const abiEncodedData = this._exchangeInstance.fillOrderNoThrow.getABIEncodedTransactionData(
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
        );
        return abiEncodedData;
    }
    public fillOrKillOrder(signedOrder: SignedOrder, takerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('takerAssetFillAmount', takerAssetFillAmount);
        const abiEncodedData = this._exchangeInstance.fillOrKillOrder.getABIEncodedTransactionData(
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
        );
        return abiEncodedData;
    }
    public cancelOrdersUpTo(targetOrderEpoch: BigNumber): string {
        assert.isBigNumber('targetOrderEpoch', targetOrderEpoch);
        const abiEncodedData = this._exchangeInstance.cancelOrdersUpTo.getABIEncodedTransactionData(targetOrderEpoch);
        return abiEncodedData;
    }
    public cancelOrder(order: Order | SignedOrder): string {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        const abiEncodedData = this._exchangeInstance.cancelOrder.getABIEncodedTransactionData(order);
        return abiEncodedData;
    }
    public marketSellOrders(signedOrders: SignedOrder[], takerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        const abiEncodedData = this._exchangeInstance.marketSellOrders.getABIEncodedTransactionData(
            signedOrders,
            takerAssetFillAmount,
            signatures,
        );
        return abiEncodedData;
    }
    public marketSellOrdersNoThrow(signedOrders: SignedOrder[], takerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        const abiEncodedData = this._exchangeInstance.marketSellOrdersNoThrow.getABIEncodedTransactionData(
            signedOrders,
            takerAssetFillAmount,
            signatures,
        );
        return abiEncodedData;
    }
    public marketBuyOrders(signedOrders: SignedOrder[], makerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        const abiEncodedData = this._exchangeInstance.marketBuyOrders.getABIEncodedTransactionData(
            signedOrders,
            makerAssetFillAmount,
            signatures,
        );
        return abiEncodedData;
    }
    public marketBuyOrdersNoThrow(signedOrders: SignedOrder[], makerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        const abiEncodedData = this._exchangeInstance.marketBuyOrdersNoThrow.getABIEncodedTransactionData(
            signedOrders,
            makerAssetFillAmount,
            signatures,
        );
        return abiEncodedData;
    }
}
