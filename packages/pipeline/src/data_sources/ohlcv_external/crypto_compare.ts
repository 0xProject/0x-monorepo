import axios from 'axios';

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

const exchange = 'CCCAGG'; // defaults to Crypto Compare aggregated average

export class CryptoCompareOHLCVSource {
    private readonly _url: string = 'https://min-api.cryptocompare.com/data/histohour';
    private readonly _concurrency: number = 10;

    constructor(maxConcurrentRequests: number) {
        this._concurrency = maxConcurrentRequests;
    }

    public async getAsync(pair: TradingPair): Promise<CryptoCompareOHLCVRecord[]> {
      if (this._concurrency <= 0) {
        return [];
      }

      // tslint:disable:custom-no-magic-numbers
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const oneSecond = 1000;
      const shouldBackfill: boolean = pair.latest < new Date().getTime() - oneWeek; // Crypto Compare returns one week of hourly data at a time
      if (shouldBackfill) {
        return [];
      } else {
        const now = new Date().getTime();
        const params = {
          e: exchange,
          fsym: pair.fromSymbol,
          tsym: pair.toSymbol,
          toTs: Math.floor(now / oneSecond), // CryptoCompare uses timestamp in seconds. not ms
        };
        const resp = await axios.get<CryptoCompareOHLCVResponse>(this._url, { params });
        return resp.data.Data
        .filter(rec => rec.time * oneSecond >= pair.latest)
        .map(rec => {
          rec.exchange = exchange;
          return rec;
        });
    }
  }
}
