import { ObjectMap } from '@0x/types';

import { AffiliateInfo, Network, OrderSource, ProviderState } from '../types';

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
    WALLET_READY = 'Wallet - Ready',
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
    orderSource?: string;
    affiliateAddress?: string;
    affiliateFeePercent?: number;
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
    generateEventProperties: (
        network: Network,
        orderSource: OrderSource,
        providerState: ProviderState,
        window: Window,
        affiliateInfo?: AffiliateInfo,
    ): AnalyticsEventOptions => {
        const affiliateAddress = affiliateInfo ? affiliateInfo.feeRecipient : 'none';
        const affiliateFeePercent = affiliateInfo ? parseFloat(affiliateInfo.feePercentage.toFixed(4)) : 0;
        const orderSourceName = typeof orderSource === 'string' ? orderSource : 'provided';
        return {
            embeddedHost: window.location.host,
            embeddedUrl: window.location.href,
            networkId: network,
            providerName: providerState.name,
            gitSha: process.env.GIT_SHA,
            npmVersion: process.env.NPM_PACKAGE_VERSION,
            orderSource: orderSourceName,
            affiliateAddress,
            affiliateFeePercent,
        };
    },
    trackWalletReady: trackingEventFnWithoutPayload(EventNames.WALLET_READY),
    trackInstantOpened: trackingEventFnWithoutPayload(EventNames.INSTANT_OPENED),
};
