import * as Web3 from 'web3';
import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {BlockParamLiteral, EventCallback, EventWatcherCallback} from '../types';
import {AbiDecoder} from '../utils/abi_decoder';
import {intervalUtils} from '../utils/interval_utils';
import {assert} from '../utils/assert';

const DEFAULT_EVENT_POLLING_INTERVAL = 200;

/*
 * The EventWatcher watches for blockchain events at the specified block confirmation
 * depth.
 */
export class EventWatcher {
    private _web3Wrapper: Web3Wrapper;
    private _pollingIntervalMs: number;
    private _intervalIdIfExists?: NodeJS.Timer;
    private _lastEvents: Web3.LogEntry[] = [];
    private _callbackIfExistsAsync?: EventWatcherCallback;
    private _numConfirmations: number;
    constructor(web3Wrapper: Web3Wrapper, pollingIntervalMs: undefined|number, numConfirmations: number) {
        this._web3Wrapper = web3Wrapper;
        this._numConfirmations = numConfirmations;
        this._pollingIntervalMs = _.isUndefined(pollingIntervalMs) ?
                                    DEFAULT_EVENT_POLLING_INTERVAL :
                                    pollingIntervalMs;
    }
    public subscribe(callback: EventWatcherCallback): void {
        assert.isFunction('callback', callback);
        this._callbackIfExistsAsync = callback;
        this._intervalIdIfExists = intervalUtils.setAsyncExcludingInterval(
            this._pollForBlockchainEventsAsync.bind(this), this._pollingIntervalMs,
        );
    }
    public unsubscribe(): void {
        delete this._callbackIfExistsAsync;
        this._lastEvents = [];
        if (!_.isUndefined(this._intervalIdIfExists)) {
            intervalUtils.clearAsyncExcludingInterval(this._intervalIdIfExists);
        }
    }
    private async _pollForBlockchainEventsAsync(): Promise<void> {
        const pendingEvents = await this._getEventsAsync();
        if (pendingEvents.length === 0) {
            // HACK: Sometimes when node rebuilds the pending block we get back the empty result.
            // We don't want to emit a lot of removal events and bring them back after a couple of miliseconds,
            // that's why we just ignore those cases.
            return;
        }
        const removedEvents = _.differenceBy(this._lastEvents, pendingEvents, JSON.stringify);
        const newEvents = _.differenceBy(pendingEvents, this._lastEvents, JSON.stringify);
        let isRemoved = true;
        await this._emitDifferencesAsync(removedEvents, isRemoved);
        isRemoved = false;
        await this._emitDifferencesAsync(newEvents, isRemoved);
        this._lastEvents = pendingEvents;
    }
    private async _getEventsAsync(): Promise<Web3.LogEntry[]> {
        let latestBlock: BlockParamLiteral|number;
        if (this._numConfirmations === 0) {
            latestBlock = BlockParamLiteral.Pending;
        } else {
            const currentBlock = await this._web3Wrapper.getBlockNumberAsync();
            latestBlock = currentBlock - this._numConfirmations;
        }
        const eventFilter = {
            fromBlock: latestBlock,
            toBlock: latestBlock,
        };
        const events = await this._web3Wrapper.getLogsAsync(eventFilter);
        return events;
    }
    private async _emitDifferencesAsync(logs: Web3.LogEntry[], isRemoved: boolean): Promise<void> {
        for (const log of logs) {
            const logEvent = {
                removed: isRemoved,
                ...log,
            };
            if (!_.isUndefined(this._callbackIfExistsAsync)) {
                await this._callbackIfExistsAsync(logEvent);
            }
        }
    }
}
