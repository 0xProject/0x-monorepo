import { BlockParamLiteral, LogEntry } from '@0xproject/types';
import { intervalUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Block, BlockAndLogStreamer, Log } from 'ethereumjs-blockstream';
import * as _ from 'lodash';

import { EventWatcherCallback, OrderWatcherError } from '../types';
import { assert } from '../utils/assert';

const DEFAULT_EVENT_POLLING_INTERVAL_MS = 200;

enum LogEventState {
    Removed,
    Added,
}

/**
 * The EventWatcher watches for blockchain events at the specified block confirmation
 * depth.
 */
export class EventWatcher {
    private _web3Wrapper: Web3Wrapper;
    private _blockAndLogStreamerIfExists: BlockAndLogStreamer<Block, Log> | undefined;
    private _blockAndLogStreamIntervalIfExists?: NodeJS.Timer;
    private _onLogAddedSubscriptionToken: string | undefined;
    private _onLogRemovedSubscriptionToken: string | undefined;
    private _pollingIntervalMs: number;
    private _stateLayer: BlockParamLiteral;
    private static _onBlockAndLogStreamerError(callback: EventWatcherCallback, err: Error): void {
        // Propogate all Blockstream subscriber errors to
        // top-level subscription
        callback(err);
    }
    constructor(
        web3Wrapper: Web3Wrapper,
        pollingIntervalIfExistsMs: undefined | number,
        stateLayer: BlockParamLiteral = BlockParamLiteral.Latest,
    ) {
        this._web3Wrapper = web3Wrapper;
        this._stateLayer = stateLayer;
        this._pollingIntervalMs = _.isUndefined(pollingIntervalIfExistsMs)
            ? DEFAULT_EVENT_POLLING_INTERVAL_MS
            : pollingIntervalIfExistsMs;
        this._blockAndLogStreamerIfExists = undefined;
        this._blockAndLogStreamIntervalIfExists = undefined;
        this._onLogAddedSubscriptionToken = undefined;
        this._onLogRemovedSubscriptionToken = undefined;
    }
    public subscribe(callback: EventWatcherCallback): void {
        assert.isFunction('callback', callback);
        if (!_.isUndefined(this._blockAndLogStreamIntervalIfExists)) {
            throw new Error(OrderWatcherError.SubscriptionAlreadyPresent);
        }
        this._startBlockAndLogStream(callback);
    }
    public unsubscribe(): void {
        if (!_.isUndefined(this._blockAndLogStreamIntervalIfExists)) {
            intervalUtils.clearAsyncExcludingInterval(this._blockAndLogStreamIntervalIfExists);
            delete this._blockAndLogStreamIntervalIfExists;
            delete this._blockAndLogStreamerIfExists;
        }
    }
    private _startBlockAndLogStream(callback: EventWatcherCallback): void {
        if (!_.isUndefined(this._blockAndLogStreamerIfExists)) {
            throw new Error(OrderWatcherError.SubscriptionAlreadyPresent);
        }
        this._blockAndLogStreamerIfExists = new BlockAndLogStreamer(
            this._web3Wrapper.getBlockAsync.bind(this._web3Wrapper),
            this._web3Wrapper.getLogsAsync.bind(this._web3Wrapper),
            EventWatcher._onBlockAndLogStreamerError.bind(this, callback),
        );
        const catchAllLogFilter = {};
        this._blockAndLogStreamerIfExists.addLogFilter(catchAllLogFilter);
        this._blockAndLogStreamIntervalIfExists = intervalUtils.setAsyncExcludingInterval(
            this._reconcileBlockAsync.bind(this),
            this._pollingIntervalMs,
            this._onReconcileBlockError.bind(this, callback),
        );
        let isRemoved = false;
        this._onLogAddedSubscriptionToken = this._blockAndLogStreamerIfExists.subscribeToOnLogAdded(
            this._onLogStateChangedAsync.bind(this, callback, isRemoved),
        );
        isRemoved = true;
        this._onLogRemovedSubscriptionToken = this._blockAndLogStreamerIfExists.subscribeToOnLogRemoved(
            this._onLogStateChangedAsync.bind(this, callback, isRemoved),
        );
    }
    private _onReconcileBlockError(callback: EventWatcherCallback, err: Error): void {
        this.unsubscribe();
        callback(err);
    }
    private async _onLogStateChangedAsync(
        callback: EventWatcherCallback,
        isRemoved: boolean,
        log: LogEntry,
    ): Promise<void> {
        await this._emitDifferencesAsync(log, isRemoved ? LogEventState.Removed : LogEventState.Added, callback);
    }
    private async _reconcileBlockAsync(): Promise<void> {
        const latestBlock = await this._web3Wrapper.getBlockAsync(BlockParamLiteral.Latest);
        // We need to coerce to Block type cause Web3.Block includes types for mempool blocks
        if (!_.isUndefined(this._blockAndLogStreamerIfExists)) {
            // If we clear the interval while fetching the block - this._blockAndLogStreamer will be undefined
            await this._blockAndLogStreamerIfExists.reconcileNewBlock((latestBlock as any) as Block);
        }
    }
    private async _emitDifferencesAsync(
        log: LogEntry,
        logEventState: LogEventState,
        callback: EventWatcherCallback,
    ): Promise<void> {
        const logEvent = {
            removed: logEventState === LogEventState.Removed,
            ...log,
        };
        if (!_.isUndefined(this._blockAndLogStreamIntervalIfExists)) {
            callback(null, logEvent);
        }
    }
}
