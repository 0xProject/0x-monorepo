import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const nftTrades = new Table({
    name: 'raw.nonfungible_dot_com_trades',
    columns: [
        { name: 'publisher', type: 'varchar', isPrimary: true },
        { name: 'transaction_hash', type: 'varchar', isPrimary: true },
        { name: 'asset_id', type: 'varchar', isPrimary: true },
        { name: 'block_number', type: 'bigint', isPrimary: true },
        { name: 'log_index', type: 'integer', isPrimary: true },

        { name: 'block_timestamp', type: 'bigint' },
        { name: 'asset_descriptor', type: 'varchar' },
        { name: 'market_address', type: 'varchar(42)' },
        { name: 'total_price', type: 'numeric' },
        { name: 'usd_price', type: 'numeric' },
        { name: 'buyer_address', type: 'varchar(42)' },
        { name: 'seller_address', type: 'varchar(42)' },
        { name: 'meta', type: 'jsonb' },
    ],
});

export class CreateNftTrades1543540108767 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(nftTrades);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(nftTrades);
    }
}
