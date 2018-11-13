import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'exchange_cancel_up_to_events' })
export class ExchangeCancelUpToEvent {
    @PrimaryColumn({ name: 'contract_address' })
    public contractAddress!: string;
    @PrimaryColumn({ name: 'log_index' })
    public logIndex!: number;
    @PrimaryColumn({ name: 'block_number' })
    public blockNumber!: number;

    // TODO(albrow): Include transaction hash
    @Column({ name: 'raw_data' })
    public rawData!: string;

    @Column({ name: 'maker_address' })
    public makerAddress!: string;
    @Column({ name: 'sender_address' })
    public senderAddress!: string;
    @Column({ name: 'order_epoch' })
    public orderEpoch!: string;
    // TODO(albrow): Include topics?
}
