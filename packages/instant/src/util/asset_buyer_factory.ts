import { AssetBuyer, AssetBuyerOpts } from '@0x/asset-buyer';
import { SupportedProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { Network, OrderSource } from '../types';

export const assetBuyerFactory = {
    getAssetBuyer: (supportedProvider: SupportedProvider, orderSource: OrderSource, network: Network): AssetBuyer => {
        const assetBuyerOptions: Partial<AssetBuyerOpts> = {
            networkId: network,
        };
        const assetBuyer = _.isString(orderSource)
            ? AssetBuyer.getAssetBuyerForStandardRelayerAPIUrl(supportedProvider, orderSource, assetBuyerOptions)
            : AssetBuyer.getAssetBuyerForProvidedOrders(supportedProvider, orderSource, assetBuyerOptions);
        return assetBuyer;
    },
};
