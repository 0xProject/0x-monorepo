export enum Web3WrapperErrors {
    TransactionMiningTimeout = 'TRANSACTION_MINING_TIMEOUT',
}

export interface AbstractBlockRPC {
    number: string | null;
    hash: string | null;
    parentHash: string;
    nonce: string | null;
    sha3Uncles: string;
    logsBloom: string | null;
    transactionsRoot: string;
    stateRoot: string;
    miner: string;
    difficulty: string;
    totalDifficulty: string;
    extraData: string;
    size: string;
    gasLimit: string;
    gasUsed: string;
    timestamp: string;
    uncles: string[];
}
export interface BlockWithoutTransactionDataRPC extends AbstractBlockRPC {
    transactions: string[];
}
export interface BlockWithTransactionDataRPC extends AbstractBlockRPC {
    transactions: TransactionRPC[];
}
export interface TransactionRPC {
    hash: string;
    nonce: string;
    blockHash: string | null;
    blockNumber: string | null;
    transactionIndex: string | null;
    from: string;
    to: string | null;
    value: string;
    gasPrice: string;
    gas: string;
    input: string;
}

export interface TransactionReceiptRPC {
    blockHash: string;
    blockNumber: string;
    transactionHash: string;
    transactionIndex: string;
    from: string;
    to: string;
    status: TransactionReceiptStatusRPC;
    cumulativeGasUsed: string;
    gasUsed: string;
    contractAddress: string | null;
    logs: LogEntryRPC[];
}

export interface LogEntryRPC {
    logIndex: string | null;
    transactionIndex: string | null;
    transactionHash: string;
    blockHash: string | null;
    blockNumber: string | null;
    address: string;
    data: string;
    topics: string[];
}

export type TransactionReceiptStatusRPC = null | string | 0 | 1;

export interface CallTxDataBaseRPC {
    to?: string;
    value?: string;
    gas?: string;
    gasPrice?: string;
    data?: string;
    nonce?: string;
}

export interface TxDataRPC extends CallTxDataBaseRPC {
    from: string;
}

export interface CallDataRPC extends CallTxDataBaseRPC {
    from?: string;
}

export interface GethCallOverridesRPC {
    [address: string]: {
        code?: string;
        nonce?: string;
        balance?: string;
    };
}

// NodeType represents the type of the backing Ethereum node.
export enum NodeType {
    Geth = 'GETH',
    Ganache = 'GANACHE',
}
