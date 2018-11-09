import { asyncData } from '../redux/async_data';
import { Store } from '../redux/store';

import { Heartbeater } from './heartbeater';

export interface HeartbeatFactoryOptions {
    store: Store;
    performImmediatelyOnStart: boolean;
}
export const generateAccountHeartbeater = (options: HeartbeatFactoryOptions): Heartbeater => {
    const { store, performImmediatelyOnStart } = options;
    return new Heartbeater(async () => {
        await asyncData.fetchAccountInfoAndDispatchToStore({ store, setLoading: false });
    }, performImmediatelyOnStart);
};

export const generateBuyQuoteHeartbeater = (options: HeartbeatFactoryOptions): Heartbeater => {
    const { store, performImmediatelyOnStart } = options;
    return new Heartbeater(async () => {
        await asyncData.fetchCurrentBuyQuoteAndDispatchToStore({ store, setPending: false });
    }, performImmediatelyOnStart);
};
