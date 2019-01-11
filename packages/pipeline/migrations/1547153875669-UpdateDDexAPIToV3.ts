import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDDexAPIToV31547153875669 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
        UPDATE raw.token_orderbook_snapshots
        SET quote_asset_symbol='WETH'
        WHERE quote_asset_symbol='ETH' AND
        source='ddex';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
        UPDATE raw.token_orderbook_snapshots
        SET quote_asset_symbol='ETH'
        WHERE quote_asset_symbol='WETH' AND
        source='ddex';
        `);
    }
}
