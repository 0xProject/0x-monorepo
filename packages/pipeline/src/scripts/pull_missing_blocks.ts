import { web3Factory } from '@0x/dev-utils';
import { logUtils } from '@0x/utils';

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
const MAX_CONCURRENCY = 20;
// Maximum number of blocks to query for at once. This is also the maximum
// number of blocks we will hold in memory prior to being saved to the database.
const MAX_BLOCKS_PER_QUERY = 1000;

let connection: Connection;

const tablesWithMissingBlocks = [
    'raw.exchange_fill_events',
    'raw.exchange_cancel_events',
    'raw.exchange_cancel_up_to_events',
    'raw.erc20_approval_events',
];

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const provider = web3Factory.getRpcProvider({
        rpcUrl: INFURA_ROOT_URL,
    });
    const web3Source = new Web3Source(provider);
    for (const tableName of tablesWithMissingBlocks) {
        await getAllMissingBlocksAsync(web3Source, tableName);
    }
    process.exit(0);
})().catch(handleError);

interface MissingBlocksResponse {
    block_number: string;
}

async function getAllMissingBlocksAsync(web3Source: Web3Source, tableName: string): Promise<void> {
    const blocksRepository = connection.getRepository(Block);
    while (true) {
        logUtils.log(`Checking for missing blocks in ${tableName}...`);
        const blockNumbers = await getMissingBlockNumbersAsync(tableName);
        if (blockNumbers.length === 0) {
            // There are no more missing blocks. We're done.
            break;
        }
        await getAndSaveBlocksAsync(web3Source, blocksRepository, blockNumbers);
    }
    const totalBlocks = await blocksRepository.count();
    logUtils.log(`Done saving blocks for ${tableName}. There are now ${totalBlocks} total blocks.`);
}

async function getMissingBlockNumbersAsync(tableName: string): Promise<number[]> {
    // This query returns up to `MAX_BLOCKS_PER_QUERY` distinct block numbers
    // which are present in `tableName` but not in `raw.blocks`.
    const response = (await connection.query(
        `SELECT DISTINCT(block_number) FROM ${tableName} LEFT JOIN raw.blocks ON ${tableName}.block_number = raw.blocks.number WHERE number IS NULL LIMIT $1;`,
        [MAX_BLOCKS_PER_QUERY],
    )) as MissingBlocksResponse[];
    const blockNumberStrings = R.pluck('block_number', response);
    const blockNumbers = R.map(parseInt, blockNumberStrings);
    logUtils.log(`Found ${blockNumbers.length} missing blocks.`);
    return blockNumbers;
}

async function getAndSaveBlocksAsync(
    web3Source: Web3Source,
    blocksRepository: Repository<Block>,
    blockNumbers: number[],
): Promise<void> {
    logUtils.log(`Getting block data for ${blockNumbers.length} blocks...`);
    Parallel.setConcurrency(MAX_CONCURRENCY);
    const rawBlocks = await Parallel.map(blockNumbers, async (blockNumber: number) =>
        web3Source.getBlockInfoAsync(blockNumber),
    );
    logUtils.log(`Parsing ${rawBlocks.length} blocks...`);
    const blocks = R.map(parseBlock, rawBlocks);
    logUtils.log(`Saving ${blocks.length} blocks...`);
    await blocksRepository.save(blocks, { chunk: Math.ceil(blocks.length / BATCH_SAVE_SIZE) });
    logUtils.log('Done saving this batch of blocks');
}
