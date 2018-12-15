// tslint:disable:no-console
import { web3Factory } from '@0x/dev-utils';
import * as Parallel from 'async-parallel';
import R = require('ramda');
import 'reflect-metadata';
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { Web3Source } from '../data_sources/web3';
import { Block } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseBlock } from '../parsers/web3';
import { handleError, INFURA_ROOT_URL } from '../utils';

// Number of blocks to save at once.
const BATCH_SAVE_SIZE = 1000;
// Maximum number of requests to send at once.
const MAX_CONCURRENCY = 10;
// Maximum number of blocks to query for at once. This is also the maximum
// number of blocks we will hold in memory prior to being saved to the database.
const MAX_BLOCKS_PER_QUERY = 1000;

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const provider = web3Factory.getRpcProvider({
        rpcUrl: INFURA_ROOT_URL,
    });
    const web3Source = new Web3Source(provider);
    await getAllMissingBlocksAsync(web3Source);
    process.exit(0);
})().catch(handleError);

interface MissingBlocksResponse {
    block_number: string;
}

async function getAllMissingBlocksAsync(web3Source: Web3Source): Promise<void> {
    const blocksRepository = connection.getRepository(Block);
    let fromBlock = 0;
    while (true) {
        const blockNumbers = await getMissingBlockNumbersAsync(fromBlock);
        if (blockNumbers.length === 0) {
            // There are no more missing blocks. We're done.
            break;
        }
        await getAndSaveBlocksAsync(web3Source, blocksRepository, blockNumbers);
        fromBlock = Math.max(...blockNumbers) + 1;
    }
    const totalBlocks = await blocksRepository.count();
    console.log(`Done saving blocks. There are now ${totalBlocks} total blocks.`);
}

async function getMissingBlockNumbersAsync(fromBlock: number): Promise<number[]> {
    console.log(`Checking for missing blocks starting at ${fromBlock}...`);
    // Note(albrow): The easiest way to get all the blocks we need is to
    // consider all the events tables together in a single query. If this query
    // gets too slow, we should consider re-architecting so that we can work on
    // getting the blocks for one type of event at a time.
    const response = (await connection.query(
        `WITH all_events AS (
            SELECT block_number FROM raw.exchange_fill_events
                UNION SELECT block_number FROM raw.exchange_cancel_events
                UNION SELECT block_number FROM raw.exchange_cancel_up_to_events
                UNION SELECT block_number FROM raw.erc20_approval_events
        )
        SELECT DISTINCT(block_number) FROM all_events
            WHERE block_number NOT IN (SELECT number FROM raw.blocks)
                AND block_number >= $1
            ORDER BY block_number ASC LIMIT $2`,
        [fromBlock, MAX_BLOCKS_PER_QUERY],
    )) as MissingBlocksResponse[];
    const blockNumberStrings = R.pluck('block_number', response);
    const blockNumbers = R.map(parseInt, blockNumberStrings);
    console.log(`Found ${blockNumbers.length} missing blocks in the given range.`);
    return blockNumbers;
}

async function getAndSaveBlocksAsync(
    web3Source: Web3Source,
    blocksRepository: Repository<Block>,
    blockNumbers: number[],
): Promise<void> {
    console.log(`Getting block data for ${blockNumbers.length} blocks...`);
    Parallel.setConcurrency(MAX_CONCURRENCY);
    const rawBlocks = await Parallel.map(blockNumbers, async (blockNumber: number) =>
        web3Source.getBlockInfoAsync(blockNumber),
    );
    console.log(`Parsing ${rawBlocks.length} blocks...`);
    const blocks = R.map(parseBlock, rawBlocks);
    console.log(`Saving ${blocks.length} blocks...`);
    await blocksRepository.save(blocks, { chunk: Math.ceil(blocks.length / BATCH_SAVE_SIZE) });
}
