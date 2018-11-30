// tslint:disable:no-console
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { CryptoCompareOHLCVSource } from '../data_sources/ohlcv_external/crypto_compare';
import { OHLCVExternal } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseRecords } from '../parsers/ohlcv_external/crypto_compare';
import { handleError } from '../utils';
import { getOHLCVTradingPairs, TradingPair } from '../utils/get_ohlcv_trading_pairs';

const MAX_CONCURRENT_REQUESTS = 18;

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const repository = connection.getRepository(OHLCVExternal);
    const source = new CryptoCompareOHLCVSource(MAX_CONCURRENT_REQUESTS);

    const tradingPairs = await getOHLCVTradingPairs(connection);
    console.log(`Starting ${tradingPairs.length} job(s) to scrape Crypto Compare for OHLCV records...`);

    const getAndSavePromises = tradingPairs.map(async pair => {
      const pairs = source.getBackfillIntervals(pair);
      return getAndSaveWithBackfillAsync(source, repository, pairs);
    });
    await Promise.all(getAndSavePromises);
    console.log(`Finished scraping OHLCV records from Crypto Compare, exiting...`);
    process.exit(0);
})().catch(handleError);

async function getAndSaveWithBackfillAsync(source: CryptoCompareOHLCVSource, repository: Repository<OHLCVExternal>, pairs: TradingPair[]): Promise<void> {
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
    if (rawRecords.length < 2) { // need minimum 2 records to calculate startTime and endTime for each record
      console.log(`No new records for ${JSON.stringify(p)}, stopping`);
      shouldContinue = false;
      return;
    }
    const parsedRecords = parseRecords(rawRecords, p, new Date().getTime());
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
