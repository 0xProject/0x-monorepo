import * as _ from 'lodash';
import { applyMiddleware, createStore, Store as ReduxStore } from 'redux';

import { reducer, State } from './reducer';

export const store: ReduxStore<State> = createStore(reducer);
