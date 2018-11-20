import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'token_metadata', schema: 'raw' })
export class TokenMetadata {
    @PrimaryColumn({ type: 'varchar', nullable: false })
    public address!: string;

    @PrimaryColumn({ type: 'varchar', nullable: false })
    public authority!: string;

    @Column({ type: 'integer', nullable: true })
    public decimals!: number;

    @Column({ type: 'varchar', nullable: true })
    public symbol!: string;

    @Column({ type: 'varchar', nullable: true })
    public name!: string;
}
