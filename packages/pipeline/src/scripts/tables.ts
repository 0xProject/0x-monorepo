import { redshiftClient } from '../redshift';
import { formatters } from '../utils';

const tableQueries = {
    events: `CREATE TABLE IF NOT EXISTS events (
        id BIGINT IDENTITY (0,1),
        timestamp TIMESTAMP,
        event_type VARCHAR,
        error_id VARCHAR,
        order_hash CHAR(66),
        maker CHAR(42),
        maker_amount VARCHAR,
        maker_fee VARCHAR,
        maker_token CHAR(42),
        taker CHAR(42),
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
    events_raw: `CREATE TABLE IF NOT EXISTS events_raw (
        id BIGINT IDENTITY (0,1),
        timestamp TIMESTAMP,
        event_type VARCHAR,
        error_id VARCHAR,
        order_hash CHAR(66),
        maker CHAR(42),
        maker_amount VARCHAR,
        maker_fee VARCHAR,
        maker_token CHAR(42),
        taker CHAR(42),
        taker_amount VARCHAR,
        taker_fee VARCHAR,
        taker_token CHAR(42),
        txn_hash CHAR(66),
        fee_recipient CHAR(42),
        block_number BIGINT,
        PRIMARY KEY (id)
    )`,
};

function _safeQuery(query: string): any {
    return new Promise((resolve, reject) => {
        redshiftClient
            .query(query)
            .then((data: any) => {
                resolve(data);
            })
            .catch((err: any) => {
                reject(err);
            });
    });
}

export const tableScripts = {
    createTable(query: string): any {
        return _safeQuery(query);
    },
    createAllTables(): any {
        _safeQuery(tableQueries.events_raw);
    },
};

export const insertDataScripts = {
    insertSingleRow(table: string, object: any): any {
        return new Promise((resolve, reject) => {
            const queryString = `INSERT INTO ${table} (${Object.keys(object)}) VALUES (${formatters.escapeSQLParams(
                Object.values(object),
            )})`;
            redshiftClient
                .query(queryString)
                .then((data: any) => {
                    resolve(data);
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    },
    insertMultipleRows(table: string, rows: any[]): any {
        return new Promise((resolve, reject) => {
            if (rows.length > 0) {
                const rowsSplit = rows.map((value, index) => {
                    return '(' + formatters.escapeSQLParams(Object.values(value)) + ')';
                });
                const queryString = `INSERT INTO ${table} (${Object.keys(rows[0])}) VALUES ${rowsSplit}`;
                redshiftClient
                    .query(queryString)
                    .then((data: any) => {
                        resolve(data);
                    })
                    .catch((err: any) => {
                        reject(err);
                    });
            } else {
                resolve({});
            }
        });
    },
};
