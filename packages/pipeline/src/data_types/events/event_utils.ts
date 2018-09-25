import { AbiDecoder } from '@0xproject/utils';
import { AbiDefinition, LogEntry, LogWithDecodedArgs } from 'ethereum-types';

import { EventsResponseResult } from '../../data_sources/etherscan';

const hexRadix = 16;

function hexToInt(hex: string): number {
    return parseInt(hex.replace('0x', ''), hexRadix);
}

// Converts a raw event response to a LogEntry
export function convertResponseToLogEntry(result: EventsResponseResult): LogEntry {
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
export function decodeLogEntry<EventArgsType>(
    contractAbi: AbiDefinition[],
    log: LogEntry,
): LogWithDecodedArgs<EventArgsType> {
    const abiDecoder = new AbiDecoder([contractAbi]);
    const logWithDecodedArgs = abiDecoder.tryToDecodeLogOrNoop<EventArgsType>(log);
    // tslint:disable-next-line:no-unnecessary-type-assertion
    return logWithDecodedArgs as LogWithDecodedArgs<EventArgsType>;
}
