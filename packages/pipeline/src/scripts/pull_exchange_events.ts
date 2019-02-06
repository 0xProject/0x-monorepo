import { web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import R = require('ramda');
import 'reflect-metadata';
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { ExchangeEventsSource } from '../data_sources/contract-wrappers/exchange_events';
import { ExchangeCancelEvent, ExchangeCancelUpToEvent, ExchangeEvent, ExchangeFillEvent } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseExchangeCancelEvents, parseExchangeCancelUpToEvents, parseExchangeFillEvents } from '../parsers/events';
import { EXCHANGE_START_BLOCK, handleError, INFURA_ROOT_URL } from '../utils';

const START_BLOCK_OFFSET = 100; // Number of blocks before the last known block to consider when updating fill events.
const BATCH_SAVE_SIZE = 1000; // Number of events to save at once.
const BLOCK_FINALITY_THRESHOLD = 10; // When to consider blocks as final. Used to compute default endBlock.

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const provider = web3Factory.getRpcProvider({
        rpcUrl: INFURA_ROOT_URL,
    });
    const endBlock = await calculateEndBlockAsync(provider);
    const eventsSource = new ExchangeEventsSource(provider, 1);
    await getFillEventsAsync(eventsSource, endBlock);
    await getCancelEventsAsync(eventsSource, endBlock);
    await getCancelUpToEventsAsync(eventsSource, endBlock);
    process.exit(0);
})().catch(handleError);

async function getFillEventsAsync(eventsSource: ExchangeEventsSource, endBlock: number): Promise<void> {
    logUtils.log('Checking existing fill events...');
    const repository = connection.getRepository(ExchangeFillEvent);
    const startBlock = await getStartBlockAsync(repository);
    logUtils.log(`Getting fill events starting at ${startBlock}...`);
    const eventLogs = await eventsSource.getFillEventsAsync(startBlock, endBlock);
    logUtils.log('Parsing fill events...');
    const events = parseExchangeFillEvents(eventLogs);
    logUtils.log(`Retrieved and parsed ${events.length} total fill events.`);
    await saveEventsAsync(startBlock === EXCHANGE_START_BLOCK, repository, events);
}

async function getCancelEventsAsync(eventsSource: ExchangeEventsSource, endBlock: number): Promise<void> {
    logUtils.log('Checking existing cancel events...');
    const repository = connection.getRepository(ExchangeCancelEvent);
    const startBlock = await getStartBlockAsync(repository);
    logUtils.log(`Getting cancel events starting at ${startBlock}...`);
    const eventLogs = await eventsSource.getCancelEventsAsync(startBlock, endBlock);
    logUtils.log('Parsing cancel events...');
    const events = parseExchangeCancelEvents(eventLogs);
    logUtils.log(`Retrieved and parsed ${events.length} total cancel events.`);
    await saveEventsAsync(startBlock === EXCHANGE_START_BLOCK, repository, events);
}

async function getCancelUpToEventsAsync(eventsSource: ExchangeEventsSource, endBlock: number): Promise<void> {
    logUtils.log('Checking existing CancelUpTo events...');
    const repository = connection.getRepository(ExchangeCancelUpToEvent);
    const startBlock = await getStartBlockAsync(repository);
    logUtils.log(`Getting CancelUpTo events starting at ${startBlock}...`);
    const eventLogs = await eventsSource.getCancelUpToEventsAsync(startBlock, endBlock);
    logUtils.log('Parsing CancelUpTo events...');
    const events = parseExchangeCancelUpToEvents(eventLogs);
    logUtils.log(`Retrieved and parsed ${events.length} total CancelUpTo events.`);
    await saveEventsAsync(startBlock === EXCHANGE_START_BLOCK, repository, events);
}

const tableNameRegex = /^[a-zA-Z_]*$/;

async function getStartBlockAsync<T extends ExchangeEvent>(repository: Repository<T>): Promise<number> {
    const fillEventCount = await repository.count();
    if (fillEventCount === 0) {
        logUtils.log(`No existing ${repository.metadata.name}s found.`);
        return EXCHANGE_START_BLOCK;
    }
    const tableName = repository.metadata.tableName;
    if (!tableNameRegex.test(tableName)) {
        throw new Error(`Unexpected special character in table name: ${tableName}`);
    }
    const queryResult = await connection.query(
        `SELECT block_number FROM raw.${tableName} ORDER BY block_number DESC LIMIT 1`,
    );
    const lastKnownBlock = queryResult[0].block_number;
    return lastKnownBlock - START_BLOCK_OFFSET;
}

async function saveEventsAsync<T extends ExchangeEvent>(
    isInitialPull: boolean,
    repository: Repository<T>,
    events: T[],
): Promise<void> {
    logUtils.log(`Saving ${repository.metadata.name}s...`);
    if (isInitialPull) {
        // Split data into numChunks pieces of maximum size BATCH_SAVE_SIZE
        // each.
        for (const eventsBatch of R.splitEvery(BATCH_SAVE_SIZE, events)) {
            await repository.insert(eventsBatch);
        }
    } else {
        // If we possibly have some overlap where we need to update some
        // existing events, we need to use our workaround/fallback.
        await saveIndividuallyWithFallbackAsync(repository, events);
    }
    const totalEvents = await repository.count();
    logUtils.log(`Done saving events. There are now ${totalEvents} total ${repository.metadata.name}s.`);
}

async function saveIndividuallyWithFallbackAsync<T extends ExchangeEvent>(
    repository: Repository<T>,
    events: T[],
): Promise<void> {
    // Note(albrow): This is a temporary hack because `save` is not working as
    // documented and is causing a primary key constraint violation. Hopefully
    // can remove later because this "poor man's upsert" implementation operates
    // on one event at a time and is therefore much slower.
    for (const event of events) {
        try {
            // First try an insert.
            await repository.insert(event);
        } catch (err) {
            if (err.message.includes('duplicate key value violates unique constraint')) {
                logUtils.log("Ignore the preceeding INSERT failure; it's not unexpected");
            } else {
                throw err;
            }
            // If it fails, assume it was a primary key constraint error and try
            // doing an update instead.
            // Note(albrow): Unfortunately the `as any` hack here seems
            // required. I can't figure out how to convince the type-checker
            // that the criteria and the entity itself are the correct type for
            // the given repository. If we can remove the `save` hack then this
            // will probably no longer be necessary.
            await repository.update(
                {
                    contractAddress: event.contractAddress,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                    transactionHash: event.transactionHash,
                } as any,
                event as any,
            );
        }
    }
}

async function calculateEndBlockAsync(provider: Web3ProviderEngine): Promise<number> {
    const web3Wrapper = new Web3Wrapper(provider);
    const currentBlock = await web3Wrapper.getBlockNumberAsync();
    return currentBlock - BLOCK_FINALITY_THRESHOLD;
}
