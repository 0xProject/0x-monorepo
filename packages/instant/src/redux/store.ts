import * as _ from 'lodash';
import { applyMiddleware, createStore, Store as ReduxStore } from 'redux';

import { reducer, State } from './reducer';

const ONE_SECOND = 1000;

export const store: ReduxStore<State> = createStore(reducer);
