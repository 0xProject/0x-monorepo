// tslint:disable:no-console
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { Web3Wrapper } from '@0x/web3-wrapper';
import 'reflect-metadata';
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { ERC20EventsSource } from '../data_sources/contract-wrappers/erc20_events';
import { ERC20ApprovalEvent } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseERC20ApprovalEvents } from '../parsers/events';
import { handleError, INFURA_ROOT_URL } from '../utils';

const NETWORK_ID = 1;
const START_BLOCK_OFFSET = 100; // Number of blocks before the last known block to consider when updating fill events.
const BATCH_SAVE_SIZE = 1000; // Number of events to save at once.
const BLOCK_FINALITY_THRESHOLD = 10; // When to consider blocks as final. Used to compute default endBlock.
const WETH_START_BLOCK = 4719568; // Block number when the WETH contract was deployed.

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const provider = web3Factory.getRpcProvider({
        rpcUrl: INFURA_ROOT_URL,
    });
    const endBlock = await calculateEndBlockAsync(provider);
    await getAndSaveWETHApprovalEventsAsync(provider, endBlock);
    process.exit(0);
})().catch(handleError);

async function getAndSaveWETHApprovalEventsAsync(provider: Web3ProviderEngine, endBlock: number): Promise<void> {
    console.log('Checking existing approval events...');
    const repository = connection.getRepository(ERC20ApprovalEvent);
    const startBlock = (await getStartBlockAsync(repository)) || WETH_START_BLOCK;

    console.log(`Getting WETH approval events starting at ${startBlock}...`);
    const wethTokenAddress = getContractAddressesForNetworkOrThrow(NETWORK_ID).etherToken;
    const eventsSource = new ERC20EventsSource(provider, NETWORK_ID, wethTokenAddress);
    const eventLogs = await eventsSource.getApprovalEventsAsync(startBlock, endBlock);

    console.log(`Parsing ${eventLogs.length} WETH approval events...`);
    const events = parseERC20ApprovalEvents(eventLogs);
    console.log(`Retrieved and parsed ${events.length} total WETH approval events.`);
    await repository.save(events, { chunk: Math.ceil(events.length / BATCH_SAVE_SIZE) });
}

async function calculateEndBlockAsync(provider: Web3ProviderEngine): Promise<number> {
    const web3Wrapper = new Web3Wrapper(provider);
    const currentBlock = await web3Wrapper.getBlockNumberAsync();
    return currentBlock - BLOCK_FINALITY_THRESHOLD;
}

async function getStartBlockAsync(repository: Repository<ERC20ApprovalEvent>): Promise<number | null> {
    const fillEventCount = await repository.count();
    if (fillEventCount === 0) {
        console.log(`No existing approval events found.`);
        return null;
    }
    const queryResult = await connection.query(
        `SELECT block_number FROM raw.erc20_approval_events ORDER BY block_number DESC LIMIT 1`,
    );
    const lastKnownBlock = queryResult[0].block_number;
    return lastKnownBlock - START_BLOCK_OFFSET;
}
