import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const DEX_TRADES_TABLE_NAME = 'raw.dex_trades';

export class AllowDuplicateTxHashesInDexTrades1548809952793 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        const dexTradesTable = await queryRunner.getTable(DEX_TRADES_TABLE_NAME);
        if (dexTradesTable) {
            // Composite key goes from (source_url, tx_hash) to (trade_index, source_url, tx_hash)
            await queryRunner.addColumn(
                DEX_TRADES_TABLE_NAME,
                new TableColumn({
                    name: 'trade_index',
                    type: 'varchar',
                    isPrimary: true,
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const dexTradesTable = await queryRunner.getTable(DEX_TRADES_TABLE_NAME);
        if (dexTradesTable) {
            await queryRunner.dropColumn(dexTradesTable, 'trade_index');
        }
    }
}
