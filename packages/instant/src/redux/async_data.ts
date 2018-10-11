import { BigNumber } from '@0xproject/utils';

import { ActionTypes } from '../types';
import { coinbaseApi } from '../util/coinbase_api';

import { store } from './store';

export const asyncData = {
    fetchAndDispatchToStore: async () => {
        let ethUsdPriceStr = '0';
        try {
            ethUsdPriceStr = await coinbaseApi.getEthUsdPrice();
        } catch (e) {
            // ignore
        } finally {
            store.dispatch({
                type: ActionTypes.UPDATE_ETH_USD_PRICE,
                data: new BigNumber(ethUsdPriceStr),
            });
        }
    },
};
