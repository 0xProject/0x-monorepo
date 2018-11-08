import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'blocks' })
export class Block {
    @PrimaryColumn() public hash!: string;
    @PrimaryColumn() public number!: number;

    @Column({ name: 'unix_timestamp_seconds' })
    public unixTimestampSeconds!: number;
}
