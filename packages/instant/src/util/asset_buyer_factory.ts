import { AssetBuyer, AssetBuyerOpts } from '@0x/asset-buyer';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { Network, OrderSource } from '../types';

export const assetBuyerFactory = {
    getAssetBuyer: (provider: Provider, orderSource: OrderSource, network: Network): AssetBuyer => {
        const assetBuyerOptions: Partial<AssetBuyerOpts> = {
            networkId: network,
        };
        const assetBuyer = _.isString(orderSource)
            ? AssetBuyer.getAssetBuyerForStandardRelayerAPIUrl(provider, orderSource, assetBuyerOptions)
            : AssetBuyer.getAssetBuyerForProvidedOrders(provider, orderSource, assetBuyerOptions);
        return assetBuyer;
    },
};
