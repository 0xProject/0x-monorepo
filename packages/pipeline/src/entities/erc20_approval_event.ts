import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

@Entity({ name: 'erc20_approval_events', schema: 'raw' })
export class ERC20ApprovalEvent {
    @PrimaryColumn({ name: 'token_address' })
    public tokenAddress!: string;
    @PrimaryColumn({ name: 'log_index' })
    public logIndex!: number;
    @PrimaryColumn({ name: 'block_number', transformer: numberToBigIntTransformer })
    public blockNumber!: number;

    @Column({ name: 'raw_data' })
    public rawData!: string;

    @PrimaryColumn({ name: 'transaction_hash' })
    public transactionHash!: string;
    @Column({ name: 'owner_address' })
    public ownerAddress!: string;
    @Column({ name: 'spender_address' })
    public spenderAddress!: string;
    @Column({ name: 'amount', type: 'numeric', transformer: bigNumberTransformer })
    public amount!: BigNumber;
}
