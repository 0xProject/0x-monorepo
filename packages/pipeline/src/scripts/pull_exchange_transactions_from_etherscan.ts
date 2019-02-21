import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { getContractAddressesForNetworkOrThrow, NetworkId } from '@0x/contract-addresses';
import { web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { EtherscanSource } from '../data_sources/etherscan';
import { EtherscanTransaction } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseEtherscanTransactions } from '../parsers/etherscan';
import { EXCHANGE_START_BLOCK, handleError, INFURA_ROOT_URL } from '../utils';

const BATCH_SAVE_SIZE = 1000; // Number of orders to save at once.
const START_BLOCK_OFFSET = 100; // Number of blocks before the last known block to consider when updating fill events.
const BLOCK_FINALITY_THRESHOLD = 10; // When to consider blocks as final. Used to compute default endBlock.

// API key to use if environment variable has not been set
const FALLBACK_API_KEY = 'YourApiKeyToken';

let connection: Connection;

(async () => {
    let apiKey = process.env.ETHERSCAN_API_KEY;
    if (apiKey === undefined) {
        logUtils.log(`Missing env var: ETHERSCAN_API_KEY - using default API key: ${FALLBACK_API_KEY}`);
        apiKey = FALLBACK_API_KEY;
    }
    connection = await createConnection(ormConfig as ConnectionOptions);
    const provider = web3Factory.getRpcProvider({
        rpcUrl: INFURA_ROOT_URL,
    });
    const EtherscanTransactionRepository = connection.getRepository(EtherscanTransaction);
    const startBlock = await getStartBlockAsync(EtherscanTransactionRepository);
    logUtils.log(`Start block: ${startBlock}`);
    const endBlock = await calculateEndBlockAsync(provider);
    logUtils.log(`End block: ${endBlock}`);
    const etherscanSource = new EtherscanSource(apiKey, startBlock, endBlock);
    const exchangeContractAddress = getContractAddressesForNetworkOrThrow(NetworkId.Mainnet).exchange;
    logUtils.log('Fetching exchange transactions from Etherscan...');
    const rawTransactions = await etherscanSource.getEtherscanTransactionsForAddressAsync(exchangeContractAddress);
    const transactions = parseEtherscanTransactions(rawTransactions);
    logUtils.log(`Saving ${transactions.length} records to database`);
    await EtherscanTransactionRepository.save(transactions, { chunk: Math.ceil(transactions.length / BATCH_SAVE_SIZE) });
    logUtils.log('Done');
    process.exit(0);
})().catch(handleError);

async function getStartBlockAsync<T>(repository: Repository<T>): Promise<number> {
    const transactionsCount = await repository.count();
    if (transactionsCount === 0) {
        logUtils.log(`No existing ${repository.metadata.name}s found.`);
        return EXCHANGE_START_BLOCK;
    }
    const tableName = repository.metadata.tableName;
    const queryResult = await connection.query(
        `SELECT block_number FROM raw.${tableName} ORDER BY block_number DESC LIMIT 1`,
    );
    const lastKnownBlock = queryResult[0].block_number;
    return lastKnownBlock - START_BLOCK_OFFSET;
}

async function calculateEndBlockAsync(provider: Web3ProviderEngine): Promise<number> {
    const web3Wrapper = new Web3Wrapper(provider);
    const currentBlock = await web3Wrapper.getBlockNumberAsync();
    return currentBlock - BLOCK_FINALITY_THRESHOLD;
}
