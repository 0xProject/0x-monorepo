import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import { Middleware } from 'redux';

import { analytics } from '../util/analytics';

import { AccountState } from './../types';
import { Action, ActionTypes } from './actions';
import { State } from './reducer';

export const analyticsMiddleware: Middleware = store => next => middlewareAction => {
    const prevState = store.getState() as State;
    const nextAction = next(middlewareAction) as Action;
    const nextState = store.getState() as State;

    const curAccount = nextState.providerState.account;
    const prevAccount = prevState.providerState.account;
    switch (nextAction.type) {
        case ActionTypes.SET_ACCOUNT_STATE_READY:
            if (curAccount.state === AccountState.Ready && !_.isEqual(curAccount, prevAccount)) {
                const ethAddress = curAccount.address;
                analytics.addUserProperties({ ethAddress });
                analytics.track('Wallet - Ready');
            }
            break;
        case ActionTypes.UPDATE_ACCOUNT_ETH_BALANCE:
            if (
                curAccount.state === AccountState.Ready &&
                curAccount.ethBalanceInWei &&
                !_.isEqual(curAccount, prevAccount)
            ) {
                const ethBalanceInWei = curAccount.ethBalanceInWei.toString();
                analytics.addUserProperties({ ethBalanceInWei });
            }
    }

    return nextAction;
};
