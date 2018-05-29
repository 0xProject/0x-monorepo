import { Provider, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { orderHashUtils } from './order_hash';
import { generatePseudoRandomSalt } from './salt';
import { ecSignOrderHashAsync, getVRSHexString } from './signature_utils';

const SHOULD_ADD_PERSONAL_MESSAGE_PREFIX = false;

export const orderFactory = {
    async createSignedOrderAsync(
        provider: Provider,
        makerAddress: string,
        takerAddress: string,
        senderAddress: string,
        makerFee: BigNumber,
        takerFee: BigNumber,
        makerAssetAmount: BigNumber,
        makerAssetData: string,
        takerAssetAmount: BigNumber,
        takerAssetData: string,
        exchangeAddress: string,
        feeRecipientAddress: string,
        expirationTimeSecondsIfExists?: BigNumber,
    ): Promise<SignedOrder> {
        const defaultExpirationUnixTimestampSec = new BigNumber(2524604400); // Close to infinite
        const expirationTimeSeconds = _.isUndefined(expirationTimeSecondsIfExists)
            ? defaultExpirationUnixTimestampSec
            : expirationTimeSecondsIfExists;
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
            salt: generatePseudoRandomSalt(),
            exchangeAddress,
            feeRecipientAddress,
            expirationTimeSeconds,
        };
        const orderHash = orderHashUtils.getOrderHashHex(order);
        const ecSignature = await ecSignOrderHashAsync(
            provider,
            orderHash,
            makerAddress,
            SHOULD_ADD_PERSONAL_MESSAGE_PREFIX,
        );
        const signature = getVRSHexString(ecSignature);
        const signedOrder: SignedOrder = _.assign(order, { signature });
        return signedOrder;
    },
};
