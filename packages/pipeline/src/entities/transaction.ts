import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

// Transactions are pulled directly from an Ethereum node (or from something
// like Infura).
@Entity({ name: 'transactions', schema: 'raw' })
export class Transaction {
    // The hash of the transaction.
    @PrimaryColumn({ name: 'transaction_hash' })
    public transactionHash!: string;
    // The hash of the block this transsaction is a part of.
    @PrimaryColumn({ name: 'block_hash' })
    public blockHash!: string;
    // The number of the block this transaction is a part of.
    @PrimaryColumn({ name: 'block_number', transformer: numberToBigIntTransformer })
    public blockNumber!: number;

    // The amount of gas used for the transaction.
    @Column({ type: 'numeric', name: 'gas_used', transformer: bigNumberTransformer })
    public gasUsed!: BigNumber;
    // The gas price paid for the transaction.
    @Column({ type: 'numeric', name: 'gas_price', transformer: bigNumberTransformer })
    public gasPrice!: BigNumber;
}
