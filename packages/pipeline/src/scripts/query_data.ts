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
            a.block_number < $2`,
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
            a.block_number < $2`,
    get_token_registry: `
        SELECT
            *
        FROM
            tokens`,
    get_max_block: `
        SELECT
            MAX(block_number)
        FROM
            events_raw`,
    get_relayers: `
        SELECT
            *
        FROM
            relayers`,
    get_most_recent_pricing_date: `
        SELECT
            MAX(DATE(timestamp))
        FROM
            prices
    `,
    get_top_unknown_token_addresses: `
    SELECT a.token_address as address, a.txn_value / 2 as total_txn_value
FROM
(SELECT token_address, SUM(txn_value) as txn_value
FROM
(select a.timestamp, a.maker_token as token_address, (CASE WHEN a.taker_txn_usd_value > a.maker_txn_usd_value OR a.maker_txn_usd_value IS NULL
                        THEN a.taker_txn_usd_value
                        ELSE a.maker_txn_usd_value END) as txn_value
        from events_full a
        where a.event_type = 'LogFill'
        and a.timestamp > (NOW() + INTERVAL '-24 hours')
        union
        select a.timestamp, a.taker_token as token_address, (CASE WHEN a.taker_txn_usd_value > a.maker_txn_usd_value OR a.maker_txn_usd_value IS NULL
                        THEN a.taker_txn_usd_value
                        ELSE a.maker_txn_usd_value END) as txn_value
        from events_full a
        where a.event_type = 'LogFill'
        and a.timestamp > (NOW() + INTERVAL '-24 hours')) token_txn_values
WHERE token_address IS NOT NULL
AND txn_value > 0
GROUP BY 1
ORDER BY 2 DESC) a
LEFT JOIN tokens b
ON a.token_address = b.address
WHERE symbol is NULL
ORDER BY 2 DESC
`,
};
