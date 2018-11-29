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
  exchange?: string; // added metadata, not part of API response
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
const defaultExchange = 'CCCAGG'; // defaults to Crypto Compare aggregated average
const oneWeek = 7 * 24 * 60 * 60 * 1000;
const oneSecond = 1000;

export class CryptoCompareOHLCVSource {
    private readonly _url: string = 'https://min-api.cryptocompare.com/data/histohour';
    private readonly _plimit: (fetchFn: () => Promise<AxiosResponse<CryptoCompareOHLCVResponse>>) => Promise<AxiosResponse<CryptoCompareOHLCVResponse>>;

    constructor(maxConcurrentRequests: number) {
        this._plimit = promiseLimit(maxConcurrentRequests);
    }

    public async getAsync(pair: TradingPair): Promise<CryptoCompareOHLCVRecord[]> {
      const params = {
        e: defaultExchange,
        fsym: pair.fromSymbol,
        tsym: pair.toSymbol,
        toTs: Math.floor((pair.latest + oneWeek) / oneSecond), // CryptoCompare uses timestamp in seconds. not ms
      };

      const fetchPromise = this._plimit(() => {
        // tslint:disable:no-console
        console.log(`Scraping Crypto Compare with ${JSON.stringify(params)}`);
        return axios.get<CryptoCompareOHLCVResponse>(this._url, { params });
      });

      const resp = await Promise.resolve(fetchPromise);

      return resp.data.Data
        .filter(rec => rec.time * oneSecond >= pair.latest)
        .map(rec => {
          rec.exchange = defaultExchange;
          return rec;
        });

    }

}

/**
 * Expand a single trading pair into an array of trading pairs with a range of timestamps starting from the original pair and ending in the present timestamp
 * @param interval the interval between timestamps, in milliseconds
 */
export function getBackfillIntervals(pair: TradingPair, interval: number = oneWeek): TradingPair[] {
    const now = new Date().getTime();
    const f = (p: TradingPair): false | [TradingPair, TradingPair] => {
      if (p.latest > now) {
        return false;
      } else {
        return [
          p,
          merge(p, { latest: p.latest + interval }),
        ];
      }
    };
    const pairs = unfold(f, pair);
    return pairs;
  }
