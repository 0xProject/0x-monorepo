import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { Action, ActionTypes } from '../types';

export interface State {
    ethUsdPrice?: string;
    selectedAssetAmount?: BigNumber;
}

export const INITIAL_STATE: State = {
    ethUsdPrice: undefined,
    selectedAssetAmount: undefined,
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
        default:
            return state;
    }
};
