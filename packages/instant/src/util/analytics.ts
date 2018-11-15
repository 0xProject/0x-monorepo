import { ObjectMap } from '@0x/types';
import { logUtils } from '@0x/utils';

import { ANALYTICS_ENABLED } from '../constants';

import { HeapAnalytics, heapUtil } from './heap';

const evaluteHeapCall = (heapFunctionCall: (heap: HeapAnalytics) => void): void => {
    if (!ANALYTICS_ENABLED) {
        return;
    }

    const curHeap = heapUtil.getHeap();
    if (curHeap) {
        try {
            heapFunctionCall(curHeap);
        } catch (e) {
            // We never want analytics to crash our React component
            // TODO: error reporter here
            logUtils.log('Analytics error', e);
        }
    }
};

export const analytics = {
    addUserProperties: (properties: ObjectMap<string | number>): void => {
        console.log('HEAP: adding user properties', properties);
        evaluteHeapCall(heap => heap.addUserProperties(properties));
    },
    addEventProperties: (properties: ObjectMap<string | number>): void => {
        console.log('HEAP: adding user properties', properties);
        evaluteHeapCall(heap => heap.addEventProperties(properties));
    },
    track: (eventName: string, eventProperties?: ObjectMap<string | number>): void => {
        console.log('HEAP: tracking', eventName, eventProperties);
        evaluteHeapCall(heap => heap.track(eventName, eventProperties));
    },
};
