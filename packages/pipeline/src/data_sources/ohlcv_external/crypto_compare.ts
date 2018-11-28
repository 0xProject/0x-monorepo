import axios from 'axios';

export interface CryptoCompareOHLCVResponse {
  Data: CryptoCompareOHLCVRecord[];
}

export interface CryptoCompareOHLCVRecord {
  time: number;
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
  e: string | null;
  aggregate?: string;
  aggregatePredictableTimePeriods?: boolean;
  limit?: number;
  toTs?: number;
}

export class CryptoCompareOHLCVSource {
    private readonly _url: string = 'https://min-api.cryptocompare.com/data/histohour';
    private readonly _concurrency: number = 10;

    constructor(maxConcurrentRequests: number) {
        this._concurrency = maxConcurrentRequests;
    }

    public async getAsync(params: CryptoCompareOHLCVParams): Promise<CryptoCompareOHLCVRecord[]> {
      if (this._concurrency <= 0) {
        return [];
      }
      const resp = await axios.get<CryptoCompareOHLCVResponse>(this._url, { params });
      return resp.data.Data;
    }

}
