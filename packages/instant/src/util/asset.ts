import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId, ObjectMap } from '@0x/types';
import * as _ from 'lodash';

import { assetDataNetworkMapping } from '../data/asset_data_network_mapping';
import { Asset, AssetMetaData, Network, ZeroExInstantError } from '../types';

export const assetUtils = {
    createAssetFromAssetData: (
        assetData: string,
        assetMetaDataMap: ObjectMap<AssetMetaData>,
        network: Network,
    ): Asset => {
        return {
            assetData,
            metaData: assetUtils.getMetaDataOrThrow(assetData, assetMetaDataMap, network),
        };
    },
    getMetaDataOrThrow: (assetData: string, metaDataMap: ObjectMap<AssetMetaData>, network: Network): AssetMetaData => {
        let mainnetAssetData: string | undefined = assetData;
        if (network !== Network.Mainnet) {
            mainnetAssetData = assetUtils.getAssociatedAssetDataIfExists(assetData, network);
        }
        if (_.isUndefined(mainnetAssetData)) {
            throw new Error(ZeroExInstantError.AssetMetaDataNotAvailable);
        }
        const metaData = metaDataMap[mainnetAssetData];
        if (_.isUndefined(metaData)) {
            throw new Error(ZeroExInstantError.AssetMetaDataNotAvailable);
        }
        return metaData;
    },
    bestNameForAsset: (asset?: Asset, defaultName: string = '???'): string => {
        if (_.isUndefined(asset)) {
            return defaultName;
        }
        const metaData = asset.metaData;
        switch (metaData.assetProxyId) {
            case AssetProxyId.ERC20:
                return metaData.symbol.toUpperCase();
            case AssetProxyId.ERC721:
                return metaData.name.toUpperCase();
            default:
                return defaultName;
        }
    },
    getAssociatedAssetDataIfExists: (assetData: string, network: Network): string | undefined => {
        const assetDataGroupIfExists = _.find(assetDataNetworkMapping, value => value[network] === assetData);
        if (_.isUndefined(assetDataGroupIfExists)) {
            return;
        }
        return assetDataGroupIfExists[Network.Mainnet];
    },
};
