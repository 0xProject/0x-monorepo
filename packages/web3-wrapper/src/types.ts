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
    nonce: number;
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
