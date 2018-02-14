import * as commandLineArgs from 'command-line-args';
import { postgresClient } from '../postgres';
import { formatters } from '../utils';

const tableQueries: any = {
    events_full: `CREATE TABLE IF NOT EXISTS events_full (
        timestamp TIMESTAMP WITH TIME ZONE,
        event_type VARCHAR,
        error_id VARCHAR,
        order_hash CHAR(66),
        maker CHAR(42),
        maker_amount NUMERIC(78),
        maker_fee NUMERIC(78),
        maker_token CHAR(42),
        taker CHAR(42),
        taker_amount NUMERIC(78),
        taker_fee NUMERIC(78),
        taker_token CHAR(42),
        txn_hash CHAR(66),
        gas_used NUMERIC(78),
        gas_price NUMERIC(78),
        fee_recipient CHAR(42),
        method_id CHAR(10),
        salt VARCHAR,
        block_number BIGINT,
        log_index BIGINT,
        taker_symbol VARCHAR,
        taker_name VARCHAR,
        taker_decimals BIGINT,
        taker_usd_price NUMERIC(78),
        txn_usd_value NUMERIC(78),
        PRIMARY KEY (txn_hash, order_hash, log_index)
    )`,
    events: `CREATE TABLE IF NOT EXISTS events (
        timestamp TIMESTAMP WITH TIME ZONE,
        event_type VARCHAR,
        error_id VARCHAR,
        order_hash CHAR(66),
        maker CHAR(42),
        maker_amount NUMERIC(78),
        maker_fee NUMERIC(78),
        maker_token CHAR(42),
        taker CHAR(42),
        taker_amount NUMERIC(78),
        taker_fee NUMERIC(78),
        taker_token CHAR(42),
        txn_hash CHAR(66),
        gas_used NUMERIC(78),
        gas_price NUMERIC(78),
        fee_recipient CHAR(42),
        method_id CHAR(10),
        salt VARCHAR,
        block_number BIGINT,
        log_index BIGINT,
        PRIMARY KEY (txn_hash, order_hash, log_index)
    )`,
    events_staging: `CREATE TABLE IF NOT EXISTS events_staging (
        timestamp TIMESTAMP WITH TIME ZONE,
        event_type VARCHAR,
        error_id VARCHAR,
        order_hash CHAR(66),
        maker CHAR(42),
        maker_amount NUMERIC(78),
        maker_fee NUMERIC(78),
        maker_token CHAR(42),
        taker CHAR(42),
        taker_amount NUMERIC(78),
        taker_fee NUMERIC(78),
        taker_token CHAR(42),
        txn_hash CHAR(66),
        fee_recipient CHAR(42),
        block_number BIGINT,
        log_index BIGINT,
        PRIMARY KEY (txn_hash, order_hash, log_index)
    )`,
    events_raw: `CREATE TABLE IF NOT EXISTS events_raw (
        event_type VARCHAR,
        error_id VARCHAR,
        order_hash CHAR(66),
        maker CHAR(42),
        maker_amount NUMERIC(78),
        maker_fee NUMERIC(78),
        maker_token CHAR(42),
        taker CHAR(42),
        taker_amount NUMERIC(78),
        taker_fee NUMERIC(78),
        taker_token CHAR(42),
        txn_hash CHAR(66),
        fee_recipient CHAR(42),
        block_number BIGINT,
        log_index BIGINT,
        PRIMARY KEY (txn_hash, order_hash, log_index)
    )`,
    blocks: `CREATE TABLE IF NOT EXISTS blocks (
        timestamp TIMESTAMP WITH TIME ZONE,
        block_hash CHAR(66) UNIQUE,
        block_number BIGINT,
        PRIMARY KEY (block_hash)
    )`,
    transactions:  `CREATE TABLE IF NOT EXISTS transactions (
        txn_hash CHAR(66) UNIQUE,
        block_hash CHAR(66),
        block_number BIGINT,
        gas_used NUMERIC(78),
        gas_price NUMERIC(78),
        method_id CHAR(10),
        salt VARCHAR,
        PRIMARY KEY (txn_hash)
    )`,
    tokens: `CREATE TABLE IF NOT EXISTS tokens (
        address CHAR(42) UNIQUE,
        name VARCHAR,
        symbol VARCHAR,
        decimals INT,
        PRIMARY KEY (address)
    )`,
    prices: `CREATE TABLE IF NOT EXISTS prices (
        address CHAR(42) UNIQUE,
        timestamp TIMESTAMP WITH TIME ZONE,
        price NUMERIC(50),
        PRIMARY KEY (address, timestamp)
    )`,
    relayers: `CREATE TABLE IF NOT EXISTS relayers (
        id VARCHAR UNIQUE,
        name VARCHAR,
        url VARCHAR DEFAULT '',
        model VARCHAR DEFAULT '',
        status VARCHAR DEFAULT '',
        sra_status VARCHAR DEFAULT '',
        sra_http_url VARCHAR DEFAULT '',
        known_fee_addresses CHAR(42)[] DEFAULT '{}',
        known_taker_addresses CHAR(42)[] DEFAULT '{}',
        relayer_type VARCHAR DEFAULT '',
        PRIMARY KEY(id)
    )`,
};

function _safeQuery(query: string): any {
    return new Promise((resolve, reject) => {
        postgresClient
            .query(query)
            .then((data: any) => {
                console.log(data)
                resolve(data);
            })
            .catch((err: any) => {
                console.error(err)
                reject(err);
            });
    });
}

export const tableScripts = {
    createTable(query: string): any {
        return _safeQuery(query);
    },
    createAllTables(): any {
        for(const tableName in tableQueries) {
            _safeQuery(tableQueries[tableName])
        }
    },
};

export const insertDataScripts = {
    insertSingleRow(table: string, object: any): any {
        return new Promise((resolve, reject) => {
            const columns = Object.keys(object);
            const safeArray: any = [];
            for(let key of columns) {
                if(key in object) {
                    if(key === 'timestamp') {
                        safeArray.push('to_timestamp(' + object[key] + ')');
                    } else if (typeof object[key] === 'string' || object[key] instanceof String) {
                        safeArray.push(formatters.escapeSQLParam(object[key]))
                    } else {
                        safeArray.push(object[key])
                    }

                } else {
                    safeArray.push('default');
                }
            }
            const queryString = `INSERT INTO ${table} (${columns}) VALUES (${safeArray})`;
            postgresClient
                .query(queryString)
                .then((data: any) => {
                    resolve(data);
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    },
    insertMultipleRows(table: string, rows: any[], columns: any[]): any {
        return new Promise((resolve, reject) => {
            if (rows.length > 0) {
                const rowsSplit = rows.map((value, index) => {
                    const safeArray: any = [];
                    for(let key of columns) {
                        if(key in value) {
                            if(key === 'timestamp') {
                                safeArray.push('to_timestamp(' + value[key] + ')');
                            } else if (typeof value[key] === 'string' || value[key] instanceof String) {
                                safeArray.push(formatters.escapeSQLParam(value[key]))
                            } else if (value[key] instanceof Array) {
                                const escapedArray = value[key].map((subValue: string, subIndex: number) => {
                                    return formatters.escapeSQLParam(subValue);
                                });
                                safeArray.push('ARRAY[' + escapedArray.toString() + ']');
                            } else {
                                safeArray.push(value[key]);
                            }

                        } else {
                            safeArray.push('default');
                        }
                    }
                    return '(' + safeArray + ')';
                });
                const queryString = `INSERT INTO ${table} (${columns}) VALUES ${rowsSplit}`;
                console.log(queryString);
                postgresClient
                    .query(queryString)
                    .then((data: any) => {
                        console.log(data);
                        resolve(data);
                    })
                    .catch((err: any) => {
                        console.log(err);
                        reject(err);
                    });
            } else {
                resolve({});
            }
        });
    },
};