import * as commandLineArgs from 'command-line-args';

import { postgresClient } from '../postgres';
import { formatters } from '../utils';
const optionDefinitions = [
    { name: 'name', alias: 'n', type: String },
    { name: 'from', alias: 'f', type: Number },
    { name: 'to', alias: 't', type: Number },
];
const cli = commandLineArgs(optionDefinitions);
const dataInsertionQueries: any = {
    events_staging: `INSERT INTO events_staging (
        timestamp,
        event_type,
        error_id,
        order_hash,
        maker,
        maker_amount,
        maker_fee,
        maker_token,
        taker,
        taker_amount,
        taker_fee,
        taker_token,
        txn_hash,
        fee_recipient,
        block_number,
        log_index
    )
        (SELECT
            b.timestamp,
            a.event_type,
            a.error_id,
            a.order_hash,
            a.maker,
            a.maker_amount,
            a.maker_fee,
            a.maker_token,
            a.taker,
            a.taker_amount,
            a.taker_fee,
            a.taker_token,
            a.txn_hash,
            a.fee_recipient,
            a.block_number,
            a.log_index
        FROM
            events_raw a
        JOIN
            blocks b
        ON
            a.block_number = b.block_number
        AND
            b.block_number >= $1
        AND
            b.block_number <= $2
        ) ON CONFLICT (order_hash, txn_hash, log_index) DO NOTHING`,
    events: `INSERT INTO events (
        timestamp,
        event_type,
        error_id,
        order_hash,
        maker,
        maker_amount,
        maker_fee,
        maker_token,
        taker,
        taker_amount,
        taker_fee,
        taker_token,
        txn_hash,
        fee_recipient,
        block_number,
        log_index,
        gas_used,
        gas_price,
        method_id,
        salt
    )
        (SELECT
            a.timestamp,
            a.event_type,
            a.error_id,
            a.order_hash,
            a.maker,
            a.maker_amount,
            a.maker_fee,
            a.maker_token,
            a.taker,
            a.taker_amount,
            a.taker_fee,
            a.taker_token,
            a.txn_hash,
            a.fee_recipient,
            a.block_number,
            a.log_index,
            b.gas_used,
            b.gas_price,
            b.method_id,
            b.salt
        FROM
            events_staging a
        JOIN
            transactions b
        ON
            a.txn_hash = b.txn_hash
        AND
            a.block_number >= $1
        AND
            a.block_number <= $2
        ) ON CONFLICT (order_hash, txn_hash, log_index) DO NOTHING`,
    events_full: `
    INSERT INTO events_full (
        timestamp,
        event_type,
        error_id,
        order_hash,
        maker,
        maker_amount,
        maker_fee,
        maker_token,
        taker,
        taker_amount,
        taker_fee,
        taker_token,
        txn_hash,
        fee_recipient,
        block_number,
        log_index,
        gas_used,
        gas_price,
        method_id,
        salt,
        taker_symbol,
        taker_name,
        taker_decimals,
        taker_usd_price,
        taker_txn_usd_value,
        maker_symbol,
        maker_name,
        maker_decimals,
        maker_usd_price,
        maker_txn_usd_value
    )
     (SELECT
        events.timestamp,
        events.event_type,
        events.error_id,
        events.order_hash,
        events.maker,
        events.maker_amount,
        events.maker_fee,
        events.maker_token,
        events.taker,
        events.taker_amount,
        events.taker_fee,
        events.taker_token,
        events.txn_hash,
        events.fee_recipient,
        events.block_number,
        events.log_index,
        events.gas_used,
        events.gas_price,
        events.method_id,
        events.salt,
        taker_token_prices.symbol,
        taker_token_prices.name,
        taker_token_prices.decimals,
        taker_token_prices.price,
        (events.taker_amount / (10 ^ taker_token_prices.decimals)) * taker_token_prices.price,
        maker_token_prices.symbol,
        maker_token_prices.name,
        maker_token_prices.decimals,
        maker_token_prices.price,
        (events.maker_amount / (10 ^ maker_token_prices.decimals)) * maker_token_prices.price
    FROM
        events
    LEFT JOIN
        (SELECT
            tokens.address,
            tokens.name,
            tokens.symbol,
            tokens.decimals,
            prices.timestamp,
            prices.price
        FROM
            tokens
        LEFT JOIN
            prices
        ON
            tokens.symbol = prices.symbol) taker_token_prices
	    ON
        	(events.taker_token = taker_token_prices.address
   		AND
        	(DATE(events.timestamp) = DATE(taker_token_prices.timestamp) OR taker_token_prices.timestamp IS NULL))
    LEFT JOIN
        (SELECT
            tokens.address,
            tokens.name,
            tokens.symbol,
            tokens.decimals,
            prices.timestamp,
            prices.price
        FROM
            tokens
        LEFT JOIN
            prices
        ON
            tokens.symbol = prices.symbol) maker_token_prices
    ON
        (events.maker_token = maker_token_prices.address
    AND
        (DATE(events.timestamp) = DATE(maker_token_prices.timestamp) OR maker_token_prices.timestamp IS NULL))
    WHERE
        events.block_number >= $1
    AND
        events.block_number <= $2
    ) ON CONFLICT (order_hash, txn_hash, log_index) DO NOTHING`,
};
if (cli.name) {
    const query = dataInsertionQueries[cli.name];
    if (query && cli.from) {
        const fromBlock = cli.from;
        const toBlock = cli.to ? cli.to : cli.from + 1;
        postgresClient
            .query(query, [fromBlock, toBlock])
            .then((data: any) => {
                console.log(data);
            })
            .catch((err: any) => {
                console.error(err);
            });
    }
}
