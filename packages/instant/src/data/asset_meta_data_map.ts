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
    '0xf47261b0000000000000000000000000e94327d07fc17907b4db788e5adf2ed424addff6': {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: '#512D80',
        symbol: 'rep',
    },
};
