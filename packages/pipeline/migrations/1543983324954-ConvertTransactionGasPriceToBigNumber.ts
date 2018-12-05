import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertTransactionGasPriceToBigNumber1543983324954 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `ALTER TABLE raw.transactions
                ALTER COLUMN gas_price TYPE numeric USING gas_price::numeric,
                ALTER COLUMN gas_used TYPE numeric USING gas_used::numeric;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `ALTER TABLE raw.transactions
                ALTER COLUMN gas_price TYPE numeric USING gas_price::bigint,
                ALTER COLUMN gas_used TYPE numeric USING gas_used::bigint;`,
        );
    }
}
