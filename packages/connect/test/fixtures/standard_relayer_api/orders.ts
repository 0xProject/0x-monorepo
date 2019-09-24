import { BigNumber } from '@0x/utils';

import { OrdersResponse } from '@0x/types';

export const ordersResponse: OrdersResponse = {
    total: 984,
    page: 1,
    perPage: 100,
    records: [
        {
            order: {
                makerAddress: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
                takerAddress: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
                feeRecipientAddress: '0xb046140686d052fff581f63f8136cce132e857da',
                senderAddress: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
                makerAssetAmount: new BigNumber('10000000000000000'),
                takerAssetAmount: new BigNumber('20000000000000000'),
                makerFee: new BigNumber('100000000000000'),
                takerFee: new BigNumber('200000000000000'),
                expirationTimeSeconds: new BigNumber('1532560590'),
                salt: new BigNumber('1532559225'),
                makerAssetData: '0xf47261b04c32345ced77393b3530b1eed0f346429d',
                takerAssetData: '0x0257179264389b814a946f3e92105513705ca6b990',
                makerFeeAssetData: '0xf47261b04c32345ced77393b3530b1eed0f346429d',
                takerFeeAssetData: '0x0257179264389b814a946f3e92105513705ca6b990',
                signature: '0x012761a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
                domain: {
                    chainId: 1,
                    verifyingContract: '0x12459c951127e0c374ff9105dda097662a027093',
                },
            },
            metaData: {},
        },
    ],
};
