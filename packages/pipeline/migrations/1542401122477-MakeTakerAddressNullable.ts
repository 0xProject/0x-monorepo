import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeTakerAddressNullable1542401122477 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `ALTER TABLE raw.exchange_cancel_events
                ALTER COLUMN taker_address DROP NOT NULL;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `ALTER TABLE raw.exchange_cancel_events
                ALTER COLUMN taker_address SET NOT NULL;`,
        );
    }
}
