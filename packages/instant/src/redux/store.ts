import * as _ from 'lodash';
import { createStore, Store as ReduxStore } from 'redux';
import { devToolsEnhancer } from 'redux-devtools-extension/developmentOnly';

import { createReducer, State } from './reducer';

export type Store = ReduxStore<State>;

export const store = {
    create: (initialState: State): Store => {
        const reducer = createReducer(initialState);
        return createStore(reducer, initialState, devToolsEnhancer({}));
    },
};
