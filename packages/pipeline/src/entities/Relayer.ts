import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Relayer {
    @PrimaryColumn() public name!: string;

    @Column() public url!: string;
    @Column({ nullable: true, type: String })
    public sraHttpEndpoint!: string | null;
    @Column({ nullable: true, type: String })
    public sraWsEndpoint!: string | null;
    @Column({ nullable: true, type: String })
    public appUrl!: string | null;

    // TODO(albrow): Add exchange contract or protocol version?
    // TODO(albrow): Add network ids for addresses?

    @Column({ type: 'varchar', array: true })
    public feeRecipientAddresses!: string[];
    @Column({ type: 'varchar', array: true })
    public takerAddresses!: string[];
}
