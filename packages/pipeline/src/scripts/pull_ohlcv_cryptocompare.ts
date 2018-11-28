// tslint:disable:no-console
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { CryptoCompareOHLCVSource } from '../data_sources/ohlcv_external/crypto_compare';
import { OHLCVExternal } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseResponse } from '../parsers/ohlcv_external/crypto_compare';
import { handleError } from '../utils';
import { getOHLCVTradingPairs, TradingPair } from '../utils/get_ohlcv_trading_pairs';

const maxConcurrentRequests = 50;

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const repository = connection.getRepository(OHLCVExternal);
    const source = new CryptoCompareOHLCVSource(maxConcurrentRequests);

    const tradingPairs = await getOHLCVTradingPairs(connection);
    console.log(`Starting ${tradingPairs.length} jobs to scrape Crypto Compare for OHLCV records...`);

    const getAndSavePromises = tradingPairs.map(async pair => {
      await getAndSaveAsync(source, repository, pair);
    });
    await Promise.all(getAndSavePromises);
    console.log(`Finished scraping OHLCV records from Crypto Compare, exiting...`);
    process.exit(0);
})().catch(handleError);

async function getAndSaveAsync(source: CryptoCompareOHLCVSource, repository: Repository<OHLCVExternal>, pair: TradingPair): Promise<void> {
    const rawRecords = await source.getAsync(pair);

    if (!rawRecords.length) {
      return;
    }
    const parsedRecords = parseResponse(rawRecords, pair, new Date().getTime());
    await saveRecordsAsync(repository, parsedRecords);
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
