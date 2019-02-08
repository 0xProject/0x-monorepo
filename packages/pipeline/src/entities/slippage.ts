import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'slippage_records', schema: 'raw' })
export class SlippageRecord {
    @PrimaryColumn({ name: 'time', type: 'number'})
    public time!: number;
    @PrimaryColumn({ name: 'symbol' })
    public symbol!: string;
    @PrimaryColumn({ name: 'exchange' })
    public exchange!: string;
    @PrimaryColumn({ name: 'usdAmount', type: 'number' })
    public usdAmount!: number;
    @Column({ name: 'slippage', type: 'number' })
    public slippage!: number;
}
