import * as _ from 'lodash';
import { createStore, Store as ReduxStore } from 'redux';

import { reducer, State } from './reducer';

const reduxDevTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
export const store: ReduxStore<State> = createStore(reducer, reduxDevTools && reduxDevTools());
