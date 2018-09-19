import { AbiDecoder } from '@0xproject/utils';
import { default as axios } from 'axios';
import { BlockParam, BlockParamLiteral, DecodedLogArgs, LogEntry, LogWithDecodedArgs } from 'ethereum-types';
import * as R from 'ramda';

import { artifacts } from './artifacts';

// const EXCHANGE_ADDRESS = '0x4f833a24e1f95d70f028921e27040ca56e09ab0b';
const ETHERSCAN_URL = 'https://api.etherscan.io/api';
// TOOD(albrow): Pass this in as a constructor argument instead of an env var.
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

// Raw response from etherescan.io
interface EventsResponse {
    status: string;
    message: string;
    result: EventsResponseResult[];
}

// Events as represented in the response from etherscan.io
interface EventsResponseResult {
    address: string;
    topics: string[];
    data: string;
    blockNumber: string;
    timeStamp: string;
    gasPrice: string;
    gasUsed: string;
    logIndex: string;
    transactionHash: string;
    transactionIndex: string;
}

// Parses and abi-decodes the fill events response from etherscan.io.
const parseFillEventsResponse = R.pipe(R.map(convertResponseToLogEntry), R.map(tryToDecodeLogOrNoop));

function convertResponseToLogEntry(result: EventsResponseResult): LogEntry {
    const radix = 10;
    return {
        logIndex: parseInt(result.logIndex, radix),
        transactionIndex: parseInt(result.logIndex, radix),
        transactionHash: result.transactionHash,
        blockHash: '',
        blockNumber: parseInt(result.blockNumber, radix),
        address: result.address,
        data: result.data,
        topics: result.topics,
    };
}

function tryToDecodeLogOrNoop(log: LogEntry): LogWithDecodedArgs<DecodedLogArgs> {
    const abiDecoder = new AbiDecoder([artifacts.Exchange.compilerOutput.abi]);
    const logWithDecodedArgs = abiDecoder.tryToDecodeLogOrNoop(log);
    // tslint:disable-next-line:no-unnecessary-type-assertion
    return logWithDecodedArgs as LogWithDecodedArgs<DecodedLogArgs>;
}

/**
 * Gets the decoded events for a specific contract and block range.
 * @param contractAddress  The address of the contract to get the events for.
 * @param fromBlock The start of the block range to get events for (inclusive).
 * @param toBlock The end of the block range to get events for (inclusive).
 * @returns A list of decoded events.
 */
export async function getContractEventsAsync(
    contractAddress: string,
    fromBlock: BlockParam = BlockParamLiteral.Earliest,
    toBlock: BlockParam = BlockParamLiteral.Latest,
): Promise<Array<LogWithDecodedArgs<DecodedLogArgs>>> {
    const fullURL = `${ETHERSCAN_URL}?module=logs&action=getLogs&address=${contractAddress}&fromBlock=${fromBlock}&toBlock=${toBlock}&apikey=${ETHERSCAN_API_KEY}`;
    const resp = await axios.get<EventsResponse>(fullURL);
    // TODO(albrow): Check response code.
    const decodedEvents = parseFillEventsResponse(resp.data.result);
    return decodedEvents;
}
