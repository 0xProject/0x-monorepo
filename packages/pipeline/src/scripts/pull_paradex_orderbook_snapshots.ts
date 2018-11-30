// tslint:disable:no-console
import { BigNumber } from '@0x/utils';
import * as R from 'ramda';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import {
    PARADEX_SOURCE,
    ParadexActiveMarketsResponse,
    ParadexMarket,
    ParadexSource,
    ParadexTokenInfo,
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
    const tokenOrderRepository = connection.getRepository(TokenOrder);
    const markets = await paradexSource.getActiveMarketsAsync();
    const tokenInfoResponse = await paradexSource.getTokenInfoAsync();
    const extendedMarkets = addTokenAddresses(markets, tokenInfoResponse);
    await Promise.all(
        extendedMarkets.map(async (market: ParadexMarket) => getAndSaveMarketOrderbook(paradexSource, market)),
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
    const extractSymbolAddress = (acc: Map<string, string>, tokenInfo: ParadexTokenInfo): Map<string, string> => {
        acc.set(tokenInfo.symbol, tokenInfo.address);
        return acc;
    };

    const symbolAddressMapping = R.reduce(extractSymbolAddress, new Map(), tokenInfoResponse);

    markets.forEach((market: ParadexMarket) => {
        if (symbolAddressMapping.has(market.baseToken)) {
            market.baseTokenAddress = symbolAddressMapping.get(market.baseToken);
        } else {
            console.log(`${market.baseToken}: No address found.`);
        }

        if (symbolAddressMapping.has(market.quoteToken)) {
            market.quoteTokenAddress = symbolAddressMapping.get(market.quoteToken);
        } else {
            console.log(`${market.quoteToken}: No address found.`);
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
async function getAndSaveMarketOrderbook(paradexSource: ParadexSource, market: ParadexMarket): Promise<void> {
    const paradexOrderbookResponse = await paradexSource.getMarketOrderbookAsync(market.symbol);
    const retrievedTimestamp = Date.now();

    console.log(`${market.symbol}: Parsing orders.`);
    const orders = parseParadexOrders(paradexOrderbookResponse, market, retrievedTimestamp, PARADEX_SOURCE);

    if (orders.length > 0) {
        console.log(`${market.symbol}: Saving ${orders.length} orders.`);
        const TokenOrderRepository = connection.getRepository(TokenOrder);
        await TokenOrderRepository.save(orders, { chunk: Math.ceil(orders.length / BATCH_SAVE_SIZE) });
    } else {
        console.log(`${market.symbol}: 0 orders to save.`);
    }
}
