import { CryptoCompareOHLCVRecord } from '../../data_sources/ohlcv_external/crypto_compare';
import { OHLCVExternal } from '../../entities';

const ONE_SECOND = 1000; // Crypto Compare uses timestamps in seconds instead of milliseconds

export interface OHLCVMetadata {
    exchange: string;
    fromSymbol: string;
    toSymbol: string;
    source: string;
    observedTimestamp: number;
}
/**
 * Parses OHLCV records from Crypto Compare into an array of OHLCVExternal entities
 * @param rawRecords an array of OHLCV records from Crypto Compare (not the full response)
 */
export function parseRecords(rawRecords: CryptoCompareOHLCVRecord[], metadata: OHLCVMetadata): OHLCVExternal[] {
    if (rawRecords.length > 1) {
        const intervalInSeconds = Math.abs(rawRecords[0].time - rawRecords[1].time);
        return rawRecords.map(rec => {
            const ohlcvRecord = new OHLCVExternal();
            ohlcvRecord.exchange = metadata.exchange;
            ohlcvRecord.fromSymbol = metadata.fromSymbol;
            ohlcvRecord.toSymbol = metadata.toSymbol;
            ohlcvRecord.startTime = (rec.time - intervalInSeconds) * ONE_SECOND;
            ohlcvRecord.endTime = rec.time * ONE_SECOND;

            ohlcvRecord.open = rec.open;
            ohlcvRecord.close = rec.close;
            ohlcvRecord.low = rec.low;
            ohlcvRecord.high = rec.high;
            ohlcvRecord.volumeFrom = rec.volumefrom;
            ohlcvRecord.volumeTo = rec.volumeto;

            ohlcvRecord.source = metadata.source;
            ohlcvRecord.observedTimestamp = metadata.observedTimestamp;
            return ohlcvRecord;
        });
    } else {
        return [];
    }
}
