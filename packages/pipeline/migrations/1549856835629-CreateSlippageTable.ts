import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const slippage = new Table({
    name: 'raw.slippage',
    columns: [
        { name: 'observed_timestamp', type: 'bigint', isPrimary: true },
        { name: 'symbol', type: 'varchar', isPrimary: true },
        { name: 'exchange', type: 'varchar', isPrimary: true },
        { name: 'usd_amount', type: 'numeric', isPrimary: true },

        { name: 'token_amount', type: 'numeric', isNullable: false },
        { name: 'avg_price_in_eth_buy', type: 'numeric', isNullable: true },
        { name: 'avg_price_in_eth_sell', type: 'numeric', isNullable: true },
        { name: 'slippage', type: 'numeric', isNullable: true },
    ],
});

export class CreateSlippageTable1549856835629 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(slippage);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(slippage);
    }
}
