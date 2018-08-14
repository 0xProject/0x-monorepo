import { BigNumber } from '@0xproject/utils';

import { AssetPairsItem } from '../../../src/types';

export const assetDataPairsResponse: AssetPairsItem[] = [
    {
        assetDataA: {
            address: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
            minAmount: new BigNumber(0),
            maxAmount: new BigNumber('10000000000000000000'),
            precision: 5,
        },
        assetDataB: {
            address: '0xef7fff64389b814a946f3e92105513705ca6b990',
            minAmount: new BigNumber(0),
            maxAmount: new BigNumber('50000000000000000000'),
            precision: 5,
        },
    },
];
