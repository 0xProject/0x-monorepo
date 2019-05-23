import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

// These events come directly from an ERC20 token contract and are fired
// whenever someone updates or sets an approval.
// See: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#erc20proxy
@Entity({ name: 'erc20_approval_events', schema: 'raw' })
export class ERC20ApprovalEvent {
    // The address of the token for which allowance has been set.
    @PrimaryColumn({ name: 'token_address' })
    public tokenAddress!: string;
    // The index of the event log.
    @PrimaryColumn({ name: 'log_index' })
    public logIndex!: number;
    // The block number where the event occurred.
    @PrimaryColumn({ name: 'block_number', transformer: numberToBigIntTransformer })
    public blockNumber!: number;
    // The hash of the transaction where this event occurred.
    @PrimaryColumn({ name: 'transaction_hash' })
    public transactionHash!: string;

    // The raw data which comes directly from the event.
    @Column({ name: 'raw_data' })
    public rawData!: string;

    // Note: the following fields are parsed from the raw_data.

    // The address of the owner (i.e., the person setting the allowance).
    @Column({ name: 'owner_address' })
    public ownerAddress!: string;
    // The address of the spender (i.e., our asset proxy).
    @Column({ name: 'spender_address' })
    public spenderAddress!: string;
    // The amount of the allowance.
    @Column({ name: 'amount', type: 'numeric', transformer: bigNumberTransformer })
    public amount!: BigNumber;
}
