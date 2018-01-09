import { intervalUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { BlockParamLiteral, EventWatcherCallback, ZeroExError } from '../types';
import { assert } from '../utils/assert';

const DEFAULT_EVENT_POLLING_INTERVAL_MS = 200;

enum LogEventState {
    Removed,
    Added,
}

/*
 * The EventWatcher watches for blockchain events at the specified block confirmation
 * depth.
 */
export class EventWatcher {
    private _web3Wrapper: Web3Wrapper;
    private _pollingIntervalMs: number;
    private _intervalIdIfExists?: NodeJS.Timer;
    private _lastEvents: Web3.LogEntry[] = [];
    constructor(web3Wrapper: Web3Wrapper, pollingIntervalIfExistsMs: undefined | number) {
        this._web3Wrapper = web3Wrapper;
        this._pollingIntervalMs = _.isUndefined(pollingIntervalIfExistsMs)
            ? DEFAULT_EVENT_POLLING_INTERVAL_MS
            : pollingIntervalIfExistsMs;
    }
    public subscribe(callback: EventWatcherCallback): void {
        assert.isFunction('callback', callback);
        if (!_.isUndefined(this._intervalIdIfExists)) {
            throw new Error(ZeroExError.SubscriptionAlreadyPresent);
        }
        this._intervalIdIfExists = intervalUtils.setAsyncExcludingInterval(
            this._pollForBlockchainEventsAsync.bind(this, callback),
            this._pollingIntervalMs,
        );
    }
    public unsubscribe(): void {
        this._lastEvents = [];
        if (!_.isUndefined(this._intervalIdIfExists)) {
            intervalUtils.clearAsyncExcludingInterval(this._intervalIdIfExists);
            delete this._intervalIdIfExists;
        }
    }
    private async _pollForBlockchainEventsAsync(callback: EventWatcherCallback): Promise<void> {
        const pendingEvents = await this._getEventsAsync();
        if (pendingEvents.length === 0) {
            // HACK: Sometimes when node rebuilds the pending block we get back the empty result.
            // We don't want to emit a lot of removal events and bring them back after a couple of miliseconds,
            // that's why we just ignore those cases.
            return;
        }
        const removedEvents = _.differenceBy(this._lastEvents, pendingEvents, JSON.stringify);
        const newEvents = _.differenceBy(pendingEvents, this._lastEvents, JSON.stringify);
        await this._emitDifferencesAsync(removedEvents, LogEventState.Removed, callback);
        await this._emitDifferencesAsync(newEvents, LogEventState.Added, callback);
        this._lastEvents = pendingEvents;
    }
    private async _getEventsAsync(): Promise<Web3.LogEntry[]> {
        const eventFilter = {
            fromBlock: BlockParamLiteral.Pending,
            toBlock: BlockParamLiteral.Pending,
        };
        const events = await this._web3Wrapper.getLogsAsync(eventFilter);
        return events;
    }
    private async _emitDifferencesAsync(
        logs: Web3.LogEntry[],
        logEventState: LogEventState,
        callback: EventWatcherCallback,
    ): Promise<void> {
        for (const log of logs) {
            const logEvent = {
                removed: logEventState === LogEventState.Removed,
                ...log,
            };
            if (!_.isUndefined(this._intervalIdIfExists)) {
                callback(logEvent);
            }
        }
    }
}
