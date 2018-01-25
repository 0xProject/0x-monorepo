import { BigNumber } from '@0xproject/utils';

export const ordersResponse = [
    {
        maker: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
        taker: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
        makerFee: new BigNumber('100000000000000'),
        takerFee: new BigNumber('200000000000000'),
        makerTokenAmount: new BigNumber('10000000000000000'),
        takerTokenAmount: new BigNumber('20000000000000000'),
        makerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
        takerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
        salt: new BigNumber('256'),
        feeRecipient: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
        exchangeContractAddress: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
        expirationUnixTimestampSec: new BigNumber('42'),
        ecSignature: {
            v: 27,
            r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
            s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
        },
    },
];
