import { SignedOrder, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';

import { Action, ActionTypes, AssetToken } from '../types';

export interface State {
    networkId: number;
    userAddress?: string;
    userWeiBalance?: BigNumber;
    userTokenBalance?: BigNumber;
    selectedToken: AssetToken;
    order: SignedOrder;
}
const INITIAL_STATE: State = {
    networkId: undefined,
    userAddress: undefined,
    selectedToken: AssetToken.ZRX,
    order: undefined,
};

/**
 * Reducer
 */
export function reducer(state: State = INITIAL_STATE, action: Action) {
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
            return {
                ...state,
                userAddress: action.data,
            };
        }
        case ActionTypes.UpdateUserWeiBalance: {
            return {
                ...state,
                userWeiBalance: action.data,
            };
        }
        case ActionTypes.UpdateUserTokenBalance: {
            return {
                ...state,
                userTokenBalance: action.data,
            };
        }
        case ActionTypes.UpdateOrder: {
            return {
                ...state,
                order: action.data,
            };
        }
        default:
            return { ...state };
    }
}
