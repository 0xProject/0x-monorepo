import { OHLCVExternal, TradingPair } from '../../entities';
import { CryptoCompareOHLCVRecord } from '../../data_sources/ohlcv_external/crypto_compare';

export function parseResponse(rawResponse: Array<CryptoCompareOHLCVRecord>, pair: TradingPair, exchange: string, scraped: number): Array<OHLCVExternal> {
  const intervalInSeconds = Math.abs(rawResponse[0].time - rawResponse[1].time);
  return rawResponse.map(rec => {
    const ohlcvRecord = new OHLCVExternal();
    ohlcvRecord.exchange = exchange;
    ohlcvRecord.fromSymbol = pair.fromSymbol;
    ohlcvRecord.toSymbol = pair.toSymbol;
    ohlcvRecord.startTime = (rec.time - intervalInSeconds) * 1000;
    ohlcvRecord.endTime = rec.time * 1000;

    ohlcvRecord.open = rec.open;
    ohlcvRecord.close = rec.close;
    ohlcvRecord.low = rec.low;
    ohlcvRecord.high = rec.high;
    ohlcvRecord.volumeFrom = rec.volumefrom;
    ohlcvRecord.volumeTo = rec.volumeto;

    ohlcvRecord.source = 'CryptoCompare';
    ohlcvRecord.observedTimestamp = scraped;
    return ohlcvRecord;
  })
}
