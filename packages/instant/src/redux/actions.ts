import { BuyQuote } from '@0xproject/asset-buyer';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { ActionsUnion, AsyncProcessState } from '../types';

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
    UPDATE_ETH_USD_PRICE = 'UPDATE_ETH_USD_PRICE',
    UPDATE_SELECTED_ASSET_AMOUNT = 'UPDATE_SELECTED_ASSET_AMOUNT',
    UPDATE_SELECTED_ASSET_BUY_STATE = 'UPDATE_SELECTED_ASSET_BUY_STATE',
    UPDATE_LATEST_BUY_QUOTE = 'UPDATE_LATEST_BUY_QUOTE',
    UPDATE_BUY_QUOTE_STATE_PENDING = 'UPDATE_BUY_QUOTE_STATE_PENDING',
    UPDATE_BUY_QUOTE_STATE_FAILURE = 'UPDATE_BUY_QUOTE_STATE_FAILURE',
    SET_ERROR = 'SET_ERROR',
    HIDE_ERROR = 'HIDE_ERROR',
    CLEAR_ERROR = 'CLEAR_ERROR',
}

export const actions = {
    updateEthUsdPrice: (price?: BigNumber) => createAction(ActionTypes.UPDATE_ETH_USD_PRICE, price),
    updateSelectedAssetAmount: (amount?: BigNumber) => createAction(ActionTypes.UPDATE_SELECTED_ASSET_AMOUNT, amount),
    updateSelectedAssetBuyState: (buyState: AsyncProcessState) =>
        createAction(ActionTypes.UPDATE_SELECTED_ASSET_BUY_STATE, buyState),
    updateLatestBuyQuote: (buyQuote?: BuyQuote) => createAction(ActionTypes.UPDATE_LATEST_BUY_QUOTE, buyQuote),
    updateBuyQuoteStatePending: () => createAction(ActionTypes.UPDATE_BUY_QUOTE_STATE_PENDING),
    updateBuyQuoteStateFailure: () => createAction(ActionTypes.UPDATE_BUY_QUOTE_STATE_FAILURE),
    setError: (error?: any) => createAction(ActionTypes.SET_ERROR, error),
    hideError: () => createAction(ActionTypes.HIDE_ERROR),
    clearError: () => createAction(ActionTypes.CLEAR_ERROR),
};
