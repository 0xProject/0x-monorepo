import { AbiDecoder } from '@0xproject/utils';
import { DecodedLogArgs, LogEntry, LogWithDecodedArgs } from 'ethereum-types';
import * as R from 'ramda';

import { artifacts } from '../../artifacts';

// Raw events response from etherescan.io
export interface EventsResponse {
    status: string;
    message: string;
    result: EventsResponseResult[];
}

// Events as represented in the response from etherscan.io
export interface EventsResponseResult {
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
 * Parses and abi-decodes the raw events response from etherscan.io.
 * @param rawEventsResponse The raw events response from etherescan.io.
 * @returns Parsed and decoded events.
 */
export const parseRawEventsResponse = R.pipe(R.map(convertResponseToLogEntry), R.map(tryToDecodeLogOrNoop));
