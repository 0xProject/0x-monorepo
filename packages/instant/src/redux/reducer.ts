import { BuyQuote } from '@0x/asset-buyer';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { zrxAssetData } from '../constants';
import { AsyncProcessState } from '../types';

import { Action, ActionTypes } from './actions';

export enum LatestErrorDisplay {
    Present,
    Hidden,
}
export interface State {
    selectedAssetData?: string;
    selectedAssetAmount?: BigNumber;
    buyOrderState: AsyncProcessState;
    ethUsdPrice?: BigNumber;
    latestBuyQuote?: BuyQuote;
    quoteRequestState: AsyncProcessState;
    latestError?: any;
    latestErrorDisplay: LatestErrorDisplay;
}

export const INITIAL_STATE: State = {
    // TODO: Remove hardcoded zrxAssetData
    selectedAssetData: zrxAssetData,
    selectedAssetAmount: undefined,
    buyOrderState: AsyncProcessState.NONE,
    ethUsdPrice: undefined,
    latestBuyQuote: undefined,
    latestError: undefined,
    latestErrorDisplay: LatestErrorDisplay.Hidden,
    quoteRequestState: AsyncProcessState.NONE,
};

export const reducer = (state: State = INITIAL_STATE, action: Action): State => {
    switch (action.type) {
        case ActionTypes.UPDATE_ETH_USD_PRICE:
            return {
                ...state,
                ethUsdPrice: action.data,
            };
        case ActionTypes.UPDATE_SELECTED_ASSET_AMOUNT:
            return {
                ...state,
                selectedAssetAmount: action.data,
            };
        case ActionTypes.UPDATE_LATEST_BUY_QUOTE:
            return {
                ...state,
                latestBuyQuote: action.data,
                quoteRequestState: AsyncProcessState.SUCCESS,
            };
        case ActionTypes.UPDATE_BUY_QUOTE_STATE_PENDING:
            return {
                ...state,
                latestBuyQuote: undefined,
                quoteRequestState: AsyncProcessState.PENDING,
            };
        case ActionTypes.UPDATE_BUY_QUOTE_STATE_FAILURE:
            return {
                ...state,
                latestBuyQuote: undefined,
                quoteRequestState: AsyncProcessState.FAILURE,
            };
        case ActionTypes.UPDATE_SELECTED_ASSET_BUY_STATE:
            return {
                ...state,
                buyOrderState: action.data,
            };
        case ActionTypes.SET_ERROR:
            return {
                ...state,
                latestError: action.data,
                latestErrorDisplay: LatestErrorDisplay.Present,
            };
        case ActionTypes.HIDE_ERROR:
            return {
                ...state,
                latestErrorDisplay: LatestErrorDisplay.Hidden,
            };
        case ActionTypes.CLEAR_ERROR:
            return {
                ...state,
                latestError: undefined,
                latestErrorDisplay: LatestErrorDisplay.Hidden,
            };
        default:
            return state;
    }
};
