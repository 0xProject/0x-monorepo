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
        name: '0x',
    },
    '0xf47261b000000000000000000000000042d6622dece394b54999fbd73d108123806f6a18': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#ec3e6c',
        symbol: 'spank',
        name: 'Spank',
    },
    '0xf47261b0000000000000000000000000d26114cd6ee289accf82350c8d8487fedb8a0c07': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#2e61ea',
        symbol: 'omg',
        name: 'OmiseGo',
    },
    '0xf47261b00000000000000000000000009f8f72aa9304c8b593d555f12ef6589cc3a579a2': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#87e4ca',
        symbol: 'mkr',
        name: 'Maker',
    },
    '0xf47261b00000000000000000000000000d8775f648430679a709e98d2b0cb6250d2887ef': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#9c326c',
        symbol: 'bat',
        name: 'Basic Attention Token',
    },
    '0xf47261b0000000000000000000000000744d70fdbe2ba4cf95131626614a1763df805b9e': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#5663b0',
        symbol: 'snt',
        name: 'Status',
    },
    '0xf47261b00000000000000000000000000f5d2fb29fb7d3cfee444a200298f468908cc942': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#f08839',
        symbol: 'mana',
        name: 'Decentraland',
    },
    '0xf47261b0000000000000000000000000a74476443119a942de498590fe1f2454d7d4ac0d': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#263469',
        symbol: 'gnt',
        name: 'Golem',
    },
    '0xf47261b000000000000000000000000012480e24eb5bec1a9d4369cab6a80cad3c0a377a': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#de5445',
        symbol: 'sub',
        name: 'Substratum',
    },
    '0xf47261b000000000000000000000000008d32b0da63e2C3bcF8019c9c5d849d7a9d791e6': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#000',
        symbol: 'dentacoin',
        name: 'Dentacoin',
    },
    '0xf47261b00000000000000000000000001985365e9f78359a9b6ad760e32412f4a445e862': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#512D80',
        symbol: 'rep',
        name: 'Augur',
    },
};
