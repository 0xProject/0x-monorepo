import { BigNumber } from 'bignumber.js';
import * as Web3 from 'web3';

export interface TxData {
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

export interface JSONRPCPayload {
    params: any[];
    method: string;
}

export enum AbiType {
    Function = 'function',
    Constructor = 'constructor',
    Event = 'event',
    Fallback = 'fallback',
}

export type ContractEventArg = string | BigNumber;

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
