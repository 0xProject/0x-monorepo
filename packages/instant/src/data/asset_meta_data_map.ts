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
};
