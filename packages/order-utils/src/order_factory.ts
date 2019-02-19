import { Order, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { SupportedProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from './constants';
import { orderHashUtils } from './order_hash';
import { generatePseudoRandomSalt } from './salt';
import { signatureUtils } from './signature_utils';
import { CreateOrderOpts } from './types';
export const orderFactory = {
    createOrderFromPartial(partialOrder: Partial<Order>): Order {
        const defaultOrder = generateEmptyOrder();
        return {
            ...defaultOrder,
            ...partialOrder,
        };
    },
    createSignedOrderFromPartial(partialSignedOrder: Partial<SignedOrder>): SignedOrder {
        const defaultOrder = generateEmptySignedOrder();
        return {
            ...defaultOrder,
            ...partialSignedOrder,
        };
    },
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
        supportedProvider: SupportedProvider,
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
        const signature = await signatureUtils.ecSignHashAsync(supportedProvider, orderHash, makerAddress);
        const signedOrder: SignedOrder = _.assign(order, { signature });
        return signedOrder;
    },
};

function generateEmptySignedOrder(): SignedOrder {
    return {
        ...generateEmptyOrder(),
        signature: constants.NULL_BYTES,
    };
}
function generateEmptyOrder(): Order {
    return {
        senderAddress: constants.NULL_ADDRESS,
        makerAddress: constants.NULL_ADDRESS,
        takerAddress: constants.NULL_ADDRESS,
        makerFee: constants.ZERO_AMOUNT,
        takerFee: constants.ZERO_AMOUNT,
        makerAssetAmount: constants.ZERO_AMOUNT,
        takerAssetAmount: constants.ZERO_AMOUNT,
        makerAssetData: constants.NULL_BYTES,
        takerAssetData: constants.NULL_BYTES,
        salt: generatePseudoRandomSalt(),
        exchangeAddress: constants.NULL_ADDRESS,
        feeRecipientAddress: constants.NULL_ADDRESS,
        expirationTimeSeconds: constants.INFINITE_TIMESTAMP_SEC,
    };
}

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
