// tslint:disable:no-console
import axios from 'axios';

const DDEX_BASE_URL = 'https://api.ddex.io/v2';
const ACTIVE_MARKETS_URL = DDEX_BASE_URL + '/markets';
const ORDERBOOK_ENDPOINT = '/orderbook?level=3';
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
    maxOrderSize: string;
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
        console.log('Getting all active DDEX markets');
        const resp = await axios.get<DdexActiveMarketsResponse>(ACTIVE_MARKETS_URL);
        const markets = resp.data.data.markets;
        console.log(`Got ${markets.length} markets.`);
        return markets;
    }

    /**
     * Retrieve orderbook from Ddex API for a given market.
     * @param marketId String identifying the market we want data for.
     */
    public async getMarketOrderbookAsync(marketId: string): Promise<DdexOrderbook> {
        console.log(`${marketId}: Retrieving orderbook.`);
        const marketOrderbookUrl = ACTIVE_MARKETS_URL + '/' + marketId + ORDERBOOK_ENDPOINT;
        const resp = await axios.get<DdexOrderbookResponse>(marketOrderbookUrl);
        return resp.data.data.orderBook;
    }
}
