import { AbiDecoder, intervalUtils, logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import {
    BlockParamLiteral,
    ContractAbi,
    ContractArtifact,
    FilterObject,
    LogEntry,
    LogWithDecodedArgs,
    RawLog,
} from 'ethereum-types';
import { Block, BlockAndLogStreamer, Log } from 'ethereumjs-blockstream';
import * as _ from 'lodash';

import {
    BlockRange,
    ContractEventArgs,
    ContractEvents,
    ContractWrappersError,
    EventCallback,
    IndexedFilterValues,
} from '../types';
import { constants } from '../utils/constants';
import { filterUtils } from '../utils/filter_utils';

const CONTRACT_NAME_TO_NOT_FOUND_ERROR: {
    [contractName: string]: ContractWrappersError;
} = {
    ZRX: ContractWrappersError.ZRXContractDoesNotExist,
    EtherToken: ContractWrappersError.EtherTokenContractDoesNotExist,
    ERC20Token: ContractWrappersError.ERC20TokenContractDoesNotExist,
    ERC20Proxy: ContractWrappersError.ERC20ProxyContractDoesNotExist,
    ERC721Token: ContractWrappersError.ERC721TokenContractDoesNotExist,
    ERC721Proxy: ContractWrappersError.ERC721ProxyContractDoesNotExist,
    Exchange: ContractWrappersError.ExchangeContractDoesNotExist,
};

export abstract class ContractWrapper {
    public abstract abi: ContractAbi;
    protected _web3Wrapper: Web3Wrapper;
    protected _networkId: number;
    private _blockAndLogStreamerIfExists: BlockAndLogStreamer<Block, Log> | undefined;
    private _blockPollingIntervalMs: number;
    private _blockAndLogStreamIntervalIfExists?: NodeJS.Timer;
    private _filters: { [filterToken: string]: FilterObject };
    private _filterCallbacks: {
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
    constructor(web3Wrapper: Web3Wrapper, networkId: number, blockPollingIntervalMs?: number) {
        this._web3Wrapper = web3Wrapper;
        this._networkId = networkId;
        this._blockPollingIntervalMs = _.isUndefined(blockPollingIntervalMs)
            ? constants.DEFAULT_BLOCK_POLLING_INTERVAL
            : blockPollingIntervalMs;
        this._filters = {};
        this._filterCallbacks = {};
        this._blockAndLogStreamerIfExists = undefined;
        this._onLogAddedSubscriptionToken = undefined;
        this._onLogRemovedSubscriptionToken = undefined;
    }
    protected _unsubscribeAll(): void {
        const filterTokens = _.keys(this._filterCallbacks);
        _.each(filterTokens, filterToken => {
            this._unsubscribe(filterToken);
        });
    }
    protected _unsubscribe(filterToken: string, err?: Error): void {
        if (_.isUndefined(this._filters[filterToken])) {
            throw new Error(ContractWrappersError.SubscriptionNotFound);
        }
        if (!_.isUndefined(err)) {
            const callback = this._filterCallbacks[filterToken];
            callback(err, undefined);
        }
        delete this._filters[filterToken];
        delete this._filterCallbacks[filterToken];
        if (_.isEmpty(this._filters)) {
            this._stopBlockAndLogStream();
        }
    }
    protected _subscribe<ArgsType extends ContractEventArgs>(
        address: string,
        eventName: ContractEvents,
        indexFilterValues: IndexedFilterValues,
        abi: ContractAbi,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
    ): string {
        const filter = filterUtils.getFilter(address, eventName, indexFilterValues, abi);
        if (_.isUndefined(this._blockAndLogStreamerIfExists)) {
            this._startBlockAndLogStream(isVerbose);
        }
        const filterToken = filterUtils.generateUUID();
        this._filters[filterToken] = filter;
        this._filterCallbacks[filterToken] = callback as EventCallback<ContractEventArgs>;
        return filterToken;
    }
    protected async _getLogsAsync<ArgsType extends ContractEventArgs>(
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
    protected async _getContractAbiAndAddressFromArtifactsAsync(
        artifact: ContractArtifact,
        addressIfExists?: string,
    ): Promise<[ContractAbi, string]> {
        let contractAddress: string;
        if (_.isUndefined(addressIfExists)) {
            if (_.isUndefined(artifact.networks[this._networkId])) {
                throw new Error(ContractWrappersError.ContractNotDeployedOnNetwork);
            }
            contractAddress = artifact.networks[this._networkId].address.toLowerCase();
        } else {
            contractAddress = addressIfExists;
        }
        const doesContractExist = await this._web3Wrapper.doesContractExistAtAddressAsync(contractAddress);
        if (!doesContractExist) {
            throw new Error(CONTRACT_NAME_TO_NOT_FOUND_ERROR[artifact.contractName]);
        }
        const abiAndAddress: [ContractAbi, string] = [artifact.compilerOutput.abi, contractAddress];
        return abiAndAddress;
    }
    protected _getContractAddress(artifact: ContractArtifact, addressIfExists?: string): string {
        if (_.isUndefined(addressIfExists)) {
            if (_.isUndefined(artifact.networks[this._networkId])) {
                throw new Error(ContractWrappersError.ContractNotDeployedOnNetwork);
            }
            const contractAddress = artifact.networks[this._networkId].address;
            if (_.isUndefined(contractAddress)) {
                throw new Error(CONTRACT_NAME_TO_NOT_FOUND_ERROR[artifact.contractName]);
            }
            return contractAddress;
        } else {
            return addressIfExists;
        }
    }
    private _onLogStateChanged<ArgsType extends ContractEventArgs>(isRemoved: boolean, log: LogEntry): void {
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
    private _startBlockAndLogStream(isVerbose: boolean): void {
        if (!_.isUndefined(this._blockAndLogStreamerIfExists)) {
            throw new Error(ContractWrappersError.SubscriptionAlreadyPresent);
        }
        this._blockAndLogStreamerIfExists = new BlockAndLogStreamer(
            this._web3Wrapper.getBlockAsync.bind(this._web3Wrapper),
            this._web3Wrapper.getLogsAsync.bind(this._web3Wrapper),
            ContractWrapper._onBlockAndLogStreamerError.bind(this, isVerbose),
        );
        const catchAllLogFilter = {};
        this._blockAndLogStreamerIfExists.addLogFilter(catchAllLogFilter);
        this._blockAndLogStreamIntervalIfExists = intervalUtils.setAsyncExcludingInterval(
            this._reconcileBlockAsync.bind(this),
            this._blockPollingIntervalMs,
            ContractWrapper._onBlockAndLogStreamerError.bind(this, isVerbose),
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
    // HACK: This should be a package-scoped method (which doesn't exist in TS)
    // We don't want this method available in the public interface for all classes
    // who inherit from ContractWrapper, and it is only used by the internal implementation
    // of those higher classes.
    // tslint:disable-next-line:no-unused-variable
    private _setNetworkId(networkId: number): void {
        this._networkId = networkId;
    }
    private _stopBlockAndLogStream(): void {
        if (_.isUndefined(this._blockAndLogStreamerIfExists)) {
            throw new Error(ContractWrappersError.SubscriptionNotFound);
        }
        this._blockAndLogStreamerIfExists.unsubscribeFromOnLogAdded(this._onLogAddedSubscriptionToken as string);
        this._blockAndLogStreamerIfExists.unsubscribeFromOnLogRemoved(this._onLogRemovedSubscriptionToken as string);
        intervalUtils.clearAsyncExcludingInterval(this._blockAndLogStreamIntervalIfExists as NodeJS.Timer);
        delete this._blockAndLogStreamerIfExists;
    }
    private async _reconcileBlockAsync(): Promise<void> {
        const latestBlock = await this._web3Wrapper.getBlockAsync(BlockParamLiteral.Latest);
        // We need to coerce to Block type cause Web3.Block includes types for mempool blocks
        if (!_.isUndefined(this._blockAndLogStreamerIfExists)) {
            // If we clear the interval while fetching the block - this._blockAndLogStreamer will be undefined
            await this._blockAndLogStreamerIfExists.reconcileNewBlock((latestBlock as any) as Block);
        }
    }
}
