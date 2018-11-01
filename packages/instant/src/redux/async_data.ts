import * as _ from 'lodash';

import { BIG_NUMBER_ZERO } from '../constants';
import { assetUtils } from '../util/asset';
import { coinbaseApi } from '../util/coinbase_api';

import { actions } from './actions';
import { Store } from './store';

export const asyncData = {
    fetchEthPriceAndDispatchToStore: async (store: Store) => {
        let ethUsdPrice = BIG_NUMBER_ZERO;
        try {
            ethUsdPrice = await coinbaseApi.getEthUsdPrice();
        } catch (e) {
            // ignore
        } finally {
            store.dispatch(actions.updateEthUsdPrice(ethUsdPrice));
        }
    },
    fetchAvailableAssetDatasAndDispatchToStore: async (store: Store) => {
        const { assetBuyer, assetMetaDataMap, network } = store.getState();
        if (!_.isUndefined(assetBuyer)) {
            try {
                const assetDatas = await assetBuyer.getAvailableAssetDatasAsync();
                const assets = assetUtils.createAssetsFromAssetDatas(assetDatas, assetMetaDataMap, network);
                store.dispatch(actions.setAvailableAssets(assets));
            } catch (e) {
                // ignore
            }
        }
    },
};
