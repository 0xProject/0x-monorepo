import { BigNumber } from '@0x/utils';

import { OrderbookResponse } from '@0x/types';

export const orderbookResponse: OrderbookResponse = {
    bids: {
        total: 325,
        page: 2,
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
                    exchangeAddress: '0x12459c951127e0c374ff9105dda097662a027093',
                    signature: '0x012761a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
                },
                metaData: {},
            },
        ],
    },
    asks: {
        total: 500,
        page: 2,
        perPage: 100,
        records: [
            {
                order: {
                    makerAddress: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
                    takerAddress: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
                    feeRecipientAddress: '0xb046140686d052fff581f63f8136cce132e857da',
                    senderAddress: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
                    makerAssetAmount: new BigNumber('20000000000000000'),
                    takerAssetAmount: new BigNumber('10000000000000000'),
                    makerFee: new BigNumber('200000000000000'),
                    takerFee: new BigNumber('100000000000000'),
                    expirationTimeSeconds: new BigNumber('1532560590'),
                    salt: new BigNumber('1532559225'),
                    makerAssetData: '0x0257179264389b814a946f3e92105513705ca6b990',
                    takerAssetData: '0xf47261b04c32345ced77393b3530b1eed0f346429d',
                    exchangeAddress: '0x12459c951127e0c374ff9105dda097662a027093',
                    signature: '0x013842a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b3518891',
                },
                metaData: {},
            },
        ],
    },
};
