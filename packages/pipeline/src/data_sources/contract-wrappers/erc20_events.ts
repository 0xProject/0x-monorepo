import {
    ContractWrappers,
    ERC20TokenApprovalEventArgs,
    ERC20TokenEvents,
    ERC20TokenWrapper,
} from '@0x/contract-wrappers';
import { Web3ProviderEngine } from '@0x/subproviders';
import { LogWithDecodedArgs } from 'ethereum-types';

import { GetEventsFunc, getEventsWithPaginationAsync } from './utils';

export class ERC20EventsSource {
    private readonly _erc20Wrapper: ERC20TokenWrapper;
    private readonly _tokenAddress: string;
    constructor(provider: Web3ProviderEngine, networkId: number, tokenAddress: string) {
        const contractWrappers = new ContractWrappers(provider, { networkId });
        this._erc20Wrapper = contractWrappers.erc20Token;
        this._tokenAddress = tokenAddress;
    }

    public async getApprovalEventsAsync(
        startBlock: number,
        endBlock: number,
    ): Promise<Array<LogWithDecodedArgs<ERC20TokenApprovalEventArgs>>> {
        return getEventsWithPaginationAsync(
            this._getApprovalEventsForRangeAsync.bind(this) as GetEventsFunc<ERC20TokenApprovalEventArgs>,
            startBlock,
            endBlock,
        );
    }

    // Gets all approval events of for a specific sub-range. This getter
    // function will be called during each step of pagination.
    private async _getApprovalEventsForRangeAsync(
        fromBlock: number,
        toBlock: number,
    ): Promise<Array<LogWithDecodedArgs<ERC20TokenApprovalEventArgs>>> {
        return this._erc20Wrapper.getLogsAsync<ERC20TokenApprovalEventArgs>(
            this._tokenAddress,
            ERC20TokenEvents.Approval,
            { fromBlock, toBlock },
            {},
        );
    }
}
