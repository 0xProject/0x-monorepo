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
        )`
};

if(cli.name) {
    let query = dataInsertionQueries[cli.name];
    if (query && cli.from) {
        const fromBlock = cli.from;
        const toBlock = cli.to ? cli.to : cli.from + 1;
        postgresClient.query(query, [fromBlock, toBlock])
        .then((data: any) => {
            console.log(data)
        })
        .catch((err: any) => {
            console.error(err)
        })
    }
}