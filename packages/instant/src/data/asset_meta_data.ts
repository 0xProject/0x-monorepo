import { AssetProxyId, ObjectMap } from '@0xproject/types';

import { zrxAssetData } from '../constants';
import { AssetMetaData } from '../types';

// Map from assetData string to AssetMetaData object
// TODO: import this from somewhere else.
export const assetMetaData: ObjectMap<AssetMetaData> = {
    [zrxAssetData]: {
        assetProxyId: AssetProxyId.ERC20,
        decimals: 18,
        primaryColor: 'rgb(54, 50, 60)',
        symbol: 'zrx',
    },
};
