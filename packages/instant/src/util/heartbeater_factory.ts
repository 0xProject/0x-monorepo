import { asyncData } from '../redux/async_data';
import { Store } from '../redux/store';

import { Heartbeater } from './heartbeater';

export const generateAccountHeartbeater = (store: Store, performImmediatelyOnStart: boolean): Heartbeater => {
    return new Heartbeater(async () => {
        await asyncData.fetchAccountInfoAndDispatchToStore(store, { setLoading: false });
    }, performImmediatelyOnStart);
};

export const generateBuyQuoteHeartbeater = (store: Store, performImmediatelyOnStart: boolean): Heartbeater => {
    return new Heartbeater(async () => {
        await asyncData.fetchCurrentBuyQuoteAndDispatchToStore(store, false);
    }, performImmediatelyOnStart);
};
