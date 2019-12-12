import { generatePseudoRandomSalt } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';

import { constants } from '../../constants';

import { constants as marketOperationUtilConstants } from './constants';

const { NULL_ADDRESS, NULL_BYTES, ZERO_AMOUNT } = constants;
const { INFINITE_TIMESTAMP_SEC } = marketOperationUtilConstants;

export const dummyOrderUtils = {
    createDummyOrderForSampler(makerAssetData: string, takerAssetData: string): SignedOrder {
        return {
            makerAddress: NULL_ADDRESS,
            takerAddress: NULL_ADDRESS,
            senderAddress: NULL_ADDRESS,
            feeRecipientAddress: NULL_ADDRESS,
            salt: generatePseudoRandomSalt(),
            expirationTimeSeconds: INFINITE_TIMESTAMP_SEC,
            makerAssetData,
            takerAssetData,
            makerFeeAssetData: NULL_BYTES,
            takerFeeAssetData: NULL_BYTES,
            makerFee: ZERO_AMOUNT,
            takerFee: ZERO_AMOUNT,
            makerAssetAmount: ZERO_AMOUNT,
            takerAssetAmount: ZERO_AMOUNT,
            signature: NULL_BYTES,
            chainId: 0,
            exchangeAddress: NULL_ADDRESS,
        };
    },
};
