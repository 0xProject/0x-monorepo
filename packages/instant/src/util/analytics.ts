import { ObjectMap } from '@0x/types';
import { logUtils } from '@0x/utils';

import { HeapAnalytics, heapUtil } from './heap';

export class Analytics {
    public static init(): Analytics {
        return new Analytics();
    }
    public track(eventName: string, eventProperties?: ObjectMap<string | number>): void {
        console.log('HEAP: tracking', eventName, eventProperties);
        this._evaluteHeapCall(heap => heap.track(eventName, eventProperties));
    }
    public addUserProperties(properties: ObjectMap<string | number>): void {
        console.log('HEAP: adding user properties', properties);
        this._evaluteHeapCall(heap => heap.addUserProperties(properties));
    }
    public addEventProperties(properties: ObjectMap<string | number>): void {
        this._evaluteHeapCall(heap => heap.addEventProperties(properties));
    }
    private _evaluteHeapCall(heapFunctionCall: (heap: HeapAnalytics) => void): void {
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
    }
}

export const analytics = Analytics.init();
