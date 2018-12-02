// tslint:disable:no-duplicate-imports
import { AxiosResponse } from 'axios';
import axios from 'axios';
import promiseLimit = require('p-limit');

import { merge, unfold } from 'ramda';

import { TradingPair } from '../../utils/get_ohlcv_trading_pairs';

export interface CryptoCompareOHLCVResponse {
    Data: CryptoCompareOHLCVRecord[];
}

export interface CryptoCompareOHLCVRecord {
    time: number; // in seconds, not milliseconds
    close: number;
    high: number;
    low: number;
    open: number;
    volumefrom: number;
    volumeto: number;
}

export interface CryptoCompareOHLCVParams {
    fsym: string;
    tsym: string;
    e?: string;
    aggregate?: string;
    aggregatePredictableTimePeriods?: boolean;
    limit?: number;
    toTs?: number;
}

// tslint:disable:custom-no-magic-numbers
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
const ONE_SECOND = 1000;

const HISTORICAL_HOURLY_OHLCV_URI = 'https://min-api.cryptocompare.com/data/histohour';

export class CryptoCompareOHLCVSource {
    public readonly interval = ONE_WEEK; // the hourly API returns data for one week at a time
    public readonly default_exchange = 'CCCAGG';
    private readonly _url: string = HISTORICAL_HOURLY_OHLCV_URI;
    private readonly _plimit: (
        fetchFn: () => Promise<AxiosResponse<CryptoCompareOHLCVResponse>>,
    ) => Promise<AxiosResponse<CryptoCompareOHLCVResponse>>;

    constructor(maxConcurrentRequests: number = 50) {
        this._plimit = promiseLimit(maxConcurrentRequests);
    }

    // gets OHLCV records starting from pair.latest
    public async getAsync(pair: TradingPair): Promise<CryptoCompareOHLCVRecord[]> {
        const params = {
            e: this.default_exchange,
            fsym: pair.fromSymbol,
            tsym: pair.toSymbol,
            toTs: Math.floor((pair.latest + this.interval) / ONE_SECOND), // CryptoCompare uses timestamp in seconds. not ms
        };

        const fetchPromise = this._plimit(() => {
            // tslint:disable:no-console
            console.log(`Scraping Crypto Compare with ${JSON.stringify(params)}`);
            return axios.get<CryptoCompareOHLCVResponse>(this._url, { params });
        });

        const resp = await Promise.resolve(fetchPromise);

        if (Object.keys(resp.data.Data).length < 2) {
            console.log(`No data found for ${JSON.stringify(params)}`);
            return [];
        }
        return resp.data.Data.filter(rec => rec.time * ONE_SECOND >= pair.latest);
    }

    public getBackfillIntervals(pair: TradingPair): TradingPair[] {
        const now = new Date().getTime();
        const f = (p: TradingPair): false | [TradingPair, TradingPair] => {
            if (p.latest > now) {
                return false;
            } else {
                return [p, merge(p, { latest: p.latest + this.interval })];
            }
        };
        const pairs = unfold(f, pair);
        return pairs;
    }
}
