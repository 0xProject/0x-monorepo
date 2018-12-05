import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'relayers', schema: 'raw' })
export class Relayer {
    @PrimaryColumn() public uuid!: string;

    @Column() public name!: string;
    @Column({ name: 'homepage_url', type: 'varchar' })
    public homepageUrl!: string;
    @Column({ name: 'sra_http_endpoint', type: 'varchar', nullable: true })
    public sraHttpEndpoint!: string | null;
    @Column({ name: 'sra_ws_endpoint', type: 'varchar', nullable: true })
    public sraWsEndpoint!: string | null;
    @Column({ name: 'app_url', type: 'varchar', nullable: true })
    public appUrl!: string | null;

    @Column({ name: 'fee_recipient_addresses', type: 'varchar', array: true })
    public feeRecipientAddresses!: string[];
    @Column({ name: 'taker_addresses', type: 'varchar', array: true })
    public takerAddresses!: string[];
}
