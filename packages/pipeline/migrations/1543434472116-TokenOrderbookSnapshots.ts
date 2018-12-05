import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const tokenOrderbookSnapshots = new Table({
    name: 'raw.token_orderbook_snapshots',
    columns: [
        { name: 'observed_timestamp', type: 'bigint', isPrimary: true },
        { name: 'source', type: 'varchar', isPrimary: true },
        { name: 'order_type', type: 'order_t' },
        { name: 'price', type: 'numeric', isPrimary: true },

        { name: 'base_asset_symbol', type: 'varchar', isPrimary: true },
        { name: 'base_asset_address', type: 'char(42)' },
        { name: 'base_volume', type: 'numeric' },

        { name: 'quote_asset_symbol', type: 'varchar', isPrimary: true },
        { name: 'quote_asset_address', type: 'char(42)' },
        { name: 'quote_volume', type: 'numeric' },
    ],
});

export class TokenOrderbookSnapshots1543434472116 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TYPE order_t AS enum('bid', 'ask');`);
        await queryRunner.createTable(tokenOrderbookSnapshots);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(tokenOrderbookSnapshots.name);
    }
}
