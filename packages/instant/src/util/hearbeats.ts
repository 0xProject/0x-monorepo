import * as _ from 'lodash';

import { asyncData } from './../redux/async_data';
import { Store } from './../redux/store';

export class AccountUpdateHeartbeat {
    private _intervalId?: number;
    private _pendingRequest?: boolean;
    private _store?: Store;

    public start(store: Store, intervalTimeMs: number): void {
        if (!_.isUndefined(this._intervalId)) {
            throw new Error('Heartbeat is running, please stop before restarting');
        }
        this._store = store;
        // Kick off initial first request
        this._performActionAsync(true);
        // Set interval for heartbeat
        this._intervalId = window.setInterval(this._performActionAsync.bind(this, false), intervalTimeMs);
    }

    public stop(): void {
        if (!_.isUndefined(this._intervalId)) {
            window.clearInterval(this._intervalId);
            this._resetState();
        }
    }

    private _resetState(): void {
        this._intervalId = undefined;
        this._pendingRequest = false;
        this._store = undefined;
    }

    private async _performActionAsync(setLoading: boolean): Promise<void> {
        if (this._pendingRequest || _.isUndefined(this._store)) {
            return;
        }

        this._pendingRequest = true;
        try {
            await asyncData.fetchAccountInfoAndDispatchToStore(this._store, { setLoading });
        } finally {
            this._pendingRequest = false;
        }
    }
}
