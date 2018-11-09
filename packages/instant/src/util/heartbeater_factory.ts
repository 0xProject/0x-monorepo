import { asyncData } from '../redux/async_data';
import { Store } from '../redux/store';

import { updateBuyQuoteOrFlashErrorAsyncForState } from './buy_quote_fetcher';
import { Heartbeater } from './heartbeater';

export const generateAccountHeartbeater = (store: Store): Heartbeater => {
    return new Heartbeater(async () => {
        await asyncData.fetchAccountInfoAndDispatchToStore(store, { setLoading: false });
    });
};

export const generateBuyQuoteHeartbeater = (store: Store): Heartbeater => {
    return new Heartbeater(async () => {
        await updateBuyQuoteOrFlashErrorAsyncForState(store.getState(), store.dispatch);
    });
};
