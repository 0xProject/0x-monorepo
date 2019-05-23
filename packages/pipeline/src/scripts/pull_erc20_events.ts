import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import 'reflect-metadata';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { ERC20EventsSource } from '../data_sources/contract-wrappers/erc20_events';
import { ERC20ApprovalEvent } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseERC20ApprovalEvents } from '../parsers/events';
import { handleError, INFURA_ROOT_URL } from '../utils';

const NETWORK_ID = 1;
const START_BLOCK_OFFSET = 100; // Number of blocks before the last known block to consider when updating fill events.
const BATCH_SAVE_SIZE = 1000; // Number of events to save at once.
const BLOCK_FINALITY_THRESHOLD = 10; // When to consider blocks as final. Used to compute default endBlock.

let connection: Connection;

interface Token {
    // name is used for logging only.
    name: string;
    address: string;
    defaultStartBlock: number;
}

const tokensToGetApprovalEvents: Token[] = [
    {
        name: 'WETH',
        address: getContractAddressesForNetworkOrThrow(NETWORK_ID).etherToken,
        defaultStartBlock: 4719568, // Block when the WETH contract was deployed.
    },
    {
        name: 'ZRX',
        address: getContractAddressesForNetworkOrThrow(NETWORK_ID).zrxToken,
        defaultStartBlock: 4145415, // Block when the ZRX contract was deployed.
    },
    {
        name: 'DAI',
        address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        defaultStartBlock: 4752008, // Block when the DAI contract was deployed.
    },
];

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const provider = web3Factory.getRpcProvider({
        rpcUrl: INFURA_ROOT_URL,
    });
    const endBlock = await calculateEndBlockAsync(provider);
    for (const token of tokensToGetApprovalEvents) {
        await getAndSaveApprovalEventsAsync(provider, token, endBlock);
    }
    process.exit(0);
})().catch(handleError);

async function getAndSaveApprovalEventsAsync(
    provider: Web3ProviderEngine,
    token: Token,
    endBlock: number,
): Promise<void> {
    logUtils.log(`Getting approval events for ${token.name}...`);
    logUtils.log('Checking existing approval events...');
    const repository = connection.getRepository(ERC20ApprovalEvent);
    const startBlock = (await getStartBlockAsync(token)) || token.defaultStartBlock;

    logUtils.log(`Getting approval events starting at ${startBlock}...`);
    const eventsSource = new ERC20EventsSource(provider, NETWORK_ID, token.address);
    const eventLogs = await eventsSource.getApprovalEventsAsync(startBlock, endBlock);

    logUtils.log(`Parsing ${eventLogs.length} approval events...`);
    const events = parseERC20ApprovalEvents(eventLogs);
    logUtils.log(`Retrieved and parsed ${events.length} total approval events.`);
    await repository.save(events, { chunk: Math.ceil(events.length / BATCH_SAVE_SIZE) });
}

async function calculateEndBlockAsync(provider: Web3ProviderEngine): Promise<number> {
    const web3Wrapper = new Web3Wrapper(provider);
    const currentBlock = await web3Wrapper.getBlockNumberAsync();
    return currentBlock - BLOCK_FINALITY_THRESHOLD;
}

async function getStartBlockAsync(token: Token): Promise<number | null> {
    const queryResult = await connection.query(
        `SELECT block_number FROM raw.erc20_approval_events WHERE token_address = $1 ORDER BY block_number DESC LIMIT 1`,
        [token.address],
    );
    if (queryResult.length === 0) {
        logUtils.log(`No existing approval events found for ${token.name}.`);
        return null;
    }
    const lastKnownBlock = queryResult[0].block_number;
    return lastKnownBlock - START_BLOCK_OFFSET;
}
