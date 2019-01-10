import { fetchAsync, logUtils } from '@0x/utils';

const DDEX_BASE_URL = 'https://api.ddex.io/v3';
const ACTIVE_MARKETS_URL = `${DDEX_BASE_URL}/markets`;
const NO_AGGREGATION_LEVEL = 3; // See https://docs.ddex.io/#get-orderbook
const ORDERBOOK_ENDPOINT = `/orderbook?level=${NO_AGGREGATION_LEVEL}`;
export const DDEX_SOURCE = 'ddex';

export interface DdexActiveMarketsResponse {
    status: number;
    desc: string;
    data: {
        markets: DdexMarket[];
    };
}

export interface DdexMarket {
    id: string;
    quoteToken: string;
    quoteTokenDecimals: number;
    quoteTokenAddress: string;
    baseToken: string;
    baseTokenDecimals: number;
    baseTokenAddress: string;
    minOrderSize: string;
    pricePrecision: number;
    priceDecimals: number;
    amountDecimals: number;
}

export interface DdexOrderbookResponse {
    status: number;
    desc: string;
    data: {
        orderBook: DdexOrderbook;
    };
}

export interface DdexOrderbook {
    marketId: string;
    bids: DdexOrder[];
    asks: DdexOrder[];
}

export interface DdexOrder {
    price: string;
    amount: string;
    orderId: string;
}

// tslint:disable:prefer-function-over-method
// ^ Keep consistency with other sources and help logical organization
export class DdexSource {
    /**
     * Call Ddex API to find out which markets they are maintaining orderbooks for.
     */
    public async getActiveMarketsAsync(): Promise<DdexMarket[]> {
        logUtils.log('Getting all active DDEX markets');
        const resp = await fetchAsync(ACTIVE_MARKETS_URL);
        const respJson: DdexActiveMarketsResponse = await resp.json();
        const markets = respJson.data.markets;
        logUtils.log(`Got ${markets.length} markets.`);
        return markets;
    }

    /**
     * Retrieve orderbook from Ddex API for a given market.
     * @param marketId String identifying the market we want data for. Eg. 'REP/AUG'
     */
    public async getMarketOrderbookAsync(marketId: string): Promise<DdexOrderbook> {
        logUtils.log(`${marketId}: Retrieving orderbook.`);
        const marketOrderbookUrl = `${ACTIVE_MARKETS_URL}/${marketId}${ORDERBOOK_ENDPOINT}`;
        const resp = await fetchAsync(marketOrderbookUrl);
        const respJson: DdexOrderbookResponse = await resp.json();
        return respJson.data.orderBook;
    }
}
