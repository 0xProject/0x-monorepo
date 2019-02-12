import { fetchAsync, logUtils } from '@0x/utils';

const EDPS_BASE_URL = 'https://ethereum-dex-prices-service.production.airswap.io';
const PRICE_BASE_URL = 'https://min-api.cryptocompare.com/data/price?tsyms=USD'

export type EdpsResponse = EdpsWrapper[]

export interface EdpsWrapper {
    [key: string]: EdpsExchange
}

export interface EdpsExchange {
    exchangeName: string,
    totalPrice: number,
    tokenAmount: number,
    tokenSymbol: string,
    avgPrice: number,
    timestamp: number,
    error: string
}

export interface PriceResponse {
    USD: number;
}

// tslint:disable:prefer-function-over-method
// ^ Keep consistency with other sources and help logical organization
export class EdpsSource {
    /**
     * Call Ethereum DEX Price Service API.
     */
    public async getEdpsAsync(direction: string, symbol: string, amount: number): Promise<Map<string, EdpsExchange>> {
        const edpsUrl = `${EDPS_BASE_URL}/${direction}?symbol=${symbol}&amount=${amount}`;
        const resp = await fetchAsync(edpsUrl);
        const respJson: EdpsResponse = await resp.json();
        const allExchanges = new Map<string, EdpsExchange>();
        for (let entry of respJson) {
            for (let key in entry) {
                allExchanges.set(key, entry[key]);
            }
        }
        return allExchanges;
    }
}

export class PriceSource {
    /**
     * Call CryptoCompare Price API to get USD price of token.
     */
    public async getUsdPriceAsync(symbol: string): Promise<number> {
        const priceUrl = `${PRICE_BASE_URL}&fsym=${symbol}`
        const resp = await fetchAsync(priceUrl);
        const respJson: PriceResponse = await resp.json();
        return respJson.USD;
    }
}