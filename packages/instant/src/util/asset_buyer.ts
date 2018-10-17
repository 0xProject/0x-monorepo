import { AssetBuyer } from '@0xproject/asset-buyer';

import { sraApiUrl } from '../constants';

import { getProvider } from './provider';

const provider = getProvider();

export const assetBuyer = AssetBuyer.getAssetBuyerForStandardRelayerAPIUrl(provider, sraApiUrl);
