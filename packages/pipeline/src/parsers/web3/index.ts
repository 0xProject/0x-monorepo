import { BlockWithoutTransactionData, Transaction as EthTransaction } from 'ethereum-types';

import { Block, Transaction } from '../../entities';

export function parseBlock(rawBlock: BlockWithoutTransactionData): Block {
    if (rawBlock.hash == null) {
        throw new Error('Tried to parse raw block but hash was null');
    }
    if (rawBlock.number == null) {
        throw new Error('Tried to parse raw block but number was null');
    }

    const block = new Block();
    block.hash = rawBlock.hash;
    block.number = rawBlock.number;
    block.unixTimestampSeconds = rawBlock.timestamp;
    return block;
}

export function parseTransaction(rawTransaction: EthTransaction): Transaction {
    if (rawTransaction.blockHash == null) {
        throw new Error('Tried to parse raw transaction but blockHash was null');
    }
    if (rawTransaction.blockNumber == null) {
        throw new Error('Tried to parse raw transaction but blockNumber was null');
    }

    const tx = new Transaction();
    tx.transactionHash = rawTransaction.hash;
    tx.blockHash = rawTransaction.blockHash;
    tx.blockNumber = rawTransaction.blockNumber;

    tx.gasUsed = rawTransaction.gas;
    // TODO(albrow) figure out bignum solution.
    tx.gasPrice = rawTransaction.gasPrice.toNumber();

    return tx;
}
