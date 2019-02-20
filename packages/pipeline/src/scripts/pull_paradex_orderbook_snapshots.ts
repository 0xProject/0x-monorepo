import { logUtils } from '@0x/utils';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import {
    ParadexActiveMarketsResponse,
    ParadexMarket,
    ParadexSource,
    ParadexTokenInfoResponse,
} from '../data_sources/paradex';
import { TokenOrderbookSnapshot as TokenOrder } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseParadexOrders } from '../parsers/paradex_orders';
import { handleError } from '../utils';

// Number of orders to save at once.
const BATCH_SAVE_SIZE = 1000;

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const apiKey = process.env.PARADEX_DATA_PIPELINE_API_KEY;
    if (apiKey === undefined) {
        throw new Error('Missing required env var: PARADEX_DATA_PIPELINE_API_KEY');
    }
    const paradexSource = new ParadexSource(apiKey);
    const markets = await paradexSource.getActiveMarketsAsync();
    const tokenInfoResponse = await paradexSource.getTokenInfoAsync();
    const extendedMarkets = addTokenAddresses(markets, tokenInfoResponse);
    await Promise.all(
        extendedMarkets.map(async (market: ParadexMarket) => getAndSaveMarketOrderbookAsync(paradexSource, market)),
    );
    process.exit(0);
})().catch(handleError);

/**
 * Extend the default ParadexMarket objects with token addresses.
 * @param markets An array of ParadexMarket objects.
 * @param tokenInfoResponse An array of ParadexTokenInfo containing the addresses.
 */
function addTokenAddresses(
    markets: ParadexActiveMarketsResponse,
    tokenInfoResponse: ParadexTokenInfoResponse,
): ParadexMarket[] {
    const symbolAddressMapping = new Map<string, string>();
    tokenInfoResponse.forEach(tokenInfo => symbolAddressMapping.set(tokenInfo.symbol, tokenInfo.address));

    markets.forEach((market: ParadexMarket) => {
        if (symbolAddressMapping.has(market.baseToken)) {
            market.baseTokenAddress = symbolAddressMapping.get(market.baseToken);
        } else {
            market.quoteTokenAddress = '';
            logUtils.warn(`${market.baseToken}: No address found.`);
        }

        if (symbolAddressMapping.has(market.quoteToken)) {
            market.quoteTokenAddress = symbolAddressMapping.get(market.quoteToken);
        } else {
            market.quoteTokenAddress = '';
            logUtils.warn(`${market.quoteToken}: No address found.`);
        }
    });
    return markets;
}

/**
 * Retrieve orderbook from Paradex API for a given market. Parse orders and insert
 * them into our database.
 * @param paradexSource Data source which can query the Paradex API.
 * @param market Object from the Paradex API with information about the market in question.
 */
async function getAndSaveMarketOrderbookAsync(paradexSource: ParadexSource, market: ParadexMarket): Promise<void> {
    const paradexOrderbookResponse = await paradexSource.getMarketOrderbookAsync(market.symbol);
    const observedTimestamp = Date.now();

    logUtils.log(`${market.symbol}: Parsing orders.`);
    const orders = parseParadexOrders(paradexOrderbookResponse, market, observedTimestamp);

    if (orders.length > 0) {
        logUtils.log(`${market.symbol}: Saving ${orders.length} orders.`);
        const tokenOrderRepository = connection.getRepository(TokenOrder);
        await tokenOrderRepository.save(orders, { chunk: Math.ceil(orders.length / BATCH_SAVE_SIZE) });
    } else {
        logUtils.log(`${market.symbol}: 0 orders to save.`);
    }
}
