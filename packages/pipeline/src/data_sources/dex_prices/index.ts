import { fetchAsync } from '@0x/utils';

const EDPS_BASE_URL = 'https://ethereum-dex-prices-service.production.airswap.io';

export type EdpsResponse = EdpsWrapper[];

export interface EdpsWrapper {
    [key: string]: EdpsExchange;
}

export interface EdpsExchange {
    exchangeName: string;
    totalPrice: number;
    tokenAmount: number;
    tokenSymbol: string;
    avgPrice: number;
    timestamp: number;
    error: string;
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
        for (const entry of respJson) {
            for (const key of Object.keys(entry)) {
                allExchanges.set(key, entry[key]);
            }
        }
        return allExchanges;
    }
}
