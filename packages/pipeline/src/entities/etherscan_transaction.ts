import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

@Entity({ name: 'etherscan_transactions', schema: 'raw' })
export class EtherscanTransaction {
    @PrimaryColumn({ name: 'hash' })
    public hash!: string;

    @Column({ name: 'block_number', type: 'bigint', transformer: bigNumberTransformer })
    public blockNumber!: BigNumber;

    @Column({ name: 'timestamp', type: 'bigint', transformer: bigNumberTransformer })
    public timeStamp!: BigNumber;

    @Column({ name: 'block_hash' })
    public blockHash!: string;

    @Column({ name: 'transaction_index', transformer: numberToBigIntTransformer })
    public transactionIndex!: number;

    @Column({ name: 'nonce', transformer: numberToBigIntTransformer })
    public nonce!: number;

    @Column({ name: 'from' })
    public from!: string;

    @Column({ name: 'to' })
    public to!: string;

    @Column({ name: 'value', type: 'bigint', transformer: bigNumberTransformer })
    public value!: BigNumber;

    @Column({ name: 'gas', type: 'bigint', transformer: bigNumberTransformer })
    public gas!: BigNumber;

    @Column({ name: 'gas_price', type: 'bigint', transformer: bigNumberTransformer })
    public gasPrice!: BigNumber;

    @Column({ name: 'is_error', type: 'boolean', nullable: true })
    public isError!: boolean;

    @Column({ name: 'txreceipt_status' })
    public txreceiptStatus?: string;

    @Column({ name: 'input' })
    public input!: string;

    @Column({ name: 'contract_address' })
    public contractAddress!: string;

    @Column({ name: 'cumulative_gas_used', type: 'bigint', transformer: bigNumberTransformer })
    public cumulativeGasUsed!: BigNumber;

    @Column({ name: 'gas_used', type: 'bigint', transformer: bigNumberTransformer })
    public gasUsed!: BigNumber;

    @Column({ name: 'confirmations', type: 'bigint', transformer: bigNumberTransformer })
    public confirmations!: BigNumber;
}
