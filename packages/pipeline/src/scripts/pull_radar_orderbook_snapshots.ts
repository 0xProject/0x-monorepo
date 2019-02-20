import { logUtils } from '@0x/utils';
import { RadarMarket } from '@radarrelay/types';
import * as R from 'ramda';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { RadarSource } from '../data_sources/radar';
import { TokenOrderbookSnapshot as TokenOrder } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseRadarOrders } from '../parsers/radar_orders';
import { handleError } from '../utils';

// Number of orders to save at once.
const BATCH_SAVE_SIZE = 1000;

// Number of markets to retrieve orderbooks for at once.
const MARKET_ORDERBOOK_REQUEST_BATCH_SIZE = 50;

// Delay between market orderbook requests.
const MILLISEC_MARKET_ORDERBOOK_REQUEST_DELAY = 5000;

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const radarSource = new RadarSource();
    const markets = await radarSource.getActiveMarketsAsync();
    for (const marketsChunk of R.splitEvery(MARKET_ORDERBOOK_REQUEST_BATCH_SIZE, markets)) {
        await Promise.all(
            marketsChunk.map(async (market: RadarMarket) => getAndSaveMarketOrderbookAsync(radarSource, market)),
        );
        await new Promise<void>(resolve => setTimeout(resolve, MILLISEC_MARKET_ORDERBOOK_REQUEST_DELAY));
    }
    process.exit(0);
})().catch(handleError);

/**
 * Retrieve orderbook from radar API for a given market. Parse orders and insert
 * them into our database.
 * @param radarSource Data source which can query radar API.
 * @param market Object from radar API containing market data.
 */
async function getAndSaveMarketOrderbookAsync(radarSource: RadarSource, market: RadarMarket): Promise<void> {
    const orderBook = await radarSource.getMarketOrderbookAsync(market.id);
    const observedTimestamp = Date.now();

    logUtils.log(`${market.id}: Parsing orders.`);
    const orders = parseRadarOrders(orderBook, market, observedTimestamp);

    if (orders.length > 0) {
        logUtils.log(`${market.id}: Saving ${orders.length} orders.`);
        const TokenOrderRepository = connection.getRepository(TokenOrder);
        await TokenOrderRepository.save(orders, { chunk: Math.ceil(orders.length / BATCH_SAVE_SIZE) });
    } else {
        logUtils.log(`${market.id}: 0 orders to save.`);
    }
}
