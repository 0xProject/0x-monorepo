import { stringify } from 'querystring';

import { logUtils } from '@0x/utils';

import { fetchSuccessfullyOrThrowAsync } from '../../utils';

// URL to use for getting nft trades from nonfungible.com.
export const NONFUNGIBLE_DOT_COM_URL = 'https://nonfungible.com/api/v1';
// Number of trades to get at once. This is a hard limit enforced by the API.
const MAX_TRADES_PER_QUERY = 100;

// Note(albrow): For now this will have to be manually updated by checking
// https://nonfungible.com/
export const knownPublishers = [
    'axieinfinity',
    // 'cryptokitties', // disabled until we get updated initial dump that isn't truncated
    'cryptopunks',
    'cryptovoxels',
    'decentraland',
    'decentraland_estate',
    'etherbots',
    'etheremon',
    'ethtown',
    // 'knownorigin', // disabled because of null characters in data being rejected by postgres
    'mythereum',
    'superrare',
];

export interface NonfungibleDotComHistoryResponse {
    data: NonfungibleDotComTradeResponse[];
}

export interface NonfungibleDotComTradeResponse {
    _id: string;
    transactionHash: string;
    blockNumber: number;
    logIndex: number;
    blockTimestamp: string;
    assetId: string;
    assetDescriptor: string;
    nftAddress: string;
    marketAddress: string;
    tokenTicker: string;
    totalDecimalPrice: number;
    totalPrice: string;
    usdPrice: number;
    currencyTransfer: object;
    buyer: string;
    seller: string;
    meta: object;
    image: string;
    composedOf: string;
    asset_link: string;
    seller_address_link: string;
    buyer_address_link: string;
}

/**
 * Gets and returns all trades for the given publisher, starting at the given block number.
 * Automatically handles pagination.
 * @param publisher A valid "publisher" for the nonfungible.com API. (e.g. "cryptokitties")
 * @param blockNumberStart The block number to start querying from.
 */
export async function getTradesAsync(
    publisher: string,
    blockNumberStart: number,
): Promise<NonfungibleDotComTradeResponse[]> {
    const allTrades: NonfungibleDotComTradeResponse[] = [];

    /**
     * due to high data volumes and rate limiting, we procured an initial data
     * dump from nonfungible.com.  If the requested starting block number is
     * contained in that initial dump, then pull relevant trades from there
     * first.  Later (below) we'll get the more recent trades from the API itself.
     */

    if (blockNumberStart < highestBlockNumbersInIntialDump[publisher]) {
        logUtils.log('getting trades from one-time dump');
        // caller needs trades that are in the initial data dump, so get them
        // from there, then later go to the API for the rest.
        const initialDumpResponse: NonfungibleDotComHistoryResponse = await fetchSuccessfullyOrThrowAsync(
            getInitialDumpUrl(publisher),
        );
        const initialDumpTrades = initialDumpResponse.data;
        for (const initialDumpTrade of initialDumpTrades) {
            if (!shouldProcessTrade(initialDumpTrade, allTrades)) {
                continue;
            }

            ensureNonNull(initialDumpTrade);

            allTrades.push(initialDumpTrade);
        }
        logUtils.log(`got ${allTrades.length} from one-time dump`);
    }

    const fullUrl = getFullUrlForPublisher(publisher);

    /**
     * API returns trades in reverse chronological order, so highest block
     * numbers first.  The `start` query parameter indicates how far back in
     * time (in number of trades) the results should start.  Here we iterate
     * over both start parameter values and block numbers simultaneously.
     * Start parameter values count up from zero.  Block numbers count down
     * until reaching the highest block number in the initial dump.
     */

    const blockNumberStop = Math.max(highestBlockNumbersInIntialDump[publisher] + 1, blockNumberStart);
    for (
        let startParam = 0, blockNumber = Number.MAX_SAFE_INTEGER;
        blockNumber > blockNumberStop;
        startParam += MAX_TRADES_PER_QUERY
    ) {
        const response = await _getTradesWithOffsetAsync(fullUrl, publisher, startParam);
        const tradesFromApi = response.data;
        logUtils.log(
            `got ${
                tradesFromApi.length
            } trades from API. blockNumber=${blockNumber}. blockNumberStop=${blockNumberStop}`,
        );
        for (const tradeFromApi of tradesFromApi) {
            if (tradeFromApi.blockNumber <= blockNumberStop) {
                blockNumber = blockNumberStop;
                break;
            }
            if (!shouldProcessTrade(tradeFromApi, allTrades)) {
                continue;
            }
            ensureNonNull(tradeFromApi);
            allTrades.push(tradeFromApi);
            blockNumber = tradeFromApi.blockNumber;
        }
    }

    return allTrades;
}

function shouldProcessTrade(
    trade: NonfungibleDotComTradeResponse,
    existingTrades: NonfungibleDotComTradeResponse[],
): boolean {
    // check to see if this trade is already in existingTrades
    const existingTradeIndex = existingTrades.findIndex(
        // HACK! making assumptions about composition of primary key
        e =>
            e.transactionHash === trade.transactionHash &&
            e.logIndex === trade.logIndex &&
            e.blockNumber === trade.blockNumber,
    );
    if (existingTradeIndex !== -1) {
        logUtils.log("we've already captured this trade. deciding whether to use the existing record or this one.");
        if (trade.blockNumber > existingTrades[existingTradeIndex].blockNumber) {
            logUtils.log('throwing out existing trade');
            existingTrades.splice(existingTradeIndex, 1);
        } else {
            logUtils.log('letting existing trade stand, and skipping processing of this trade');
            return false;
        }
    }
    return true;
}

const highestBlockNumbersInIntialDump: { [publisher: string]: number } = {
    axieinfinity: 7065913,
    cryptokitties: 4658171,
    cryptopunks: 7058897,
    cryptovoxels: 7060783,
    decentraland_estate: 7065181,
    decentraland: 6938962,
    etherbots: 5204980,
    etheremon: 7065370,
    ethtown: 7064126,
    knownorigin: 7065160,
    mythereum: 7065311,
    superrare: 7065955,
};

async function _getTradesWithOffsetAsync(
    url: string,
    publisher: string,
    offset: number,
): Promise<NonfungibleDotComHistoryResponse> {
    const resp: NonfungibleDotComHistoryResponse = await fetchSuccessfullyOrThrowAsync(
        `${url}?${stringify({
            publisher,
            start: offset,
            length: MAX_TRADES_PER_QUERY,
        })}`,
    );
    return resp;
}

function getFullUrlForPublisher(publisher: string): string {
    return `${NONFUNGIBLE_DOT_COM_URL}/market/${publisher}/history`;
}

function getInitialDumpUrl(publisher: string): string {
    return `https://nonfungible-dot-com-one-time-data-dump.s3.amazonaws.com/sales_summary_${publisher}.json`;
}

function ensureNonNull(trade: NonfungibleDotComTradeResponse): void {
    // these fields need to be set in order to avoid non-null
    // constraint exceptions upon database insertion.
    if (trade.logIndex === undefined) {
        // for cryptopunks
        trade.logIndex = 0;
    }
    if (trade.assetDescriptor === undefined) {
        // for cryptopunks
        trade.assetDescriptor = '';
    }
    if (trade.meta === undefined) {
        // for cryptopunks
        trade.meta = {};
    }
    if (trade.marketAddress === null) {
        // for decentraland_estate
        trade.marketAddress = '';
    }
}
