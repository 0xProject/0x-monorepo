import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Transaction {
    @PrimaryColumn() public transactionHash!: string;
    @PrimaryColumn() public blockHash!: string;
    @PrimaryColumn() public blockNumber!: number;

    @Column({ type: 'bigint' })
    public gasUsed!: number;
    @Column({ type: 'bigint' })
    public gasPrice!: number;
}
