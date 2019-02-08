// tslint:disable:no-console
import 'reflect-metadata';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { getTradesAsync } from '../data_sources/nonfungible_dot_com';
import { NftTrade } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseNonFungibleDotComTrades } from '../parsers/non_fungible_dot_com';
import { handleError } from '../utils';

// Number of trades to save at once.
const BATCH_SAVE_SIZE = 1000;

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    await getAndSaveTrades();
    process.exit(0);
})().catch(handleError);

async function getAndSaveTrades(): Promise<void> {
    const tradesRepository = connection.getRepository(NftTrade);
    console.log('Getting latest NFT trades...');
    // TODO(albrow): Pull NFT trades for all publishers, not just cryptokitties.
    const tradeWithHighestBlockNumber = await tradesRepository
        .createQueryBuilder('nonfungible_dot_com')
        .where('nonfungible_dot_com.publisher = :publisher', { publisher: 'cryptokitties' })
        .orderBy({ 'nonfungible_dot_com.block_number': 'DESC' })
        .getOne();
    const highestExistingBlockNumber =
        tradeWithHighestBlockNumber === undefined ? 0 : tradeWithHighestBlockNumber.blockNumber;
    console.log(`Highest block number in existing trades: ${highestExistingBlockNumber}`);
    const rawTrades = await getTradesAsync('cryptokitties', highestExistingBlockNumber);
    console.log(`Parsing ${rawTrades.length} trades...`);
    const trades = parseNonFungibleDotComTrades(rawTrades, 'cryptokitties');
    console.log(`Saving ${rawTrades.length} trades...`);
    await tradesRepository.save(trades, { chunk: Math.ceil(trades.length / BATCH_SAVE_SIZE) });
    const newTotalTrades = await tradesRepository.count();
    console.log(`Done saving trades. There are now ${newTotalTrades} total NFT trades.`);
}
