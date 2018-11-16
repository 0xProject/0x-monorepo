import { ObjectMap } from '@0x/types';

import { heapUtil } from './heap';

enum EventNames {
    INSTANT_OPENED = 'Instant - Opened',
    WALLET_READY = 'Wallet - Ready',
}
const track = (eventName: EventNames, eventData: ObjectMap<string | number> = {}): void => {
    heapUtil.evaluateHeapCall(heap => heap.track(eventName, eventData));
};
function trackingEventFnWithoutPayload(eventName: EventNames): () => void {
    return () => {
        track(eventName);
    };
}
// tslint:disable-next-line:no-unused-variable
function trackingEventFnWithPayload<T extends ObjectMap<string | number>>(
    eventName: EventNames,
): (eventDataProperties: T) => void {
    return (eventDataProperties: T) => {
        track(eventName, eventDataProperties);
    };
}

export interface AnalyticsUserOptions {
    ethAddress?: string;
    ethBalanceInUnitAmount?: string;
}
export interface AnalyticsEventOptions {
    embeddedHost?: string;
    embeddedUrl?: string;
    networkId?: number;
    providerName?: string;
    gitSha?: string;
    npmVersion?: string;
}
export const analytics = {
    addUserProperties: (properties: AnalyticsUserOptions): void => {
        heapUtil.evaluateHeapCall(heap => heap.addUserProperties(properties));
    },
    addEventProperties: (properties: AnalyticsEventOptions): void => {
        heapUtil.evaluateHeapCall(heap => heap.addEventProperties(properties));
    },
    trackWalletReady: trackingEventFnWithoutPayload(EventNames.WALLET_READY),
    trackInstantOpened: trackingEventFnWithoutPayload(EventNames.INSTANT_OPENED),
};
