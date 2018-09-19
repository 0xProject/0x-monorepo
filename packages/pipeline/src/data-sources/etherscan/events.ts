import { AbiDecoder } from '@0xproject/utils';
import { AbiDefinition, DecodedLogArgs, LogEntry, LogWithDecodedArgs } from 'ethereum-types';
import * as R from 'ramda';

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

const hexRadix = 16;

function hexToInt(hex: string): number {
    return parseInt(hex.replace('0x', ''), hexRadix);
}

// Converts a raw event response to a LogEntry
// tslint:disable-next-line:completed-docs
export function _convertResponseToLogEntry(result: EventsResponseResult): LogEntry {
    return {
        logIndex: hexToInt(result.logIndex),
        transactionIndex: hexToInt(result.transactionIndex),
        transactionHash: result.transactionHash,
        blockHash: '',
        blockNumber: hexToInt(result.blockNumber),
        address: result.address,
        data: result.data,
        topics: result.topics,
    };
}

// Decodes a LogEntry into a LogWithDecodedArgs
// tslint:disable-next-line:completed-docs
export const _decodeLogEntry = R.curry((contractAbi: AbiDefinition[], log: LogEntry): LogWithDecodedArgs<
    DecodedLogArgs
> => {
    const abiDecoder = new AbiDecoder([contractAbi]);
    const logWithDecodedArgs = abiDecoder.tryToDecodeLogOrNoop(log);
    // tslint:disable-next-line:no-unnecessary-type-assertion
    return logWithDecodedArgs as LogWithDecodedArgs<DecodedLogArgs>;
});

/**
 * Parses and abi-decodes the raw events response from etherscan.io.
 * @param contractAbi The ABI for the contract that the events where emited from.
 * @param rawEventsResponse The raw events response from etherescan.io.
 * @returns Parsed and decoded events.
 */
export function parseRawEventsResponse(
    contractAbi: AbiDefinition[],
    rawEventsResponse: EventsResponse,
): Array<LogWithDecodedArgs<DecodedLogArgs>> {
    return R.pipe(R.map(_convertResponseToLogEntry), R.map(_decodeLogEntry(contractAbi)))(rawEventsResponse.result);
}

// export const parseRawEventsResponse = R.pipe(R.map(_convertResponseToLogEntry), R.map(_decodeLogEntry));
