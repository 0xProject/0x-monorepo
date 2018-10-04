import * as _ from 'lodash';
import { createStore, Store as ReduxStore } from 'redux';

import { reducer, State } from './reducer';

export const store: ReduxStore<State> = createStore(reducer);
