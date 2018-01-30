import { BigNumber } from '@0xproject/utils';
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
