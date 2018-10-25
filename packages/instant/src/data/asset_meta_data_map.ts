import { AssetProxyId, ObjectMap } from '@0x/types';

import { AssetMetaData } from '../types';

// Map from assetData string to AssetMetaData object
// TODO: import this from somewhere else.
export const assetMetaDataMap: ObjectMap<AssetMetaData> = {
    '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#512D80', // TODO: dont commit!!!!!
        symbol: 'zrx',
    },
    '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#512D80', // TODO: dont commit!!!!!
        symbol: 'zrx',
    },
};
