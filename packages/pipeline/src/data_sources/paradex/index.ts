// tslint:disable:no-console
import axios from 'axios';

const PARADEX_BASE_URL = 'https://api.paradex.io/consumer';
const ACTIVE_MARKETS_URL = PARADEX_BASE_URL + '/v0/markets';
const ORDERBOOK_ENDPOINT = PARADEX_BASE_URL + '/v0/orderbook';
const TOKEN_INFO_ENDPOINT = PARADEX_BASE_URL + '/v0/tokens';
export const PARADEX_SOURCE = 'paradex';

export interface ParadexActiveMarketsResponse extends Array<ParadexMarket> {}

export interface ParadexMarket {
    id: string;
    symbol: string;
    baseToken: string;
    quoteToken: string;
    minOrderSize: string;
    maxOrderSize: string;
    priceMaxDecimals: number;
    amountMaxDecimals: number;
    // These are not native to the Paradex API response. We tag them on later
    // by calling the token endpoint and joining on symbol.
    baseTokenAddress?: string;
    quoteTokenAddress?: string;
}

export interface ParadexOrderbookResponse {
    marketId: number;
    marketSymbol: string;
    bids: ParadexOrder[];
    asks: ParadexOrder[];
}

export interface ParadexOrder {
    amount: string;
    price: string;
}

export interface ParadexTokenInfoResponse extends Array<ParadexTokenInfo> {}

export interface ParadexTokenInfo {
    name: string;
    symbol: string;
    address: string;
}

export class ParadexSource {
    private readonly _apiKey: string;

    constructor(apiKey: string) {
        this._apiKey = apiKey;
    }

    /**
     * Call Paradex API to find out which markets they are maintaining orderbooks for.
     */
    public async getActiveMarketsAsync(): Promise<ParadexActiveMarketsResponse> {
        console.log('Getting all active Paradex markets.');
        const resp = await axios.get<ParadexActiveMarketsResponse>(ACTIVE_MARKETS_URL, {
            headers: { 'API-KEY': this._apiKey },
        });
        const markets = resp.data;
        console.log(`Got ${markets.length} markets.`);
        return markets;
    }

    /**
     * Call Paradex API to find out their token information.
     */
    public async getTokenInfoAsync(): Promise<ParadexTokenInfoResponse> {
        console.log('Getting token information from Paradex.');
        const resp = await axios.get<ParadexTokenInfoResponse>(TOKEN_INFO_ENDPOINT, {
            headers: { 'API-KEY': this._apiKey },
        });
        const tokens = resp.data;
        console.log(`Got information for ${tokens.length} tokens.`);
        return tokens;
    }

    /**
     * Retrieve orderbook from Paradex API for a given market.
     * @param marketSymbol String representing the market we want data for.
     */
    public async getMarketOrderbookAsync(marketSymbol: string): Promise<ParadexOrderbookResponse> {
        console.log(`${marketSymbol}: Retrieving orderbook.`);
        const marketOrderbookUrl = ORDERBOOK_ENDPOINT + `?market=${marketSymbol}`;
        const resp = await axios.get<ParadexOrderbookResponse>(marketOrderbookUrl, {
            headers: { 'API-KEY': this._apiKey },
        });
        return resp.data;
    }
}
