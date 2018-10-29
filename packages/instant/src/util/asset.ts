import { AssetProxyId, ObjectMap } from '@0x/types';
import * as _ from 'lodash';

import { assetDataNetworkMapping } from '../data/asset_data_network_mapping';
import { Asset, AssetMetaData, ERC20Asset, Network, ZeroExInstantError } from '../types';

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
            const mainnetAssetDataIfExists = assetUtils.getAssociatedAssetDataIfExists(assetData, network);
            // Just so we don't fail in the case where we are on a non-mainnet network,
            // but pass in a valid mainnet assetData.
            mainnetAssetData = mainnetAssetDataIfExists || assetData;
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
                return metaData.name;
            default:
                return defaultName;
        }
    },
    formattedSymbolForAsset: (asset?: ERC20Asset, defaultName: string = '???'): string => {
        if (_.isUndefined(asset)) {
            return defaultName;
        }
        const symbol = asset.metaData.symbol;
        if (symbol.length <= 5) {
            return symbol;
        }
        return `${symbol.slice(0, 3)}…`;
    },
    getAssociatedAssetDataIfExists: (assetData: string, network: Network): string | undefined => {
        const assetDataGroupIfExists = _.find(assetDataNetworkMapping, value => value[network] === assetData);
        if (_.isUndefined(assetDataGroupIfExists)) {
            return;
        }
        return assetDataGroupIfExists[Network.Mainnet];
    },
};
