// tslint:disable:no-console
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { CryptoCompareOHLCVSource } from '../data_sources/ohlcv_external/crypto_compare';
import { OHLCVExternal, TradingPair } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseResponse } from '../parsers/ohlcv_external/crypto_compare';
import { handleError } from '../utils';

const exchange = 'CCCAGG'; // defaults to CryptoCompare aggregated average
const beginningOfTime = new Date('2010-09-01').getTime(); // the time when BTC/USD info starts appearing on Crypto Compare
const maxConcurrentRequests = 50;

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const repository = connection.getRepository(OHLCVExternal);
    const source = new CryptoCompareOHLCVSource(maxConcurrentRequests);

    const tradingPairs = await getTradingPairsAsync(connection);
    console.log(`Starting ${tradingPairs.length} jobs to scrape Crypto Compare for OHLCV records...`);

    const getAndSavePromises = tradingPairs.map(async pair => {
      const latest = await getLatestAsync(repository, pair);
      console.log(`Scraping OHLCV records from CryptoCompare starting from ${latest}...`);

      // const backfill: Boolean = latest < new Date().getTime() - 7*24*60*60*1000 // one week ago
      const backfill = false;
      await getAndSaveAsync(source, repository, pair, latest, backfill);
    });
    await Promise.all(getAndSavePromises);
    process.exit(0);
})().catch(handleError);

async function getTradingPairsAsync(conn: Connection): Promise<TradingPair[]> {
  return [
    {
      fromSymbol: 'ETH',
      toSymbol: 'USD',
      source: 'CryptoCompare',
    },
    {
      fromSymbol: 'ETH',
      toSymbol: 'EUR',
      source: 'CryptoCompare',
    },
    {
      fromSymbol: 'ETH',
      toSymbol: 'ZRX',
      source: 'CryptoCompare',
    },
  ];
}

async function getLatestAsync(repository: Repository<OHLCVExternal>, pair: TradingPair): Promise<number> {
  const query = await repository.find({
    where: {
      fromSymbol: pair.fromSymbol,
      toSymbol: pair.toSymbol,
    },
    order: {
      endTime: 'DESC',
    },
    take: 1,
  });
  if (!query[0]) {
    return beginningOfTime;
  }
  return query[0].endTime;
}

async function getAndSaveAsync(source: CryptoCompareOHLCVSource, repository: Repository<OHLCVExternal>, pair: TradingPair, fromTimestamp: number, backfill: boolean): Promise<void> {
  const oneSecond = 1000;
  if (backfill) {
    return;
    // await backfillOHLCVExternalAsync(source, pair, fromTimestamp, e);
  } else {
    const now = new Date().getTime();
    const params = {
      e: exchange,
      fsym: pair.fromSymbol,
      tsym: pair.toSymbol,
      toTs: Math.floor(now / oneSecond), // CryptoCompare uses timestamp in seconds. not ms
    };
    const rawRecords = await source.getAsync(params);
    console.log(`Scraped ${rawRecords.length} OHLCV records from CryptoCompare`);

    if (!rawRecords.length) {
      return;
    }
    const parsedRecords = parseResponse(rawRecords, pair, exchange, now)
      .filter(rec => rec.startTime >= fromTimestamp);
    await saveRecordsAsync<OHLCVExternal>(repository, parsedRecords);
  }
}

async function saveRecordsAsync<T>(repository: Repository<T>, records: T[]): Promise<void> {
  console.log(`Saving ${records.length} records to ${repository.metadata.name}...`);
  await repository.insert(records);
}
