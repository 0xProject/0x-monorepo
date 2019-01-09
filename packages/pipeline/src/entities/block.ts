import { Column, Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'blocks', schema: 'raw' })
export class Block {
    @PrimaryColumn() public hash!: string;
    @PrimaryColumn({ transformer: numberToBigIntTransformer })
    public number!: number;

    @Column({ name: 'timestamp', transformer: numberToBigIntTransformer })
    public timestamp!: number;
}
