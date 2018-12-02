// tslint:disable:no-console
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { CryptoCompareOHLCVSource } from '../data_sources/ohlcv_external/crypto_compare';
import { OHLCVExternal } from '../entities';
import * as ormConfig from '../ormconfig';
import { OHLCVMetadata, parseRecords } from '../parsers/ohlcv_external/crypto_compare';
import { handleError } from '../utils';
import { getOHLCVTradingPairs, TradingPair } from '../utils/get_ohlcv_trading_pairs';

const SOURCE_NAME = 'CryptoCompare';

// convert these to env variables
const MAX_CONCURRENT_REQUESTS = 18;
const EARLIEST_BACKFILL_TIME = new Date('2010-09-01').getTime(); // the time when BTC/USD info starts appearing on Crypto Compare

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const repository = connection.getRepository(OHLCVExternal);
    const source = new CryptoCompareOHLCVSource(MAX_CONCURRENT_REQUESTS);

    const tradingPairs = await getOHLCVTradingPairs(connection, SOURCE_NAME, EARLIEST_BACKFILL_TIME);
    console.log(`Starting ${tradingPairs.length} job(s) to scrape Crypto Compare for OHLCV records...`);

    const getAndSavePromises = tradingPairs.map(async pair => {
        const pairs = source.getBackfillIntervals(pair);
        return getAndSaveWithBackfillAsync(source, repository, pairs);
    });
    await Promise.all(getAndSavePromises);
    console.log(`Finished scraping OHLCV records from Crypto Compare, exiting...`);
    process.exit(0);
})().catch(handleError);

async function getAndSaveWithBackfillAsync(
    source: CryptoCompareOHLCVSource,
    repository: Repository<OHLCVExternal>,
    pairs: TradingPair[],
): Promise<void> {
    const sortAscTimestamp = (a: TradingPair, b: TradingPair): number => {
        if (a.latest < b.latest) {
            return -1;
        } else if (a.latest > b.latest) {
            return 1;
        } else {
            return 0;
        }
    };
    pairs.sort(sortAscTimestamp);

    let i = 0;
    let shouldContinue = true;
    while (i < pairs.length && shouldContinue) {
        const p = pairs[i];
        const rawRecords = await source.getAsync(p);

        // need minimum 2 records to calculate startTime and endTime for each record
        if (rawRecords.length < 2) {
            i++;
            continue;
        }
        const metadata: OHLCVMetadata = {
            exchange: source.default_exchange,
            fromSymbol: p.fromSymbol,
            toSymbol: p.toSymbol,
            source: SOURCE_NAME,
            observedTimestamp: new Date().getTime(),
        };
        const parsedRecords = parseRecords(rawRecords, metadata);
        try {
            await saveRecordsAsync(repository, parsedRecords);
            i++;
        } catch (e) {
            console.log(`Error saving OHLCVRecords, stopping task for ${JSON.stringify(p)} [${e}]`);
            shouldContinue = false;
        }
    }
    return Promise.resolve();
}

async function saveRecordsAsync(repository: Repository<OHLCVExternal>, records: OHLCVExternal[]): Promise<void> {
    const metadata = [
        records[0].fromSymbol,
        records[0].toSymbol,
        new Date(records[0].startTime),
        new Date(records[records.length - 1].endTime),
    ];

    console.log(`Saving ${records.length} records to ${repository.metadata.name}... ${JSON.stringify(metadata)}`);
    await repository.insert(records);
}
