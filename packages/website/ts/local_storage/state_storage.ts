import { localStorage } from 'ts/local_storage/local_storage';
import { INITIAL_STATE, State } from 'ts/redux/reducer';

const STORAGE_NAME = 'persistedState';

export const stateStorage = {
    saveState(partialState: Partial<State>): void {
        localStorage.setObject(STORAGE_NAME, partialState);
    },
    getPersistedState(): Partial<State> {
        return localStorage.getObject(STORAGE_NAME);
    },
    getPersistedDefaultState(): State {
        return { ...INITIAL_STATE, ...stateStorage.getPersistedState() };
    },
};
