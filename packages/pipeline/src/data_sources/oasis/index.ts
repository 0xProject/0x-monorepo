import { fetchAsync } from '@0x/utils';

const OASIS_BASE_URL = 'https://data.makerdao.com/v1';
const OASIS_MARKET_QUERY = `query {
  oasisMarkets(period: "1 week") {
    nodes {
      id
      base
      quote
      buyVol
      sellVol
      price
      high
      low
    }
  }
}`;
const OASIS_ORDERBOOK_QUERY = `query ($market: String!) {
  allOasisOrders(condition: { market: $market }) {
    totalCount
    nodes {
      market
      offerId
      price
      amount
      act
    }
  }
}`;
export const OASIS_SOURCE = 'oasis';

export interface OasisMarket {
    id: string; // market symbol e.g MKRDAI
    base: string; // base symbol   e.g MKR
    quote: string; // quote symbol  e.g DAI
    buyVol: number; // total buy volume (base)
    sellVol: number; // total sell volume (base)
    price: number; // volume weighted price (quote)
    high: number; // max sell price
    low: number; // min buy price
}

export interface OasisMarketResponse {
    data: {
        oasisMarkets: {
            nodes: OasisMarket[];
        };
    };
}

export interface OasisOrder {
    offerId: number; // Offer Id
    market: string; // Market symbol (base/quote)
    price: string; // Offer price (quote)
    amount: string; // Offer amount (base)
    act: string; // Action (ask|bid)
}

export interface OasisOrderbookResponse {
    data: {
        allOasisOrders: {
            totalCount: number;
            nodes: OasisOrder[];
        };
    };
}

// tslint:disable:prefer-function-over-method
// ^ Keep consistency with other sources and help logical organization
export class OasisSource {
    /**
     * Call Ddex API to find out which markets they are maintaining orderbooks for.
     */
    public async getActiveMarketsAsync(): Promise<OasisMarket[]> {
        const params = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: OASIS_MARKET_QUERY }),
        };
        const resp = await fetchAsync(OASIS_BASE_URL, params);
        const respJson: OasisMarketResponse = await resp.json();
        const markets = respJson.data.oasisMarkets.nodes;
        return markets;
    }

    /**
     * Retrieve orderbook from Oasis API for a given market.
     * @param marketId String identifying the market we want data for. Eg. 'REPAUG'.
     */
    public async getMarketOrderbookAsync(marketId: string): Promise<OasisOrder[]> {
        const input = {
            market: marketId,
        };
        const params = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: OASIS_ORDERBOOK_QUERY, variables: input }),
        };
        const resp = await fetchAsync(OASIS_BASE_URL, params);
        const respJson: OasisOrderbookResponse = await resp.json();
        return respJson.data.allOasisOrders.nodes;
    }
}
