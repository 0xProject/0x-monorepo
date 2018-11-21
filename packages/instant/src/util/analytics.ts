import { ObjectMap } from '@0x/types';

import { heapUtil } from './heap';

let isDisabled = false;
export const disableAnalytics = (shouldDisableAnalytics: boolean) => {
    isDisabled = shouldDisableAnalytics;
};
export const evaluateIfEnabled = (fnCall: () => void) => {
    if (isDisabled) {
        return;
    }
    fnCall();
};

enum EventNames {
    INSTANT_OPENED = 'Instant - Opened',
    ACCOUNT_LOCKED = 'Account - Locked',
    ACCOUNT_READY = 'Account - Ready',
    ACCOUNT_UNLOCK_REQUESTED = 'Account - Unlock Requested',
    ACCOUNT_UNLOCK_DENIED = 'Account - Unlock Denied',
    ACCOUNT_ADDRESS_CHANGED = 'Account - Address Changed',
}
const track = (eventName: EventNames, eventData: ObjectMap<string | number> = {}): void => {
    evaluateIfEnabled(() => {
        heapUtil.evaluateHeapCall(heap => heap.track(eventName, eventData));
    });
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
        evaluateIfEnabled(() => {
            heapUtil.evaluateHeapCall(heap => heap.addUserProperties(properties));
        });
    },
    addEventProperties: (properties: AnalyticsEventOptions): void => {
        evaluateIfEnabled(() => {
            heapUtil.evaluateHeapCall(heap => heap.addEventProperties(properties));
        });
    },
    trackInstantOpened: trackingEventFnWithoutPayload(EventNames.INSTANT_OPENED),
    trackAccountLocked: trackingEventFnWithoutPayload(EventNames.ACCOUNT_LOCKED),
    trackAccountReady: (address: string) => trackingEventFnWithPayload(EventNames.ACCOUNT_READY)({ address }),
    trackAccountUnlockRequested: trackingEventFnWithoutPayload(EventNames.ACCOUNT_UNLOCK_REQUESTED),
    trackAccountUnlockDenied: trackingEventFnWithoutPayload(EventNames.ACCOUNT_UNLOCK_DENIED),
    trackAccountAddressChanged: (address: string) =>
        trackingEventFnWithPayload(EventNames.ACCOUNT_ADDRESS_CHANGED)({ address }),
};
