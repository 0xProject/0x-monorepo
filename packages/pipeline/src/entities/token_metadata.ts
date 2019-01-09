import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer } from '../utils/transformers';

@Entity({ name: 'token_metadata', schema: 'raw' })
export class TokenMetadata {
    @PrimaryColumn({ type: 'varchar', nullable: false })
    public address!: string;

    @PrimaryColumn({ type: 'varchar', nullable: false })
    public authority!: string;

    @Column({ type: 'numeric', transformer: bigNumberTransformer, nullable: true })
    public decimals!: BigNumber | null;

    @Column({ type: 'varchar', nullable: true })
    public symbol!: string | null;

    @Column({ type: 'varchar', nullable: true })
    public name!: string | null;
}
