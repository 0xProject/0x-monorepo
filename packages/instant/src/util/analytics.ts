import { EventProperties, heapUtil } from './heap';

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
    TOKEN_SELECTOR_OPENED = 'Token Selector - Opened',
    TOKEN_SELECTOR_CLOSED = 'Token Selector - Closed',
    TOKEN_SELECTOR_CHOSE = 'Token Selector - Chose',
    TOKEN_SELECTOR_SEARCHED = 'Token Selector - Searched',
}
const track = (eventName: EventNames, eventProperties: EventProperties = {}): void => {
    evaluateIfEnabled(() => {
        heapUtil.evaluateHeapCall(heap => heap.track(eventName, eventProperties));
    });
};
function trackingEventFnWithoutPayload(eventName: EventNames): () => void {
    return () => {
        track(eventName);
    };
}
// tslint:disable-next-line:no-unused-variable
function trackingEventFnWithPayload(eventName: EventNames): (eventProperties: EventProperties) => void {
    return (eventProperties: EventProperties) => {
        track(eventName, eventProperties);
    };
}

export interface AnalyticsUserOptions {
    lastKnownEthAddress?: string;
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
    trackTokenSelectorOpened: trackingEventFnWithoutPayload(EventNames.TOKEN_SELECTOR_OPENED),
    trackTokenSelectorClosed: trackingEventFnWithoutPayload(EventNames.TOKEN_SELECTOR_CLOSED),
    trackTokenSelectorChose: (payload: { assetName: string; assetData: string }) =>
        trackingEventFnWithPayload(EventNames.TOKEN_SELECTOR_CHOSE)(payload),
    trackTokenSelectorSearched: (searchText: string) =>
        trackingEventFnWithPayload(EventNames.TOKEN_SELECTOR_SEARCHED)({ searchText }),
};
