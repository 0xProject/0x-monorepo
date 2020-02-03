import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { GIT_SHA, HEAP_ENABLED, INSTANT_DISCHARGE_TARGET, NODE_ENV, NPM_PACKAGE_VERSION } from '../constants';
import {
    AffiliateInfo,
    Asset,
    BaseCurrency,
    Network,
    OrderProcessState,
    OrderSource,
    ProviderState,
    QuoteFetchOrigin,
    WalletSuggestion,
    ZeroExAPIQuoteResponse,
} from '../types';

import { EventProperties, heapUtil } from './heap';

let isDisabledViaConfig = false;
export const disableAnalytics = (shouldDisableAnalytics: boolean) => {
    isDisabledViaConfig = shouldDisableAnalytics;
};
export const evaluateIfEnabled = (fnCall: () => void) => {
    if (isDisabledViaConfig) {
        return;
    }
    if (HEAP_ENABLED) {
        fnCall();
    }
};

enum EventNames {
    InstantOpened = 'Instant - Opened',
    InstantClosed = 'Instant - Closed',
    AccountLocked = 'Account - Locked',
    AccountReady = 'Account - Ready',
    AccountUnlockRequested = 'Account - Unlock Requested',
    AccountUnlockDenied = 'Account - Unlock Denied',
    AccountAddressChanged = 'Account - Address Changed',
    BaseCurrencyChanged = 'Base Currency - Changed',
    PaymentMethodDropdownOpened = 'Payment Method - Dropdown Opened',
    PaymentMethodOpenedEtherscan = 'Payment Method - Opened Etherscan',
    PaymentMethodCopiedAddress = 'Payment Method - Copied Address',
    BuyNotEnoughEth = 'Buy - Not Enough Eth',
    BuyStarted = 'Buy - Started',
    BuySignatureDenied = 'Buy - Signature Denied',
    BuySimulationFailed = 'Buy - Simulation Failed',
    BuyUnknownError = 'Buy - Unknown Error',
    BuyTxSubmitted = 'Buy - Tx Submitted',
    BuyTxSucceeded = 'Buy - Tx Succeeded',
    BuyTxFailed = 'Buy - Tx Failed',
    UsdPriceFetchFailed = 'USD Price - Fetch Failed',
    InstallWalletClicked = 'Install Wallet - Clicked',
    InstallWalletModalOpened = 'Install Wallet - Modal - Opened',
    InstallWalletModalClickedExplanation = 'Install Wallet - Modal - Clicked Explanation',
    InstallWalletModalClickedGet = 'Install Wallet - Modal - Clicked Get',
    InstallWalletModalClosed = 'Install Wallet - Modal - Closed',
    TokenSelectorOpened = 'Token Selector - Opened',
    TokenSelectorClosed = 'Token Selector - Closed',
    TokenSelectorChose = 'Token Selector - Chose',
    TokenSelectorSearched = 'Token Selector - Searched',
    TransactionViewed = 'Transaction - Viewed',
    QuoteFetched = 'Quote - Fetched',
    QuoteError = 'Quote - Error',
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

const quoteEventProperties = (quote: ZeroExAPIQuoteResponse) => {
    return {
        to: quote.to,
        data: quote.data,
        value: quote.value.toString(),
        gasPrice: quote.gasPrice.toString(),
        gas: quote.gas.toString(),
        protocolFee: quote.protocolFee.toString(),
        buyAmount: quote.buyAmount.toString(),
        sellAmount: quote.sellAmount.toString(),
    };
};

export interface AnalyticsUserOptions {
    lastKnownEthAddress?: string;
    lastEthBalanceInUnitAmount?: string;
}
export interface AnalyticsEventOptions {
    embeddedHost?: string;
    embeddedUrl?: string;
    ethBalanceInUnitAmount?: string;
    ethAddress?: string;
    networkId?: number;
    providerName?: string;
    providerDisplayName?: string;
    gitSha?: string;
    npmVersion?: string;
    instantEnvironment?: string;
    orderSource?: string;
    affiliateAddress?: string;
    affiliateFeePercent?: number;
    numberAvailableAssets?: number;
    selectedAssetName?: string;
    selectedAssetSymbol?: string;
    selectedAssetData?: string;
    selectedAssetDecimals?: number;
    baseCurrency?: string;
}
export enum TokenSelectorClosedVia {
    ClickedX = 'Clicked X', // tslint:disable-line:enum-naming
    TokenChose = 'Token Chose',
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
        selectedAsset?: Asset,
        affiliateInfo?: AffiliateInfo,
        baseCurrency?: BaseCurrency,
    ): AnalyticsEventOptions => {
        const affiliateAddress = affiliateInfo ? affiliateInfo.feeRecipient : 'none';
        const affiliateFeePercent = affiliateInfo ? parseFloat(affiliateInfo.feePercentage.toFixed(4)) : 0;
        const orderSourceName = typeof orderSource === 'string' ? orderSource : 'provided';
        const eventOptions: AnalyticsEventOptions = {
            embeddedHost: window.location.host,
            embeddedUrl: window.location.href,
            networkId: network,
            providerName: providerState.name,
            providerDisplayName: providerState.displayName,
            gitSha: GIT_SHA,
            npmVersion: NPM_PACKAGE_VERSION,
            orderSource: orderSourceName,
            affiliateAddress,
            affiliateFeePercent,
            selectedAssetName: selectedAsset ? selectedAsset.metaData.name : 'none',
            selectedAssetData: selectedAsset ? selectedAsset.assetData : 'none',
            instantEnvironment: INSTANT_DISCHARGE_TARGET || `Local ${NODE_ENV}`,
            baseCurrency,
        };
        return eventOptions;
    },
    trackInstantOpened: trackingEventFnWithoutPayload(EventNames.InstantOpened),
    trackInstantClosed: trackingEventFnWithoutPayload(EventNames.InstantClosed),
    trackAccountLocked: trackingEventFnWithoutPayload(EventNames.AccountLocked),
    trackAccountReady: (address: string) => trackingEventFnWithPayload(EventNames.AccountReady)({ address }),
    trackAccountUnlockRequested: trackingEventFnWithoutPayload(EventNames.AccountUnlockRequested),
    trackAccountUnlockDenied: trackingEventFnWithoutPayload(EventNames.AccountUnlockDenied),
    trackAccountAddressChanged: (address: string) =>
        trackingEventFnWithPayload(EventNames.AccountAddressChanged)({ address }),
    trackBaseCurrencyChanged: (currencyChangedTo: BaseCurrency) =>
        trackingEventFnWithPayload(EventNames.BaseCurrencyChanged)({ currencyChangedTo }),
    trackPaymentMethodDropdownOpened: trackingEventFnWithoutPayload(EventNames.PaymentMethodDropdownOpened),
    trackPaymentMethodOpenedEtherscan: trackingEventFnWithoutPayload(EventNames.PaymentMethodOpenedEtherscan),
    trackPaymentMethodCopiedAddress: trackingEventFnWithoutPayload(EventNames.PaymentMethodCopiedAddress),
    trackBuyNotEnoughEth: (quote: ZeroExAPIQuoteResponse) =>
        trackingEventFnWithPayload(EventNames.BuyNotEnoughEth)(quoteEventProperties(quote)),
    trackBuyStarted: (quote: ZeroExAPIQuoteResponse) =>
        trackingEventFnWithPayload(EventNames.BuyStarted)(quoteEventProperties(quote)),
    trackBuySignatureDenied: (quote: ZeroExAPIQuoteResponse) =>
        trackingEventFnWithPayload(EventNames.BuySignatureDenied)(quoteEventProperties(quote)),
    trackBuySimulationFailed: (quote: ZeroExAPIQuoteResponse) =>
        trackingEventFnWithPayload(EventNames.BuySimulationFailed)(quoteEventProperties(quote)),
    trackBuyUnknownError: (quote: ZeroExAPIQuoteResponse, errorMessage: string) =>
        trackingEventFnWithPayload(EventNames.BuyUnknownError)({
            ...quoteEventProperties(quote),
            errorMessage,
        }),
    trackBuyTxSubmitted: (
        quote: ZeroExAPIQuoteResponse,
        txHash: string,
        startTimeUnix: number,
        expectedEndTimeUnix: number,
    ) =>
        trackingEventFnWithPayload(EventNames.BuyTxSubmitted)({
            ...quoteEventProperties(quote),
            txHash,
            expectedTxTimeMs: expectedEndTimeUnix - startTimeUnix,
        }),
    trackBuyTxSucceeded: (
        quote: ZeroExAPIQuoteResponse,
        txHash: string,
        startTimeUnix: number,
        expectedEndTimeUnix: number,
    ) =>
        trackingEventFnWithPayload(EventNames.BuyTxSucceeded)({
            ...quoteEventProperties(quote),
            txHash,
            expectedTxTimeMs: expectedEndTimeUnix - startTimeUnix,
            actualTxTimeMs: new Date().getTime() - startTimeUnix,
        }),
    trackBuyTxFailed: (
        quote: ZeroExAPIQuoteResponse,
        txHash: string,
        startTimeUnix: number,
        expectedEndTimeUnix: number,
    ) =>
        trackingEventFnWithPayload(EventNames.BuyTxFailed)({
            ...quoteEventProperties(quote),
            txHash,
            expectedTxTimeMs: expectedEndTimeUnix - startTimeUnix,
            actualTxTimeMs: new Date().getTime() - startTimeUnix,
        }),
    trackInstallWalletClicked: (walletSuggestion: WalletSuggestion) =>
        trackingEventFnWithPayload(EventNames.InstallWalletClicked)({ walletSuggestion }),
    trackInstallWalletModalClickedExplanation: trackingEventFnWithoutPayload(
        EventNames.InstallWalletModalClickedExplanation,
    ),
    trackInstallWalletModalClickedGet: trackingEventFnWithoutPayload(EventNames.InstallWalletModalClickedGet),
    trackInstallWalletModalOpened: trackingEventFnWithoutPayload(EventNames.InstallWalletModalOpened),
    trackInstallWalletModalClosed: trackingEventFnWithoutPayload(EventNames.InstallWalletModalClosed),
    trackTokenSelectorOpened: trackingEventFnWithoutPayload(EventNames.TokenSelectorOpened),
    trackTokenSelectorClosed: (closedVia: TokenSelectorClosedVia) =>
        trackingEventFnWithPayload(EventNames.TokenSelectorClosed)({ closedVia }),
    trackTokenSelectorChose: (payload: { assetName: string; assetData: string }) =>
        trackingEventFnWithPayload(EventNames.TokenSelectorChose)(payload),
    trackTokenSelectorSearched: (searchText: string) =>
        trackingEventFnWithPayload(EventNames.TokenSelectorSearched)({ searchText }),
    trackTransactionViewed: (orderProcesState: OrderProcessState) =>
        trackingEventFnWithPayload(EventNames.TransactionViewed)({ orderState: orderProcesState }),
    trackQuoteFetched: (quote: ZeroExAPIQuoteResponse, fetchOrigin: QuoteFetchOrigin) =>
        trackingEventFnWithPayload(EventNames.QuoteFetched)({
            ...quoteEventProperties(quote),
            fetchOrigin,
        }),
    trackQuoteError: (errorMessage: string, makerAssetFillAmount: BigNumber, fetchOrigin: QuoteFetchOrigin) => {
        trackingEventFnWithPayload(EventNames.QuoteError)({
            errorMessage,
            makerAssetFillAmount: makerAssetFillAmount.toString(),
            fetchOrigin,
        });
    },
    trackUsdPriceFailed: trackingEventFnWithoutPayload(EventNames.UsdPriceFetchFailed),
};
