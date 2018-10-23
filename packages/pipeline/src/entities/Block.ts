import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Block {
    @PrimaryColumn() public hash!: string;
    @PrimaryColumn() public number!: number;

    @Column() public unixTimestampSeconds!: number;
}
