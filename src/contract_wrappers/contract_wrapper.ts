import * as _ from 'lodash';
import * as Web3 from 'web3';
import {BlockAndLogStreamer, Block} from 'ethereumjs-blockstream';
import {Web3Wrapper} from '../web3_wrapper';
import {AbiDecoder} from '../utils/abi_decoder';
import {
    ZeroExError,
    InternalZeroExError,
    Artifact,
    LogWithDecodedArgs,
    RawLog,
    ContractEvents,
    SubscriptionOpts,
    IndexedFilterValues,
    EventCallback,
} from '../types';
import {utils} from '../utils/utils';
import {constants} from '../utils/constants';
import {intervalUtils} from '../utils/interval_utils';
import {filterUtils} from '../utils/filter_utils';

export class ContractWrapper {
    protected _web3Wrapper: Web3Wrapper;
    private _abiDecoder?: AbiDecoder;
    private _blockAndLogStreamer: BlockAndLogStreamer;
    private _blockAndLogStreamInterval: NodeJS.Timer;
    private _activeFilters: number;
    private _filters: {[filterToken: string]: Web3.FilterObject};
    private _filterCallbacks: {[filterToken: string]: EventCallback};
    private _onLogAddedSubscriptionToken: string|undefined;
    private _onLogRemovedSubscriptionToken: string|undefined;
    constructor(web3Wrapper: Web3Wrapper, abiDecoder?: AbiDecoder) {
        this._web3Wrapper = web3Wrapper;
        this._abiDecoder = abiDecoder;
        this._activeFilters = 0;
        this._filters = {};
        this._filterCallbacks = {};
        this._onLogAddedSubscriptionToken = undefined;
        this._onLogRemovedSubscriptionToken = undefined;
    }
    protected _subscribe(address: string, eventName: ContractEvents,
                         indexFilterValues: IndexedFilterValues, abi: Web3.ContractAbi,
                         callback: EventCallback): string {
        const filter = filterUtils.getFilter(
            this._web3Wrapper.keccak256.bind(this._web3Wrapper), address, eventName, indexFilterValues, abi,
        );
        if (_.isEmpty(this._filters)) {
            this._startBlockAndLogStream();
        }
        const filterToken = filterUtils.generateUUID();
        this._filters[filterToken] = filter;
        this._filterCallbacks[filterToken] = callback;
        return filterToken;
    }
    protected _unsubscribe(filterToken: string): void {
        if (_.isUndefined(this._filters[filterToken])) {
            throw new Error(ZeroExError.SubscriptionNotFound);
        }
        delete this._filters[filterToken];
        delete this._filterCallbacks[filterToken];
        if (_.isEmpty(this._filters)) {
            this._stopBlockAndLogStream();
        }
    }
    protected async _getLogsAsync(address: string, eventName: ContractEvents, subscriptionOpts: SubscriptionOpts,
                                  indexFilterValues: IndexedFilterValues,
                                  abi: Web3.ContractAbi): Promise<LogWithDecodedArgs[]> {
        const filter = filterUtils.getFilter(
            this._web3Wrapper.keccak256.bind(this._web3Wrapper), address, eventName, indexFilterValues, abi,
            subscriptionOpts,
        );
        const logs = await this._web3Wrapper.getLogsAsync(filter);
        const logsWithDecodedArguments = _.map(logs, this._tryToDecodeLogOrNoop.bind(this));
        return logsWithDecodedArguments;
    }
    protected _tryToDecodeLogOrNoop(log: Web3.LogEntry): LogWithDecodedArgs|RawLog {
        if (_.isUndefined(this._abiDecoder)) {
            throw new Error(InternalZeroExError.NoAbiDecoder);
        }
        const logWithDecodedArgs = this._abiDecoder.tryToDecodeLogOrNoop(log);
        return logWithDecodedArgs;
    }
    protected async _instantiateContractIfExistsAsync<A extends Web3.ContractInstance>(artifact: Artifact,
                                                                                       addressIfExists?: string,
                                                                                      ): Promise<A> {
        const contractInstance =
            await this._web3Wrapper.getContractInstanceFromArtifactAsync<A>(artifact, addressIfExists);
        return contractInstance;
    }
    private _onLogStateChanged(removed: boolean, log: Web3.LogEntry): void {
        _.forEach(this._filters, (filter: Web3.FilterObject, filterToken: string) => {
            if (filterUtils.matchesFilter(log, filter)) {
                const decodedLog = this._tryToDecodeLogOrNoop(log) as LogWithDecodedArgs;
                const logEvent = {
                    ...decodedLog,
                    removed,
                };
                this._filterCallbacks[filterToken](logEvent);
            }
        });
    }
    private _startBlockAndLogStream(): void {
        this._blockAndLogStreamer = new BlockAndLogStreamer(
            this._web3Wrapper.getBlockAsync.bind(this._web3Wrapper),
            this._web3Wrapper.getLogsAsync.bind(this._web3Wrapper),
        );
        const catchAllLogFilter = {};
        this._blockAndLogStreamer.addLogFilter(catchAllLogFilter);
        this._blockAndLogStreamInterval = intervalUtils.setAsyncExcludingInterval(
            this._reconcileBlockAsync.bind(this), constants.DEFAULT_BLOCK_POLLING_INTERVAL,
        );
        let removed = false;
        this._onLogAddedSubscriptionToken = this._blockAndLogStreamer.subscribeToOnLogAdded(
            this._onLogStateChanged.bind(this, removed),
        );
        removed = true;
        this._onLogRemovedSubscriptionToken = this._blockAndLogStreamer.subscribeToOnLogRemoved(
            this._onLogStateChanged.bind(this, removed),
        );
    }
    private _stopBlockAndLogStream(): void {
        this._blockAndLogStreamer.unsubscribeFromOnLogAdded(this._onLogAddedSubscriptionToken as string);
        this._blockAndLogStreamer.unsubscribeFromOnLogRemoved(this._onLogRemovedSubscriptionToken as string);
        intervalUtils.clearAsyncExcludingInterval(this._blockAndLogStreamInterval);
        delete this._blockAndLogStreamer;
    }
    private async _reconcileBlockAsync(): Promise<void> {
        const latestBlock = await this._web3Wrapper.getBlockAsync('latest');
        // We need to coerce to Block type cause Web3.Block includes types for mempool bloks
        this._blockAndLogStreamer.reconcileNewBlock(latestBlock as any as Block);
    }
}
