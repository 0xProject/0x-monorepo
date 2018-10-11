import { BuyQuote } from '@0xproject/asset-buyer';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { Action, ActionTypes, AsyncProcessState } from '../types';

export interface State {
    selectedAssetAmount?: BigNumber;
    selectedAssetBuyState: AsyncProcessState;
    ethUsdPrice?: BigNumber;
    latestBuyQuote?: BuyQuote;
}

export const INITIAL_STATE: State = {
    ethUsdPrice: undefined,
    selectedAssetBuyState: AsyncProcessState.NONE,
    selectedAssetAmount: undefined,
    latestBuyQuote: undefined,
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
        default:
            return state;
    }
};
