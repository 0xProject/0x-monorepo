// tslint:disable:no-duplicate-imports
import { fetchAsync } from '@0x/utils';
import promiseLimit = require('p-limit');
import { stringify } from 'querystring';
import * as R from 'ramda';

import { TradingPair } from '../../utils/get_ohlcv_trading_pairs';

export interface CryptoCompareOHLCVResponse {
    Data: Map<string, CryptoCompareOHLCVRecord[]>;
    Response: string;
    Message: string;
    Type: number;
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

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // tslint:disable-line:custom-no-magic-numbers
const ONE_HOUR = 60 * 60 * 1000; // tslint:disable-line:custom-no-magic-numbers
const ONE_SECOND = 1000;
const HTTP_OK_STATUS = 200;
const CRYPTO_COMPARE_VALID_EMPTY_RESPONSE_TYPE = 96;

export class CryptoCompareOHLCVSource {
    public readonly interval = ONE_WEEK; // the hourly API returns data for one week at a time
    public readonly default_exchange = 'CCCAGG';
    public readonly intervalBetweenRecords = ONE_HOUR;
    private readonly _url: string = 'https://min-api.cryptocompare.com/data/histohour?';

    // rate-limit for all API calls through this class instance
    private readonly _promiseLimit: (fetchFn: () => Promise<Response>) => Promise<Response>;
    constructor(maxConcurrentRequests: number = 50) {
        this._promiseLimit = promiseLimit(maxConcurrentRequests);
    }

    // gets OHLCV records starting from pair.latest
    public async getHourlyOHLCVAsync(pair: TradingPair): Promise<CryptoCompareOHLCVRecord[]> {
        const params = {
            e: this.default_exchange,
            fsym: pair.fromSymbol,
            tsym: pair.toSymbol,
            toTs: Math.floor((pair.latestSavedTime + this.interval) / ONE_SECOND), // CryptoCompare uses timestamp in seconds. not ms
        };
        const url = this._url + stringify(params);

        // go through the instance-wide rate-limit
        const fetchPromise: Promise<Response> = this._promiseLimit(() => {
            // tslint:disable-next-line:no-console
            console.log(`Scraping Crypto Compare at ${url}`);
            return fetchAsync(url);
        });

        const response = await Promise.resolve(fetchPromise);
        if (response.status !== HTTP_OK_STATUS) {
            throw new Error(`HTTP error while scraping Crypto Compare: [${response}]`);
        }
        const json: CryptoCompareOHLCVResponse = await response.json();
        if (
            (json.Response === 'Error' || Object.keys(json.Data).length === 0) &&
            json.Type !== CRYPTO_COMPARE_VALID_EMPTY_RESPONSE_TYPE
        ) {
            throw new Error(`Error scraping ${url}: ${json.Message}`);
        }
        return Object.values(json.Data).filter(rec => rec.time * ONE_SECOND >= pair.latestSavedTime);
    }
    public generateBackfillIntervals(pair: TradingPair): TradingPair[] {
        const now = new Date().getTime();
        const f = (p: TradingPair): false | [TradingPair, TradingPair] => {
            if (p.latestSavedTime > now) {
                return false;
            } else {
                return [p, R.merge(p, { latestSavedTime: p.latestSavedTime + this.interval })];
            }
        };
        return R.unfold(f, pair);
    }
}
