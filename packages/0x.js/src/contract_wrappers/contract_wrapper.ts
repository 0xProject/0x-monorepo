import { intervalUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Block, BlockAndLogStreamer } from 'ethereumjs-blockstream';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import {
    Artifact,
    BlockParamLiteral,
    BlockRange,
    ContractEventArgs,
    ContractEvents,
    EventCallback,
    IndexedFilterValues,
    InternalZeroExError,
    LogWithDecodedArgs,
    RawLog,
    ZeroExError,
} from '../types';
import { AbiDecoder } from '../utils/abi_decoder';
import { constants } from '../utils/constants';
import { filterUtils } from '../utils/filter_utils';

const CONTRACT_NAME_TO_NOT_FOUND_ERROR: {
    [contractName: string]: ZeroExError;
} = {
    ZRX: ZeroExError.ZRXContractDoesNotExist,
    EtherToken: ZeroExError.EtherTokenContractDoesNotExist,
    Token: ZeroExError.TokenContractDoesNotExist,
    TokenRegistry: ZeroExError.TokenRegistryContractDoesNotExist,
    TokenTransferProxy: ZeroExError.TokenTransferProxyContractDoesNotExist,
    Exchange: ZeroExError.ExchangeContractDoesNotExist,
};

export class ContractWrapper {
    protected _web3Wrapper: Web3Wrapper;
    private _networkId: number;
    private _abiDecoder?: AbiDecoder;
    private _blockAndLogStreamerIfExists: BlockAndLogStreamer | undefined;
    private _blockAndLogStreamInterval: NodeJS.Timer;
    private _filters: { [filterToken: string]: Web3.FilterObject };
    private _filterCallbacks: {
        [filterToken: string]: EventCallback<ContractEventArgs>;
    };
    private _onLogAddedSubscriptionToken: string | undefined;
    private _onLogRemovedSubscriptionToken: string | undefined;
    constructor(web3Wrapper: Web3Wrapper, networkId: number, abiDecoder?: AbiDecoder) {
        this._web3Wrapper = web3Wrapper;
        this._networkId = networkId;
        this._abiDecoder = abiDecoder;
        this._filters = {};
        this._filterCallbacks = {};
        this._blockAndLogStreamerIfExists = undefined;
        this._onLogAddedSubscriptionToken = undefined;
        this._onLogRemovedSubscriptionToken = undefined;
    }
    protected unsubscribeAll(): void {
        const filterTokens = _.keys(this._filterCallbacks);
        _.each(filterTokens, filterToken => {
            this._unsubscribe(filterToken);
        });
    }
    protected _unsubscribe(filterToken: string, err?: Error): void {
        if (_.isUndefined(this._filters[filterToken])) {
            throw new Error(ZeroExError.SubscriptionNotFound);
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
        abi: Web3.ContractAbi,
        callback: EventCallback<ArgsType>,
    ): string {
        const filter = filterUtils.getFilter(address, eventName, indexFilterValues, abi);
        if (_.isUndefined(this._blockAndLogStreamerIfExists)) {
            this._startBlockAndLogStream();
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
        abi: Web3.ContractAbi,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        const filter = filterUtils.getFilter(address, eventName, indexFilterValues, abi, blockRange);
        const logs = await this._web3Wrapper.getLogsAsync(filter);
        const logsWithDecodedArguments = _.map(logs, this._tryToDecodeLogOrNoop.bind(this));
        return logsWithDecodedArguments;
    }
    protected _tryToDecodeLogOrNoop<ArgsType extends ContractEventArgs>(
        log: Web3.LogEntry,
    ): LogWithDecodedArgs<ArgsType> | RawLog {
        if (_.isUndefined(this._abiDecoder)) {
            throw new Error(InternalZeroExError.NoAbiDecoder);
        }
        const logWithDecodedArgs = this._abiDecoder.tryToDecodeLogOrNoop(log);
        return logWithDecodedArgs;
    }
    protected async _instantiateContractIfExistsAsync(
        artifact: Artifact,
        addressIfExists?: string,
    ): Promise<Web3.ContractInstance> {
        let contractAddress: string;
        if (_.isUndefined(addressIfExists)) {
            if (_.isUndefined(artifact.networks[this._networkId])) {
                throw new Error(ZeroExError.ContractNotDeployedOnNetwork);
            }
            contractAddress = artifact.networks[this._networkId].address.toLowerCase();
        } else {
            contractAddress = addressIfExists;
        }
        const doesContractExist = await this._web3Wrapper.doesContractExistAtAddressAsync(contractAddress);
        if (!doesContractExist) {
            throw new Error(CONTRACT_NAME_TO_NOT_FOUND_ERROR[artifact.contract_name]);
        }
        const contractInstance = this._web3Wrapper.getContractInstance(artifact.abi, contractAddress);
        return contractInstance;
    }
    protected _getContractAddress(artifact: Artifact, addressIfExists?: string): string {
        if (_.isUndefined(addressIfExists)) {
            const contractAddress = artifact.networks[this._networkId].address;
            if (_.isUndefined(contractAddress)) {
                throw new Error(ZeroExError.ExchangeContractDoesNotExist);
            }
            return contractAddress;
        } else {
            return addressIfExists;
        }
    }
    private _onLogStateChanged<ArgsType extends ContractEventArgs>(isRemoved: boolean, log: Web3.LogEntry): void {
        _.forEach(this._filters, (filter: Web3.FilterObject, filterToken: string) => {
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
    private _startBlockAndLogStream(): void {
        if (!_.isUndefined(this._blockAndLogStreamerIfExists)) {
            throw new Error(ZeroExError.SubscriptionAlreadyPresent);
        }
        this._blockAndLogStreamerIfExists = new BlockAndLogStreamer(
            this._web3Wrapper.getBlockAsync.bind(this._web3Wrapper),
            this._web3Wrapper.getLogsAsync.bind(this._web3Wrapper),
        );
        const catchAllLogFilter = {};
        this._blockAndLogStreamerIfExists.addLogFilter(catchAllLogFilter);
        this._blockAndLogStreamInterval = intervalUtils.setAsyncExcludingInterval(
            this._reconcileBlockAsync.bind(this),
            constants.DEFAULT_BLOCK_POLLING_INTERVAL,
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
    private _setNetworkId(networkId: number): void {
        this._networkId = networkId;
    }
    private _stopBlockAndLogStream(): void {
        if (_.isUndefined(this._blockAndLogStreamerIfExists)) {
            throw new Error(ZeroExError.SubscriptionNotFound);
        }
        this._blockAndLogStreamerIfExists.unsubscribeFromOnLogAdded(this._onLogAddedSubscriptionToken as string);
        this._blockAndLogStreamerIfExists.unsubscribeFromOnLogRemoved(this._onLogRemovedSubscriptionToken as string);
        intervalUtils.clearAsyncExcludingInterval(this._blockAndLogStreamInterval);
        delete this._blockAndLogStreamerIfExists;
    }
    private async _reconcileBlockAsync(): Promise<void> {
        try {
            const latestBlock = await this._web3Wrapper.getBlockAsync(BlockParamLiteral.Latest);
            // We need to coerce to Block type cause Web3.Block includes types for mempool blocks
            if (!_.isUndefined(this._blockAndLogStreamerIfExists)) {
                // If we clear the interval while fetching the block - this._blockAndLogStreamer will be undefined
                await this._blockAndLogStreamerIfExists.reconcileNewBlock((latestBlock as any) as Block);
            }
        } catch (err) {
            const filterTokens = _.keys(this._filterCallbacks);
            _.each(filterTokens, filterToken => {
                this._unsubscribe(filterToken, err);
            });
        }
    }
}
