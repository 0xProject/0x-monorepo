/**
 * Expects one argument, a date, of the form YYYY-MM-DD
 */

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
    await getAndSaveTradesAsync(process.argv[2]);
    process.exit(0);
})().catch(handleError);

/**
 * expects date to be in the form 'YYYY-MM-DD'.
 */
async function getAndSaveTradesAsync(date: string): Promise<void> {
    const apiKey = process.env.BLOXY_API_KEY;
    if (apiKey === undefined) {
        throw new Error('Missing required env var: BLOXY_API_KEY');
    }
    const bloxySource = new BloxySource(apiKey);
    const tradesRepository = connection.getRepository(DexTrade);
    logUtils.log(`Getting dex trades for ${date}...`);
    const rawTrades = await bloxySource.getDexTradesForDateAsync(date);
    logUtils.log(`Parsing ${rawTrades.length} trades...`);
    const trades = parseBloxyTrades(rawTrades);
    logUtils.log(`Saving ${trades.length} trades...`);
    await tradesRepository.save(trades, { chunk: Math.ceil(trades.length / BATCH_SAVE_SIZE) });
    logUtils.log('Done saving trades.');
}
