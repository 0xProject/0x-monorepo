import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

// These events come directly from the Exchange contract and are fired whenever
// someone cancels orders using the cancelOrdersUpTo function.
// See https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#cancelordersupto
@Entity({ name: 'exchange_cancel_up_to_events', schema: 'raw' })
export class ExchangeCancelUpToEvent {
    // The address of the smart contract where this event was fired.
    @PrimaryColumn({ name: 'contract_address' })
    public contractAddress!: string;
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

    // The address of the maker.
    @Column({ name: 'maker_address' })
    public makerAddress!: string;
    // The address of the sender (used for extension contracts).
    @Column({ name: 'sender_address' })
    public senderAddress!: string;
    // Orders with a salt less than or equal to this value will be cancelled.
    @Column({ name: 'order_epoch', type: 'numeric', transformer: bigNumberTransformer })
    public orderEpoch!: BigNumber;
}
