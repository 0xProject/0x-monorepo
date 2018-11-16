import { ObjectMap } from '@0x/types';

import { heapUtil } from './heap';

enum EventNames {
    WALLET_OPENED = 'Wallet - Opened',
    WALLET_READY = 'Wallet - Ready',
    WIDGET_OPENED = 'Widget - Opened',
}
const track = (eventName: EventNames, eventData: ObjectMap<string | number> = {}): void => {
    heapUtil.evaluateHeapCall(heap => heap.track(eventName, eventData));
};
function trackingEventFnWithoutPayload(eventName: EventNames): () => void {
    return () => {
        track(eventName);
    };
}
function trackingEventFnWithPayload<T extends ObjectMap<string | number>>(
    eventName: EventNames,
): (eventDataProperties: T) => void {
    return (eventDataProperties: T) => {
        track(eventName, eventDataProperties);
    };
}

export const analytics = {
    // TODO(sk): make these more specific
    addUserProperties: (properties: ObjectMap<string | number>): void => {
        heapUtil.evaluateHeapCall(heap => heap.addUserProperties(properties));
    },
    addEventProperties: (properties: ObjectMap<string | number>): void => {
        heapUtil.evaluateHeapCall(heap => heap.addEventProperties(properties));
    },
    walletOpened: trackingEventFnWithoutPayload(EventNames.WALLET_OPENED),
    walletReady: trackingEventFnWithPayload<{ numAssetsAvailable: number }>(EventNames.WALLET_READY),
    widgetOpened: trackingEventFnWithoutPayload(EventNames.WIDGET_OPENED),
};
