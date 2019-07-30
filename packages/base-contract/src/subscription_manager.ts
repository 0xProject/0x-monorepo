import { AbiDecoder, intervalUtils, logUtils } from '@0x/utils';
import { marshaller, Web3Wrapper } from '@0x/web3-wrapper';
import {
    BlockParamLiteral,
    ContractAbi,
    FilterObject,
    LogEntry,
    LogWithDecodedArgs,
    RawLog,
    RawLogEntry,
} from 'ethereum-types';
import { Block, BlockAndLogStreamer, Log } from 'ethereumjs-blockstream';
import * as _ from 'lodash';

import { BlockRange, EventCallback, IndexedFilterValues, SubscriptionErrors } from './types';
import { filterUtils } from './utils/filter_utils';

const DEFAULT_BLOCK_POLLING_INTERVAL = 1000;

export class SubscriptionManager<ContractEventArgs, ContractEvents extends string> {
    public abi: ContractAbi;
    private _blockAndLogStreamerIfExists: BlockAndLogStreamer<Block, Log> | undefined;
    private _blockAndLogStreamIntervalIfExists?: NodeJS.Timer;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _filters: { [filterToken: string]: FilterObject };
    private readonly _filterCallbacks: {
        [filterToken: string]: EventCallback<ContractEventArgs>;
    };
    private _onLogAddedSubscriptionToken: string | undefined;
    private _onLogRemovedSubscriptionToken: string | undefined;
    private static _onBlockAndLogStreamerError(isVerbose: boolean, err: Error): void {
        // Since Blockstream errors are all recoverable, we simply log them if the verbose
        // config is passed in.
        if (isVerbose) {
            logUtils.warn(err);
        }
    }
    constructor(abi: ContractAbi, web3Wrapper: Web3Wrapper) {
        this.abi = abi;
        this._web3Wrapper = web3Wrapper;
        this._filters = {};
        this._filterCallbacks = {};
        this._blockAndLogStreamerIfExists = undefined;
        this._onLogAddedSubscriptionToken = undefined;
        this._onLogRemovedSubscriptionToken = undefined;
    }
    public unsubscribeAll(): void {
        const filterTokens = _.keys(this._filterCallbacks);
        _.each(filterTokens, filterToken => {
            this.unsubscribe(filterToken);
        });
    }
    public unsubscribe(filterToken: string, err?: Error): void {
        if (this._filters[filterToken] === undefined) {
            throw new Error(SubscriptionErrors.SubscriptionNotFound);
        }
        if (err !== undefined) {
            const callback = this._filterCallbacks[filterToken];
            callback(err, undefined);
        }
        delete this._filters[filterToken];
        delete this._filterCallbacks[filterToken];
        if (_.isEmpty(this._filters)) {
            this._stopBlockAndLogStream();
        }
    }
    public subscribe<ArgsType extends ContractEventArgs>(
        address: string,
        eventName: ContractEvents,
        indexFilterValues: IndexedFilterValues,
        abi: ContractAbi,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        const filter = filterUtils.getFilter(address, eventName, indexFilterValues, abi);
        if (this._blockAndLogStreamerIfExists === undefined) {
            this._startBlockAndLogStream(isVerbose, blockPollingIntervalMs);
        }
        const filterToken = filterUtils.generateUUID();
        this._filters[filterToken] = filter;
        this._filterCallbacks[filterToken] = callback as EventCallback<ContractEventArgs>;
        return filterToken;
    }
    public async getLogsAsync<ArgsType extends ContractEventArgs>(
        address: string,
        eventName: ContractEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
        abi: ContractAbi,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        const filter = filterUtils.getFilter(address, eventName, indexFilterValues, abi, blockRange);
        const logs = await this._web3Wrapper.getLogsAsync(filter);
        const logsWithDecodedArguments = _.map(logs, this._tryToDecodeLogOrNoop.bind(this));
        return logsWithDecodedArguments;
    }
    protected _tryToDecodeLogOrNoop<ArgsType extends ContractEventArgs>(
        log: LogEntry,
    ): LogWithDecodedArgs<ArgsType> | RawLog {
        const abiDecoder = new AbiDecoder([this.abi]);
        const logWithDecodedArgs = abiDecoder.tryToDecodeLogOrNoop(log);
        return logWithDecodedArgs;
    }
    private _onLogStateChanged<ArgsType extends ContractEventArgs>(isRemoved: boolean, rawLog: RawLogEntry): void {
        const log: LogEntry = marshaller.unmarshalLog(rawLog);
        _.forEach(this._filters, (filter: FilterObject, filterToken: string) => {
            if (filterUtils.matchesFilter(log, filter)) {
                const decodedLog = this._tryToDecodeLogOrNoop(log) as LogWithDecodedArgs<ArgsType>;
                const logEvent = {
                    log: decodedLog,
                    isRemoved,
                };
                this._filterCallbacks[filterToken](null, logEvent);
            }
        });
    }
    private _startBlockAndLogStream(isVerbose: boolean, blockPollingIntervalMs?: number): void {
        if (this._blockAndLogStreamerIfExists !== undefined) {
            throw new Error(SubscriptionErrors.SubscriptionAlreadyPresent);
        }
        this._blockAndLogStreamerIfExists = new BlockAndLogStreamer(
            this._blockstreamGetBlockOrNullAsync.bind(this),
            this._blockstreamGetLogsAsync.bind(this),
            SubscriptionManager._onBlockAndLogStreamerError.bind(this, isVerbose),
        );
        const catchAllLogFilter = {};
        this._blockAndLogStreamerIfExists.addLogFilter(catchAllLogFilter);
        const _blockPollingIntervalMs =
            blockPollingIntervalMs === undefined ? DEFAULT_BLOCK_POLLING_INTERVAL : blockPollingIntervalMs;
        this._blockAndLogStreamIntervalIfExists = intervalUtils.setAsyncExcludingInterval(
            this._reconcileBlockAsync.bind(this),
            _blockPollingIntervalMs,
            SubscriptionManager._onBlockAndLogStreamerError.bind(this, isVerbose),
        );
        let isRemoved = false;
        this._onLogAddedSubscriptionToken = this._blockAndLogStreamerIfExists.subscribeToOnLogAdded(
            this._onLogStateChanged.bind(this, isRemoved),
        );
        isRemoved = true;
        this._onLogRemovedSubscriptionToken = this._blockAndLogStreamerIfExists.subscribeToOnLogRemoved(
            this._onLogStateChanged.bind(this, isRemoved),
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
            throw new Error(SubscriptionErrors.SubscriptionNotFound);
        }
        this._blockAndLogStreamerIfExists.unsubscribeFromOnLogAdded(this._onLogAddedSubscriptionToken as string);
        this._blockAndLogStreamerIfExists.unsubscribeFromOnLogRemoved(this._onLogRemovedSubscriptionToken as string);
        intervalUtils.clearAsyncExcludingInterval(this._blockAndLogStreamIntervalIfExists as NodeJS.Timer);
        delete this._blockAndLogStreamerIfExists;
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
}
