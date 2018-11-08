export const relayerApiOrderbookResponse = {
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
                    makerAssetAmount: '10000000000000000',
                    takerAssetAmount: '1',
                    makerFee: '100000000000000',
                    takerFee: '200000000000000',
                    expirationTimeSeconds: '1532560590',
                    salt: '1532559225',
                    makerAssetData: '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498',
                    takerAssetData:
                        '0x02571792000000000000000000000000371b13d97f4bf77d724e78c16b7dc74099f40e840000000000000000000000000000000000000000000000000000000000000063',
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
                    makerAssetAmount: '20000000000000000',
                    takerAssetAmount: '1',
                    makerFee: '200000000000000',
                    takerFee: '100000000000000',
                    expirationTimeSeconds: '1532560590',
                    salt: '1532559225',
                    makerAssetData:
                        '0x02571792000000000000000000000000371b13d97f4bf77d724e78c16b7dc74099f40e840000000000000000000000000000000000000000000000000000000000000063',
                    takerAssetData: '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498',
                    exchangeAddress: '0x12459c951127e0c374ff9105dda097662a027093',
                    signature: '0x013842a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b3518891',
                },
                metaData: {},
            },
        ],
    },
};
