// tslint:disable:no-console
import { web3Factory } from '@0x/dev-utils';
import R = require('ramda');
import 'reflect-metadata';
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { ExchangeEventsSource } from '../data_sources/contract-wrappers/exchange_events';
import { ExchangeCancelEvent, ExchangeCancelUpToEvent, ExchangeEvent, ExchangeFillEvent } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseExchangeCancelEvents, parseExchangeCancelUpToEvents, parseExchangeFillEvents } from '../parsers/events';
import { handleError } from '../utils';

const EXCHANGE_START_BLOCK = 6271590; // Block number when the Exchange contract was deployed to mainnet.
const START_BLOCK_OFFSET = 100; // Number of blocks before the last known block to consider when updating fill events.
const BATCH_SAVE_SIZE = 1000; // Number of events to save at once.

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const provider = web3Factory.getRpcProvider({
        rpcUrl: 'https://mainnet.infura.io',
    });
    const eventsSource = new ExchangeEventsSource(provider, 1);
    await getFillEventsAsync(eventsSource);
    await getCancelEventsAsync(eventsSource);
    await getCancelUpToEventsAsync(eventsSource);
    process.exit(0);
})().catch(handleError);

async function getFillEventsAsync(eventsSource: ExchangeEventsSource): Promise<void> {
    console.log('Checking existing fill events...');
    const repository = connection.getRepository(ExchangeFillEvent);
    const startBlock = await getStartBlockAsync(repository);
    console.log(`Getting fill events starting at ${startBlock}...`);
    const eventLogs = await eventsSource.getFillEventsAsync(startBlock);
    console.log('Parsing fill events...');
    const events = parseExchangeFillEvents(eventLogs);
    console.log(`Retrieved and parsed ${events.length} total fill events.`);
    await saveEventsAsync(startBlock === EXCHANGE_START_BLOCK, repository, events);
}

async function getCancelEventsAsync(eventsSource: ExchangeEventsSource): Promise<void> {
    console.log('Checking existing cancel events...');
    const repository = connection.getRepository(ExchangeCancelEvent);
    const startBlock = await getStartBlockAsync(repository);
    console.log(`Getting cancel events starting at ${startBlock}...`);
    const eventLogs = await eventsSource.getCancelEventsAsync(startBlock);
    console.log('Parsing cancel events...');
    const events = parseExchangeCancelEvents(eventLogs);
    console.log(`Retrieved and parsed ${events.length} total cancel events.`);
    await saveEventsAsync(startBlock === EXCHANGE_START_BLOCK, repository, events);
}

async function getCancelUpToEventsAsync(eventsSource: ExchangeEventsSource): Promise<void> {
    console.log('Checking existing CancelUpTo events...');
    const repository = connection.getRepository(ExchangeCancelUpToEvent);
    const startBlock = await getStartBlockAsync(repository);
    console.log(`Getting CancelUpTo events starting at ${startBlock}...`);
    const eventLogs = await eventsSource.getCancelUpToEventsAsync(startBlock);
    console.log('Parsing CancelUpTo events...');
    const events = parseExchangeCancelUpToEvents(eventLogs);
    console.log(`Retrieved and parsed ${events.length} total CancelUpTo events.`);
    await saveEventsAsync(startBlock === EXCHANGE_START_BLOCK, repository, events);
}

const tableNameRegex = /^[a-zA-Z_]*$/;

async function getStartBlockAsync<T extends ExchangeEvent>(repository: Repository<T>): Promise<number> {
    const fillEventCount = await repository.count();
    if (fillEventCount === 0) {
        console.log(`No existing ${repository.metadata.name}s found.`);
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
    console.log(`Saving ${repository.metadata.name}s...`);
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
    console.log(`Done saving events. There are now ${totalEvents} total ${repository.metadata.name}s.`);
}

async function saveIndividuallyWithFallbackAsync<T extends ExchangeEvent>(
    repository: Repository<T>,
    events: T[],
): Promise<void> {
    // Note(albrow): This is a temporary hack because `save` is not working as
    // documented and is causing a foreign key constraint violation. Hopefully
    // can remove later because this "poor man's upsert" implementation operates
    // on one event at a time and is therefore much slower.
    for (const event of events) {
        try {
            // First try an insert.
            await repository.insert(event);
        } catch {
            // If it fails, assume it was a foreign key constraint error and try
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
                } as any,
                event as any,
            );
        }
    }
}
