import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { logUtils } from '@0x/utils';

import { CryptoCompareOHLCVSource } from '../data_sources/ohlcv_external/crypto_compare';
import { OHLCVExternal } from '../entities';
import * as ormConfig from '../ormconfig';
import { OHLCVMetadata, parseRecords } from '../parsers/ohlcv_external/crypto_compare';
import { handleError } from '../utils';
import { fetchOHLCVTradingPairsAsync, TradingPair } from '../utils/get_ohlcv_trading_pairs';

const SOURCE_NAME = 'CryptoCompare';
const TWO_HOURS_AGO = new Date().getTime() - 2 * 60 * 60 * 1000; // tslint:disable-line:custom-no-magic-numbers

const MAX_REQS_PER_SECOND = parseInt(process.env.CRYPTOCOMPARE_MAX_REQS_PER_SECOND || '15', 10); // tslint:disable-line:custom-no-magic-numbers
const EARLIEST_BACKFILL_DATE = process.env.OHLCV_EARLIEST_BACKFILL_DATE || '2014-06-01';
const EARLIEST_BACKFILL_TIME = new Date(EARLIEST_BACKFILL_DATE).getTime();

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const repository = connection.getRepository(OHLCVExternal);
    const source = new CryptoCompareOHLCVSource(MAX_REQS_PER_SECOND);

    const jobTime = new Date().getTime();
    const tradingPairs = await fetchOHLCVTradingPairsAsync(connection, SOURCE_NAME, EARLIEST_BACKFILL_TIME);
    logUtils.log(`Starting ${tradingPairs.length} job(s) to scrape Crypto Compare for OHLCV records...`);

    const fetchAndSavePromises = tradingPairs.map(async pair => {
        const pairs = source.generateBackfillIntervals(pair);
        return fetchAndSaveAsync(source, repository, jobTime, pairs);
    });
    await Promise.all(fetchAndSavePromises);
    logUtils.log(`Finished scraping OHLCV records from Crypto Compare, exiting...`);
    process.exit(0);
})().catch(handleError);

async function fetchAndSaveAsync(
    source: CryptoCompareOHLCVSource,
    repository: Repository<OHLCVExternal>,
    jobTime: number,
    pairs: TradingPair[],
): Promise<void> {
    const sortAscTimestamp = (a: TradingPair, b: TradingPair): number => {
        if (a.latestSavedTime < b.latestSavedTime) {
            return -1;
        } else if (a.latestSavedTime > b.latestSavedTime) {
            return 1;
        } else {
            return 0;
        }
    };
    pairs.sort(sortAscTimestamp);

    let i = 0;
    while (i < pairs.length) {
        const pair = pairs[i];
        if (pair.latestSavedTime > TWO_HOURS_AGO) {
            break;
        }
        try {
            const records = await source.getHourlyOHLCVAsync(pair);
            logUtils.log(`Retrieved ${records.length} records for ${JSON.stringify(pair)}`);
            if (records.length > 0) {
                const metadata: OHLCVMetadata = {
                    exchange: source.defaultExchange,
                    fromSymbol: pair.fromSymbol,
                    toSymbol: pair.toSymbol,
                    source: SOURCE_NAME,
                    observedTimestamp: jobTime,
                    interval: source.intervalBetweenRecords,
                };
                const parsedRecords = parseRecords(records, metadata);
                await saveRecordsAsync(repository, parsedRecords);
            }
            i++;
        } catch (err) {
            logUtils.log(`Error scraping OHLCVRecords, stopping task for ${JSON.stringify(pair)} [${err}]`);
            break;
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

    logUtils.log(`Saving ${records.length} records to ${repository.metadata.name}... ${JSON.stringify(metadata)}`);
    await repository.save(records);
}
