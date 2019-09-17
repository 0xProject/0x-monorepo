import { APIOrder } from '@0x/connect';
import { BigNumber } from '@0x/utils';

export const createOrder = (makerAssetData: string, takerAssetData: string): APIOrder => {
    return {
        order: {
            makerAddress: '0x00',
            takerAddress: '0x00',
            makerAssetData,
            takerAssetData,
            makerFeeAssetData: makerAssetData,
            takerFeeAssetData: takerAssetData,
            domain: {
                chainId: 0,
                verifyingContractAddress: '0x00',
            },
            senderAddress: '0x00',
            makerAssetAmount: new BigNumber(1),
            takerAssetAmount: new BigNumber(1),
            feeRecipientAddress: '0x00',
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            salt: new BigNumber(0),
            expirationTimeSeconds: new BigNumber(0),
            signature: '0xsig',
        },
        metaData: {
            orderHash: '0x12345',
            remainingFillableTakerAssetAmount: new BigNumber(1),
        },
    };
};
