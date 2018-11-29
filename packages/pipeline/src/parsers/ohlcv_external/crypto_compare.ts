import { CryptoCompareOHLCVRecord } from '../../data_sources/ohlcv_external/crypto_compare';
import { OHLCVExternal } from '../../entities';
import { TradingPair } from '../../utils/get_ohlcv_trading_pairs';

const oneSecond = 1000; // Crypto Compare uses timestamps in seconds instead of milliseconds

/**
 * Parses OHLCV records from Crypto Compare into an array of OHLCVExternal entities
 * @param rawRecords an array of OHLCV records from Crypto Compare (not the full response)
 */
export function parseResponse(rawRecords: CryptoCompareOHLCVRecord[], pair: TradingPair, scraped: number): OHLCVExternal[] {
  if (rawRecords.length > 1) {
    const intervalInSeconds = Math.abs(rawRecords[0].time - rawRecords[1].time);
    return rawRecords
      .filter(rec => !!rec.exchange)
      .map(rec => {
      if (!rec.exchange) {
        throw new Error(`OHLCV record is missing exchange field`); // should never reach this line
      }

      const ohlcvRecord = new OHLCVExternal();
      ohlcvRecord.exchange = rec.exchange;
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
  } else {
    return [];
  }
}
