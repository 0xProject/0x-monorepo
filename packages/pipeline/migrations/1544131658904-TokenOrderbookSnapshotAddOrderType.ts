import { MigrationInterface, QueryRunner } from 'typeorm';

export class TokenOrderbookSnapshotAddOrderType1544131658904 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `ALTER TABLE raw.token_orderbook_snapshots
                DROP CONSTRAINT "PK_8a16487e7cb6862ec5a84ed3495",
                ADD PRIMARY KEY (observed_timestamp, source, order_type, price, base_asset_symbol, quote_asset_symbol);
            `,
        );
        await queryRunner.query(
            `ALTER TABLE raw.token_orderbook_snapshots
                ALTER COLUMN quote_asset_address DROP NOT NULL,
                ALTER COLUMN base_asset_address DROP NOT NULL;
            `,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `ALTER TABLE raw.token_orderbook_snapshots
                ALTER COLUMN quote_asset_address SET NOT NULL,
                ALTER COLUMN base_asset_address SET NOT NULL;
            `,
        );
        await queryRunner.query(
            `ALTER TABLE raw.token_orderbook_snapshots
                DROP CONSTRAINT token_orderbook_snapshots_pkey,
                ADD CONSTRAINT "PK_8a16487e7cb6862ec5a84ed3495" PRIMARY KEY (observed_timestamp, source, price, base_asset_symbol, quote_asset_symbol);
            `,
        );
    }
}
