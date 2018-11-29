import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const dexTrades = new Table({
    name: 'raw.dex_trades',
    columns: [
        { name: 'source_url', type: 'varchar', isPrimary: true },
        { name: 'tx_hash', type: 'varchar', isPrimary: true },

        { name: 'tx_timestamp', type: 'bigint' },
        { name: 'tx_date', type: 'varchar' },
        { name: 'tx_sender', type: 'varchar(42)' },
        { name: 'smart_contract_id', type: 'bigint' },
        { name: 'smart_contract_address', type: 'varchar(42)' },
        { name: 'contract_type', type: 'varchar' },
        { name: 'maker', type: 'varchar(42)' },
        { name: 'taker', type: 'varchar(42)' },
        { name: 'amount_buy', type: 'numeric' },
        { name: 'maker_fee', type: 'numeric' },
        { name: 'buy_currency_id', type: 'bigint' },
        { name: 'buy_symbol', type: 'varchar' },
        { name: 'amount_sell', type: 'numeric' },
        { name: 'taker_fee', type: 'numeric' },
        { name: 'sell_currency_id', type: 'bigint' },
        { name: 'sell_symbol', type: 'varchar' },
        { name: 'maker_annotation', type: 'varchar' },
        { name: 'taker_annotation', type: 'varchar' },
        { name: 'protocol', type: 'varchar' },
        { name: 'buy_address', type: 'varchar(42)', isNullable: true },
        { name: 'sell_address', type: 'varchar(42)', isNullable: true },
    ],
});

export class CreateDexTrades1543446690436 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(dexTrades);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(dexTrades);
    }
}
