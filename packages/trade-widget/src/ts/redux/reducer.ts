import { SignedOrder, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { combineReducers } from 'redux';

import { AccountTokenBalances, AccountWeiBalances, Action, ActionTypes, AssetToken, Quote } from '../types';

export interface State {
    networkId: number;
    userAddress?: string;
    selectedToken: AssetToken;
    userTokenBalances: AccountTokenBalances;
    usersWeiBalance: AccountWeiBalances;
    quote: Quote;
    isQuoting: boolean;
    lastAction: Action;
}
const INITIAL_STATE: State = {
    networkId: undefined,
    userAddress: undefined,
    selectedToken: AssetToken.ZRX,
    userTokenBalances: {},
    usersWeiBalance: {},
    lastAction: undefined,
    quote: undefined,
    isQuoting: false,
};

function lastActionReducer(state: State = INITIAL_STATE, action: Action) {
    return {
        ...state,
        lastAction: action,
    };
}

function appReducer(state: State = INITIAL_STATE, action: Action) {
    switch (action.type) {
        case ActionTypes.UpdateNetworkId: {
            return {
                ...state,
                networkId: action.data,
            };
        }
        case ActionTypes.UpdateSelectedToken: {
            return {
                ...state,
                selectedToken: action.data,
                quote: undefined as Quote,
            };
        }
        case ActionTypes.UpdateUserAddress: {
            const address = action.data;
            return {
                ...state,
                userAddress: action.data,
                userTokenBalances: {
                    ...state.userTokenBalances,
                    ...{ [address]: state.userTokenBalances[address] || {} },
                },
                usersWeiBalance: {
                    ...state.usersWeiBalance,
                    ...{ [address]: state.usersWeiBalance[address] || new BigNumber(0) },
                },
            };
        }
        case ActionTypes.UpdateUserWeiBalance: {
            const { address, balance } = action.data;
            return {
                ...state,
                usersWeiBalance: { ...state.usersWeiBalance, ...{ [address]: balance } },
            };
        }
        case ActionTypes.UpdateUserTokenBalance: {
            const { address, balance, token } = action.data;
            return {
                ...state,
                userTokenBalances: {
                    ...state.userTokenBalances,
                    ...{ [address]: { ...state.userTokenBalances[address], ...{ [token]: balance } } },
                },
            };
        }
        case ActionTypes.QuoteRequested: {
            return {
                ...state,
                isQuoting: true,
            };
        }
        case ActionTypes.QuoteRequestFailed: {
            return {
                ...state,
                isQuoting: false,
            };
        }
        case ActionTypes.QuoteReceived: {
            const { quote } = action.data;
            return {
                ...state,
                isQuoting: false,
                quote: { ...quote },
            };
        }
        default:
            return { ...state };
    }
}
/**
 * Reducer
 */
export function reducer(state: State = INITIAL_STATE, action: Action) {
    return lastActionReducer(appReducer(state, action), action);
}
