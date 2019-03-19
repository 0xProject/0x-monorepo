import { Column, Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

// Blocks are pulled directly from an Ethereum node (or from something like
// Infura).
@Entity({ name: 'blocks', schema: 'raw' })
export class Block {
    // Block hash
    @PrimaryColumn() public hash!: string;
    // Block number
    @PrimaryColumn({ transformer: numberToBigIntTransformer })
    public number!: number;

    // Timestamp when the block was mined (in ms since Unix Epoch)
    @Column({ name: 'timestamp', transformer: numberToBigIntTransformer })
    public timestamp!: number;
}
