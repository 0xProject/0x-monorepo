import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'relayers', schema: 'raw' })
export class Relayer {
    @PrimaryColumn() public uuid!: string;

    @Column() public name!: string;
    @Column() public url!: string;
    @Column({ nullable: true, type: String, name: 'sra_http_endpoint' })
    public sraHttpEndpoint!: string | null;
    @Column({ nullable: true, type: String, name: 'sra_ws_endpoint' })
    public sraWsEndpoint!: string | null;
    @Column({ nullable: true, type: String, name: 'app_url' })
    public appUrl!: string | null;

    // TODO(albrow): Add exchange contract or protocol version?
    // TODO(albrow): Add network ids for addresses?

    @Column({ type: 'varchar', array: true, name: 'fee_recipient_addresses' })
    public feeRecipientAddresses!: string[];
    @Column({ type: 'varchar', array: true, name: 'taker_addresses' })
    public takerAddresses!: string[];
}
