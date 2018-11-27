import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ohlcv_external', schema: 'raw' })
export class OHLCVExternal {
    @PrimaryColumn() public exchange!: string;
    @PrimaryColumn() public fromSymbol!: string;
    @PrimaryColumn() public toSymbol!: string;
    @PrimaryColumn() public startTime!: number;
    @PrimaryColumn() public endTime!: number;

    @Column() public open!: number;
    @Column() public close!: number;
    @Column() public low!: number;
    @Column() public high!: number;
    @Column() public volumeFrom!: number;
    @Column() public volumeTo!: number;

    @PrimaryColumn() public source!: string;
    @PrimaryColumn() public observedTimestamp!: number;
}
