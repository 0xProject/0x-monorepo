import * as _ from 'lodash';

import { BIG_NUMBER_ZERO } from '../constants';
import { assetUtils } from '../util/asset';
import { coinbaseApi } from '../util/coinbase_api';
import { errorFlasher } from '../util/error_flasher';

import { actions } from './actions';
import { Store } from './store';

export const asyncData = {
    fetchEthPriceAndDispatchToStore: async (store: Store) => {
        try {
            const ethUsdPrice = await coinbaseApi.getEthUsdPrice();
            store.dispatch(actions.updateEthUsdPrice(ethUsdPrice));
        } catch (e) {
            const errorMessage = 'Error fetching ETH/USD price';
            errorFlasher.flashNewErrorMessage(store.dispatch, errorMessage);
            store.dispatch(actions.updateEthUsdPrice(BIG_NUMBER_ZERO));
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
                const errorMessage = 'Could not find any assets';
                errorFlasher.flashNewErrorMessage(store.dispatch, errorMessage);
                // On error, just specify that none are available
                store.dispatch(actions.setAvailableAssets([]));
            }
        }
    },
};
