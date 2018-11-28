import axios from 'axios';

export type CryptoCompareOHLCVResponse = {
  Data: Array<CryptoCompareOHLCVRecord>
}

export type CryptoCompareOHLCVRecord = {
  time: number,
  close: number,
  high: number,
  low: number,
  open: number,
  volumefrom: number,
  volumeto: number
}

export type CryptoCompareOHLCVParams = {
  fsym: string,
  tsym: string,
  e: string | null,
  aggregate?: string,
  aggregatePredictableTimePeriods?: Boolean,
  limit?: number,
  toTs?: number
}

export class CryptoCompareOHLCVSource {
    private readonly _url: string = 'https://min-api.cryptocompare.com/data/histohour';
    private readonly _concurrency: number = 10;

    constructor(maxConcurrentRequests: number) {
        this._concurrency = maxConcurrentRequests;
    }

    public async getAsync(params: CryptoCompareOHLCVParams): Promise<Array<CryptoCompareOHLCVRecord>> {
      const resp = await axios.get<CryptoCompareOHLCVResponse>(this._url, { params });
      return resp.data.Data;
    }

}
