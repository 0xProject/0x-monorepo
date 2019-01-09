import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewMetadataAndOHLCVTables1542655823221 implements MigrationInterface {
    // tslint:disable-next-line
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE TABLE raw.token_metadata (
                address VARCHAR NOT NULL,
                authority VARCHAR NOT NULL,
                decimals INT NULL,
                symbol VARCHAR NULL,
                name VARCHAR NULL,

                PRIMARY KEY (address, authority)
            );
        `);

        await queryRunner.dropTable('raw.token_on_chain_metadata');

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

    // tslint:disable-next-line
    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE TABLE raw.token_on_chain_metadata (
                address VARCHAR NOT NULL,
                decimals INT NULL,
                symbol VARCHAR NULL,
                name VARCHAR NULL,

                PRIMARY KEY (address)
            );
        `);

        await queryRunner.dropTable('raw.token_metadata');

        await queryRunner.dropTable('raw.ohlcv_external');
    }
}
