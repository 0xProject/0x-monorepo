import { ContractWrappers, ExchangeEvents, ExchangeFillEventArgs, ExchangeWrapper } from '@0x/contract-wrappers';
import { Web3ProviderEngine } from '@0x/subproviders';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { LogWithDecodedArgs } from 'ethereum-types';

const BLOCK_FINALITY_THRESHOLD = 10; // When to consider blocks as final. Used to compute default toBlock.
const NUM_BLOCKS_PER_QUERY = 100000; // Number of blocks to query for events at a time.
const EXCHANGE_START_BLOCK = 6271590; // Block number when the Exchange contract was deployed to mainnet.

export class ExchangeEventsSource {
    private _exchangeWrapper: ExchangeWrapper;
    private _web3Wrapper: Web3Wrapper;
    constructor(provider: Web3ProviderEngine, networkId: number) {
        this._web3Wrapper = new Web3Wrapper(provider);
        const contractWrappers = new ContractWrappers(provider, { networkId });
        this._exchangeWrapper = contractWrappers.exchange;
    }

    // TODO(albrow): Get Cancel and CancelUpTo events.

    public async getFillEventsAsync(
        fromBlock: number = EXCHANGE_START_BLOCK,
        toBlock?: number,
    ): Promise<Array<LogWithDecodedArgs<ExchangeFillEventArgs>>> {
        const calculatedToBlock =
            toBlock === undefined
                ? (await this._web3Wrapper.getBlockNumberAsync()) - BLOCK_FINALITY_THRESHOLD
                : toBlock;
        let events: Array<LogWithDecodedArgs<ExchangeFillEventArgs>> = [];
        for (let currFromBlock = fromBlock; currFromBlock <= calculatedToBlock; currFromBlock += NUM_BLOCKS_PER_QUERY) {
            events = events.concat(
                await this._getFillEventsForRangeAsync(
                    currFromBlock,
                    Math.min(currFromBlock + NUM_BLOCKS_PER_QUERY - 1, calculatedToBlock),
                ),
            );
        }
        return events;
    }

    private async _getFillEventsForRangeAsync(
        fromBlock: number,
        toBlock: number,
    ): Promise<Array<LogWithDecodedArgs<ExchangeFillEventArgs>>> {
        return this._exchangeWrapper.getLogsAsync<ExchangeFillEventArgs>(
            ExchangeEvents.Fill,
            {
                fromBlock,
                toBlock,
            },
            {},
        );
    }
}
