import * as _ from 'lodash';

import { Network } from '../types';

interface AssetDataByNetwork {
    [Network.Kovan]?: string;
    [Network.Mainnet]?: string;
}

export const assetDataNetworkMapping: AssetDataByNetwork[] = [
    // ZRX
    {
        [Network.Mainnet]: '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498',
        [Network.Kovan]: '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa',
    },
    // SPANK
    {
        [Network.Mainnet]: '0xf47261b000000000000000000000000042d6622dece394b54999fbd73d108123806f6a18',
        [Network.Kovan]: '0xf47261b00000000000000000000000007c9eee8448f3a7d1193389652d863b27e543272d',
    },
    // OMG
    {
        [Network.Mainnet]: '0xf47261b000000000000000000000000042d6622dece394b54999fbd73d108123806f6a18',
        [Network.Kovan]: '0xf47261b000000000000000000000000046096d8ec059dbaae2950b30e01634ff0dc652ec',
    },
    // MKR
    {
        [Network.Mainnet]: '0xf47261b00000000000000000000000009f8f72aa9304c8b593d555f12ef6589cc3a579a2',
        [Network.Kovan]: '0xf47261b00000000000000000000000000xbf5e8e38659562fda594fbb3ec5a3576d02a9e0a',
    },
    // BAT
    {
        [Network.Mainnet]: '0xf47261b00000000000000000000000000d8775f648430679a709e98d2b0cb6250d2887ef',
        [Network.Kovan]: '0xf47261b0000000000000000000000000c87faa7a58f0adf306bad9e7d892fb045a20e5af',
    },
    // SNT
    {
        [Network.Mainnet]: '0xf47261b0000000000000000000000000744d70fdbe2ba4cf95131626614a1763df805b9e',
        [Network.Kovan]: '0xf47261b00000000000000000000000009cfe76a718ea75e3e8ce4fc7ad0fef84be70919b',
    },
    // MANA
    {
        [Network.Mainnet]: '0xf47261b00000000000000000000000000f5d2fb29fb7d3cfee444a200298f468908cc942',
        [Network.Kovan]: '0xf47261b0000000000000000000000000c64edfc78321673435fbeebdaaa7f9d755963542',
    },
    // GNT
    {
        [Network.Mainnet]: '0xf47261b0000000000000000000000000a74476443119A942dE498590Fe1f2454d7D4aC0d',
        [Network.Kovan]: '0xf47261b00000000000000000000000006986fa3646f408905ecb1876bfd355d25039ee3a',
    },
    // SUB
    {
        [Network.Mainnet]: '0xf47261b000000000000000000000000012480e24eb5bec1a9d4369cab6a80cad3c0a377a',
    },
    // Dentacoin
    {
        [Network.Mainnet]: '0xf47261b000000000000000000000000008d32b0da63e2C3bcF8019c9c5d849d7a9d791e6',
    },
];
