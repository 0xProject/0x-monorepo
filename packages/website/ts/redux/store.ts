import * as _ from 'lodash';
import { createStore, Store as ReduxStore } from 'redux';
import { devToolsEnhancer } from 'redux-devtools-extension/developmentOnly';
import { stateStorage } from 'ts/local_storage/state_storage';
import { reducer, State } from 'ts/redux/reducer';

const ONE_SECOND = 1000;

export const store: ReduxStore<State> = createStore(
    reducer,
    stateStorage.getPersistedDefaultState(),
    devToolsEnhancer({ name: '0x Website Redux Store' }),
);
store.subscribe(
    _.throttle(() => {
        // Persisted state
        stateStorage.saveState({
            hasPortalOnboardingBeenSeen: store.getState().hasPortalOnboardingBeenSeen,
        });
    }, ONE_SECOND),
);
