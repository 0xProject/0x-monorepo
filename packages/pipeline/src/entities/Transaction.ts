import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'transactions' })
export class Transaction {
    @PrimaryColumn({ name: 'transaction_hash' })
    public transactionHash!: string;
    @PrimaryColumn({ name: 'block_hash' })
    public blockHash!: string;
    @PrimaryColumn({ name: 'block_number' })
    public blockNumber!: number;

    @Column({ type: 'bigint', name: 'gas_used' })
    public gasUsed!: number;
    @Column({ type: 'bigint', name: 'gas_price' })
    public gasPrice!: number;
}
