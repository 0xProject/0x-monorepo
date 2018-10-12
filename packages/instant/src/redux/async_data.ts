import { BIG_NUMBER_ZERO } from '../constants';
import { coinbaseApi } from '../util/coinbase_api';

import { ActionTypes } from './actions';

import { store } from './store';

export const asyncData = {
    fetchAndDispatchToStore: async () => {
        let ethUsdPrice = BIG_NUMBER_ZERO;
        try {
            ethUsdPrice = await coinbaseApi.getEthUsdPrice();
        } catch (e) {
            // ignore
        } finally {
            store.dispatch({
                type: ActionTypes.UPDATE_ETH_USD_PRICE,
                data: ethUsdPrice,
            });
        }
    },
};
