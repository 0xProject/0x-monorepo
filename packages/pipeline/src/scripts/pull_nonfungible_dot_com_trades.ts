// tslint:disable:no-console
import 'reflect-metadata';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { getTradesAsync, knownPublishers } from '../data_sources/nonfungible_dot_com';
import { NonfungibleDotComTrade } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseNonFungibleDotComTrades } from '../parsers/nonfungible_dot_com';
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
    const tradesRepository = connection.getRepository(NonfungibleDotComTrade);

    for (const publisher of knownPublishers) {
        console.log(`Getting latest trades for NFT ${publisher}...`);
        const tradeWithHighestBlockNumber = await tradesRepository
            .createQueryBuilder('nonfungible_dot_com_trades')
            .where('nonfungible_dot_com_trades.publisher = :publisher', { publisher })
            .orderBy({ 'nonfungible_dot_com_trades.block_number': 'DESC' })
            .getOne();
        const highestExistingBlockNumber =
            tradeWithHighestBlockNumber === undefined ? 0 : tradeWithHighestBlockNumber.blockNumber;
        console.log(`Highest block number in existing trades: ${highestExistingBlockNumber}`);
        const rawTrades = await getTradesAsync(publisher, highestExistingBlockNumber);
        console.log(`Parsing ${rawTrades.length} trades...`);
        const trades = parseNonFungibleDotComTrades(rawTrades, publisher);
        console.log(`Saving ${rawTrades.length} trades...`);
        await tradesRepository.save(trades, { chunk: Math.ceil(trades.length / BATCH_SAVE_SIZE) });
    }
    const newTotalTrades = await tradesRepository.count();
    console.log(`Done saving trades. There are now ${newTotalTrades} total NFT trades.`);
}
