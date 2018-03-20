import { SignedOrder, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { combineReducers } from 'redux';

import { AccountTokenBalances, AccountWeiBalances, Action, ActionTypes, AssetToken } from '../types';

export interface State {
    networkId: number;
    userAddress?: string;
    selectedToken: AssetToken;
    userTokenBalances: AccountTokenBalances;
    usersWeiBalance: AccountWeiBalances;
    lastAction: Action;
}
const INITIAL_STATE: State = {
    networkId: undefined,
    userAddress: undefined,
    selectedToken: AssetToken.ZRX,
    userTokenBalances: {},
    usersWeiBalance: {},
    lastAction: undefined,
};

function lastActionReducer(state: State = INITIAL_STATE, action: Action) {
    return {
        ...state,
        lastAction: action,
    };
}
/**
 * Reducer
 */
export function reducer(state: State = INITIAL_STATE, action: Action) {
    // tslint:disable-next-line:no-parameter-reassignment
    state = { ...state, lastAction: action };
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
            };
        }
        case ActionTypes.UpdateUserAddress: {
            const userAddress = action.data;
            const tokenBalances = state.userTokenBalances;
            const usersWeiBalance = state.usersWeiBalance;
            tokenBalances[userAddress] = tokenBalances[userAddress] || {};
            usersWeiBalance[userAddress] = usersWeiBalance[userAddress] || new BigNumber(0);
            return {
                ...state,
                userAddress: action.data,
                userTokenBalances: { ...tokenBalances },
                usersWeiBalance: { ...usersWeiBalance },
            };
        }
        case ActionTypes.UpdateUserWeiBalance: {
            const { address, balance } = action.data;
            const weiBalances = state.usersWeiBalance;
            weiBalances[address] = balance;
            return {
                ...state,
                usersWeiBalance: { ...weiBalances },
            };
        }
        case ActionTypes.UpdateUserTokenBalance: {
            const { address, balance, token } = action.data;
            const tokenBalances = state.userTokenBalances;
            tokenBalances[address] = tokenBalances[address] || {};
            tokenBalances[address][token] = balance;

            return {
                ...state,
                userTokenBalances: { ...tokenBalances },
            };
        }
        default:
            return { ...state };
    }
}
