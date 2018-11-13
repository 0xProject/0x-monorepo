import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSraOrdersFilledAmounts1542152278484 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.renameColumn('raw.sra_orders', 'maker_asset_filled_amount', 'maker_asset_amount');
        await queryRunner.renameColumn('raw.sra_orders', 'taker_asset_filled_amount', 'taker_asset_amount');
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.renameColumn('raw.sra_orders', 'maker_asset_amount', 'maker_asset_filled_amount');
        await queryRunner.renameColumn('raw.sra_orders', 'taker_asset_amount', 'taker_asset_filled_amount');
    }
}
