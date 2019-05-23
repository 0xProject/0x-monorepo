import { logUtils } from '@0x/utils';
import * as R from 'ramda';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { OasisMarket, OasisSource } from '../data_sources/oasis';
import { TokenOrderbookSnapshot as TokenOrder } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseOasisOrders } from '../parsers/oasis_orders';
import { handleError } from '../utils';

// Number of orders to save at once.
const BATCH_SAVE_SIZE = 1000;

// Number of markets to retrieve orderbooks for at once.
const MARKET_ORDERBOOK_REQUEST_BATCH_SIZE = 50;

// Delay between market orderbook requests.
const MILLISEC_MARKET_ORDERBOOK_REQUEST_DELAY = 1000;

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const oasisSource = new OasisSource();
    logUtils.log('Getting all active Oasis markets');
    const markets = await oasisSource.getActiveMarketsAsync();
    logUtils.log(`Got ${markets.length} markets.`);
    for (const marketsChunk of R.splitEvery(MARKET_ORDERBOOK_REQUEST_BATCH_SIZE, markets)) {
        await Promise.all(
            marketsChunk.map(async (market: OasisMarket) => getAndSaveMarketOrderbookAsync(oasisSource, market)),
        );
        await new Promise<void>(resolve => setTimeout(resolve, MILLISEC_MARKET_ORDERBOOK_REQUEST_DELAY));
    }
    process.exit(0);
})().catch(handleError);

/**
 * Retrieve orderbook from Oasis API for a given market. Parse orders and insert
 * them into our database.
 * @param oasisSource Data source which can query Oasis API.
 * @param marketId String identifying market we want data for. eg. 'REPAUG'.
 */
async function getAndSaveMarketOrderbookAsync(oasisSource: OasisSource, market: OasisMarket): Promise<void> {
    logUtils.log(`${market.id}: Retrieving orderbook.`);
    const orderBook = await oasisSource.getMarketOrderbookAsync(market.id);
    const observedTimestamp = Date.now();

    logUtils.log(`${market.id}: Parsing orders.`);
    const orders = parseOasisOrders(orderBook, market, observedTimestamp);

    if (orders.length > 0) {
        logUtils.log(`${market.id}: Saving ${orders.length} orders.`);
        const TokenOrderRepository = connection.getRepository(TokenOrder);
        await TokenOrderRepository.save(orders, { chunk: Math.ceil(orders.length / BATCH_SAVE_SIZE) });
    } else {
        logUtils.log(`${market.id}: 0 orders to save.`);
    }
}
