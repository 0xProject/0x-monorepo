import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'blocks', schema: 'raw' })
export class Block {
    @PrimaryColumn() public hash!: string;
    @PrimaryColumn() public number!: number;

    @Column({ name: 'timestamp' })
    public timestamp!: number;
}
