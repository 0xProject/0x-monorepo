import { BigNumber } from 'bignumber.js';
import * as Web3 from 'web3';

export interface TxData {
    data?: string;
    from?: string;
    gas?: number;
    gasPrice?: BigNumber;
    nonce?: number;
}

export interface TxDataPayable extends TxData {
    value?: BigNumber;
}

export interface TransactionReceipt {
    blockHash: string;
    blockNumber: number;
    transactionHash: string;
    transactionIndex: number;
    from: string;
    to: string;
    status: null | 0 | 1;
    cumulativeGasUsed: number;
    gasUsed: number;
    contractAddress: string | null;
    logs: Web3.LogEntry[];
}

export enum AbiType {
    Function = 'function',
    Constructor = 'constructor',
    Event = 'event',
    Fallback = 'fallback',
}

export type ContractEventArg = string | BigNumber | number;

export interface DecodedLogArgs {
    [argName: string]: ContractEventArg;
}

export interface LogWithDecodedArgs<ArgsType> extends Web3.DecodedLogEntry<ArgsType> {}
export type RawLog = Web3.LogEntry;
export enum SolidityTypes {
    Address = 'address',
    Uint256 = 'uint256',
    Uint8 = 'uint8',
    Uint = 'uint',
}

export interface TransactionReceiptWithDecodedLogs extends TransactionReceipt {
    logs: Array<LogWithDecodedArgs<DecodedLogArgs> | Web3.LogEntry>;
}

// Earliest is omitted by design. It is simply an alias for the `0` constant and
// is thus not very helpful. Moreover, this type is used in places that only accept
// `latest` or `pending`.
export enum BlockParamLiteral {
    Latest = 'latest',
    Pending = 'pending',
}

export type BlockParam = BlockParamLiteral | number;

export interface RawLogEntry {
    logIndex: string | null;
    transactionIndex: string | null;
    transactionHash: string;
    blockHash: string | null;
    blockNumber: string | null;
    address: string;
    data: string;
    topics: string[];
}
