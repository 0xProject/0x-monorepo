import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { logUtils } from '@0x/utils';

import * as ormConfig from '../ormconfig';
import { handleError } from '../utils';

(async () => {
    const connection = await createConnection(ormConfig as ConnectionOptions);
    logUtils.log('Creating radar_orderbook_usd_prices');
    await runQueryAsync(connection);
    logUtils.log('Done');
    process.exit(0);
})().catch(handleError);

export async function runQueryAsync(connection: Connection): Promise<void> {
    await connection.query(
        `
drop table if exists concepts.radar_orderbook_usd_prices;

create table concepts.radar_orderbook_usd_prices as
with usd_prices as (
    select * from raw.ohlcv_external
    where to_symbol = 'USD' and end_time >= date_part('epoch', now() - interval '2 month')*1000
), radar_orderbook as (
    select * from raw.token_orderbook_snapshots
    where source = 'radar' and observed_timestamp  > date_part('epoch', now() - interval '2 month')*1000
)
select
    case
        when (usd_prices2.close is not null) then usd_prices2.close * radar_orderbook.base_volume
        when (usd_prices1.close is not null) then usd_prices1.close * radar_orderbook.quote_volume
    end as trade_usd_value,
    usd_prices2.close as base_asset_price,
    usd_prices1.close as quote_asset_price,
    radar_orderbook.observed_timestamp,
    radar_orderbook.price,
    radar_orderbook.base_asset_address,
    radar_orderbook.base_asset_symbol,
    radar_orderbook.base_volume,
    radar_orderbook.quote_asset_address,
    radar_orderbook.quote_asset_symbol,
    radar_orderbook.quote_volume
from radar_orderbook
left join usd_prices usd_prices1 on radar_orderbook.observed_timestamp between usd_prices1.start_time and usd_prices1.end_time
    and (usd_prices1.from_symbol = radar_orderbook.quote_asset_symbol or (usd_prices1.from_symbol = 'ETH' and (radar_orderbook.quote_asset_symbol = 'WETH' or radar_orderbook.quote_asset_symbol = 'Veil ETH')))
left join usd_prices usd_prices2 on radar_orderbook.observed_timestamp between usd_prices2.start_time and usd_prices2.end_time
    and (
        not (usd_prices2.from_symbol = radar_orderbook.quote_asset_symbol or (usd_prices2.from_symbol = 'ETH' and (radar_orderbook.quote_asset_symbol = 'WETH' or radar_orderbook.quote_asset_symbol = 'Veil ETH')))
        and (usd_prices2.from_symbol = radar_orderbook.base_asset_symbol or (usd_prices2.from_symbol = 'ETH' and (radar_orderbook.base_asset_symbol = 'WETH' or radar_orderbook.quote_asset_symbol = 'Veil ETH')))
    )
    `.replace(/\s/g, ' '),
    );
}
