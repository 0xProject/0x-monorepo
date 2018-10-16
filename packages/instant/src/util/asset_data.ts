import { AssetProxyId } from '@0xproject/types';

import { assetMetaData } from '../data/asset_meta_data';

// TODO: tests for this
export const bestNameForAsset = (assetData: string | undefined, defaultString: string) => {
    if (assetData === undefined) {
        return defaultString;
    }
    const metaData = assetMetaData[assetData];
    if (metaData === undefined) {
        return defaultString;
    }
    if (metaData.assetProxyId === AssetProxyId.ERC20) {
        return metaData.symbol.toUpperCase();
    }
    return defaultString;
};
