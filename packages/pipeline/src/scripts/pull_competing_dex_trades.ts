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
    if ((await tradesRepository.count()) === 0) {
        return 0;
    }
    const response = (await connection.query(
        'SELECT tx_timestamp FROM raw.dex_trades ORDER BY tx_timestamp DESC LIMIT 1',
    )) as Array<{ tx_timestamp: number }>;
    if (response.length === 0) {
        return 0;
    }
    return response[0].tx_timestamp;
}
