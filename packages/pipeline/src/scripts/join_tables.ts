import * as commandLineArgs from 'command-line-args';
import { postgresClient, safeQuery } from '../postgres';
import { formatters } from '../utils';

const optionDefinitions = [{ name: 'name', alias: 'n', type: String }, { name: 'from', alias: 'f', type: Number }, { name: 'to', alias: 't', type: Number }];
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
            b.block_number < $2
        )`,
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
            a.block_number < $2
        )`,
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
        txn_usd_value
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
        token_prices.symbol,
        token_prices.name,
        token_prices.decimals,
        token_prices.close,
        (events.taker_amount / (10 ^ token_prices.decimals)) * token_prices.close
    FROM
        events
    LEFT JOIN
        (SELECT
            tokens.address,
            tokens.name,
            tokens.symbol,
            tokens.decimals,
            historical_prices.timestamp,
            historical_prices.close
        FROM
            tokens
        LEFT JOIN
            historical_prices
        ON
            tokens.symbol = historical_prices.token) token_prices
    ON
        events.taker_token = token_prices.address
    AND
        (DATE(events.timestamp) = DATE(token_prices.timestamp) OR token_prices.timestamp IS NULL)
    AND
        events.block_number >= $1
    AND
        events.block_number < $2
    )`,
};

if(cli.name) {
    let query = dataInsertionQueries[cli.name];
    if (query && cli.from) {
        const fromBlock = cli.from;
        const toBlock = cli.to ? cli.to : cli.from + 1;
        postgresClient.query(query, [fromBlock, toBlock])
        .then((data: any) => {
            console.log(data);
        })
        .catch((err: any) => {
            console.error(err);
        })
    }
}