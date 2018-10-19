import * as _ from 'lodash';
import { createStore, Store as ReduxStore } from 'redux';
import { devToolsEnhancer } from 'redux-devtools-extension/developmentOnly';

import { reducer, State } from './reducer';

export type Store = ReduxStore<State>;

export const store = {
    create: (state: State): Store => {
        return createStore(reducer, state, devToolsEnhancer({}));
    },
};
