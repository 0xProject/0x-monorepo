import { logUtils } from '@0x/utils';
import * as R from 'ramda';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { IDEX_SOURCE, IdexSource } from '../data_sources/idex';
import { TokenOrderbookSnapshot as TokenOrder } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseIdexOrders } from '../parsers/idex_orders';
import { handleError } from '../utils';

// Number of orders to save at once.
const BATCH_SAVE_SIZE = 1000;

// Number of markets to retrieve orderbooks for at once.
const MARKET_ORDERBOOK_REQUEST_BATCH_SIZE = 100;

// Delay between market orderbook requests.
const MILLISEC_MARKET_ORDERBOOK_REQUEST_DELAY = 2000;

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const idexSource = new IdexSource();
    const markets = await idexSource.getMarketsAsync();
    for (const marketsChunk of R.splitEvery(MARKET_ORDERBOOK_REQUEST_BATCH_SIZE, markets)) {
        await Promise.all(
            marketsChunk.map(async (marketId: string) => getAndSaveMarketOrderbook(idexSource, marketId)),
        );
        await new Promise<void>(resolve => setTimeout(resolve, MILLISEC_MARKET_ORDERBOOK_REQUEST_DELAY));
    }
    process.exit(0);
})().catch(handleError);

/**
 * Retrieve orderbook from Idex API for a given market. Parse orders and insert
 * them into our database.
 * @param idexSource Data source which can query Idex API.
 * @param marketId String representing market of interest, eg. 'ETH_TIC'.
 */
async function getAndSaveMarketOrderbook(idexSource: IdexSource, marketId: string): Promise<void> {
    const orderBook = await idexSource.getMarketOrderbookAsync(marketId);
    const observedTimestamp = Date.now();

    if (!R.has('bids', orderBook) || !R.has('asks', orderBook)) {
        logUtils.warn(`${marketId}: Orderbook faulty.`);
        return;
    }

    logUtils.log(`${marketId}: Parsing orders.`);
    const orders = parseIdexOrders(orderBook, observedTimestamp, IDEX_SOURCE);

    if (orders.length > 0) {
        logUtils.log(`${marketId}: Saving ${orders.length} orders.`);
        const TokenOrderRepository = connection.getRepository(TokenOrder);
        await TokenOrderRepository.save(orders, { chunk: Math.ceil(orders.length / BATCH_SAVE_SIZE) });
    } else {
        logUtils.log(`${marketId}: 0 orders to save.`);
    }
}
