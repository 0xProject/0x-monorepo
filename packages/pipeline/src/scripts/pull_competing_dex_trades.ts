import 'reflect-metadata';
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { logUtils } from '@0x/utils';

import { BloxySource } from '../data_sources/bloxy';
import { DexTrade } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseBloxyTrades } from '../parsers/bloxy';
import { handleError } from '../utils';

// Number of trades to save at once.
const BATCH_SAVE_SIZE = 1000;

// maximum number of days into the past for which trades will be pulled. this
// is arbitrary and can be tweaked, but deep history takes a significant amount
// of time to pull.
const MAX_DAYS = 30;

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    await getAndSaveTradesAsync();
    process.exit(0);
})().catch(handleError);

async function getAndSaveTradesAsync(): Promise<void> {
    const apiKey = process.env.BLOXY_API_KEY;
    if (apiKey === undefined) {
        throw new Error('Missing required env var: BLOXY_API_KEY');
    }
    const bloxySource = new BloxySource(apiKey);
    const tradesRepository = connection.getRepository(DexTrade);
    const lastSeenTimestamp = await getLastSeenTimestampAsync(tradesRepository);
    logUtils.log(`Last seen timestamp: ${lastSeenTimestamp === 0 ? 'none' : lastSeenTimestamp}`);
    logUtils.log('Getting latest dex trades...');
    const rawTrades = await bloxySource.getDexTradesAsync(lastSeenTimestamp);
    logUtils.log(`Parsing ${rawTrades.length} trades...`);
    const trades = parseBloxyTrades(rawTrades);
    logUtils.log(`Saving ${trades.length} trades...`);
    await tradesRepository.save(trades, { chunk: Math.ceil(trades.length / BATCH_SAVE_SIZE) });
    logUtils.log('Done saving trades.');
}

async function getLastSeenTimestampAsync(tradesRepository: Repository<DexTrade>): Promise<number> {
    const hoursPerDay = 24;
    const minutesPerHour = 60;
    const secondsPerMinute = 60;
    const millisecondsPerSecond = 1000;
    const millisecondsPerDay = millisecondsPerSecond * secondsPerMinute * minutesPerHour * hoursPerDay;

    const oldestTimestampWilling = Date.now() - MAX_DAYS * millisecondsPerDay;

    if ((await tradesRepository.count()) === 0) {
        return oldestTimestampWilling;
    }

    const lastTrade: DexTrade | undefined = await tradesRepository.manager
        .createQueryBuilder()
        .select('trade')
        .from(DexTrade, 'trade')
        .orderBy('tx_timestamp', 'DESC')
        .limit(1)
        .getOne();

    if (lastTrade === undefined) {
        return oldestTimestampWilling;
    }

    return lastTrade.txTimestamp;
}
