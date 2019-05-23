import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const table = new Table({
    name: 'concepts.radar_orderbook_usd_prices',
    columns: [
        { name: 'trade_usd_value', type: 'numeric' },
        { name: 'base_asset_price', type: 'numeric', isNullable: true },
        { name: 'quote_asset_price', type: 'numeric', isNullable: true },

        { name: 'observed_timestamp', type: 'bigint', isPrimary: true },
        { name: 'price', type: 'numeric', isPrimary: true },
        { name: 'base_asset_address', type: 'char(42)' },
        { name: 'base_asset_symbol', type: 'varchar', isPrimary: true },
        { name: 'base_volume', type: 'numeric' },
        { name: 'quote_asset_address', type: 'char(42)' },
        { name: 'quote_asset_symbol', type: 'varchar', isPrimary: true },
        { name: 'quote_volume', type: 'numeric' },
        { name: 'maker_address', type: 'char(42)', isPrimary: true },

        { name: 'order_type', type: 'order_t', isPrimary: true },
    ],
});

export class CreateRadarOrderbookUsdPrices1550881763949 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(table);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(table);
    }
}
