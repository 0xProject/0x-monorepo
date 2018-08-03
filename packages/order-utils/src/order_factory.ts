import { ECSignature, Order, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Provider } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { constants } from './constants';
import { orderHashUtils } from './order_hash';
import { generatePseudoRandomSalt } from './salt';
import { ecSignOrderHashAsync } from './signature_utils';
import { MessagePrefixType } from './types';

export const orderFactory = {
    createOrder(
        makerAddress: string,
        makerAssetAmount: BigNumber,
        makerAssetData: string,
        takerAssetAmount: BigNumber,
        takerAssetData: string,
        exchangeAddress: string,
        takerAddress: string = constants.NULL_ADDRESS,
        senderAddress: string = constants.NULL_ADDRESS,
        makerFee: BigNumber = constants.ZERO_AMOUNT,
        takerFee: BigNumber = constants.ZERO_AMOUNT,
        feeRecipientAddress: string = constants.NULL_ADDRESS,
        salt: BigNumber = generatePseudoRandomSalt(),
        expirationTimeSeconds: BigNumber = constants.INFINITE_TIMESTAMP_SEC,
    ): Order {
        const order = {
            makerAddress,
            takerAddress,
            senderAddress,
            makerFee,
            takerFee,
            makerAssetAmount,
            takerAssetAmount,
            makerAssetData,
            takerAssetData,
            salt,
            exchangeAddress,
            feeRecipientAddress,
            expirationTimeSeconds,
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
        takerAddress?: string,
        senderAddress?: string,
        makerFee?: BigNumber,
        takerFee?: BigNumber,
        feeRecipientAddress?: string,
        salt?: BigNumber,
        expirationTimeSeconds?: BigNumber,
    ): Promise<SignedOrder> {
        const order = orderFactory.createOrder(
            makerAddress,
            makerAssetAmount,
            makerAssetData,
            takerAssetAmount,
            takerAssetData,
            exchangeAddress,
            takerAddress,
            senderAddress,
            makerFee,
            takerFee,
            feeRecipientAddress,
            salt,
            expirationTimeSeconds,
        );
        const orderHash = orderHashUtils.getOrderHashHex(order);
        const messagePrefixOpts = {
            prefixType: MessagePrefixType.EthSign,
            shouldAddPrefixBeforeCallingEthSign: false,
        };
        const ecSignature = await ecSignOrderHashAsync(provider, orderHash, makerAddress, messagePrefixOpts);
        const signature = getVRSHexString(ecSignature);
        const signedOrder: SignedOrder = _.assign(order, { signature });
        return signedOrder;
    },
};

function getVRSHexString(ecSignature: ECSignature): string {
    const ETH_SIGN_SIGNATURE_TYPE = '03';
    const vrs = `${intToHex(ecSignature.v)}${ethUtil.stripHexPrefix(ecSignature.r)}${ethUtil.stripHexPrefix(
        ecSignature.s,
    )}${ETH_SIGN_SIGNATURE_TYPE}`;
    return vrs;
}

function intToHex(i: number): string {
    const hex = ethUtil.bufferToHex(ethUtil.toBuffer(i));
    return hex;
}
