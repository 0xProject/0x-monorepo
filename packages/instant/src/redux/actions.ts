import { MarketBuySwapQuote } from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';

import { ActionsUnion, AddressAndEthBalanceInWei, Asset, BaseCurrency, StandardSlidingPanelContent } from '../types';

export interface PlainAction<T extends string> {
    type: T;
}

export interface ActionWithPayload<T extends string, P> extends PlainAction<T> {
    data: P;
}

export type Action = ActionsUnion<typeof actions>;

function createAction<T extends string>(type: T): PlainAction<T>;
function createAction<T extends string, P>(type: T, data: P): ActionWithPayload<T, P>;
function createAction<T extends string, P>(type: T, data?: P): PlainAction<T> | ActionWithPayload<T, P> {
    return data === undefined ? { type } : { type, data };
}

export enum ActionTypes {
    SetAccountStateLoading = 'SET_ACCOUNT_STATE_LOADING',
    SetAccountStateLocked = 'SET_ACCOUNT_STATE_LOCKED',
    SetAccountStateReady = 'SET_ACCOUNT_STATE_READY',
    UpdateAccountEthBalance = 'UPDATE_ACCOUNT_ETH_BALANCE',
    UpdateEthUsdPrice = 'UPDATE_ETH_USD_PRICE',
    UpdateSelectedAssetUnitAmount = 'UPDATE_SELECTED_ASSET_UNIT_AMOUNT',
    SetSwapOrderStateNone = 'SET_SWAP_ORDER_STATE_NONE',
    SetSwapOrderStateValidating = 'SET_SWAP_ORDER_STATE_VALIDATING',
    SetSwapOrderStateProcessing = 'SET_SWAP_ORDER_STATE_PROCESSING',
    SetSwapOrderStateFailure = 'SET_SWAP_ORDER_STATE_FAILURE',
    SetSwapOrderStateSuccess = 'SET_SWAP_ORDER_STATE_SUCCESS',
    UpdateLatestSwapQuote = 'UPDATE_LATEST_SWAP_QUOTE',
    UpdateSelectedAsset = 'UPDATE_SELECTED_ASSET',
    SetAvailableAssets = 'SET_AVAILABLE_ASSETS',
    SetQuoteRequestStatePending = 'SET_QUOTE_REQUEST_STATE_PENDING',
    SetQuoteRequestStateFailure = 'SET_QUOTE_REQUEST_STATE_FAILURE',
    SetErrorMessage = 'SET_ERROR_MESSAGE',
    HideError = 'HIDE_ERROR',
    ClearError = 'CLEAR_ERROR',
    ResetAmount = 'RESET_AMOUNT',
    OpenStandardSlidingPanel = 'OPEN_STANDARD_SLIDING_PANEL',
    CloseStandardSlidingPanel = 'CLOSE_STANDARD_SLIDING_PANEL',
    UpdateBaseCurrency = 'UPDATE_BASE_CURRENCY',
}

export const actions = {
    setAccountStateLoading: () => createAction(ActionTypes.SetAccountStateLoading),
    setAccountStateLocked: () => createAction(ActionTypes.SetAccountStateLocked),
    setAccountStateReady: (address: string) => createAction(ActionTypes.SetAccountStateReady, address),
    updateAccountEthBalance: (addressAndBalance: AddressAndEthBalanceInWei) =>
        createAction(ActionTypes.UpdateAccountEthBalance, addressAndBalance),
    updateEthUsdPrice: (price?: BigNumber) => createAction(ActionTypes.UpdateEthUsdPrice, price),
    updateSelectedAssetAmount: (amount?: BigNumber) => createAction(ActionTypes.UpdateSelectedAssetUnitAmount, amount),
    setSwapOrderStateNone: () => createAction(ActionTypes.SetSwapOrderStateNone),
    setSwapOrderStateValidating: () => createAction(ActionTypes.SetSwapOrderStateValidating),
    setSwapOrderStateProcessing: (txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) =>
        createAction(ActionTypes.SetSwapOrderStateProcessing, { txHash, startTimeUnix, expectedEndTimeUnix }),
    setSwapOrderStateFailure: (txHash: string) => createAction(ActionTypes.SetSwapOrderStateFailure, txHash),
    setSwapOrderStateSuccess: (txHash: string) => createAction(ActionTypes.SetSwapOrderStateSuccess, txHash),
    updateLatestSwapQuote: (swapQuote?: MarketBuySwapQuote) => createAction(ActionTypes.UpdateLatestSwapQuote, swapQuote),
    updateSelectedAsset: (asset: Asset) => createAction(ActionTypes.UpdateSelectedAsset, asset),
    setAvailableAssets: (availableAssets: Asset[]) => createAction(ActionTypes.SetAvailableAssets, availableAssets),
    setQuoteRequestStatePending: () => createAction(ActionTypes.SetQuoteRequestStatePending),
    setQuoteRequestStateFailure: () => createAction(ActionTypes.SetQuoteRequestStateFailure),
    setErrorMessage: (errorMessage: string) => createAction(ActionTypes.SetErrorMessage, errorMessage),
    hideError: () => createAction(ActionTypes.HideError),
    clearError: () => createAction(ActionTypes.ClearError),
    resetAmount: () => createAction(ActionTypes.ResetAmount),
    openStandardSlidingPanel: (content: StandardSlidingPanelContent) =>
        createAction(ActionTypes.OpenStandardSlidingPanel, content),
    closeStandardSlidingPanel: () => createAction(ActionTypes.CloseStandardSlidingPanel),
    updateBaseCurrency: (baseCurrency: BaseCurrency) => createAction(ActionTypes.UpdateBaseCurrency, baseCurrency),
};
