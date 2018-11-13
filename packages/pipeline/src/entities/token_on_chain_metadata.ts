import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'token_on_chain_metadata', schema: 'raw' })
export class TokenOnChainMetadata {
    @PrimaryColumn({ type: 'nvarchar', nullable: false })
    public address!: string;

    @Column({ type: 'integer', nullable: false })
    public decimals!: number;

    @Column({ type: 'nvarchar', nullable: false })
    public symbol!: string;

    @Column({ type: 'nvarchar', nullable: false })
    public name!: string;
}