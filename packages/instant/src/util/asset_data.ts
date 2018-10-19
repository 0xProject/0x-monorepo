import * as _ from 'lodash';

import { AssetProxyId } from '@0x/types';

import { assetMetaData } from '../data/asset_meta_data';

export const assetDataUtil = {
    bestNameForAsset: (assetData: string | undefined, defaultString: string) => {
        if (_.isUndefined(assetData)) {
            return defaultString;
        }
        const metaData = assetMetaData[assetData];
        if (_.isUndefined(metaData)) {
            return defaultString;
        }
        if (metaData.assetProxyId === AssetProxyId.ERC20) {
            return metaData.symbol.toUpperCase();
        }
        return defaultString;
    },
};
