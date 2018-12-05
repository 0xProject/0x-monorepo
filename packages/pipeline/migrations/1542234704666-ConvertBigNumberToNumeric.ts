import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertBigNumberToNumeric1542234704666 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `ALTER TABLE raw.exchange_fill_events
                ALTER COLUMN maker_asset_filled_amount TYPE numeric USING maker_asset_filled_amount::numeric,
                ALTER COLUMN taker_asset_filled_amount TYPE numeric USING taker_asset_filled_amount::numeric,
                ALTER COLUMN maker_fee_paid TYPE numeric USING maker_fee_paid::numeric,
                ALTER COLUMN taker_fee_paid TYPE numeric USING taker_fee_paid::numeric;`,
        );

        await queryRunner.query(
            `ALTER TABLE raw.exchange_cancel_up_to_events
                ALTER COLUMN order_epoch TYPE numeric USING order_epoch::numeric;`,
        );

        await queryRunner.query(
            `ALTER TABLE raw.sra_orders
                ALTER COLUMN maker_asset_amount TYPE numeric USING maker_asset_amount::numeric,
                ALTER COLUMN taker_asset_amount TYPE numeric USING taker_asset_amount::numeric,
                ALTER COLUMN maker_fee TYPE numeric USING maker_fee::numeric,
                ALTER COLUMN taker_fee TYPE numeric USING taker_fee::numeric,
                ALTER COLUMN expiration_time_seconds TYPE numeric USING expiration_time_seconds::numeric,
                ALTER COLUMN salt TYPE numeric USING salt::numeric;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `ALTER TABLE raw.sra_orders
                ALTER COLUMN maker_asset_amount TYPE varchar USING maker_asset_amount::varchar,
                ALTER COLUMN taker_asset_amount TYPE varchar USING taker_asset_amount::varchar,
                ALTER COLUMN maker_fee TYPE varchar USING maker_fee::varchar,
                ALTER COLUMN taker_fee TYPE varchar USING taker_fee::varchar,
                ALTER COLUMN expiration_time_seconds TYPE varchar USING expiration_time_seconds::varchar,
                ALTER COLUMN salt TYPE varchar USING salt::varchar;`,
        );

        await queryRunner.query(
            `ALTER TABLE raw.exchange_cancel_up_to_events
                ALTER COLUMN order_epoch TYPE varchar USING order_epoch::varchar;`,
        );

        await queryRunner.query(
            `ALTER TABLE raw.exchange_fill_events
                ALTER COLUMN maker_asset_filled_amount TYPE varchar USING maker_asset_filled_amount::varchar,
                ALTER COLUMN taker_asset_filled_amount TYPE varchar USING taker_asset_filled_amount::varchar,
                ALTER COLUMN maker_fee_paid TYPE varchar USING maker_fee_paid::varchar,
                ALTER COLUMN taker_fee_paid TYPE varchar USING taker_fee_paid::varchar;`,
        );
    }
}
