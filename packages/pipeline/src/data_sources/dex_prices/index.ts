import { fetchAsync } from '@0x/utils';
import Bottleneck from 'bottleneck';

const ONE_SECOND = 1000;
const EDPS_BASE_URL = 'http://23.22.220.126:1337';
const TIMEOUT = 30 * ONE_SECOND;

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
    // rate-limit for all API calls through this class instance
    private readonly _limiter: Bottleneck;
    constructor(maxReqsPerSecond: number) {
        this._limiter = new Bottleneck({
            minTime: ONE_SECOND / maxReqsPerSecond,
        });
    }

    /**
     * Call Ethereum DEX Price Service API.
     */
    public async getEdpsAsync(direction: string, symbol: string, amount: number): Promise<EdpsWrapper> {
        const edpsUrl = `${EDPS_BASE_URL}/${direction}?amount=${amount}&symbol=${symbol}&decimals=`;
        const resp = await this._limiter.schedule(() => fetchAsync(edpsUrl, {}, TIMEOUT));
        const respJson: EdpsResponse = await resp.json();
        const allExchanges: EdpsWrapper = {};
        // The below unwraps the response so we get 1 single EdpsWrapper object
        // instead of a list of singletons
        for (const entry of respJson) {
            for (const key of Object.keys(entry)) {
                allExchanges[key] = entry[key];
            }
        }
        return allExchanges;
    }
}
