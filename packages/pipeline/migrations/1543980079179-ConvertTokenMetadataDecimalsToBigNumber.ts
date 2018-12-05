import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertTokenMetadataDecimalsToBigNumber1543980079179 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `ALTER TABLE raw.token_metadata
                ALTER COLUMN decimals TYPE numeric USING decimals::numeric;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `ALTER TABLE raw.token_metadata
                ALTER COLUMN decimals TYPE numeric USING decimals::integer;`,
        );
    }
}
