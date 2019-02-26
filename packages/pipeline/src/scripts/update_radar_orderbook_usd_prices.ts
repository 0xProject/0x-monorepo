import { logUtils } from '@0x/utils';
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import * as ormConfig from '../ormconfig';
import { handleError, isCli } from '../utils';

if (isCli()) {
    logUtils.log('running update_radar_orderbook');
    (async () => {
        const currentDate = new Date();
        const oneMonthAgoTimestampMs = currentDate.setMonth(currentDate.getMonth() - 1);
        const connection = await createConnection(ormConfig as ConnectionOptions);
        const fromTimestampMs = (await getLastSeenTimestampAsync(connection)) || oneMonthAgoTimestampMs;
        await updateRadarOrderbookUsdPricesAsync(connection, fromTimestampMs);
        process.exit(0);
    })().catch(handleError);
}

export async function updateRadarOrderbookUsdPricesAsync(
    connection: Connection,
    fromTimestampMs: number,
): Promise<void> {
    logUtils.log(`Updating concepts.radar_orderbook_usd_prices starting from ${fromTimestampMs}`);
    await connection.query(
        `
insert into concepts.radar_orderbook_usd_prices
with usd_prices as (
    select * from raw.ohlcv_external
    where to_symbol = 'USD' and end_time > ${fromTimestampMs}
), radar_orderbook as (
    select * from raw.token_orderbook_snapshots
    where source = 'radar' and observed_timestamp > ${fromTimestampMs}
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
    radar_orderbook.quote_volume,
    radar_orderbook.maker_address,
    radar_orderbook.order_type
from radar_orderbook
left join usd_prices usd_prices1 on radar_orderbook.observed_timestamp between usd_prices1.start_time and usd_prices1.end_time
    and (usd_prices1.from_symbol = radar_orderbook.quote_asset_symbol or (usd_prices1.from_symbol = 'ETH' and (radar_orderbook.quote_asset_symbol = 'WETH' or radar_orderbook.quote_asset_symbol = 'Veil ETH')))
left join usd_prices usd_prices2 on radar_orderbook.observed_timestamp between usd_prices2.start_time and usd_prices2.end_time
    and (
        not (usd_prices2.from_symbol = radar_orderbook.quote_asset_symbol or (usd_prices2.from_symbol = 'ETH' and (radar_orderbook.quote_asset_symbol = 'WETH' or radar_orderbook.quote_asset_symbol = 'Veil ETH')))
        and (usd_prices2.from_symbol = radar_orderbook.base_asset_symbol or (usd_prices2.from_symbol = 'ETH' and (radar_orderbook.base_asset_symbol = 'WETH' or radar_orderbook.quote_asset_symbol = 'Veil ETH')))
    )
where usd_prices2.close is not null or usd_prices1.close is not null
`.replace(/\s/g, ' '),
    );
    logUtils.log('Done updating radar_orderbook_usd_prices');
}

async function getLastSeenTimestampAsync(connection: Connection): Promise<number | undefined> {
    const response = (await connection.query(
        'SELECT observed_timestamp FROM concepts.radar_orderbook_usd_prices ORDER BY observed_timestamp DESC LIMIT 1',
    )) as Array<{ observed_timestamp: number }>;
    if (response.length === 0) {
        return;
    }
    return response[0].observed_timestamp;
}
