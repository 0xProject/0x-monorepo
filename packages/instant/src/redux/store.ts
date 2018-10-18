import * as _ from 'lodash';
import { createStore, Store as ReduxStore } from 'redux';
import { devToolsEnhancer } from 'redux-devtools-extension/developmentOnly';

import { INITIAL_STATE, reducer, State } from './reducer';

export type Store = ReduxStore<State>;

export const store = {
    create: (withState: Partial<State>): Store => {
        const allInitialState = {
            ...INITIAL_STATE,
            ...withState,
        };
        return createStore(reducer, allInitialState, devToolsEnhancer({}));
    },
};
