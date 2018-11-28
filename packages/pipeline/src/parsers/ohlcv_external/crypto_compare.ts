import { CryptoCompareOHLCVRecord } from '../../data_sources/ohlcv_external/crypto_compare';
import { OHLCVExternal, TradingPair } from '../../entities';

const oneSecond = 1000; // Crypto Compare uses timestamps in seconds instead of milliseconds
/**
 * Parses OHLCV records from Crypto Compare into an array of OHLCVExternal entities
 * @param rawRecords an array of OHLCV records from Crypto Compare (not the full response)
 */
export function parseResponse(rawRecords: CryptoCompareOHLCVRecord[], pair: TradingPair, exchange: string, scraped: number): OHLCVExternal[] {
  const intervalInSeconds = Math.abs(rawRecords[0].time - rawRecords[1].time);
  return rawRecords.map(rec => {
    const ohlcvRecord = new OHLCVExternal();
    ohlcvRecord.exchange = exchange;
    ohlcvRecord.fromSymbol = pair.fromSymbol;
    ohlcvRecord.toSymbol = pair.toSymbol;
    ohlcvRecord.startTime = (rec.time - intervalInSeconds) * oneSecond;
    ohlcvRecord.endTime = rec.time * oneSecond;

    ohlcvRecord.open = rec.open;
    ohlcvRecord.close = rec.close;
    ohlcvRecord.low = rec.low;
    ohlcvRecord.high = rec.high;
    ohlcvRecord.volumeFrom = rec.volumefrom;
    ohlcvRecord.volumeTo = rec.volumeto;

    ohlcvRecord.source = 'CryptoCompare';
    ohlcvRecord.observedTimestamp = scraped;
    return ohlcvRecord;
  });
}
