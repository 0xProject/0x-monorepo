import {
    ContractWrappers,
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    ExchangeEventArgs,
    ExchangeEvents,
    ExchangeFillEventArgs,
    ExchangeWrapper,
} from '@0x/contract-wrappers';
import { Web3ProviderEngine } from '@0x/subproviders';
import { LogWithDecodedArgs } from 'ethereum-types';

import { GetEventsFunc, getEventsWithPaginationAsync } from './utils';

export class ExchangeEventsSource {
    private readonly _exchangeWrapper: ExchangeWrapper;
    constructor(provider: Web3ProviderEngine, networkId: number) {
        const contractWrappers = new ContractWrappers(provider, { networkId });
        this._exchangeWrapper = contractWrappers.exchange;
    }

    public async getFillEventsAsync(
        startBlock: number,
        endBlock: number,
    ): Promise<Array<LogWithDecodedArgs<ExchangeFillEventArgs>>> {
        const getFillEventsForRangeAsync = this._makeGetterFuncForEventType<ExchangeFillEventArgs>(ExchangeEvents.Fill);
        return getEventsWithPaginationAsync(getFillEventsForRangeAsync, startBlock, endBlock);
    }

    public async getCancelEventsAsync(
        startBlock: number,
        endBlock: number,
    ): Promise<Array<LogWithDecodedArgs<ExchangeCancelEventArgs>>> {
        const getCancelEventsForRangeAsync = this._makeGetterFuncForEventType<ExchangeCancelEventArgs>(
            ExchangeEvents.Cancel,
        );
        return getEventsWithPaginationAsync(getCancelEventsForRangeAsync, startBlock, endBlock);
    }

    public async getCancelUpToEventsAsync(
        startBlock: number,
        endBlock: number,
    ): Promise<Array<LogWithDecodedArgs<ExchangeCancelUpToEventArgs>>> {
        const getCancelUpToEventsForRangeAsync = this._makeGetterFuncForEventType<ExchangeCancelUpToEventArgs>(
            ExchangeEvents.CancelUpTo,
        );
        return getEventsWithPaginationAsync(getCancelUpToEventsForRangeAsync, startBlock, endBlock);
    }

    // Returns a getter function which gets all events of a specific type for a
    // specific sub-range. This getter function will be called during each step
    // of pagination.
    private _makeGetterFuncForEventType<ArgsType extends ExchangeEventArgs>(
        eventType: ExchangeEvents,
    ): GetEventsFunc<ArgsType> {
        return async (fromBlock: number, toBlock: number) =>
            this._exchangeWrapper.getLogsAsync<ArgsType>(eventType, { fromBlock, toBlock }, {});
    }
}
