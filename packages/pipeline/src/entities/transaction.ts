import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

@Entity({ name: 'transactions', schema: 'raw' })
export class Transaction {
    @PrimaryColumn({ name: 'transaction_hash' })
    public transactionHash!: string;
    @PrimaryColumn({ name: 'block_hash' })
    public blockHash!: string;
    @PrimaryColumn({ name: 'block_number', transformer: numberToBigIntTransformer })
    public blockNumber!: number;

    @Column({ type: 'numeric', name: 'gas_used', transformer: bigNumberTransformer })
    public gasUsed!: BigNumber;
    @Column({ type: 'numeric', name: 'gas_price', transformer: bigNumberTransformer })
    public gasPrice!: BigNumber;
}
