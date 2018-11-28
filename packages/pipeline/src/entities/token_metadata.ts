import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'token_metadata', schema: 'raw' })
export class TokenMetadata {
    @PrimaryColumn({ type: 'varchar', nullable: false })
    public address!: string;

    @PrimaryColumn({ type: 'varchar', nullable: false })
    public authority!: string;

    // TODO(albrow): Convert decimals field to type BigNumber/numeric because it
    // comes from a 256-bit integer in a smart contract.
    @Column({ type: 'integer', nullable: true })
    public decimals!: number | null;

    @Column({ type: 'varchar', nullable: true })
    public symbol!: string | null;

    @Column({ type: 'varchar', nullable: true })
    public name!: string | null;
}
