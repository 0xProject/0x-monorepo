import { ECSignature, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Provider } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { orderHashUtils } from './order_hash';
import { generatePseudoRandomSalt } from './salt';
import { ecSignOrderHashAsync } from './signature_utils';
import { MessagePrefixType } from './types';

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
    const vrs = `0x${intToHex(ecSignature.v)}${ethUtil.stripHexPrefix(ecSignature.r)}${ethUtil.stripHexPrefix(
        ecSignature.s,
    )}`;
    return vrs;
}

function intToHex(i: number): string {
    const hex = ethUtil.bufferToHex(ethUtil.toBuffer(i));
    return hex;
}
