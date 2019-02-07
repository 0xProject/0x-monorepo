import axios from 'axios';

// URL to use for getting nft trades from nonfungible.com.
export const NONFUNGIBLE_DOT_COM_URL = 'https://nonfungible.com/api/v1';
// Number of trades to get at once. This is a hard limit enforced by the API.
const MAX_TRADES_PER_QUERY = 100;

// Note(albrow): For now this will have to be manually updated by checking
// https://nonfungible.com/
export const knownPublishers = [
    'axieinfinity',
    'cryptokitties',
    'cryptopunks',
    'cryptovoxels',
    'decentraland',
    'decentraland_estate',
    'etherbots',
    'etheremon',
    'ethtown',
    'knownorigin',
    'mythereum',
    'superrare',
];

export interface NonfungibleDotComHistoryResponse {
    data: NonfungibleDotComTrade[];
}

export interface NonfungibleDotComTrade {
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
 * Gets and returns all trades for the given publisher and starting offset.
 * Automatically handles pagination.
 * @param publisher A valid "publisher" for the nonfungible.com API. (e.g. "cryptokitties")
 * @param start The offset to start querying from.
 */
export async function getTradesAsync(publisher: string, start: number): Promise<NonfungibleDotComTrade[]> {
    const fullUrl = getFullUrlForPublisher(publisher);

    // TODO(albrow): The code below should work but will hit rate limits almost
    // immediately. Take another look after we talk more with nonfungible.com.

    // let totalTradesAvailable = Number.MAX_SAFE_INTEGER;
    // let allTrades: NonfungibleDotComTrade[] = [];

    // // Paginate by getting MAX_TRADES_PER_QUERY trades per request and
    // // incrementing offset. The API reports the total number of trades available
    // // as part of the response. We are finished after we send exactly one
    // // request where offset > totalTradesAvailable.
    // for (let offset = start; offset < totalTradesAvailable + MAX_TRADES_PER_QUERY; offset += MAX_TRADES_PER_QUERY) {
    //     const resp = await _getTradesWithOffsetAsync(fullUrl, publisher, offset);
    //     allTrades = allTrades.concat(resp.data);
    //     totalTradesAvailable = resp.recordsFiltered;
    //     console.log(`total trades available: ${totalTradesAvailable}`);
    // }
    // return allTrades;

    const resp = await _getTradesWithOffsetAsync(fullUrl, publisher, start);
    return resp.data;
}

async function _getTradesWithOffsetAsync(
    url: string,
    publisher: string,
    offset: number,
): Promise<NonfungibleDotComHistoryResponse> {
    const resp = await axios.get<NonfungibleDotComHistoryResponse>(url, {
        params: {
            publisher,
            start: offset,
            length: MAX_TRADES_PER_QUERY,
        },
    });
    return resp.data;
}

function getFullUrlForPublisher(publisher: string): string {
    return `${NONFUNGIBLE_DOT_COM_URL}/market/${publisher}/history`;
}
