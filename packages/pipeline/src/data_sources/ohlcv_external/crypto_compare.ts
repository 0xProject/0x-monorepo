// tslint:disable:no-duplicate-imports
import { fetchAsync } from '@0x/utils';
import Bottleneck from 'bottleneck';
import { stringify } from 'querystring';
import * as R from 'ramda';

import { TradingPair } from '../../utils/get_ohlcv_trading_pairs';

export interface CryptoCompareOHLCVResponse {
    Data: CryptoCompareOHLCVRecord[];
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

export interface CryptoCompareUsdPrice {
    USD: number;
}

const ONE_HOUR = 60 * 60 * 1000; // tslint:disable-line:custom-no-magic-numbers
const ONE_SECOND = 1000;
const ONE_HOUR_AGO = new Date().getTime() - ONE_HOUR;
const HTTP_OK_STATUS = 200;
const CRYPTO_COMPARE_VALID_EMPTY_RESPONSE_TYPE = 96;
const MAX_PAGE_SIZE = 2000;

export class CryptoCompareOHLCVSource {
    public readonly intervalBetweenRecords = ONE_HOUR;
    public readonly defaultExchange = 'CCCAGG';
    public readonly interval = this.intervalBetweenRecords * MAX_PAGE_SIZE; // the hourly API returns data for one interval at a time
    private readonly _url: string = 'https://min-api.cryptocompare.com/data/histohour?';

    // rate-limit for all API calls through this class instance
    private readonly _limiter: Bottleneck;
    constructor(maxReqsPerSecond: number) {
        this._limiter = new Bottleneck({
            minTime: ONE_SECOND / maxReqsPerSecond,
            reservoir: 30,
            reservoirRefreshAmount: 30,
            reservoirRefreshInterval: ONE_SECOND,
        });
    }

    // gets OHLCV records starting from pair.latest
    public async getHourlyOHLCVAsync(pair: TradingPair): Promise<CryptoCompareOHLCVRecord[]> {
        const params = {
            e: this.defaultExchange,
            fsym: pair.fromSymbol,
            tsym: pair.toSymbol,
            limit: MAX_PAGE_SIZE,
            toTs: Math.floor((pair.latestSavedTime + this.interval) / ONE_SECOND), // CryptoCompare uses timestamp in seconds. not ms
        };
        const url = this._url + stringify(params);
        const response = await this._limiter.schedule(() => fetchAsync(url));
        if (response.status !== HTTP_OK_STATUS) {
            throw new Error(`HTTP error while scraping Crypto Compare: [${response}]`);
        }
        const json: CryptoCompareOHLCVResponse = await response.json();
        if (
            (json.Response === 'Error' || json.Data.length === 0) &&
            json.Type !== CRYPTO_COMPARE_VALID_EMPTY_RESPONSE_TYPE
        ) {
            throw new Error(JSON.stringify(json));
        }
        return json.Data.filter(rec => {
            return (
                // Crypto Compare takes ~30 mins to finalise records
                rec.time * ONE_SECOND < ONE_HOUR_AGO && rec.time * ONE_SECOND > pair.latestSavedTime && hasData(rec)
            );
        });
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

    public async getUsdPriceAsync(symbol: string): Promise<number> {
        const priceUrl = `https://min-api.cryptocompare.com/data/price?tsyms=USD&fsym=${symbol}`;
        const resp = await fetchAsync(priceUrl);
        const respJson: CryptoCompareUsdPrice = await resp.json();
        return respJson.USD;
    }
}

function hasData(record: CryptoCompareOHLCVRecord): boolean {
    return (
        record.close !== 0 ||
        record.open !== 0 ||
        record.high !== 0 ||
        record.low !== 0 ||
        record.volumefrom !== 0 ||
        record.volumeto !== 0
    );
}
