import { intervalUtils, logUtils } from '@0x/utils';
import { marshaller, EthRPCClient } from '@0x/eth-rpc-client';
import { BlockParamLiteral, FilterObject, LogEntry, Provider, RawLogEntry } from 'ethereum-types';
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
    private readonly _ethRPCClient: EthRPCClient;
    private readonly _isVerbose: boolean;
    private _blockAndLogStreamerIfExists: BlockAndLogStreamer<Block, Log> | undefined;
    private _blockAndLogStreamIntervalIfExists?: NodeJS.Timer;
    private _onLogAddedSubscriptionToken: string | undefined;
    private _onLogRemovedSubscriptionToken: string | undefined;
    private readonly _pollingIntervalMs: number;
    constructor(
        provider: Provider,
        pollingIntervalIfExistsMs: undefined | number,
        stateLayer: BlockParamLiteral,
        isVerbose: boolean,
    ) {
        this._isVerbose = isVerbose;
        this._ethRPCClient = new EthRPCClient(provider);
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
        const blockOrNull = await this._ethRPCClient.sendRawPayloadAsync<Block | null>({
            method: 'eth_getBlockByHash',
            params: [hash, shouldIncludeTransactionData],
        });
        return blockOrNull;
    }
    // This method only exists in order to comply with the expected interface of Blockstream's constructor
    private async _blockstreamGetLatestBlockOrNullAsync(): Promise<Block | null> {
        const shouldIncludeTransactionData = false;
        const blockOrNull = await this._ethRPCClient.sendRawPayloadAsync<Block | null>({
            method: 'eth_getBlockByNumber',
            params: [BlockParamLiteral.Latest, shouldIncludeTransactionData],
        });
        return blockOrNull;
    }
    // This method only exists in order to comply with the expected interface of Blockstream's constructor
    private async _blockstreamGetLogsAsync(filterOptions: FilterObject): Promise<RawLogEntry[]> {
        const logs = await this._ethRPCClient.sendRawPayloadAsync<RawLogEntry[]>({
            method: 'eth_getLogs',
            params: [filterOptions],
        });
        return logs as RawLogEntry[];
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
        rawLog: RawLogEntry,
    ): Promise<void> {
        const log: LogEntry = marshaller.unmarshalLog(rawLog);
        await this._emitDifferencesAsync(log, isRemoved ? LogEventState.Removed : LogEventState.Added, callback);
    }
    private async _reconcileBlockAsync(): Promise<void> {
        const latestBlockOrNull = await this._blockstreamGetLatestBlockOrNullAsync();
        if (_.isNull(latestBlockOrNull)) {
            return; // noop
        }
        // We need to coerce to Block type cause Web3.Block includes types for mempool blocks
        if (!_.isUndefined(this._blockAndLogStreamerIfExists)) {
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
