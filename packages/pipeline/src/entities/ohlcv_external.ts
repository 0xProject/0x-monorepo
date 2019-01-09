import { Column, Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'ohlcv_external', schema: 'raw' })
export class OHLCVExternal {
    @PrimaryColumn() public exchange!: string;

    @PrimaryColumn({ name: 'from_symbol', type: 'varchar' })
    public fromSymbol!: string;
    @PrimaryColumn({ name: 'to_symbol', type: 'varchar' })
    public toSymbol!: string;
    @PrimaryColumn({ name: 'start_time', transformer: numberToBigIntTransformer })
    public startTime!: number;
    @PrimaryColumn({ name: 'end_time', transformer: numberToBigIntTransformer })
    public endTime!: number;

    @Column() public open!: number;
    @Column() public close!: number;
    @Column() public low!: number;
    @Column() public high!: number;
    @Column({ name: 'volume_from' })
    public volumeFrom!: number;
    @Column({ name: 'volume_to' })
    public volumeTo!: number;

    @PrimaryColumn() public source!: string;
    @PrimaryColumn({ name: 'observed_timestamp', transformer: numberToBigIntTransformer })
    public observedTimestamp!: number;
}
