import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { crypto } from './crypto';
import { OrderStruct, SignatureType, SignedOrder } from './types';

export const signedOrderUtils = {
    createFill: (signedOrder: SignedOrder, takerTokenFillAmount?: BigNumber) => {
        const fill = {
            order: signedOrderUtils.getOrderStruct(signedOrder),
            takerTokenFillAmount: takerTokenFillAmount || signedOrder.takerTokenAmount,
            signature: signedOrder.signature,
        };
        return fill;
    },
    createCancel(signedOrder: SignedOrder, takerTokenCancelAmount?: BigNumber) {
        const cancel = {
            order: signedOrderUtils.getOrderStruct(signedOrder),
            takerTokenCancelAmount: takerTokenCancelAmount || signedOrder.takerTokenAmount,
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
            makerTokenAmount: signedOrder.makerTokenAmount,
            takerTokenAmount: signedOrder.takerTokenAmount,
            makerFeeAmount: signedOrder.makerFeeAmount,
            takerFeeAmount: signedOrder.takerFeeAmount,
            expirationTimeSeconds: signedOrder.expirationTimeSeconds,
            salt: signedOrder.salt,
        };
        return orderStruct;
    },
    getOrderHashHex(signedOrder: SignedOrder): string {
        const orderSchemaHashBuff = crypto.solSHA3([
            'address exchangeAddress',
            'address makerAddress',
            'address takerAddress',
            'address makerTokenAddress',
            'address takerTokenAddress',
            'address feeRecipientAddress',
            'uint256 makerTokenAmount',
            'uint256 takerTokenAmount',
            'uint256 makerFeeAmount',
            'uint256 takerFeeAmount',
            'uint256 expirationTimestampSeconds',
            'uint256 salt',
        ]);
        const orderSchemaHashHex = `0x${orderSchemaHashBuff.toString('hex')}`;
        const orderHashBuff = crypto.solSHA3([
            signedOrder.exchangeAddress,
            signedOrder.makerAddress,
            signedOrder.takerAddress,
            signedOrder.makerTokenAddress,
            signedOrder.takerTokenAddress,
            signedOrder.feeRecipientAddress,
            signedOrder.makerTokenAmount,
            signedOrder.takerTokenAmount,
            signedOrder.makerFeeAmount,
            signedOrder.takerFeeAmount,
            signedOrder.expirationTimeSeconds,
            signedOrder.salt,
        ]);
        const orderHashHex = `0x${orderHashBuff.toString('hex')}`;
        const prefixedOrderHashBuff = crypto.solSHA3([new BigNumber(orderSchemaHashHex), new BigNumber(orderHashHex)]);
        const prefixedOrderHashHex = `0x${prefixedOrderHashBuff.toString('hex')}`;
        return prefixedOrderHashHex;
    },
    getSignatureType(signature: string): SignatureType {
        const signatureBuff = new Buffer(signature);
        const signatureType = signatureBuff[0];
        if (!_.has(SignatureType, signatureType)) {
            throw new Error(`${signatureType} is not a valid signature type`);
        }
        return signatureType;
    },
};
