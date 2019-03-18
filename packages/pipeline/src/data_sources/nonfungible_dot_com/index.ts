import { stringify } from 'querystring';

import { logUtils } from '@0x/utils';

import { fetchSuccessfullyOrThrowAsync } from '../../utils';

// URL to use for getting nft trades from nonfungible.com.
export const NONFUNGIBLE_DOT_COM_URL = 'https://nonfungible.com/api/v1';
// Number of trades to get at once. This is a hard limit enforced by the API.
const MAX_TRADES_PER_QUERY = 100;
// Chunk sizes for trade history splitting for storage on S3.  cryptokitties is 800 MB.  others are manageable.
export const S3_CHUNK_SIZES: { [publisher: string]: number } = {
    cryptokitties: 40000, // 40K trades puts the chunk file size on a par with the axieinfinity file size.
};

// Note(albrow): For now this will have to be manually updated by checking
// https://nonfungible.com/
export const knownPublishers = [
    'axieinfinity',
    'chainbreakers',
    'chibifighters',
    'cryptokitties',
    'cryptopunks',
    'cryptovoxels',
    'decentraland',
    'decentraland_estate',
    'etherbots',
    'etheremon',
    'ethtown',
    // 'knownorigin', // disabled because of null characters in data being rejected by postgres
    // 'mythereum', // worked at one time, but now seems dead
    'mlbcryptobaseball',
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
    blockTimestamp: string | number; // string from API, number from initial dump
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
 * @param blockNumberStart The block number to start querying from.  A value of
 * 0 indicates that trades should be pulled from the initial dump before
 * querying the API.
 */
export async function getTradesAsync(
    publisher: string,
    blockNumberStart: number,
): Promise<NonfungibleDotComTradeResponse[]> {
    /**
     * Because we need to de-duplicate trades as they come in, and because some
     * projects have a ton of trades (eg cryptokitties), we can't do a simple
     * O(n^2) search for each trade in all of the trades we've already received.
     * So, we temporarily store trades in a map, for quick lookup while
     * de-duplicating.  Later, we'll convert the map to an array for the
     * caller.
     */
    const blockNumberToTrades = new Map<number, NonfungibleDotComTradeResponse[]>();

    /**
     * The API returns trades in reverse chronological order, so highest block
     * numbers first.  This variable dictates when to stop pulling trades from
     * the API.
     */
    let blockNumberStop = blockNumberStart;

    /**
     * Due to high data volumes and rate limiting, we procured an initial data
     * dump from nonfungible.com.  If the sentinel value 0 is passed for
     * `blockNumberStart`, that indicates we should pull trades from the
     * initial dump before going to the API.
     */
    if (blockNumberStop === 0) {
        logUtils.log('getting trades from initial dump');
        const initialDumpResponse: NonfungibleDotComHistoryResponse = await getInitialDumpTradesAsync(publisher);
        const initialDumpTrades = initialDumpResponse.data;
        logUtils.log(`got ${initialDumpTrades.length} trades from initial dump.`);
        for (const initialDumpTrade of initialDumpTrades) {
            ensureNonNull(initialDumpTrade);

            if (doesTradeAlreadyExist(initialDumpTrade, blockNumberToTrades)) {
                continue;
            }

            if (!blockNumberToTrades.has(initialDumpTrade.blockNumber)) {
                blockNumberToTrades.set(initialDumpTrade.blockNumber, []);
            }

            const tradesForBlock = blockNumberToTrades.get(initialDumpTrade.blockNumber);
            if (tradesForBlock === undefined) {
                throw new Error('tradesForBlock is undefined');
            }

            tradesForBlock.push(initialDumpTrade);
            blockNumberStop = initialDumpTrade.blockNumber;
        }
    }

    /**
     * The API returns trades in reverse chronological order, so highest block
     * numbers first.  The `start` query parameter indicates how far back in
     * time (in number of trades) the results should start.  Here we iterate
     * over both start parameter values and block numbers simultaneously.
     * Start parameter values count up from zero.  Block numbers count down
     * until reaching `blockNumberStop`.
     */
    for (
        let startParam = 0, blockNumber = Number.MAX_SAFE_INTEGER;
        blockNumber > blockNumberStop;
        startParam += MAX_TRADES_PER_QUERY
    ) {
        const response = await _getTradesWithOffsetAsync(getFullUrlForPublisher(publisher), publisher, startParam);
        const tradesFromApi = response.data;
        if (tradesFromApi.length === 0) {
            break;
        }
        logUtils.log(
            `got ${
                tradesFromApi.length
            } trades from API. blockNumber=${blockNumber}. blockNumberStop=${blockNumberStop}`,
        );
        for (const tradeFromApi of tradesFromApi) {
            ensureNonNull(tradeFromApi);

            // convert date from "2019-03-06T17:36:24.000Z" to unix epoch integer
            const msPerSec = 1000;
            tradeFromApi.blockTimestamp = Math.floor(new Date(tradeFromApi.blockTimestamp).valueOf() / msPerSec);

            if (tradeFromApi.blockNumber <= blockNumberStop) {
                blockNumber = blockNumberStop;
                break;
            }

            if (doesTradeAlreadyExist(tradeFromApi, blockNumberToTrades)) {
                continue;
            }

            if (!blockNumberToTrades.has(tradeFromApi.blockNumber)) {
                blockNumberToTrades.set(tradeFromApi.blockNumber, []);
            }

            const tradesForBlock = blockNumberToTrades.get(tradeFromApi.blockNumber);
            if (tradesForBlock === undefined) {
                throw new Error('tradesForBlock is undefined');
            }

            tradesForBlock.push(tradeFromApi);
            blockNumber = tradeFromApi.blockNumber;
        }
    }

    /**
     * now that we have all the trades in the map, convert that map to a simple array for the caller.
     */
    const allTrades: NonfungibleDotComTradeResponse[] = [];
    for (const blockNumber of blockNumberToTrades.keys()) {
        const tradesForBlock = blockNumberToTrades.get(blockNumber);
        if (tradesForBlock === undefined) {
            throw new Error('tradesForBlock is undefined');
        }
        for (const trade of tradesForBlock) {
            allTrades.push(trade);
        }
    }

    return allTrades;
}

function doesTradeAlreadyExist(
    trade: NonfungibleDotComTradeResponse,
    existingTrades: Map<number, NonfungibleDotComTradeResponse[]>,
): boolean {
    // check to see if this trade is already in existingTrades

    const tradesForBlock: NonfungibleDotComTradeResponse[] | undefined = existingTrades.get(trade.blockNumber);

    if (tradesForBlock === undefined) {
        return false;
    }

    if (
        tradesForBlock.find(
            // HACK! making assumptions about composition of primary key
            e =>
                e.transactionHash === trade.transactionHash &&
                e.assetId === trade.assetId &&
                e.blockNumber === trade.blockNumber &&
                e.logIndex === trade.logIndex,
        ) === undefined
    ) {
        return false;
    }

    return true;
}

const numberOfTradesInInitialDump: { [publisher: string]: number } = {
    cryptokitties: 1986316,
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

function ensureNonNull(trade: NonfungibleDotComTradeResponse): void {
    // these fields need to be set in order to avoid non-null
    // constraint exceptions upon database insertion.
    if (trade.logIndex === undefined) {
        // for cryptopunks and cryptokitties
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

async function getInitialDumpTradesAsync(publisher: string): Promise<NonfungibleDotComHistoryResponse> {
    const s3UrlPrefix = 'https://nonfungible-dot-com-one-time-data-dump.s3.amazonaws.com/sales_summary_';

    // large data sets (eg cryptokitties) need to be chunked for ease of I/O with S3.
    // this function expects data to be chunked per ../../../scripts/partition_nonfungible_dot_com_dump.ts
    if (S3_CHUNK_SIZES.hasOwnProperty(publisher)) {
        let reconsolidated: NonfungibleDotComTradeResponse[] = [];
        const numberOfChunks = Math.ceil(numberOfTradesInInitialDump[publisher] / S3_CHUNK_SIZES[publisher]);
        logUtils.log(`Retrieving ${numberOfChunks} separate chunks from S3.`);
        for (let i = 0; i < numberOfChunks; i++) {
            logUtils.log(`Retrieving chunk ${i}...`);
            const chunkData = await fetchSuccessfullyOrThrowAsync(`${s3UrlPrefix}${publisher}${i}.json`);
            reconsolidated = reconsolidated.concat(chunkData);
        }
        return { data: reconsolidated };
    }
    try {
        return await fetchSuccessfullyOrThrowAsync(`${s3UrlPrefix}${publisher}.json`);
    } catch (error) {
        logUtils.log(`Failed to retrieve initial dump for publisher '${publisher}'.  Assuming there isn't one.`);
        return { data: [] };
    }
}
