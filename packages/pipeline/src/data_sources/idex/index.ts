import { fetchAsync, logUtils } from '@0x/utils';

const IDEX_BASE_URL = 'https://api.idex.market';
const MARKETS_URL = `${IDEX_BASE_URL}/returnTicker`;
const ORDERBOOK_URL = `${IDEX_BASE_URL}/returnOrderBook`;
const MAX_ORDER_COUNT = 100; // Maximum based on https://github.com/AuroraDAO/idex-api-docs#returnorderbook
export const IDEX_SOURCE = 'idex';

export interface IdexMarketsResponse {
    [marketName: string]: IdexMarket;
}

export interface IdexMarket {
    last: string;
    high: string;
    low: string;
    lowestAsk: string;
    highestBid: string;
    percentChange: string;
    baseVolume: string;
    quoteVolume: string;
}

export interface IdexOrderbook {
    asks: IdexOrder[];
    bids: IdexOrder[];
}

export interface IdexOrder {
    price: string;
    amount: string;
    total: string;
    orderHash: string;
    params: IdexOrderParam;
}

export interface IdexOrderParam {
    tokenBuy: string;
    buySymbol: string;
    buyPrecision: number;
    amountBuy: string;
    tokenSell: string;
    sellSymbol: string;
    sellPrecision: number;
    amountSell: string;
    expires: number;
    nonce: number;
    user: string;
}

// tslint:disable:prefer-function-over-method
// ^ Keep consistency with other sources and help logical organization
export class IdexSource {
    /**
     * Call Idex API to find out which markets they are maintaining orderbooks for.
     */
    public async getMarketsAsync(): Promise<string[]> {
        logUtils.log('Getting all IDEX markets');
        const params = { method: 'POST' };
        const resp = await fetchAsync(MARKETS_URL, params);
        const respJson: IdexMarketsResponse = await resp.json();
        const markets: string[] = Object.keys(respJson);
        logUtils.log(`Got ${markets.length} markets.`);
        return markets;
    }

    /**
     * Retrieve orderbook from Idex API for a given market.
     * @param marketId String identifying the market we want data for. Eg. 'REP_AUG'
     */
    public async getMarketOrderbookAsync(marketId: string): Promise<IdexOrderbook> {
        logUtils.log(`${marketId}: Retrieving orderbook.`);
        const params = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                market: marketId,
                count: MAX_ORDER_COUNT,
            }),
        };
        const resp = await fetchAsync(ORDERBOOK_URL, params);
        const respJson: IdexOrderbook = await resp.json();
        return respJson;
    }
}
