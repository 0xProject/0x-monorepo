import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import { Middleware } from 'redux';

import { ETH_DECIMALS } from '../constants';
import { AccountState } from '../types';
import { analytics } from '../util/analytics';

import { Action, ActionTypes } from './actions';

import { State } from './reducer';

export const analyticsMiddleware: Middleware = store => next => middlewareAction => {
    const prevState = store.getState() as State;
    const prevAccount = prevState.providerState.account;

    const nextAction = next(middlewareAction) as Action;

    const curState = store.getState() as State;
    const curAccount = curState.providerState.account;

    switch (nextAction.type) {
        case ActionTypes.SET_ACCOUNT_STATE_READY:
            if (curAccount.state === AccountState.Ready && prevAccount.state !== AccountState.Ready) {
                const ethAddress = curAccount.address;
                analytics.addUserProperties({ ethAddress });
                analytics.walletReady({
                    numAssetsAvailable: curState.availableAssets ? curState.availableAssets.length : 0,
                });
            }
            break;
        case ActionTypes.UPDATE_ACCOUNT_ETH_BALANCE:
            if (
                curAccount.state === AccountState.Ready &&
                curAccount.ethBalanceInWei &&
                !_.isEqual(curAccount, prevAccount)
            ) {
                const ethBalanceInUnitAmount = Web3Wrapper.toUnitAmount(
                    curAccount.ethBalanceInWei,
                    ETH_DECIMALS,
                ).toString();
                analytics.addUserProperties({ ethBalanceInUnitAmount });
            }
    }

    return nextAction;
};
