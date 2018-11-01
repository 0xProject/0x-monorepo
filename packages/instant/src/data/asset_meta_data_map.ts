import { AssetProxyId, ObjectMap } from '@0x/types';

import { AssetMetaData } from '../types';

// Map from assetData string to AssetMetaData object
// TODO: import this from somewhere else.
export const assetMetaDataMap: ObjectMap<AssetMetaData> = {
    '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: 'rgb(54, 50, 60)',
        symbol: 'zrx',
    },
    '0xf47261b000000000000000000000000042d6622dece394b54999fbd73d108123806f6a18': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#ec3e6c',
        symbol: 'spank',
    },
    '0xf47261b0000000000000000000000000d26114cd6EE289AccF82350c8d8487fedB8A0C07': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#2e61ea',
        symbol: 'omg',
    },
    '0xf47261b00000000000000000000000009f8f72aa9304c8b593d555f12ef6589cc3a579a2': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: 'white',
        symbol: 'mkr',
    },
    '0xf47261b00000000000000000000000000d8775f648430679a709e98d2b0cb6250d2887ef': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#9c326c',
        symbol: 'bat',
    },
    '0xf47261b0000000000000000000000000744d70fdbe2ba4cf95131626614a1763df805b9e': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#5663b0',
        symbol: 'snt',
    },
    '0xf47261b00000000000000000000000000f5d2fb29fb7d3cfee444a200298f468908cc942': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#f08839',
        symbol: 'mana',
    },
    '0xf47261b0000000000000000000000000a74476443119A942dE498590Fe1f2454d7D4aC0d': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#263469',
        symbol: 'gnt',
    },
    '0xf47261b000000000000000000000000012480e24eb5bec1a9d4369cab6a80cad3c0a377a': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#de5445',
        symbol: 'sub',
    },
    '0xf47261b000000000000000000000000008d32b0da63e2C3bcF8019c9c5d849d7a9d791e6': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#000',
        symbol: 'dentacoin',
    },
    '0xf47261b0000000000000000000000000e94327d07fc17907b4db788e5adf2ed424addff6': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#512D80',
        symbol: 'rep',
    },
};
