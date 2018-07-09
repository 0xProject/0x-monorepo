import { BlockParamLiteral, LogEntry } from '@0xproject/types';
import { intervalUtils, logUtils } from '@0xproject/utils';
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
    private _isVerbose: boolean;
    constructor(
        web3Wrapper: Web3Wrapper,
        pollingIntervalIfExistsMs: undefined | number,
        stateLayer: BlockParamLiteral = BlockParamLiteral.Latest,
        isVerbose: boolean,
    ) {
        this._isVerbose = isVerbose;
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
        if (_.isUndefined(this._blockAndLogStreamIntervalIfExists)) {
            throw new Error(OrderWatcherError.SubscriptionNotFound);
        }
        this._stopBlockAndLogStream();
    }
    private _startBlockAndLogStream(callback: EventWatcherCallback): void {
        if (!_.isUndefined(this._blockAndLogStreamerIfExists)) {
            throw new Error(OrderWatcherError.SubscriptionAlreadyPresent);
        }
        const eventFilter = {
            fromBlock: this._stateLayer,
            toBlock: this._stateLayer,
        };
        this._blockAndLogStreamerIfExists = new BlockAndLogStreamer(
            this._web3Wrapper.getBlockAsync.bind(this._web3Wrapper, this._stateLayer),
            this._web3Wrapper.getLogsAsync.bind(this._web3Wrapper, eventFilter),
            this._onBlockAndLogStreamerError.bind(this),
        );
        const catchAllLogFilter = {};
        this._blockAndLogStreamerIfExists.addLogFilter(catchAllLogFilter);
        this._blockAndLogStreamIntervalIfExists = intervalUtils.setAsyncExcludingInterval(
            this._reconcileBlockAsync.bind(this),
            this._pollingIntervalMs,
            this._onBlockAndLogStreamerError.bind(this),
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
    private _stopBlockAndLogStream(): void {
        if (_.isUndefined(this._blockAndLogStreamerIfExists)) {
            throw new Error(OrderWatcherError.SubscriptionNotFound);
        }
        this._blockAndLogStreamerIfExists.unsubscribeFromOnLogAdded(this._onLogAddedSubscriptionToken as string);
        this._blockAndLogStreamerIfExists.unsubscribeFromOnLogRemoved(this._onLogRemovedSubscriptionToken as string);
        intervalUtils.clearAsyncExcludingInterval(this._blockAndLogStreamIntervalIfExists as NodeJS.Timer);
        delete this._blockAndLogStreamerIfExists;
        delete this._blockAndLogStreamIntervalIfExists;
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
    private _onBlockAndLogStreamerError(err: Error): void {
        // Since Blockstream errors are all recoverable, we simply log them if the verbose
        // config is passed in.
        if (this._isVerbose) {
            logUtils.warn(err);
        }
    }
}
