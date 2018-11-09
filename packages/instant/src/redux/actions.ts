import { BuyQuote } from '@0x/asset-buyer';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { ActionsUnion, AddressAndEthBalanceInWei, Asset } from '../types';

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
    return _.isUndefined(data) ? { type } : { type, data };
}

export enum ActionTypes {
    SET_ACCOUNT_STATE_LOADING = 'SET_ACCOUNT_STATE_LOADING',
    SET_ACCOUNT_STATE_LOCKED = 'SET_ACCOUNT_STATE_LOCKED',
    SET_ACCOUNT_STATE_ERROR = 'SET_ACCOUNT_STATE_ERROR',
    SET_ACCOUNT_STATE_READY = 'SET_ACCOUNT_STATE_READY',
    UPDATE_ACCOUNT_ETH_BALANCE = 'UPDATE_ACCOUNT_ETH_BALANCE',
    UPDATE_ETH_USD_PRICE = 'UPDATE_ETH_USD_PRICE',
    UPDATE_SELECTED_ASSET_AMOUNT = 'UPDATE_SELECTED_ASSET_AMOUNT',
    SET_BUY_ORDER_STATE_NONE = 'SET_BUY_ORDER_STATE_NONE',
    SET_BUY_ORDER_STATE_VALIDATING = 'SET_BUY_ORDER_STATE_VALIDATING',
    SET_BUY_ORDER_STATE_PROCESSING = 'SET_BUY_ORDER_STATE_PROCESSING',
    SET_BUY_ORDER_STATE_FAILURE = 'SET_BUY_ORDER_STATE_FAILURE',
    SET_BUY_ORDER_STATE_SUCCESS = 'SET_BUY_ORDER_STATE_SUCCESS',
    UPDATE_LATEST_BUY_QUOTE = 'UPDATE_LATEST_BUY_QUOTE',
    UPDATE_SELECTED_ASSET = 'UPDATE_SELECTED_ASSET',
    SET_AVAILABLE_ASSETS = 'SET_AVAILABLE_ASSETS',
    SET_QUOTE_REQUEST_STATE_PENDING = 'SET_QUOTE_REQUEST_STATE_PENDING',
    SET_QUOTE_REQUEST_STATE_FAILURE = 'SET_QUOTE_REQUEST_STATE_FAILURE',
    SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE',
    HIDE_ERROR = 'HIDE_ERROR',
    CLEAR_ERROR = 'CLEAR_ERROR',
    RESET_AMOUNT = 'RESET_AMOUNT',
}

export const actions = {
    setAccountStateLoading: () => createAction(ActionTypes.SET_ACCOUNT_STATE_LOADING),
    setAccountStateLocked: () => createAction(ActionTypes.SET_ACCOUNT_STATE_LOCKED),
    setAccountStateError: () => createAction(ActionTypes.SET_ACCOUNT_STATE_ERROR),
    setAccountStateReady: (address: string) => createAction(ActionTypes.SET_ACCOUNT_STATE_READY, address),
    updateAccountEthBalance: (addressAndBalance: AddressAndEthBalanceInWei) =>
        createAction(ActionTypes.UPDATE_ACCOUNT_ETH_BALANCE, addressAndBalance),
    updateEthUsdPrice: (price?: BigNumber) => createAction(ActionTypes.UPDATE_ETH_USD_PRICE, price),
    updateSelectedAssetAmount: (amount?: BigNumber) => createAction(ActionTypes.UPDATE_SELECTED_ASSET_AMOUNT, amount),
    setBuyOrderStateNone: () => createAction(ActionTypes.SET_BUY_ORDER_STATE_NONE),
    setBuyOrderStateValidating: () => createAction(ActionTypes.SET_BUY_ORDER_STATE_VALIDATING),
    setBuyOrderStateProcessing: (txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) =>
        createAction(ActionTypes.SET_BUY_ORDER_STATE_PROCESSING, { txHash, startTimeUnix, expectedEndTimeUnix }),
    setBuyOrderStateFailure: (txHash: string) => createAction(ActionTypes.SET_BUY_ORDER_STATE_FAILURE, txHash),
    setBuyOrderStateSuccess: (txHash: string) => createAction(ActionTypes.SET_BUY_ORDER_STATE_SUCCESS, txHash),
    updateLatestBuyQuote: (buyQuote?: BuyQuote) => createAction(ActionTypes.UPDATE_LATEST_BUY_QUOTE, buyQuote),
    updateSelectedAsset: (asset: Asset) => createAction(ActionTypes.UPDATE_SELECTED_ASSET, asset),
    setAvailableAssets: (availableAssets: Asset[]) => createAction(ActionTypes.SET_AVAILABLE_ASSETS, availableAssets),
    setQuoteRequestStatePending: () => createAction(ActionTypes.SET_QUOTE_REQUEST_STATE_PENDING),
    setQuoteRequestStateFailure: () => createAction(ActionTypes.SET_QUOTE_REQUEST_STATE_FAILURE),
    setErrorMessage: (errorMessage: string) => createAction(ActionTypes.SET_ERROR_MESSAGE, errorMessage),
    hideError: () => createAction(ActionTypes.HIDE_ERROR),
    clearError: () => createAction(ActionTypes.CLEAR_ERROR),
    resetAmount: () => createAction(ActionTypes.RESET_AMOUNT),
};
