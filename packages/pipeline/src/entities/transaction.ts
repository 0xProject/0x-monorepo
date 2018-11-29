import { Column, Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'transactions', schema: 'raw' })
export class Transaction {
    @PrimaryColumn({ name: 'transaction_hash' })
    public transactionHash!: string;
    @PrimaryColumn({ name: 'block_hash' })
    public blockHash!: string;
    @PrimaryColumn({ name: 'block_number', transformer: numberToBigIntTransformer })
    public blockNumber!: number;

    @Column({ type: 'bigint', name: 'gas_used', transformer: numberToBigIntTransformer })
    public gasUsed!: number;
    @Column({ type: 'bigint', name: 'gas_price', transformer: numberToBigIntTransformer })
    public gasPrice!: number;
}
