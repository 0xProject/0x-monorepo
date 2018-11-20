import {MigrationInterface, QueryRunner} from "typeorm";

export class NewMetadataAndOHLCVTables1542655823221 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {

        await queryRunner.query(`
            CREATE TABLE raw.trusted_tokens (
                address VARCHAR NOT NULL,
                authority VARCHAR NOT NULL,

                PRIMARY KEY (address, authority)
            );
        `);

        await queryRunner.query(`
            CREATE TABLE raw.ohlcv_external (
                exchange VARCHAR NOT NULL,
                from_symbol VARCHAR NOT NULL,
                to_symbol VARCHAR NOT NULL,
                start_time BIGINT NOT NULL,
                end_time BIGINT NOT NULL,

                open DOUBLE PRECISION NOT NULL,
                close DOUBLE PRECISION NOT NULL,
                low DOUBLE PRECISION NOT NULL,
                high DOUBLE PRECISION NOT NULL,
                volume_from DOUBLE PRECISION NOT NULL,
                volume_to DOUBLE PRECISION NOT NULL,

                source VARCHAR NOT NULL,
                observed_timestamp BIGINT NOT NULL,

                PRIMARY KEY (exchange, from_symbol, to_symbol, start_time, end_time, source, observed_timestamp)
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        
        await queryRunner.dropTable('raw.trusted_tokens');

        await queryRunner.dropTable('raw.ohlcv_external');
    }

}
