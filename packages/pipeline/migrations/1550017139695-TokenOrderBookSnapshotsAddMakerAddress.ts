import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TOKEN_ORDERBOOK_SNAPSHOT_TABLE = 'raw.token_orderbook_snapshots';
const NEW_COLUMN_NAME = 'maker_address';

export class TokenOrderBookSnapshotsAddMakerAddress1550017139695 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        const snapshotTable = await queryRunner.getTable(TOKEN_ORDERBOOK_SNAPSHOT_TABLE);
        if (snapshotTable) {
            await queryRunner.addColumn(
                TOKEN_ORDERBOOK_SNAPSHOT_TABLE,
                new TableColumn({
                    name: NEW_COLUMN_NAME,
                    type: 'varchar',
                    isPrimary: true,
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const snapshotTable = await queryRunner.getTable(TOKEN_ORDERBOOK_SNAPSHOT_TABLE);
        if (snapshotTable) {
            await queryRunner.dropColumn(snapshotTable, NEW_COLUMN_NAME);
        }
    }
}
