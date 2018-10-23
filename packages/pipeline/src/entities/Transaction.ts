import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Transaction {
    @PrimaryColumn() public transactionHash!: string;
    @PrimaryColumn() public blockHash!: string;
    @PrimaryColumn() public blockNumber!: number;

    @Column() public gasUsed!: number;
    @Column() public gasPrice!: number;
}
