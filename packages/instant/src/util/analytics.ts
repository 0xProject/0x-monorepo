import { BuyQuote } from '@0x/asset-buyer';
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
    INSTANT_OPENED = 'Instant - Opened',
    INSTANT_CLOSED = 'Instant - Closed',
    ACCOUNT_LOCKED = 'Account - Locked',
    ACCOUNT_READY = 'Account - Ready',
    ACCOUNT_UNLOCK_REQUESTED = 'Account - Unlock Requested',
    ACCOUNT_UNLOCK_DENIED = 'Account - Unlock Denied',
    ACCOUNT_ADDRESS_CHANGED = 'Account - Address Changed',
    BASE_CURRENCY_CHANGED = 'Base Currency - Changed',
    PAYMENT_METHOD_DROPDOWN_OPENED = 'Payment Method - Dropdown Opened',
    PAYMENT_METHOD_OPENED_ETHERSCAN = 'Payment Method - Opened Etherscan',
    PAYMENT_METHOD_COPIED_ADDRESS = 'Payment Method - Copied Address',
    BUY_NOT_ENOUGH_ETH = 'Buy - Not Enough Eth',
    BUY_STARTED = 'Buy - Started',
    BUY_SIGNATURE_DENIED = 'Buy - Signature Denied',
    BUY_SIMULATION_FAILED = 'Buy - Simulation Failed',
    BUY_UNKNOWN_ERROR = 'Buy - Unknown Error',
    BUY_TX_SUBMITTED = 'Buy - Tx Submitted',
    BUY_TX_SUCCEEDED = 'Buy - Tx Succeeded',
    BUY_TX_FAILED = 'Buy - Tx Failed',
    USD_PRICE_FETCH_FAILED = 'USD Price - Fetch Failed',
    INSTALL_WALLET_CLICKED = 'Install Wallet - Clicked',
    INSTALL_WALLET_MODAL_OPENED = 'Install Wallet - Modal - Opened',
    INSTALL_WALLET_MODAL_CLICKED_EXPLANATION = 'Install Wallet - Modal - Clicked Explanation',
    INSTALL_WALLET_MODAL_CLICKED_GET = 'Install Wallet - Modal - Clicked Get',
    INSTALL_WALLET_MODAL_CLOSED = 'Install Wallet - Modal - Closed',
    TOKEN_SELECTOR_OPENED = 'Token Selector - Opened',
    TOKEN_SELECTOR_CLOSED = 'Token Selector - Closed',
    TOKEN_SELECTOR_CHOSE = 'Token Selector - Chose',
    TOKEN_SELECTOR_SEARCHED = 'Token Selector - Searched',
    TRANSACTION_VIEWED = 'Transaction - Viewed',
    QUOTE_FETCHED = 'Quote - Fetched',
    QUOTE_ERROR = 'Quote - Error',
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

const buyQuoteEventProperties = (buyQuote: BuyQuote) => {
    const assetBuyAmount = buyQuote.assetBuyAmount.toString();
    const assetEthAmount = buyQuote.worstCaseQuoteInfo.assetEthAmount.toString();
    const feeEthAmount = buyQuote.worstCaseQuoteInfo.feeEthAmount.toString();
    const totalEthAmount = buyQuote.worstCaseQuoteInfo.totalEthAmount.toString();
    const feePercentage = !_.isUndefined(buyQuote.feePercentage) ? buyQuote.feePercentage.toString() : 0;
    const hasFeeOrders = !_.isEmpty(buyQuote.feeOrders) ? 'true' : 'false';
    return {
        assetBuyAmount,
        assetEthAmount,
        feeEthAmount,
        totalEthAmount,
        feePercentage,
        hasFeeOrders,
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
    ClickedX = 'Clicked X',
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
    trackInstantOpened: trackingEventFnWithoutPayload(EventNames.INSTANT_OPENED),
    trackInstantClosed: trackingEventFnWithoutPayload(EventNames.INSTANT_CLOSED),
    trackAccountLocked: trackingEventFnWithoutPayload(EventNames.ACCOUNT_LOCKED),
    trackAccountReady: (address: string) => trackingEventFnWithPayload(EventNames.ACCOUNT_READY)({ address }),
    trackAccountUnlockRequested: trackingEventFnWithoutPayload(EventNames.ACCOUNT_UNLOCK_REQUESTED),
    trackAccountUnlockDenied: trackingEventFnWithoutPayload(EventNames.ACCOUNT_UNLOCK_DENIED),
    trackAccountAddressChanged: (address: string) =>
        trackingEventFnWithPayload(EventNames.ACCOUNT_ADDRESS_CHANGED)({ address }),
    trackBaseCurrencyChanged: (currencyChangedTo: BaseCurrency) =>
        trackingEventFnWithPayload(EventNames.BASE_CURRENCY_CHANGED)({ currencyChangedTo }),
    trackPaymentMethodDropdownOpened: trackingEventFnWithoutPayload(EventNames.PAYMENT_METHOD_DROPDOWN_OPENED),
    trackPaymentMethodOpenedEtherscan: trackingEventFnWithoutPayload(EventNames.PAYMENT_METHOD_OPENED_ETHERSCAN),
    trackPaymentMethodCopiedAddress: trackingEventFnWithoutPayload(EventNames.PAYMENT_METHOD_COPIED_ADDRESS),
    trackBuyNotEnoughEth: (buyQuote: BuyQuote) =>
        trackingEventFnWithPayload(EventNames.BUY_NOT_ENOUGH_ETH)(buyQuoteEventProperties(buyQuote)),
    trackBuyStarted: (buyQuote: BuyQuote) =>
        trackingEventFnWithPayload(EventNames.BUY_STARTED)(buyQuoteEventProperties(buyQuote)),
    trackBuySignatureDenied: (buyQuote: BuyQuote) =>
        trackingEventFnWithPayload(EventNames.BUY_SIGNATURE_DENIED)(buyQuoteEventProperties(buyQuote)),
    trackBuySimulationFailed: (buyQuote: BuyQuote) =>
        trackingEventFnWithPayload(EventNames.BUY_SIMULATION_FAILED)(buyQuoteEventProperties(buyQuote)),
    trackBuyUnknownError: (buyQuote: BuyQuote, errorMessage: string) =>
        trackingEventFnWithPayload(EventNames.BUY_UNKNOWN_ERROR)({
            ...buyQuoteEventProperties(buyQuote),
            errorMessage,
        }),
    trackBuyTxSubmitted: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) =>
        trackingEventFnWithPayload(EventNames.BUY_TX_SUBMITTED)({
            ...buyQuoteEventProperties(buyQuote),
            txHash,
            expectedTxTimeMs: expectedEndTimeUnix - startTimeUnix,
        }),
    trackBuyTxSucceeded: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) =>
        trackingEventFnWithPayload(EventNames.BUY_TX_SUCCEEDED)({
            ...buyQuoteEventProperties(buyQuote),
            txHash,
            expectedTxTimeMs: expectedEndTimeUnix - startTimeUnix,
            actualTxTimeMs: new Date().getTime() - startTimeUnix,
        }),
    trackBuyTxFailed: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) =>
        trackingEventFnWithPayload(EventNames.BUY_TX_FAILED)({
            ...buyQuoteEventProperties(buyQuote),
            txHash,
            expectedTxTimeMs: expectedEndTimeUnix - startTimeUnix,
            actualTxTimeMs: new Date().getTime() - startTimeUnix,
        }),
    trackInstallWalletClicked: (walletSuggestion: WalletSuggestion) =>
        trackingEventFnWithPayload(EventNames.INSTALL_WALLET_CLICKED)({ walletSuggestion }),
    trackInstallWalletModalClickedExplanation: trackingEventFnWithoutPayload(
        EventNames.INSTALL_WALLET_MODAL_CLICKED_EXPLANATION,
    ),
    trackInstallWalletModalClickedGet: trackingEventFnWithoutPayload(EventNames.INSTALL_WALLET_MODAL_CLICKED_GET),
    trackInstallWalletModalOpened: trackingEventFnWithoutPayload(EventNames.INSTALL_WALLET_MODAL_OPENED),
    trackInstallWalletModalClosed: trackingEventFnWithoutPayload(EventNames.INSTALL_WALLET_MODAL_CLOSED),
    trackTokenSelectorOpened: trackingEventFnWithoutPayload(EventNames.TOKEN_SELECTOR_OPENED),
    trackTokenSelectorClosed: (closedVia: TokenSelectorClosedVia) =>
        trackingEventFnWithPayload(EventNames.TOKEN_SELECTOR_CLOSED)({ closedVia }),
    trackTokenSelectorChose: (payload: { assetName: string; assetData: string }) =>
        trackingEventFnWithPayload(EventNames.TOKEN_SELECTOR_CHOSE)(payload),
    trackTokenSelectorSearched: (searchText: string) =>
        trackingEventFnWithPayload(EventNames.TOKEN_SELECTOR_SEARCHED)({ searchText }),
    trackTransactionViewed: (orderProcesState: OrderProcessState) =>
        trackingEventFnWithPayload(EventNames.TRANSACTION_VIEWED)({ orderState: orderProcesState }),
    trackQuoteFetched: (buyQuote: BuyQuote, fetchOrigin: QuoteFetchOrigin) =>
        trackingEventFnWithPayload(EventNames.QUOTE_FETCHED)({
            ...buyQuoteEventProperties(buyQuote),
            fetchOrigin,
        }),
    trackQuoteError: (errorMessage: string, assetBuyAmount: BigNumber, fetchOrigin: QuoteFetchOrigin) => {
        trackingEventFnWithPayload(EventNames.QUOTE_ERROR)({
            errorMessage,
            assetBuyAmount: assetBuyAmount.toString(),
            fetchOrigin,
        });
    },
    trackUsdPriceFailed: trackingEventFnWithoutPayload(EventNames.USD_PRICE_FETCH_FAILED),
};
