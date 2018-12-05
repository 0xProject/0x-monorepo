import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class NewSraOrderTimestampFormat1542147915364 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `ALTER TABLE raw.sra_orders
                DROP CONSTRAINT "PK_09bfb9980715329563bd53d667e",
                ADD PRIMARY KEY (order_hash_hex, exchange_address, source_url);
            `,
        );

        await queryRunner.query(
            `CREATE TABLE raw.sra_orders_observed_timestamps (
                order_hash_hex varchar NOT NULL,
                exchange_address varchar NOT NULL,
                source_url varchar NOT NULL,
                observed_timestamp bigint NOT NULL,
                FOREIGN KEY
                    (order_hash_hex, exchange_address, source_url)
                    REFERENCES raw.sra_orders (order_hash_hex, exchange_address, source_url),
                PRIMARY KEY (order_hash_hex, exchange_address, source_url, observed_timestamp)
            );`,
        );

        await queryRunner.query(
            `ALTER TABLE raw.sra_orders
                DROP COLUMN last_updated_timestamp,
                DROP COLUMN first_seen_timestamp;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable('raw.sra_orders_observed_timestamps');

        await queryRunner.query(
            `ALTER TABLE raw.sra_orders
                ADD COLUMN last_updated_timestamp bigint NOT NULL DEFAULT 0,
                ADD COLUMN first_seen_timestamp bigint NOT NULL DEFAULT 0;`,
        );

        await queryRunner.query(
            `ALTER TABLE raw.sra_orders
                DROP CONSTRAINT sra_orders_pkey,
                ADD CONSTRAINT "PK_09bfb9980715329563bd53d667e" PRIMARY KEY ("exchange_address", "order_hash_hex");
            `,
        );
    }
}
