import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ohlcv_external', schema: 'raw' })
export class OHLCVExternal {
    @PrimaryColumn() public exchange!: string;
    @PrimaryColumn() public from_symbol!: string;
    @PrimaryColumn() public to_symbol!: string;
    @PrimaryColumn() public start_time!: number;
    @PrimaryColumn() public end_time!: number;
    
    @Column() public open!: number;
    @Column() public close!: number;
    @Column() public low!: number;
    @Column() public high!: number;
    @Column() public volume_from!: number;
    @Column() public volume_to!: number;

    @PrimaryColumn() public source!: string;
    @PrimaryColumn() public observed_timestamp!: number;
}