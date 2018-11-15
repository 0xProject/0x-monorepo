import * as _ from 'lodash';
import { applyMiddleware, createStore, Store as ReduxStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';

import { analyticsMiddleware } from './analytics_middleware';
import { createReducer, State } from './reducer';

export type Store = ReduxStore<State>;

export const store = {
    create: (initialState: State): Store => {
        const reducer = createReducer(initialState);
        return createStore(reducer, initialState, composeWithDevTools(applyMiddleware(analyticsMiddleware)));
    },
};
