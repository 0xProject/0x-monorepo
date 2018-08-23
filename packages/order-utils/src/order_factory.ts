import { Order, SignedOrder, SignerType } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from './constants';
import { orderHashUtils } from './order_hash';
import { generatePseudoRandomSalt } from './salt';
import { signatureUtils } from './signature_utils';
import { CreateOrderOpts } from './types';

export const orderFactory = {
    createOrder(
        makerAddress: string,
        makerAssetAmount: BigNumber,
        makerAssetData: string,
        takerAssetAmount: BigNumber,
        takerAssetData: string,
        exchangeAddress: string,
        createOrderOpts: CreateOrderOpts = generateDefaultCreateOrderOpts(),
    ): Order {
        const defaultCreateOrderOpts = generateDefaultCreateOrderOpts();
        const order = {
            makerAddress,
            makerAssetAmount,
            takerAssetAmount,
            makerAssetData,
            takerAssetData,
            exchangeAddress,
            takerAddress: createOrderOpts.takerAddress || defaultCreateOrderOpts.takerAddress,
            senderAddress: createOrderOpts.senderAddress || defaultCreateOrderOpts.senderAddress,
            makerFee: createOrderOpts.makerFee || defaultCreateOrderOpts.makerFee,
            takerFee: createOrderOpts.takerFee || defaultCreateOrderOpts.takerFee,
            feeRecipientAddress: createOrderOpts.feeRecipientAddress || defaultCreateOrderOpts.feeRecipientAddress,
            salt: createOrderOpts.salt || defaultCreateOrderOpts.salt,
            expirationTimeSeconds:
                createOrderOpts.expirationTimeSeconds || defaultCreateOrderOpts.expirationTimeSeconds,
        };
        return order;
    },
    async createSignedOrderAsync(
        provider: Provider,
        makerAddress: string,
        makerAssetAmount: BigNumber,
        makerAssetData: string,
        takerAssetAmount: BigNumber,
        takerAssetData: string,
        exchangeAddress: string,
        createOrderOpts?: CreateOrderOpts,
    ): Promise<SignedOrder> {
        const order = orderFactory.createOrder(
            makerAddress,
            makerAssetAmount,
            makerAssetData,
            takerAssetAmount,
            takerAssetData,
            exchangeAddress,
            createOrderOpts,
        );
        const orderHash = orderHashUtils.getOrderHashHex(order);
        const signature = await signatureUtils.ecSignOrderHashAsync(
            provider,
            orderHash,
            makerAddress,
            SignerType.Default,
        );
        const signedOrder: SignedOrder = _.assign(order, { signature });
        return signedOrder;
    },
};

function generateDefaultCreateOrderOpts(): {
    takerAddress: string;
    senderAddress: string;
    makerFee: BigNumber;
    takerFee: BigNumber;
    feeRecipientAddress: string;
    salt: BigNumber;
    expirationTimeSeconds: BigNumber;
} {
    return {
        takerAddress: constants.NULL_ADDRESS,
        senderAddress: constants.NULL_ADDRESS,
        makerFee: constants.ZERO_AMOUNT,
        takerFee: constants.ZERO_AMOUNT,
        feeRecipientAddress: constants.NULL_ADDRESS,
        salt: generatePseudoRandomSalt(),
        expirationTimeSeconds: constants.INFINITE_TIMESTAMP_SEC,
    };
}
