import { formatters } from '../utils';

export const dataFetchingQueries: any = {
    get_missing_txn_hashes: `
        SELECT
            a.txn_hash
        FROM
            events_raw a
        WHERE NOT EXISTS
            (
                SELECT
                    *
                FROM
                    transactions b
                WHERE
                    b.txn_hash = a.txn_hash
            )
        AND
            a.block_number >= $1
        AND
            a.block_number < $2`
    ,
    get_used_block_numbers: `
        SELECT DISTINCT
            a.block_number
        FROM
            events_raw a
        WHERE NOT EXISTS
            (
                SELECT
                    *
                FROM
                    blocks b
                WHERE
                    b.block_number = a.block_number
            )
        AND
            a.block_number >= $1
        AND
            a.block_number < $2`
    ,
    get_token_registry: `
    SELECT
        *
    FROM
        tokens`
    ,
};