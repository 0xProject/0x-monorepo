import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TOKEN_ORDERBOOK_SNAPSHOT_TABLE = 'raw.token_orderbook_snapshots';
const NEW_COLUMN_NAME = 'maker_address';

export class TokenOrderBookSnapshotsAddMakerAddress1550163069315 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        const snapshotTable = await queryRunner.getTable(TOKEN_ORDERBOOK_SNAPSHOT_TABLE);
        if (snapshotTable) {
            const newColumn = new TableColumn({
                name: NEW_COLUMN_NAME,
                type: 'varchar',
                isNullable: true,
            });
            await queryRunner.addColumn(TOKEN_ORDERBOOK_SNAPSHOT_TABLE, newColumn);
            // backfill null values
            await queryRunner.query(`
                UPDATE ${TOKEN_ORDERBOOK_SNAPSHOT_TABLE}
                SET ${NEW_COLUMN_NAME}='unknown'
                WHERE ${NEW_COLUMN_NAME} is NULL;
            `);
            await queryRunner.query(`
                ALTER TABLE ${TOKEN_ORDERBOOK_SNAPSHOT_TABLE}
                    DROP CONSTRAINT "token_orderbook_snapshots_pkey1",
                    ADD PRIMARY KEY (observed_timestamp, source, order_type, price, base_asset_symbol, quote_asset_symbol, maker_address);
            `);
        } else {
            throw new Error(`Could not find table with name ${TOKEN_ORDERBOOK_SNAPSHOT_TABLE}`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const snapshotTable = await queryRunner.getTable(TOKEN_ORDERBOOK_SNAPSHOT_TABLE);
        if (snapshotTable) {
            await queryRunner.dropColumn(snapshotTable, NEW_COLUMN_NAME);
        } else {
            throw new Error(`Could not find table with name ${TOKEN_ORDERBOOK_SNAPSHOT_TABLE}`);
        }
    }
}
