import { Column, Entity, PrimaryColumn } from 'typeorm';

// Contains relayers along with some metadata about them.
@Entity({ name: 'relayers', schema: 'raw' })
export class Relayer {
    // A unique identifier for the relayer. Never changes.
    @PrimaryColumn() public uuid!: string;

    // A human-readable name for the relayer.
    @Column() public name!: string;
    // The URL for the relayer's home page.
    @Column({ name: 'homepage_url', type: 'varchar' })
    public homepageUrl!: string;
    // HTTP SRA endpoint for the relayer (null for relayers that don't support it).
    @Column({ name: 'sra_http_endpoint', type: 'varchar', nullable: true })
    public sraHttpEndpoint!: string | null;
    // WebSocket SRA endpoint for the relayer (null for relayers that don't support it).
    @Column({ name: 'sra_ws_endpoint', type: 'varchar', nullable: true })
    public sraWsEndpoint!: string | null;
    // Application URL (null for relayers without a separate app url).
    @Column({ name: 'app_url', type: 'varchar', nullable: true })
    public appUrl!: string | null;

    // An array of known fee recipient addresses used by this relayer.
    @Column({ name: 'fee_recipient_addresses', type: 'varchar', array: true })
    public feeRecipientAddresses!: string[];
    // An array of known taker addresses used by this relayer.
    @Column({ name: 'taker_addresses', type: 'varchar', array: true })
    public takerAddresses!: string[];
}
