import * as _ from 'lodash';

import { Action, ActionTypes } from '../types';

export interface State {
    ethUsdPrice?: string;
}

export const INITIAL_STATE: State = {
    ethUsdPrice: undefined,
};

export const reducer = (state: State = INITIAL_STATE, action: Action): State => {
    switch (action.type) {
        case ActionTypes.UPDATE_ETH_USD_PRICE:
            return {
                ...state,
                ethUsdPrice: action.data,
            };
        default:
            return state;
    }
};
