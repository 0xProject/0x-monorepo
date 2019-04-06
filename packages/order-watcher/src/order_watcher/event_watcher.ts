import { intervalUtils, logUtils } from '@0x/utils';
import { marshaller, Web3Wrapper } from '@0x/web3-wrapper';
import { BlockParamLiteral, FilterObject, LogEntry, RawLogEntry, SupportedProvider } from 'ethereum-types';
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
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _isVerbose: boolean;
    private _blockAndLogStreamerIfExists: BlockAndLogStreamer<Block, Log> | undefined;
    private _blockAndLogStreamIntervalIfExists?: NodeJS.Timer;
    private _onLogAddedSubscriptionToken: string | undefined;
    private _onLogRemovedSubscriptionToken: string | undefined;
    private readonly _pollingIntervalMs: number;
    constructor(
        supportedProvider: SupportedProvider,
        pollingIntervalIfExistsMs: undefined | number,
        isVerbose: boolean,
    ) {
        this._isVerbose = isVerbose;
        this._web3Wrapper = new Web3Wrapper(supportedProvider);
        this._pollingIntervalMs =
            pollingIntervalIfExistsMs === undefined ? DEFAULT_EVENT_POLLING_INTERVAL_MS : pollingIntervalIfExistsMs;
        this._blockAndLogStreamerIfExists = undefined;
        this._blockAndLogStreamIntervalIfExists = undefined;
        this._onLogAddedSubscriptionToken = undefined;
        this._onLogRemovedSubscriptionToken = undefined;
    }
    public subscribe(callback: EventWatcherCallback): void {
        assert.isFunction('callback', callback);
        if (this._blockAndLogStreamIntervalIfExists !== undefined) {
            throw new Error(OrderWatcherError.SubscriptionAlreadyPresent);
        }
        this._startBlockAndLogStream(callback);
    }
    public unsubscribe(): void {
        if (this._blockAndLogStreamIntervalIfExists === undefined) {
            throw new Error(OrderWatcherError.SubscriptionNotFound);
        }
        this._stopBlockAndLogStream();
    }
    private _startBlockAndLogStream(callback: EventWatcherCallback): void {
        if (this._blockAndLogStreamerIfExists !== undefined) {
            throw new Error(OrderWatcherError.SubscriptionAlreadyPresent);
        }
        this._blockAndLogStreamerIfExists = new BlockAndLogStreamer(
            this._blockstreamGetBlockOrNullAsync.bind(this),
            this._blockstreamGetLogsAsync.bind(this),
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
    // This method only exists in order to comply with the expected interface of Blockstream's constructor
    private async _blockstreamGetBlockOrNullAsync(hash: string): Promise<Block | null> {
        const shouldIncludeTransactionData = false;
        const blockOrNull = await this._web3Wrapper.sendRawPayloadAsync<Block | null>({
            method: 'eth_getBlockByHash',
            params: [hash, shouldIncludeTransactionData],
        });
        return blockOrNull;
    }
    // This method only exists in order to comply with the expected interface of Blockstream's constructor
    private async _blockstreamGetLatestBlockOrNullAsync(): Promise<Block | null> {
        const shouldIncludeTransactionData = false;
        const blockOrNull = await this._web3Wrapper.sendRawPayloadAsync<Block | null>({
            method: 'eth_getBlockByNumber',
            params: [BlockParamLiteral.Latest, shouldIncludeTransactionData],
        });
        return blockOrNull;
    }
    // This method only exists in order to comply with the expected interface of Blockstream's constructor
    private async _blockstreamGetLogsAsync(filterOptions: FilterObject): Promise<RawLogEntry[]> {
        const logs = await this._web3Wrapper.sendRawPayloadAsync<RawLogEntry[]>({
            method: 'eth_getLogs',
            params: [filterOptions],
        });
        return logs as RawLogEntry[];
    }
    private _stopBlockAndLogStream(): void {
        if (this._blockAndLogStreamerIfExists === undefined) {
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
        rawLog: RawLogEntry,
    ): Promise<void> {
        const log: LogEntry = marshaller.unmarshalLog(rawLog);
        await this._emitDifferencesAsync(log, isRemoved ? LogEventState.Removed : LogEventState.Added, callback);
    }
    private async _reconcileBlockAsync(): Promise<void> {
        const latestBlockOrNull = await this._blockstreamGetLatestBlockOrNullAsync();
        if (latestBlockOrNull === null) {
            return; // noop
        }
        // We need to coerce to Block type cause Web3.Block includes types for mempool blocks
        if (this._blockAndLogStreamerIfExists !== undefined) {
            // If we clear the interval while fetching the block - this._blockAndLogStreamer will be undefined
            await this._blockAndLogStreamerIfExists.reconcileNewBlock(latestBlockOrNull);
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
        if (this._blockAndLogStreamIntervalIfExists !== undefined) {
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
