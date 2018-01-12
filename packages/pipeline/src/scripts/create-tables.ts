import { redshiftClient } from '../redshift';

export const createTableScripts = {
    createEventsTable(): any {
        redshiftClient
            .query(
                `CREATE TABLE IF NOT EXISTS events (
                    timestamp TIMESTAMP,
                    id VARCHAR UNIQUE,
                    event_type VARCHAR,
                    error_id VARCHAR,
                    order_hash CHAR(66),
                    maker CHAR(42),
                    maker_amount VARCHAR,
                    maker_fee VARCHAR,
                    maker_token CHAR(42),
                    taker_amount VARCHAR,
                    taker_fee VARCHAR,
                    taker_token CHAR(42),
                    txn_hash CHAR(66),
                    gas_used VARCHAR,
                    gas_price VARCHAR,
                    fee_recipient CHAR(42),
                    method_id CHAR(10),
                    salt VARCHAR,
                    block_number BIGINT,
                    PRIMARY KEY (id)
                )`,
            )
            .then((data: any) => {
                console.log(data);
            })
            .catch((err: any) => {
                console.error(err);
                throw err;
            });
    },
};

export const insertDataScripts = {
    insertSingleRow(): any {
        redshiftClient
            .query(
                `CREATE TABLE IF NOT EXISTS events (
                    timestamp TIMESTAMP,
                    id VARCHAR UNIQUE,
                    event_type VARCHAR,
                    error_id VARCHAR,
                    order_hash CHAR(66),
                    maker CHAR(42),
                    maker_amount VARCHAR,
                    maker_fee VARCHAR,
                    maker_token CHAR(42),
                    taker_amount VARCHAR,
                    taker_fee VARCHAR,
                    taker_token CHAR(42),
                    txn_hash CHAR(66),
                    gas_used VARCHAR,
                    gas_price VARCHAR,
                    fee_recipient CHAR(42),
                    method_id CHAR(10),
                    salt VARCHAR,
                    block_number BIGINT,
                    PRIMARY KEY (id)
                )`,
            )
            .then((data: any) => {
                console.log(data);
            })
            .catch((err: any) => {
                console.error(err);
                throw err;
            });
    },
}
