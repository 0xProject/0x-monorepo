import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { crypto } from './crypto';
import { OrderStruct, SignatureType, SignedOrder, UnsignedOrder } from './types';

export const orderUtils = {
    createFill: (signedOrder: SignedOrder, takerSellAmount?: BigNumber) => {
        const fill = {
            order: orderUtils.getOrderStruct(signedOrder),
            takerSellAmount: takerSellAmount || signedOrder.makerBuyAmount,
            signature: signedOrder.signature,
        };
        return fill;
    },
    createCancel(signedOrder: SignedOrder, takerTokenCancelAmount?: BigNumber) {
        const cancel = {
            order: orderUtils.getOrderStruct(signedOrder),
            takerTokenCancelAmount: takerTokenCancelAmount || signedOrder.makerBuyAmount,
        };
        return cancel;
    },
    getOrderStruct(signedOrder: SignedOrder): OrderStruct {
        const orderStruct = {
            makerAddress: signedOrder.makerAddress,
            takerAddress: signedOrder.takerAddress,
            makerTokenAddress: signedOrder.makerTokenAddress,
            takerTokenAddress: signedOrder.takerTokenAddress,
            feeRecipientAddress: signedOrder.feeRecipientAddress,
            makerSellAmount: signedOrder.makerSellAmount,
            makerBuyAmount: signedOrder.makerBuyAmount,
            makerFee: signedOrder.makerFee,
            takerFee: signedOrder.takerFee,
            expirationTimeSeconds: signedOrder.expirationTimeSeconds,
            salt: signedOrder.salt,
        };
        return orderStruct;
    },
    getOrderHashBuff(order: SignedOrder | UnsignedOrder): Buffer {
        const orderSchemaHashBuff = crypto.solSHA3([
            'address exchangeAddress',
            'address makerAddress',
            'address takerAddress',
            'address makerTokenAddress',
            'address takerTokenAddress',
            'address feeRecipientAddress',
            'uint256 makerSellAmount',
            'uint256 makerBuyAmount',
            'uint256 makerFee',
            'uint256 takerFee',
            'uint256 expirationTimeSeconds',
            'uint256 salt',
        ]);
        const orderParamsHashBuff = crypto.solSHA3([
            order.exchangeAddress,
            order.makerAddress,
            order.takerAddress,
            order.makerTokenAddress,
            order.takerTokenAddress,
            order.feeRecipientAddress,
            order.makerSellAmount,
            order.makerBuyAmount,
            order.makerFee,
            order.takerFee,
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
