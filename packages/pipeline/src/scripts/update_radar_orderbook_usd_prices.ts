import { logUtils } from '@0x/utils';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import * as ormConfig from '../ormconfig';
import { updateRadarOrderbookUsdPricesAsync } from '../queries/update_radar_orderbook_usd_prices';
import { handleError } from '../utils';

(async () => {
    const currentDate = new Date();
    const oneMonthAgoTimestampMs = currentDate.setMonth(currentDate.getMonth() - 1);
    const connection = await createConnection(ormConfig as ConnectionOptions);
    const fromTimestampMs = (await getLastSeenTimestampAsync(connection)) || oneMonthAgoTimestampMs;
    await updateRadarOrderbookUsdPricesAsync(connection, fromTimestampMs);
    process.exit(0);
})().catch(handleError);

async function getLastSeenTimestampAsync(connection: Connection): Promise<number | undefined> {
    const response = (await connection.query(
        'SELECT observed_timestamp FROM concepts.radar_orderbook_usd_prices ORDER BY observed_timestamp DESC LIMIT 1',
    )) as Array<{ observed_timestamp: number }>;
    if (response.length === 0) {
        return;
    }
    return response[0].observed_timestamp;
}
