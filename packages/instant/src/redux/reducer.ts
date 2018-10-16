import { BuyQuote } from '@0xproject/asset-buyer';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { zrxAssetData } from '../constants';
import { AsyncProcessState } from '../types';

import { Action, ActionTypes } from './actions';

interface BaseState {
    selectedAssetData?: string;
    selectedAssetAmount?: BigNumber;
    selectedAssetBuyState: AsyncProcessState;
    ethUsdPrice?: BigNumber;
    latestBuyQuote?: BuyQuote;
}
interface StateWithError extends BaseState {
    latestError: any;
    latestErrorDismissed: boolean;
}
interface StateWithoutError extends BaseState {
    latestError: undefined;
    latestErrorDismissed: undefined;
}
export type State = StateWithError | StateWithoutError;

export const INITIAL_STATE: State = {
    // TODO: Remove hardcoded zrxAssetData
    selectedAssetData: zrxAssetData,
    selectedAssetAmount: undefined,
    selectedAssetBuyState: AsyncProcessState.NONE,
    ethUsdPrice: undefined,
    latestBuyQuote: undefined,
    latestError: undefined,
    latestErrorDismissed: undefined,
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
            };
        case ActionTypes.UPDATE_SELECTED_ASSET_BUY_STATE:
            return {
                ...state,
                selectedAssetBuyState: action.data,
            };
        case ActionTypes.SET_ERROR:
            return {
                ...state,
                latestError: action.data,
                latestErrorDismissed: false,
            };
        case ActionTypes.HIDE_ERROR:
            return {
                ...state,
                latestErrorDismissed: true,
            };
        case ActionTypes.CLEAR_ERROR:
            return {
                ...state,
                latestError: undefined,
                latestErrorDismissed: undefined,
            };
        default:
            return state;
    }
};
