import { assetDataUtils } from '@0xproject/order-utils';
import { AssetProxyId, ObjectMap } from '@0xproject/types';
import * as _ from 'lodash';

import { assetDataNetworkMapping } from '../data/asset_data_network_mapping';
import { Asset, AssetMetaData, Network, ZeroExInstantError } from '../types';

export const assetUtils = {
    createAssetFromAssetData: (assetData: string, assetMetaDataMap: ObjectMap<AssetMetaData>): Asset => {
        return {
            assetProxyId: assetDataUtils.decodeAssetProxyId(assetData),
            assetData,
            metaData: assetUtils.getMetaDataOrThrow(assetData, assetMetaDataMap),
        };
    },
    getMetaDataOrThrow: (
        assetData: string,
        metaDataMap: ObjectMap<AssetMetaData>,
        network: Network = Network.Mainnet,
    ): AssetMetaData => {
        let mainnetAssetData: string | undefined = assetData;
        if (network !== Network.Mainnet) {
            mainnetAssetData = assetDataNetworkMapping.getAssociatedAssetDataIfExists(assetData, network);
        }
        if (_.isUndefined(mainnetAssetData)) {
            throw new Error(ZeroExInstantError.AssetMetaDataNotAvailable);
        }
        const metaData = metaDataMap[mainnetAssetData];
        if (_.isUndefined(metaData)) {
            throw new Error();
        }
        return metaData;
    },
};
